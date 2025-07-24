from datetime import datetime
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field, ConfigDict
from enum import Enum


class SourceType(str, Enum):
    GITHUB = "github"
    WEB = "web"
    CSV = "csv"
    PDF = "pdf"
    DOCX = "docx"
    TEXT = "text"
    BRANCH = "branch"


class DocumentStatus(str, Enum):
    RAW = "raw"
    NORMALIZED = "normalized"
    EMBEDDED = "embedded"
    ERROR = "error"


class RawDocument(BaseModel):
    """Raw document from ingestion agents"""
    model_config = ConfigDict(protected_namespaces=())
    id: str = Field(..., description="Unique document ID")
    source_type: SourceType = Field(..., description="Type of source")
    source_url: Optional[str] = Field(None, description="Source URL or identifier")
    content: str = Field(..., description="Raw content text")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Source-specific metadata")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Ingestion timestamp")
    repository_id: Optional[str] = Field(None, description="Associated repository ID")
    branch: Optional[str] = Field(None, description="Associated branch name")
    status: DocumentStatus = Field(default=DocumentStatus.RAW, description="Processing status")
    error_message: Optional[str] = Field(None, description="Error message if processing failed")


class NormalizedDocument(BaseModel):
    """Normalized document after format agent processing"""
    id: str = Field(..., description="Unique document ID")
    source_type: SourceType = Field(..., description="Type of source")
    source_url: Optional[str] = Field(None, description="Source URL or identifier")
    title: Optional[str] = Field(None, description="Document title")
    content: str = Field(..., description="Cleaned and normalized content")
    summary: Optional[str] = Field(None, description="Document summary")
    tags: List[str] = Field(default_factory=list, description="Content tags")
    language: Optional[str] = Field(None, description="Detected language")
    word_count: int = Field(..., description="Word count")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Normalized metadata")
    timestamp: datetime = Field(..., description="Processing timestamp")
    repository_id: Optional[str] = Field(None, description="Associated repository ID")
    branch: Optional[str] = Field(None, description="Associated branch name")
    status: DocumentStatus = Field(default=DocumentStatus.NORMALIZED, description="Processing status")
    error_message: Optional[str] = Field(None, description="Error message if processing failed")


class EmbeddedDocument(BaseModel):
    """Document with vector embeddings"""
    id: str = Field(..., description="Unique document ID")
    source_type: SourceType = Field(..., description="Type of source")
    source_url: Optional[str] = Field(None, description="Source URL or identifier")
    title: Optional[str] = Field(None, description="Document title")
    content: str = Field(..., description="Document content")
    summary: Optional[str] = Field(None, description="Document summary")
    tags: List[str] = Field(default_factory=list, description="Content tags")
    language: Optional[str] = Field(None, description="Detected language")
    word_count: int = Field(..., description="Word count")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Document metadata")
    embedding: List[float] = Field(..., description="Vector embedding")
    embedding_model: str = Field(..., description="Model used for embedding")
    timestamp: datetime = Field(..., description="Processing timestamp")
    repository_id: Optional[str] = Field(None, description="Associated repository ID")
    branch: Optional[str] = Field(None, description="Associated branch name")
    status: DocumentStatus = Field(default=DocumentStatus.EMBEDDED, description="Processing status")
    error_message: Optional[str] = Field(None, description="Error message if processing failed")


class SearchQuery(BaseModel):
    """Search query from user"""
    query: str = Field(..., description="User query text")
    repository_id: Optional[str] = Field(None, description="Repository to search in")
    branch: Optional[str] = Field(None, description="Branch to search in")
    source_types: List[SourceType] = Field(default_factory=list, description="Filter by source types")
    max_results: int = Field(default=10, description="Maximum number of results")
    similarity_threshold: float = Field(default=0.7, description="Minimum similarity score")


class SearchResult(BaseModel):
    """Search result with relevance score"""
    document_id: str = Field(..., description="Document ID")
    title: Optional[str] = Field(None, description="Document title")
    content: str = Field(..., description="Relevant content snippet")
    source_url: Optional[str] = Field(None, description="Source URL")
    source_type: SourceType = Field(..., description="Source type")
    similarity_score: float = Field(..., description="Similarity score")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Document metadata")
    repository_id: Optional[str] = Field(None, description="Repository ID")
    branch: Optional[str] = Field(None, description="Branch name")


class ChatMessage(BaseModel):
    """Chat message for conversation context"""
    role: str = Field(..., description="Message role (user/assistant)")
    content: str = Field(..., description="Message content")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Message timestamp")


class ChatRequest(BaseModel):
    """Chat request with context"""
    query: str = Field(..., description="User query")
    repository_id: Optional[str] = Field(None, description="Repository ID")
    branch: Optional[str] = Field(None, description="Branch name")
    context_results: List[SearchResult] = Field(default_factory=list, description="Retrieved context")
    conversation_history: List[ChatMessage] = Field(default_factory=list, description="Conversation history")
    max_tokens: int = Field(default=1000, description="Maximum response tokens")


class ChatResponse(BaseModel):
    """Chat response with answer and sources"""
    answer: str = Field(..., description="Generated answer")
    sources: List[Dict[str, Any]] = Field(default_factory=list, description="Cited sources")
    confidence: float = Field(..., description="Confidence score")
    model_used: str = Field(..., description="Model used for generation")
    processing_time: float = Field(..., description="Processing time in seconds")
    tokens_used: int = Field(..., description="Tokens used in generation") 