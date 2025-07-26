"""
Chat request and response models for the RAG system.
Handles message formatting, file uploads, and response structures.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, validator
from datetime import datetime
from enum import Enum


class MessageRole(str, Enum):
    """Message role enumeration."""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class ChatMessage(BaseModel):
    """Individual chat message model."""
    role: MessageRole = Field(..., description="Role of the message sender")
    content: str = Field(..., description="Message content")
    timestamp: Optional[datetime] = Field(default_factory=datetime.now, description="Message timestamp")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Additional message metadata")


class FileUpload(BaseModel):
    """File upload model."""
    filename: str = Field(..., description="Name of the uploaded file")
    content_type: str = Field(..., description="MIME type of the file")
    size: int = Field(..., description="File size in bytes")
    content: bytes = Field(..., description="File content as bytes")
    
    @validator('size')
    def validate_file_size(cls, v):
        max_size = 10 * 1024 * 1024  # 10MB
        if v > max_size:
            raise ValueError(f"File size must be less than {max_size} bytes")
        return v


class ChatRequest(BaseModel):
    """Main chat request model."""
    message: str = Field(..., description="User message content")
    files: Optional[List[FileUpload]] = Field(default=None, description="Uploaded files")
    conversation_id: Optional[str] = Field(default=None, description="Conversation identifier")
    agent_type: Optional[str] = Field(default="code_chat", description="Type of agent to use")
    stream: bool = Field(default=False, description="Whether to stream the response")
    max_tokens: Optional[int] = Field(default=1000, description="Maximum tokens in response")
    temperature: Optional[float] = Field(default=0.7, ge=0.0, le=2.0, description="Response creativity")
    
    @validator('message')
    def validate_message(cls, v):
        if not v.strip():
            raise ValueError("Message cannot be empty")
        if len(v) > 10000:
            raise ValueError("Message too long (max 10000 characters)")
        return v.strip()
    
    @validator('agent_type')
    def validate_agent_type(cls, v):
        allowed_agents = ["code_chat", "documentation", "general"]
        if v not in allowed_agents:
            raise ValueError(f"Agent type must be one of {allowed_agents}")
        return v


class ChatResponse(BaseModel):
    """Chat response model."""
    message: str = Field(..., description="Assistant response content")
    conversation_id: str = Field(..., description="Conversation identifier")
    message_id: str = Field(..., description="Unique message identifier")
    timestamp: datetime = Field(default_factory=datetime.now, description="Response timestamp")
    agent_type: str = Field(..., description="Agent type used for response")
    sources: Optional[List[Dict[str, Any]]] = Field(default=None, description="Source documents used")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Additional response metadata")


class StreamingChatResponse(BaseModel):
    """Streaming chat response model."""
    content: str = Field(..., description="Streaming content chunk")
    conversation_id: str = Field(..., description="Conversation identifier")
    message_id: str = Field(..., description="Unique message identifier")
    is_complete: bool = Field(default=False, description="Whether this is the final chunk")
    agent_type: str = Field(..., description="Agent type used for response")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Additional metadata")


class ConversationHistory(BaseModel):
    """Conversation history model."""
    conversation_id: str = Field(..., description="Unique conversation identifier")
    messages: List[ChatMessage] = Field(default_factory=list, description="List of messages in conversation")
    created_at: datetime = Field(default_factory=datetime.now, description="Conversation creation time")
    updated_at: datetime = Field(default_factory=datetime.now, description="Last update time")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Conversation metadata")


class ErrorResponse(BaseModel):
    """Error response model."""
    error: str = Field(..., description="Error message")
    error_code: str = Field(..., description="Error code")
    details: Optional[Dict[str, Any]] = Field(default=None, description="Additional error details")
    timestamp: datetime = Field(default_factory=datetime.now, description="Error timestamp")


class HealthResponse(BaseModel):
    """Health check response model."""
    status: str = Field(..., description="Overall health status")
    services: Dict[str, bool] = Field(..., description="Individual service health status")
    timestamp: datetime = Field(default_factory=datetime.now, description="Health check timestamp")
    version: str = Field(default="1.0.0", description="API version")
