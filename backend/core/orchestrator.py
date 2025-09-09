"""
Core orchestrator for the RAG system with session-based context management.
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
from models.api.session_models import ChatSession, SessionContext, FileContext
from rag.preprocessing.chunker import get_text_chunker
from rag.retrieval.vector_retriever import get_enhanced_vector_retriever
from rag.generation.response_generator import get_enhanced_response_generator
from embeddings import get_embeddings_provider
from vectorstore.qdrant.client import get_enhanced_qdrant_client
from agents.base.base_agent import get_enhanced_agent_registry, AgentTask, AgentResult
from utils.file_utils import detect_file_type, detect_language
from core.session_manager import get_session_manager, initialize_session_manager, shutdown_session_manager

logger = structlog.get_logger(__name__)
settings = get_settings()


class RAGOrchestrator:
    """Main orchestrator for RAG pipeline and agent coordination with session management."""
    
    def __init__(self):
        """Initialize the orchestrator."""
        # Initialize components
        self.text_chunker = get_text_chunker()
        self.vector_retriever = get_enhanced_vector_retriever()
        self.response_generator = get_enhanced_response_generator()
        self.embeddings_provider = get_embeddings_provider()
        self.qdrant_client = get_enhanced_qdrant_client()
        self.agent_registry = get_enhanced_agent_registry()
        
        # Session manager
        self.session_manager = get_session_manager()
        
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
            
            # Initialize session manager
            session_manager_initialized = await initialize_session_manager()
            if not session_manager_initialized:
                logger.error("Failed to initialize session manager")
                return False
            
            # Start agents
            await self._start_agents()
            
            logger.info("RAG orchestrator initialized successfully")
            return True
            
        except Exception as e:
            logger.error("Failed to initialize RAG orchestrator", error=str(e))
            return False
    
    async def shutdown(self) -> None:
        """Shutdown the orchestrator and all components."""
        try:
            logger.info("Shutting down RAG orchestrator")
            
            # Shutdown session manager
            await shutdown_session_manager()
            
            # Shutdown agents
            await self._stop_agents()
            
            logger.info("RAG orchestrator shutdown completed")
            
        except Exception as e:
            logger.error("Error during orchestrator shutdown", error=str(e))
    
    async def _start_agents(self) -> None:
        """Start all registered agents."""
        try:
            agents = self.agent_registry.get_all_agents()
            for agent in agents:
                await agent.start()
                logger.info(f"Started agent: {agent.name}")
        except Exception as e:
            logger.error("Failed to start agents", error=str(e))
    
    async def _stop_agents(self) -> None:
        """Stop all registered agents."""
        try:
            agents = self.agent_registry.get_all_agents()
            for agent in agents:
                await agent.stop()
                logger.info(f"Stopped agent: {agent.name}")
        except Exception as e:
            logger.error("Failed to stop agents", error=str(e))
    
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
            chunks = await self.text_chunker.chunk_text(
                text=content,
                filename=file_metadata.filename,
                file_type=file_type,
                language=language
            )
            
            # Create document chunks
            document_chunks = []
            for i, chunk in enumerate(chunks):
                chunk_metadata = ChunkMetadata(
                    chunk_id=f"{file_id}_{i}",
                file_id=file_id,
                    chunk_index=i,
                    start_line=chunk.get('start_line', 0),
                    end_line=chunk.get('end_line', 0),
                    start_char=chunk.get('start_char', 0),
                    end_char=chunk.get('end_char', len(chunk.get('text', ''))),
                    chunk_type=chunk.get('type', 'text'),
                language=language,
                    complexity_score=chunk.get('complexity_score', 0.0)
                )
                
                document_chunk = DocumentChunk(
                    chunk_id=f"{file_id}_{i}",
                    file_id=file_id,
                    content=chunk.get('text', ''),
                    metadata=chunk_metadata
                )
                document_chunks.append(document_chunk)
            
            # Generate embeddings
            for chunk in document_chunks:
                embedding = await self.embeddings_provider.embed_text(chunk.content)
                chunk.embedding = embedding
            
            # Store in vector database
            success = await self.qdrant_client.upsert_chunks(document_chunks)
            
            if not success:
                raise Exception("Failed to store chunks in vector database")
            
            # Update processing result
            processing_time = time.time() - start_time
            self.processing_files[file_id] = FileProcessingResult(
                file_id=file_id,
                status="completed",
                chunks=document_chunks,
                total_chunks=len(document_chunks),
                processing_time=processing_time
            )
            
            logger.info(f"Successfully processed {file_metadata.filename} - {len(document_chunks)} chunks")
            return self.processing_files[file_id]
            
        except Exception as e:
            logger.error(f"Error processing file {file_metadata.filename}: {str(e)}")
            
            # Update processing result with error
            self.processing_files[file_id] = FileProcessingResult(
                file_id=file_id,
                status="failed",
                chunks=[],
                total_chunks=0,
                error_message=str(e)
            )
            
            return self.processing_files[file_id]
    
    async def process_session_files(self, session_id: str, files: List[Dict[str, Any]]) -> bool:
        """Process files for a specific session."""
        try:
            session = self.session_manager.get_session(session_id)
            if not session:
                logger.error(f"Session {session_id} not found")
                return False
            
            processed_count = 0
            for file_data in files:
                try:
                    # Add file to session context
                    success = self.session_manager.add_file_to_session(session_id, file_data)
                    if success:
                        processed_count += 1
                        logger.info(f"Added file {file_data['path']} to session {session_id}")
                    else:
                        logger.warning(f"Failed to add file {file_data['path']} to session {session_id}")
                        
                except Exception as e:
                    logger.error(f"Error processing file {file_data.get('path', 'unknown')}: {str(e)}")
                    continue
            
            logger.info(f"Processed {processed_count}/{len(files)} files for session {session_id}")
            return processed_count > 0
            
        except Exception as e:
            logger.error(f"Error processing session files: {str(e)}")
            return False
    
    async def chat_with_session_context(
        self, 
        session_id: str, 
        message: str, 
        user_id: str
    ) -> Dict[str, Any]:
        """Chat with session context."""
        try:
            session = self.session_manager.get_session(session_id)
            if not session:
                raise Exception("Session not found")
            
            # Add user message to session
            user_message = self.session_manager.add_message_to_session(
                session_id=session_id,
                role="user",
                content=message
            )
            
            if not user_message:
                raise Exception("Failed to add user message to session")
            
            # Prepare context from session files
            context_files = []
            for file_context in session.context.files.values():
                context_files.append({
                    "path": file_context.path,
                    "branch": file_context.branch,
                    "content": file_context.content,
                    "size": file_context.size,
                    "is_public": True
                })
            
            # Create enhanced query with session context
            enhanced_query = (
                "Context from session files:\n\n"
                + "\n".join([
                    f"File: {f['path']} (Branch: {f['branch']})\nContent:\n{f['content']}\n{'-' * 50}"
                    for f in context_files
                ])
                + f"\n\nUser Question: {message}\n\n"
                + "Please provide a detailed response based on the code and files provided above.\n"
                  "- Reference specific file names and line numbers where applicable\n"
                  "- Include relevant code snippets with proper citations\n"
                  "- Provide confidence scores for your responses\n"
                  "- If context is insufficient, clearly state what additional information would be helpful"
            )

            # Create enhanced task for the code chat agent
            task = AgentTask(
                task_type="code_chat",
                input_data={
                    "query": enhanced_query,
                    "context": chr(10).join([f.content for f in session.context.files.values()]),
                    "files": [f.path for f in session.context.files.values()],
                    "repository_id": session.repository_id or "default"
                },
                parameters={
                    "temperature": 0.7,
                    "max_tokens": 2500,
                    "include_code_snippets": True,
                    "include_citations": True,
                    "include_confidence": True
                }
            )
            
            # Get the code chat agent
            agent = self.agent_registry.get_agent_by_type("code_chat")
            if not agent:
                raise Exception("Code chat agent not found")
            
            # Execute the task
            result = await agent.execute(task)
            
            if not result.success:
                raise Exception(f"Agent execution failed: {result.error_message}")
            
            # Extract response
            response = result.output_data.get("response", "No response generated")
            
            # Extract code snippets from response
            import re
            code_block_pattern = r"```(\w+)?\n(.*?)```"
            code_matches = re.findall(code_block_pattern, response, re.DOTALL)
            
            code_snippets = []
            for lang, code in code_matches:
                if code.strip():
                    code_snippets.append({
                        "language": lang or "text",
                        "code": code.strip(),
                        "filePath": None,
                        "source": "response"
                    })
            
            # Add assistant message to session
            assistant_message = self.session_manager.add_message_to_session(
                session_id=session_id,
                role="assistant",
                content=response,
                files_referenced=[f.path for f in session.context.files.values()],
                code_snippets=code_snippets,
                metadata={
                    "agent_used": agent.name,
                    "processing_time": result.metadata.get("processing_time", 0),
                    "tokens_used": result.metadata.get("tokens_used", 0)
                }
            )
            
            if not assistant_message:
                raise Exception("Failed to add assistant message to session")
            
            return {
                "success": True,
                "response": response,
                "session_id": session_id,
                "message_id": assistant_message.message_id,
                "referenced_files": [f.path for f in session.context.files.values()],
                "code_snippets": code_snippets,
                "data": {
                    "agent_used": agent.name,
                    "processing_time": result.metadata.get("processing_time", 0),
                    "tokens_used": result.metadata.get("tokens_used", 0),
                    "files_processed": len(session.context.files),
                    "context_length": sum(len(f.content) for f in session.context.files.values()),
                    "rag_enabled": True
                }
            }
            
        except Exception as e:
            logger.error(f"Error in chat with session context: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def get_session_context_summary(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session context summary."""
        try:
            return self.session_manager.get_session_context_summary(session_id)
        except Exception as e:
            logger.error(f"Error getting session context summary: {str(e)}")
            return None
    
    async def get_session_stats(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session statistics."""
        try:
            stats = self.session_manager.get_session_stats(session_id)
            return stats.dict() if stats else None
        except Exception as e:
            logger.error(f"Error getting session stats: {str(e)}")
            return None
    
    async def search_with_session_context(
        self, 
        session_id: str, 
        query: str, 
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Search within session context."""
        try:
            session = self.session_manager.get_session(session_id)
            if not session:
                return []
            
            # Get file IDs from session context
            file_ids = [f"{session.repository_id}_{fc.path}" for fc in session.context.files.values()]
            
            # Perform search with session context filters
            search_results = await self.vector_retriever.search(
                query=query,
                limit=limit,
                filters={"file_id": file_ids} if file_ids else None
            )
            
            # Format results
            results = []
            for result in search_results:
                results.append({
                    "chunk_id": result.chunk_id,
                    "file_id": result.file_id,
                    "content": result.content,
                    "score": result.score,
                    "metadata": result.metadata.dict() if result.metadata else {}
                })
            
            return results
            
        except Exception as e:
            logger.error(f"Error searching with session context: {str(e)}")
            return []
    
    async def get_orchestrator_stats(self) -> Dict[str, Any]:
        """Get orchestrator statistics."""
        try:
            # Get session manager stats
            session_stats = self.session_manager.get_manager_stats()
            
            # Get agent stats
            agent_stats = {
                "total_agents": len(self.agent_registry.get_all_agents()),
                "active_agents": len([a for a in self.agent_registry.get_all_agents() if a.is_active])
            }
            
            # Get vector store stats
            vector_stats = await self.qdrant_client.get_collection_stats()
            
            return {
                "session_manager": session_stats,
                "agents": agent_stats,
                "vector_store": vector_stats,
                "processing_files": len(self.processing_files),
                "conversation_history": len(self.conversation_history)
            }
            
        except Exception as e:
            logger.error(f"Error getting orchestrator stats: {str(e)}")
            return {"error": str(e)}


# Global orchestrator instance
_orchestrator: Optional[RAGOrchestrator] = None


def get_orchestrator() -> RAGOrchestrator:
    """Get the global orchestrator instance."""
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = RAGOrchestrator()
    return _orchestrator


async def initialize_orchestrator() -> bool:
    """Initialize the global orchestrator."""
    try:
        orchestrator = get_orchestrator()
        return await orchestrator.initialize()
    except Exception as e:
        logger.error(f"Failed to initialize orchestrator: {e}")
        return False


async def shutdown_orchestrator() -> None:
    """Shutdown the global orchestrator."""
    global _orchestrator
    if _orchestrator:
        await _orchestrator.shutdown()
        _orchestrator = None
