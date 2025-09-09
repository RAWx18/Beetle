"""
Session-based models for the RAG system.
Handles chat sessions with integrated context management.
"""

from typing import List, Optional, Dict, Any, Set
from pydantic import BaseModel, Field, validator
from datetime import datetime
from enum import Enum
import uuid


class SessionStatus(str, Enum):
    """Session status enumeration."""
    ACTIVE = "active"
    PAUSED = "paused"
    CLOSED = "closed"
    EXPIRED = "expired"


class FileContext(BaseModel):
    """File context within a session."""
    path: str = Field(..., description="File path")
    branch: str = Field(..., description="Git branch")
    content: str = Field(..., description="File content")
    size: int = Field(..., description="File size in bytes")
    language: Optional[str] = Field(default=None, description="Programming language")
    file_type: Optional[str] = Field(default=None, description="File type")
    added_at: datetime = Field(default_factory=datetime.now, description="When file was added to session")
    last_accessed: datetime = Field(default_factory=datetime.now, description="Last access time")
    chunk_count: int = Field(default=0, description="Number of chunks created from this file")
    token_count: int = Field(default=0, description="Estimated token count")


class SessionContext(BaseModel):
    """Session context containing files and metadata."""
    session_id: str = Field(..., description="Session identifier")
    files: Dict[str, FileContext] = Field(default_factory=dict, description="Files in session context")
    total_files: int = Field(default=0, description="Total number of files")
    total_tokens: int = Field(default=0, description="Total token count")
    max_files: int = Field(default=10, description="Maximum files allowed in context")
    max_tokens: int = Field(default=50000, description="Maximum tokens allowed in context")
    created_at: datetime = Field(default_factory=datetime.now, description="Context creation time")
    updated_at: datetime = Field(default_factory=datetime.now, description="Last update time")
    
    @validator('session_id')
    def validate_session_id(cls, v):
        if not v:
            return str(uuid.uuid4())
        return v
    
    def add_file(self, file_context: FileContext) -> bool:
        """Add a file to the session context."""
        if len(self.files) >= self.max_files:
            return False
        
        # Check token limit
        estimated_tokens = len(file_context.content) // 4  # Rough estimation
        if self.total_tokens + estimated_tokens > self.max_tokens:
            return False
        
        file_key = f"{file_context.branch}:{file_context.path}"
        self.files[file_key] = file_context
        self.total_files = len(self.files)
        self.total_tokens += estimated_tokens
        self.updated_at = datetime.now()
        
        return True
    
    def remove_file(self, file_path: str, branch: str = "main") -> bool:
        """Remove a file from the session context."""
        file_key = f"{branch}:{file_path}"
        if file_key in self.files:
            file_context = self.files[file_key]
            estimated_tokens = len(file_context.content) // 4
            self.total_tokens -= estimated_tokens
            del self.files[file_key]
            self.total_files = len(self.files)
            self.updated_at = datetime.now()
            return True
        return False
    
    def clear_files(self) -> None:
        """Clear all files from the session context."""
        self.files.clear()
        self.total_files = 0
        self.total_tokens = 0
        self.updated_at = datetime.now()
    
    def get_file_paths(self) -> List[str]:
        """Get list of file paths in context."""
        return [f"{fc.branch}:{fc.path}" for fc in self.files.values()]
    
    def get_context_summary(self) -> Dict[str, Any]:
        """Get context summary for API responses."""
        return {
            "total_files": self.total_files,
            "total_tokens": self.total_tokens,
            "max_files": self.max_files,
            "max_tokens": self.max_tokens,
            "files": [
                {
                    "path": fc.path,
                    "branch": fc.branch,
                    "size": fc.size,
                    "language": fc.language,
                    "added_at": fc.added_at.isoformat(),
                    "chunk_count": fc.chunk_count,
                    "token_count": fc.token_count
                }
                for fc in self.files.values()
            ],
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }


class ChatSession(BaseModel):
    """Chat session model with integrated context."""
    session_id: str = Field(..., description="Unique session identifier")
    user_id: str = Field(..., description="User identifier")
    title: str = Field(..., description="Session title")
    repository_id: Optional[str] = Field(default=None, description="Associated repository")
    branch: Optional[str] = Field(default=None, description="Git branch")
    status: SessionStatus = Field(default=SessionStatus.ACTIVE, description="Session status")
    context: SessionContext = Field(..., description="Session context")
    message_count: int = Field(default=0, description="Number of messages in session")
    created_at: datetime = Field(default_factory=datetime.now, description="Session creation time")
    updated_at: datetime = Field(default_factory=datetime.now, description="Last update time")
    last_activity: datetime = Field(default_factory=datetime.now, description="Last activity time")
    
    @validator('session_id')
    def validate_session_id(cls, v):
        if not v:
            return str(uuid.uuid4())
        return v
    
    def update_activity(self) -> None:
        """Update last activity timestamp."""
        self.last_activity = datetime.now()
        self.updated_at = datetime.now()
    
    def add_message(self) -> None:
        """Increment message count."""
        self.message_count += 1
        self.update_activity()
    
    def get_session_summary(self) -> Dict[str, Any]:
        """Get session summary for API responses."""
        return {
            "session_id": self.session_id,
            "title": self.title,
            "repository_id": self.repository_id,
            "branch": self.branch,
            "status": self.status.value,
            "message_count": self.message_count,
            "context_summary": self.context.get_context_summary(),
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "last_activity": self.last_activity.isoformat()
        }


class SessionMessage(BaseModel):
    """Message within a chat session."""
    message_id: str = Field(..., description="Unique message identifier")
    session_id: str = Field(..., description="Session identifier")
    role: str = Field(..., description="Message role (user/assistant)")
    content: str = Field(..., description="Message content")
    timestamp: datetime = Field(default_factory=datetime.now, description="Message timestamp")
    files_referenced: List[str] = Field(default_factory=list, description="Files referenced in message")
    code_snippets: List[Dict[str, Any]] = Field(default_factory=list, description="Code snippets in message")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Additional metadata")
    
    @validator('message_id')
    def validate_message_id(cls, v):
        if not v:
            return str(uuid.uuid4())
        return v


class SessionStats(BaseModel):
    """Session statistics."""
    session_id: str = Field(..., description="Session identifier")
    total_files: int = Field(..., description="Total files in context")
    total_tokens: int = Field(..., description="Total tokens in context")
    average_tokens_per_file: float = Field(..., description="Average tokens per file")
    message_count: int = Field(..., description="Total messages in session")
    session_duration: float = Field(..., description="Session duration in seconds")
    created_at: datetime = Field(..., description="Session creation time")
    updated_at: datetime = Field(..., description="Last update time")


class SessionContextUpdate(BaseModel):
    """Session context update request."""
    action: str = Field(..., description="Action to perform (add_files, remove_files, clear_files)")
    files: Optional[List[Dict[str, Any]]] = Field(default=None, description="Files to add/remove")
    
    @validator('action')
    def validate_action(cls, v):
        allowed_actions = ['add_files', 'remove_files', 'clear_files']
        if v not in allowed_actions:
            raise ValueError(f"Action must be one of {allowed_actions}")
        return v


class SessionContextResponse(BaseModel):
    """Session context response."""
    success: bool = Field(..., description="Operation success status")
    message: str = Field(..., description="Response message")
    session: Optional[Dict[str, Any]] = Field(default=None, description="Updated session data")
    context_summary: Optional[Dict[str, Any]] = Field(default=None, description="Context summary")
