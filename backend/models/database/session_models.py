"""
Session-related database models.
Maps your existing session_models.py Pydantic models to SQLAlchemy.
"""

from sqlalchemy import Column, String, Integer, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from .base import Base, BaseModel, JSON, GUID

class ChatSessionModel(Base, BaseModel):
    """Chat session database model mapping to session_models.ChatSession."""
    __tablename__ = "chat_sessions"

    session_id = Column(String(255), unique=True, nullable=False, index=True)
    user_id = Column(GUID(), ForeignKey("users.id"), nullable=False)
    title = Column(String(500), nullable=False)
    
    # Session context
    repository_id = Column(String(255))
    branch = Column(String(255))
    status = Column(String(20), default="active")  # active, paused, closed, expired
    
    # Session statistics
    message_count = Column(Integer, default=0)
    last_activity = Column(DateTime(timezone=True), default=datetime.now)
    
    # Context data as JSON
    context_data = Column(JSON, default=dict)  # SessionContext data
    
    # Relationships
    user = relationship("UserModel", back_populates="chat_sessions")
    messages = relationship("SessionMessageModel", back_populates="session", cascade="all, delete-orphan")
    files = relationship("FileContextModel", back_populates="session", cascade="all, delete-orphan")

class SessionMessageModel(Base, BaseModel):
    """Session message database model mapping to session_models.SessionMessage."""
    __tablename__ = "session_messages"

    message_id = Column(String(255), unique=True, nullable=False, index=True)
    session_id = Column(GUID(), ForeignKey("chat_sessions.id"), nullable=False)
    
    # Message content
    role = Column(String(20), nullable=False)  # user, assistant, system
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), default=datetime.now)
    
    # Message metadata
    files_referenced = Column(JSON, default=list)  # List[str]
    code_snippets = Column(JSON, default=list)  # List[Dict[str, Any]]
    meta_data = Column(JSON)  # Optional[Dict[str, Any]]
    
    # Relationships
    session = relationship("ChatSessionModel", back_populates="messages")

class FileContextModel(Base, BaseModel):
    """File context database model mapping to session_models.FileContext."""
    __tablename__ = "file_contexts"

    session_id = Column(GUID(), ForeignKey("chat_sessions.id"), nullable=False)
    
    # File identification
    path = Column(Text, nullable=False)
    branch = Column(String(255), nullable=False)
    
    # File metadata
    content = Column(Text, nullable=False)
    size = Column(Integer, nullable=False)
    language = Column(String(100))
    file_type = Column(String(100))
    
    # Context metrics
    chunk_count = Column(Integer, default=0)
    token_count = Column(Integer, default=0)
    added_at = Column(DateTime(timezone=True), default=datetime.now)
    last_accessed = Column(DateTime(timezone=True), default=datetime.now)
    
    # Relationships
    session = relationship("ChatSessionModel", back_populates="files")

