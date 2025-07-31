"""
Chat API routes for the RAG system.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import structlog

from core.orchestrator import RAGOrchestrator
from utils.file_utils import get_file_processor
from models.api.file_models import DocumentChunk
from models.api.chunk_models import ChunkMetadata

logger = structlog.get_logger(__name__)
router = APIRouter()


class ChatRequest(BaseModel):
    query: str
    agent_type: str = "code_chat"


class ChatResponse(BaseModel):
    response: str
    metadata: Dict[str, Any] = {}


class FileData(BaseModel):
    path: str
    branch: str
    content: str
    size: int
    is_public: bool


class ProcessRepoRequest(BaseModel):
    repository: str
    repository_id: str
    branch: str
    source_type: str
    files: List[FileData]
    timestamp: str


class ProcessRepoResponse(BaseModel):
    success: bool
    message: str
    data: Dict[str, Any]


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Basic chat endpoint."""
    try:
        # Get the global orchestrator instance
        from app import orchestrator
        
        if not orchestrator:
            raise HTTPException(status_code=503, detail="System not initialized")
        
        # Create a simple task for the agent
        from agents.base.base_agent import AgentTask
        
        task = AgentTask(
            task_type=request.agent_type,
            input_data={"query": request.query},
            parameters={"temperature": 0.7, "max_tokens": 1000}
        )
        
        # Get the appropriate agent
        agent = orchestrator.agent_registry.get_agent_by_type(request.agent_type)
        if not agent:
            raise HTTPException(status_code=400, detail=f"Agent type '{request.agent_type}' not found")
        
        # Execute the task
        result = await agent.execute(task)
        
        if not result.success:
            raise HTTPException(status_code=500, detail=f"Agent execution failed: {result.error_message}")
        
        return ChatResponse(
            response=result.output_data.get("response", "No response generated"),
            metadata={
                "agent_used": agent.name,
                "processing_time": result.metadata.get("processing_time", 0),
                "tokens_used": result.metadata.get("tokens_used", 0)
            }
        )
        
    except Exception as e:
        logger.error("Chat endpoint error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/process-repo", response_model=ProcessRepoResponse)
async def process_repo(request: ProcessRepoRequest):
    """Process repository files and add them to the knowledge base."""
    try:
        logger.info(f"Processing repository: {request.repository}")
        logger.info(f"Files to process: {len(request.files)}")
        
        # Get the global orchestrator instance
        from app import orchestrator
        
        if not orchestrator:
            raise HTTPException(status_code=503, detail="System not initialized")
        
        # Process each file
        processed_files = []
        errors = []
        
        for file_data in request.files:
            try:
                logger.info(f"Processing file: {file_data.path}")
                
                # Create document chunks from file content
                file_processor = get_file_processor()
                
                # Process the file content
                processed_content = await file_processor.process_file_content(
                    content=file_data.content,
                    filename=file_data.path,
                    file_type="text"  # Default to text for now
                )
                
                # Create document chunks
                chunks = []
                for i, element in enumerate(processed_content.get("elements", [])):
                    if element.get("text", "").strip():
                        # Create ChunkMetadata object
                        chunk_metadata = ChunkMetadata(
                            chunk_id=f"{request.repository_id}_{file_data.path}_{i}",
                            file_id=f"{request.repository_id}_{file_data.path}",
                            chunk_index=i,
                            start_line=element.get("start_line", 0),
                            end_line=element.get("end_line", 0),
                            start_char=element.get("start_char", 0),
                            end_char=element.get("end_char", len(element.get("text", ""))),
                            chunk_type="text",
                            language="markdown" if file_data.path.endswith('.md') else "text",
                            complexity_score=0.0
                        )
                        
                        chunk = DocumentChunk(
                            chunk_id=f"{request.repository_id}_{file_data.path}_{i}",
                            file_id=f"{request.repository_id}_{file_data.path}",
                            content=element["text"],
                            metadata=chunk_metadata,
                            created_at=request.timestamp
                        )
                        chunks.append(chunk)
                
                # Add chunks to vector store
                if chunks:
                    success = await orchestrator.qdrant_client.upsert_chunks(chunks)
                    if success:
                        processed_files.append({
                            "path": file_data.path,
                            "chunks_added": len(chunks),
                            "size": file_data.size
                        })
                        logger.info(f"Successfully processed {file_data.path} - {len(chunks)} chunks added")
                    else:
                        errors.append(f"Failed to add chunks for {file_data.path}")
                else:
                    errors.append(f"No content extracted from {file_data.path}")
                    
            except Exception as e:
                error_msg = f"Error processing {file_data.path}: {str(e)}"
                errors.append(error_msg)
                logger.error(error_msg)
        
        # Return response
        return ProcessRepoResponse(
            success=len(processed_files) > 0,
            message=f"Processed {len(processed_files)} files successfully",
            data={
                "repository": request.repository,
                "branch": request.branch,
                "files_processed": len(processed_files),
                "files_failed": len(errors),
                "total_chunks_added": sum(f["chunks_added"] for f in processed_files),
                "processed_files": processed_files,
                "errors": errors if errors else None,
                "timestamp": request.timestamp
            }
        )
        
    except Exception as e:
        logger.error("Process repo error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))
