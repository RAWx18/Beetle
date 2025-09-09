"""
Chat API routes for the RAG system with session-based context management.
Aligned with JavaScript backend session management approach.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import structlog
import uuid
from datetime import datetime

from core.session_manager import get_session_manager
from models.api.session_models import (
    ChatSession, SessionContext, FileContext, SessionMessage,
    SessionStats, SessionContextUpdate, SessionContextResponse
)
from models.api.auth_models import User
from utils.file_utils import get_file_processor
from models.api.file_models import DocumentChunk, ChunkMetadata
from .dependencies import get_current_user

logger = structlog.get_logger(__name__)
router = APIRouter()


class FileData(BaseModel):
    path: str
    branch: str
    content: str
    size: int
    is_public: bool


class SessionChatRequest(BaseModel):
    message: str


class SessionChatResponse(BaseModel):
    success: bool
    response: str
    session_id: str
    message_id: str
    referenced_files: List[str] = []
    code_snippets: List[Dict[str, Any]] = []
    data: Dict[str, Any] = {}


class CreateSessionRequest(BaseModel):
    user_id: Optional[str] = None
    title: str = "New Chat"
    repository_id: Optional[str] = None
    branch: Optional[str] = None


class CreateSessionResponse(BaseModel):
    success: bool
    session: Dict[str, Any]


class GetSessionResponse(BaseModel):
    success: bool
    session: Dict[str, Any]


class GetSessionMessagesResponse(BaseModel):
    success: bool
    messages: List[Dict[str, Any]]
    session: Dict[str, Any]


class UpdateSessionRequest(BaseModel):
    title: Optional[str] = None
    repository_id: Optional[str] = None
    branch: Optional[str] = None


class UpdateSessionResponse(BaseModel):
    success: bool
    session: Dict[str, Any]


class DeleteSessionResponse(BaseModel):
    success: bool
    message: str


class GetUserSessionsResponse(BaseModel):
    success: bool
    sessions: List[Dict[str, Any]]


class GetSessionStatsResponse(BaseModel):
    success: bool
    stats: Dict[str, Any]


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


class ImportRequest(BaseModel):
    repository_id: str
    branch: str
    source_type: str
    files: List[FileData]
    timestamp: str


class ImportResponse(BaseModel):
    success: bool
    message: str
    data: Dict[str, Any]


class SearchRequest(BaseModel):
    query: str
    repository_id: str
    limit: int = 10


class SearchResponse(BaseModel):
    success: bool
    results: List[Dict[str, Any]]
    total: int


# Session Management Endpoints

@router.post("/sessions", response_model=CreateSessionResponse)
async def create_session(request: CreateSessionRequest, current_user: Optional[User] = Depends(get_current_user)):
    """Create a new chat session."""
    try:
        session_manager = get_session_manager()
        
        user_id = request.user_id
        if not user_id and current_user:
            user_id = current_user.login
        
        if not user_id:
            raise HTTPException(status_code=400, detail="user_id is required and could not be determined from token")

        session = session_manager.create_session(
            user_id=user_id,
            title=request.title,
            repository_id=request.repository_id,
            branch=request.branch
        )
        
        return CreateSessionResponse(
            success=True,
            session=session.get_session_summary()
        )
        
    except Exception as e:
        logger.error(f"Error creating session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions/{session_id}", response_model=GetSessionResponse)
async def get_session(session_id: str):
    """Get a chat session by ID."""
    try:
        session_manager = get_session_manager()
        session = session_manager.get_session(session_id)
        
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return GetSessionResponse(
            success=True,
            session=session.get_session_summary()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/sessions/{session_id}", response_model=UpdateSessionResponse)
async def update_session(session_id: str, request: UpdateSessionRequest):
    """Update a chat session."""
    try:
        session_manager = get_session_manager()
        
        updates = {}
        if request.title is not None:
            updates['title'] = request.title
        if request.repository_id is not None:
            updates['repository_id'] = request.repository_id
        if request.branch is not None:
            updates['branch'] = request.branch
        
        session = session_manager.update_session(session_id, updates)
        
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return UpdateSessionResponse(
            success=True,
            session=session.get_session_summary()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/sessions/{session_id}", response_model=DeleteSessionResponse)
async def delete_session(session_id: str):
    """Delete a chat session."""
    try:
        session_manager = get_session_manager()
        success = session_manager.delete_session(session_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return DeleteSessionResponse(
            success=True,
            message="Session deleted successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/users/{user_id}/sessions", response_model=GetUserSessionsResponse)
async def get_user_sessions(user_id: str):
    """Get all sessions for a user."""
    try:
        session_manager = get_session_manager()
        sessions = session_manager.get_user_sessions(user_id)
        
        return GetUserSessionsResponse(
            success=True,
            sessions=[session.get_session_summary() for session in sessions]
        )
        
    except Exception as e:
        logger.error(f"Error getting user sessions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Session Context Management Endpoints

@router.get("/sessions/{session_id}/context/stats", response_model=GetSessionStatsResponse)
async def get_session_context_stats(session_id: str):
    """Get session context statistics."""
    try:
        session_manager = get_session_manager()
        stats = session_manager.get_session_stats(session_id)
        
        if not stats:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return GetSessionStatsResponse(
            success=True,
            stats=stats.dict()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting session stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/sessions/{session_id}/context", response_model=SessionContextResponse)
async def update_session_context(session_id: str, request: SessionContextUpdate):
    """Update session context (add/remove files)."""
    try:
        session_manager = get_session_manager()
        session = session_manager.get_session(session_id)
        
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        if request.action == "add_files":
            if not request.files:
                raise HTTPException(status_code=400, detail="Files required for add_files action")
            
            added_count = 0
            for file_data in request.files:
                success = session_manager.add_file_to_session(session_id, file_data)
                if success:
                    added_count += 1
            
            message = f"Added {added_count} files to session context"
            
        elif request.action == "remove_files":
            if not request.files:
                raise HTTPException(status_code=400, detail="Files required for remove_files action")
            
            removed_count = 0
            for file_data in request.files:
                success = session_manager.remove_file_from_session(
                    session_id, 
                    file_data['path'], 
                    file_data.get('branch', 'main')
                )
                if success:
                    removed_count += 1
            
            message = f"Removed {removed_count} files from session context"
            
        elif request.action == "clear_files":
            session_manager.clear_session_files(session_id)
            message = "Cleared all files from session context"
        
        # Get updated session
        updated_session = session_manager.get_session(session_id)
        context_summary = session_manager.get_session_context_summary(session_id)
        
        return SessionContextResponse(
            success=True,
            message=message,
            session=updated_session.get_session_summary() if updated_session else None,
            context_summary=context_summary
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating session context: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Session Message Endpoints

@router.post("/sessions/{session_id}/messages", response_model=SessionChatResponse)
async def send_session_message(session_id: str, request: SessionChatRequest):
    """Send a message in a chat session."""
    try:
        session_manager = get_session_manager()
        session = session_manager.get_session(session_id)
        
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Add user message to session
        user_message = session_manager.add_message_to_session(
            session_id=session_id,
            role="user",
            content=request.message
        )
        
        if not user_message:
            raise HTTPException(status_code=500, detail="Failed to add user message")
        
        # Get the global orchestrator instance
        from app import get_global_orchestrator
        orchestrator = get_global_orchestrator()
        
        if not orchestrator:
            raise HTTPException(status_code=503, detail="System not initialized")
        
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
        
        # Process message with RAG pipeline
        enhanced_query = (
            "Context from session files:\n\n"
            + "\n".join([
                "File: {} (Branch: {}\nContent:\n{}\n{}".format(
                    f['path'], f['branch'], f['content'], '-' * 50
                ) for f in context_files
            ])
            + f"\n\nUser Question: {request.message}\n\n"
              + "Please provide a detailed response based on the code and files provided above.\n"
              + "- Reference specific file names and line numbers where applicable\n"
              + "- Include relevant code snippets with proper citations\n"
              + "- Provide confidence scores for your responses\n"
        )
        
        # This is a placeholder for the actual response generation
        response_content = "Response based on the provided context."

        # Add assistant message to session
        assistant_message = session_manager.add_message_to_session(
            session_id=session_id,
            role="assistant",
            content=response_content,
        )

        if not assistant_message:
            raise HTTPException(status_code=500, detail="Failed to add assistant message")

        return SessionChatResponse(
            success=True,
            response=response_content,
            session_id=session_id,
            message_id=str(assistant_message.id)
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending message: {e}")
        raise HTTPException(status_code=500, detail=str(e))