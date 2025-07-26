"""
Core orchestrator for the RAG system.
Coordinates RAG pipeline execution and agent workflows.
"""

import asyncio
import time
from typing import Dict, Any, Optional, List, AsyncGenerator
import structlog
from datetime import datetime
import uuid

from config.settings import get_settings
from models.api.chat_request import ChatRequest, ChatResponse, StreamingChatResponse
from models.api.file_models import FileMetadata, DocumentChunk, FileProcessingResult
from rag.preprocessing.chunker import get_text_chunker
from rag.retrieval.vector_retriever import get_enhanced_vector_retriever
from rag.generation.response_generator import get_enhanced_response_generator
from embeddings import get_embeddings_provider
from vectorstore.qdrant.client import get_enhanced_qdrant_client
from agents.base.base_agent import get_enhanced_agent_registry, AgentTask, AgentResult
from utils.file_utils import detect_file_type, detect_language

logger = structlog.get_logger(__name__)
settings = get_settings()


class RAGOrchestrator:
    """Main orchestrator for RAG pipeline and agent coordination."""
    
    def __init__(self):
        """Initialize the orchestrator."""
        # Initialize components
        self.text_chunker = get_text_chunker()
        self.vector_retriever = get_enhanced_vector_retriever()
        self.response_generator = get_enhanced_response_generator()
        self.embeddings_provider = get_embeddings_provider()
        self.qdrant_client = get_enhanced_qdrant_client()
        self.agent_registry = get_enhanced_agent_registry()
        
        # Pipeline state
        self.processing_files: Dict[str, FileProcessingResult] = {}
        self.conversation_history: Dict[str, List[Dict[str, Any]]] = {}
    
    async def initialize(self) -> bool:
        """Initialize the orchestrator and all components."""
        try:
            logger.info("Initializing RAG orchestrator")
            
            # Initialize Qdrant
            qdrant_initialized = await self.qdrant_client.initialize()
            if not qdrant_initialized:
                logger.error("Failed to initialize Qdrant client")
                return False
            
            # Start agents
            await self._start_agents()
            
            logger.info("RAG orchestrator initialized successfully")
            return True
            
        except Exception as e:
            logger.error("Failed to initialize RAG orchestrator", error=str(e))
            return False
    
    async def _start_agents(self) -> None:
        """Start all registered agents."""
        try:
            agents = self.agent_registry.get_all_agents()
            for agent in agents:
                await agent.start()
                logger.info(f"Started agent: {agent.name}")
        except Exception as e:
            logger.error("Failed to start agents", error=str(e))
    
    async def process_file(self, file_metadata: FileMetadata, file_content: bytes) -> FileProcessingResult:
        """Process a file through the RAG pipeline."""
        start_time = time.time()
        file_id = file_metadata.file_id
        
        try:
            logger.info(f"Processing file: {file_metadata.filename}")
            
            # Update processing status
            self.processing_files[file_id] = FileProcessingResult(
                file_id=file_id,
                status="processing",
                chunks=[],
                total_chunks=0
            )
            
            # Decode file content
            content = file_content.decode('utf-8', errors='ignore')
            
            # Detect file type and language
            file_type = detect_file_type(file_metadata.filename, content)
            language = detect_language(file_metadata.filename, content)
            
            # Update file metadata
            file_metadata.file_type = file_type
            file_metadata.language = language
            
            # Chunk the content
            chunks = self.text_chunker.chunk_text(
                text=content,
                file_id=file_id,
                file_type=file_type,
                language=language,
                filename=file_metadata.filename
            )
            
            if not chunks:
                raise ValueError("No chunks generated from file content")
            
            # Generate embeddings for chunks
            chunk_texts = [chunk.content for chunk in chunks]
            embeddings = await self.embeddings_provider.embed_batch(chunk_texts)
            
            # Attach embeddings to chunks
            for chunk, embedding in zip(chunks, embeddings):
                chunk.embedding = embedding
            
            # Store chunks in vector database
            success = await self.qdrant_client.upsert_chunks(chunks)
            if not success:
                raise ValueError("Failed to store chunks in vector database")
            
            # Update processing result
            processing_time = time.time() - start_time
            result = FileProcessingResult(
                file_id=file_id,
                status="completed",
                chunks=chunks,
                total_chunks=len(chunks),
                processing_time=processing_time,
                metadata={
                    "file_type": file_type.value,
                    "language": language,
                    "original_size": len(content),
                    "chunk_size": settings.max_chunk_size,
                    "chunk_overlap": settings.chunk_overlap
                }
            )
            
            self.processing_files[file_id] = result
            
            logger.info(f"Successfully processed file: {file_metadata.filename}", 
                       chunks=len(chunks), processing_time=processing_time)
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to process file: {file_metadata.filename}", error=str(e))
            
            # Update processing result with error
            result = FileProcessingResult(
                file_id=file_id,
                status="failed",
                chunks=[],
                total_chunks=0,
                processing_time=time.time() - start_time,
                error_message=str(e)
            )
            
            self.processing_files[file_id] = result
            return result
    
    async def chat(self, chat_request: ChatRequest) -> ChatResponse:
        """Process a chat request through the RAG pipeline."""
        try:
            # Generate conversation ID if not provided
            conversation_id = chat_request.conversation_id or str(uuid.uuid4())
            
            # Process files if provided
            if chat_request.files:
                for file_upload in chat_request.files:
                    file_metadata = FileMetadata(
                        filename=file_upload.filename,
                        content_type=file_upload.content_type,
                        size=file_upload.size
                    )
                    await self.process_file(file_metadata, file_upload.content)
            
            # Retrieve relevant context
            context_chunks = await self.vector_retriever.retrieve_relevant_chunks(
                query=chat_request.message,
                limit=settings.max_retrieval_results
            )
            
            # Generate response
            response = await self.response_generator.generate_response(
                query=chat_request.message,
                context_chunks=context_chunks,
                agent_type=chat_request.agent_type,
                temperature=chat_request.temperature,
                max_tokens=chat_request.max_tokens
            )
            
            # Store in conversation history
            if conversation_id not in self.conversation_history:
                self.conversation_history[conversation_id] = []
            
            self.conversation_history[conversation_id].append({
                "user_message": chat_request.message,
                "assistant_response": response.content,
                "timestamp": datetime.now(),
                "context_chunks_used": len(context_chunks),
                "model_used": response.model
            })
            
            # Create chat response
            chat_response = ChatResponse(
                message=response.content,
                conversation_id=conversation_id,
                message_id=str(uuid.uuid4()),
                agent_type=chat_request.agent_type,
                sources=[{
                    "chunk_id": chunk["chunk_id"],
                    "filename": chunk.get("filename", "Unknown"),
                    "score": chunk["score"],
                    "content_preview": chunk["content"][:200] + "..." if len(chunk["content"]) > 200 else chunk["content"]
                } for chunk in context_chunks],
                metadata={
                    "model_used": response.model,
                    "context_chunks_used": len(context_chunks),
                    "response_time": time.time()
                }
            )
            
            return chat_response
            
        except Exception as e:
            logger.error("Chat processing failed", error=str(e))
            raise
    
    async def stream_chat(self, chat_request: ChatRequest) -> AsyncGenerator[StreamingChatResponse, None]:
        """Process a streaming chat request."""
        try:
            # Generate conversation ID if not provided
            conversation_id = chat_request.conversation_id or str(uuid.uuid4())
            
            # Process files if provided
            if chat_request.files:
                for file_upload in chat_request.files:
                    file_metadata = FileMetadata(
                        filename=file_upload.filename,
                        content_type=file_upload.content_type,
                        size=file_upload.size
                    )
                    await self.process_file(file_metadata, file_upload.content)
            
            # Retrieve relevant context
            context_chunks = await self.vector_retriever.retrieve_relevant_chunks(
                query=chat_request.message,
                limit=settings.max_retrieval_results
            )
            
            # Generate streaming response
            message_id = str(uuid.uuid4())
            accumulated_content = ""
            
            async for chunk in self.response_generator.generate_streaming_response(
                query=chat_request.message,
                context_chunks=context_chunks,
                agent_type=chat_request.agent_type,
                temperature=chat_request.temperature,
                max_tokens=chat_request.max_tokens
            ):
                accumulated_content += chunk.content
                
                yield StreamingChatResponse(
                    content=chunk.content,
                    conversation_id=conversation_id,
                    message_id=message_id,
                    is_complete=chunk.is_complete,
                    agent_type=chat_request.agent_type,
                    metadata=chunk.metadata
                )
            
            # Store in conversation history
            if conversation_id not in self.conversation_history:
                self.conversation_history[conversation_id] = []
            
            self.conversation_history[conversation_id].append({
                "user_message": chat_request.message,
                "assistant_response": accumulated_content,
                "timestamp": datetime.now(),
                "context_chunks_used": len(context_chunks),
                "streaming": True
            })
            
        except Exception as e:
            logger.error("Streaming chat processing failed", error=str(e))
            raise
    
    async def execute_agent_task(self, task: AgentTask) -> AgentResult:
        """Execute a task using the appropriate agent."""
        try:
            # Find suitable agent
            suitable_agents = self.agent_registry.get_agents_by_capability(task.task_type)
            
            if not suitable_agents:
                # Try to find any agent that can handle the task
                for agent in self.agent_registry.get_all_agents():
                    if await agent.can_handle(task):
                        suitable_agents = [agent]
                        break
            
            if not suitable_agents:
                raise ValueError(f"No agent found to handle task type: {task.task_type}")
            
            # Use the first suitable agent
            agent = suitable_agents[0]
            
            # Execute task
            result = await agent.execute(task)
            
            logger.info(f"Agent task executed", 
                       agent_name=agent.name, 
                       task_type=task.task_type, 
                       success=result.success)
            
            return result
            
        except Exception as e:
            logger.error("Agent task execution failed", error=str(e))
            raise
    
    async def search_files(self, query: str, filters: Dict[str, Any] = None) -> Dict[str, Any]:
        """Search files using the vector retriever."""
        try:
            search_response = await self.vector_retriever.search_files(
                query=query,
                **filters or {}
            )
            
            return {
                "query": query,
                "results": [result.dict() for result in search_response.results],
                "total_results": search_response.total_results,
                "search_time": search_response.search_time,
                "metadata": search_response.metadata
            }
            
        except Exception as e:
            logger.error("File search failed", error=str(e))
            raise
    
    async def get_conversation_history(self, conversation_id: str) -> List[Dict[str, Any]]:
        """Get conversation history."""
        return self.conversation_history.get(conversation_id, [])
    
    async def get_processing_status(self, file_id: str) -> Optional[FileProcessingResult]:
        """Get file processing status."""
        return self.processing_files.get(file_id)
    
    async def health_check(self) -> Dict[str, Any]:
        """Perform comprehensive health check."""
        try:
            health_status = {
                "orchestrator": True,
                "components": {},
                "agents": {},
                "timestamp": datetime.now().isoformat()
            }
            
            # Check components
            health_status["components"]["qdrant"] = await self.qdrant_client.is_healthy()
            health_status["components"]["embeddings"] = await self.embeddings_provider.health_check()
            health_status["components"]["vector_retriever"] = await self.vector_retriever.health_check()
            health_status["components"]["response_generator"] = await self.response_generator.health_check()
            
            # Check agents
            agents = self.agent_registry.get_all_agents()
            for agent in agents:
                health_status["agents"][agent.name] = await agent.health_check()
            
            # Overall health
            all_healthy = all(health_status["components"].values()) and all(health_status["agents"].values())
            health_status["overall_healthy"] = all_healthy
            
            return health_status
            
        except Exception as e:
            logger.error("Health check failed", error=str(e))
            return {
                "orchestrator": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    async def cleanup(self) -> None:
        """Cleanup resources."""
        try:
            # Stop agents
            agents = self.agent_registry.get_all_agents()
            for agent in agents:
                await agent.stop()
            
            # Close Qdrant connection
            await self.qdrant_client.close()
            
            logger.info("RAG orchestrator cleanup completed")
            
        except Exception as e:
            logger.error("Cleanup failed", error=str(e))


# Global orchestrator instance
rag_orchestrator = RAGOrchestrator()


def get_rag_orchestrator() -> RAGOrchestrator:
    """Get the global RAG orchestrator instance."""
    return rag_orchestrator
