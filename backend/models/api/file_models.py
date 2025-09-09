"""
File processing models for the RAG system.
Handles file metadata, chunking, and processing status.
"""

import hashlib
import uuid
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, validator
from datetime import datetime
from enum import Enum


class FileStatus(str, Enum):
    """File processing status enumeration."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class FileType(str, Enum):
    """Supported file types."""
    TEXT = "text"
    CODE = "code"
    DOCUMENT = "document"
    IMAGE = "image"
    UNKNOWN = "unknown"


class FileMetadata(BaseModel):
    """File metadata model."""
    filename: str = Field(..., description="Original filename")
    file_id: str = Field(..., description="Unique file identifier")
    content_type: str = Field(..., description="MIME type")
    size: int = Field(..., description="File size in bytes")
    file_type: FileType = Field(..., description="Detected file type")
    language: Optional[str] = Field(default=None, description="Programming language (for code files)")
    checksum: str = Field(..., description="File content checksum")
    uploaded_at: datetime = Field(default_factory=datetime.now, description="Upload timestamp")
    processed_at: Optional[datetime] = Field(default=None, description="Processing completion timestamp")
    status: FileStatus = Field(default=FileStatus.PENDING, description="Processing status")
    error_message: Optional[str] = Field(default=None, description="Error message if processing failed")
    
    @validator('file_id')
    def generate_file_id(cls, v, values):
        if v:
            return v
        # Generate file ID from filename and timestamp
        filename = values.get('filename', 'unknown')
        timestamp = datetime.now().isoformat()
        content = f"{filename}_{timestamp}".encode()
        return hashlib.sha256(content).hexdigest()[:16]
    
    @validator('checksum')
    def generate_checksum(cls, v, values):
        if v:
            return v
        # This will be set when file content is available
        return ""


class ChunkMetadata(BaseModel):
    """Chunk metadata model."""
    chunk_id: str = Field(..., description="Unique chunk identifier")
    file_id: str = Field(..., description="Parent file identifier")
    chunk_index: int = Field(..., description="Chunk position in file")
    start_line: Optional[int] = Field(default=None, description="Starting line number")
    end_line: Optional[int] = Field(default=None, description="Ending line number")
    start_char: int = Field(..., description="Starting character position")
    end_char: int = Field(..., description="Ending character position")
    chunk_type: Optional[str] = Field(default=None, description="Type of chunk (function, class, etc.)")
    language: Optional[str] = Field(default=None, description="Programming language")
    complexity_score: Optional[float] = Field(default=None, description="Code complexity score")
    created_at: datetime = Field(default_factory=datetime.now, description="Chunk creation timestamp")
    
    @validator('chunk_id')
    def generate_chunk_id(cls, v, values):
        if v:
            return v
        # Generate UUID for chunk ID
        return str(uuid.uuid4())


class DocumentChunk(BaseModel):
    """Document chunk model for vector storage."""
    chunk_id: str = Field(..., description="Unique chunk identifier")
    file_id: str = Field(..., description="Parent file identifier")
    content: str = Field(..., description="Chunk content")
    metadata: ChunkMetadata = Field(..., description="Chunk metadata")
    embedding: Optional[List[float]] = Field(default=None, description="Vector embedding")
    vector_id: Optional[str] = Field(default=None, description="Vector database ID")
    created_at: datetime = Field(default_factory=datetime.now, description="Chunk creation timestamp")
    
    @validator('content')
    def validate_content(cls, v):
        if not v.strip():
            raise ValueError("Chunk content cannot be empty")
        return v.strip()
    
    @validator('chunk_id')
    def generate_chunk_id(cls, v, values):
        if v:
            return v
        # Generate UUID for chunk ID
        return str(uuid.uuid4())


class FileProcessingResult(BaseModel):
    """File processing result model."""
    file_id: str = Field(..., description="Processed file identifier")
    status: FileStatus = Field(..., description="Processing status")
    chunks: List[DocumentChunk] = Field(default_factory=list, description="Generated chunks")
    total_chunks: int = Field(default=0, description="Total number of chunks")
    processing_time: Optional[float] = Field(default=None, description="Processing time in seconds")
    error_message: Optional[str] = Field(default=None, description="Error message if failed")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Additional processing metadata")
    completed_at: datetime = Field(default_factory=datetime.now, description="Processing completion timestamp")


class FileUploadRequest(BaseModel):
    """File upload request model."""
    files: List[FileMetadata] = Field(..., description="Files to upload")
    conversation_id: Optional[str] = Field(default=None, description="Associated conversation")
    process_immediately: bool = Field(default=True, description="Whether to process files immediately")
    chunk_size: Optional[int] = Field(default=None, description="Custom chunk size")
    chunk_overlap: Optional[int] = Field(default=None, description="Custom chunk overlap")


class FileUploadResponse(BaseModel):
    """File upload response model."""
    uploaded_files: List[FileMetadata] = Field(..., description="Successfully uploaded files")
    failed_files: List[Dict[str, Any]] = Field(default_factory=list, description="Failed uploads with reasons")
    processing_jobs: List[str] = Field(default_factory=list, description="Processing job IDs")
    total_files: int = Field(..., description="Total number of files")
    successful_uploads: int = Field(..., description="Number of successful uploads")


class FileSearchRequest(BaseModel):
    """File search request model."""
    query: str = Field(..., description="Search query")
    file_ids: Optional[List[str]] = Field(default=None, description="Limit search to specific files")
    file_types: Optional[List[FileType]] = Field(default=None, description="Filter by file types")
    languages: Optional[List[str]] = Field(default=None, description="Filter by programming languages")
    max_results: int = Field(default=10, description="Maximum number of results")
    similarity_threshold: float = Field(default=0.7, ge=0.0, le=1.0, description="Minimum similarity score")


class FileSearchResult(BaseModel):
    """File search result model."""
    chunk_id: str = Field(..., description="Chunk identifier")
    file_id: str = Field(..., description="File identifier")
    filename: str = Field(..., description="Original filename")
    content: str = Field(..., description="Chunk content")
    similarity_score: float = Field(..., description="Similarity score")
    metadata: ChunkMetadata = Field(..., description="Chunk metadata")
    highlights: Optional[List[str]] = Field(default=None, description="Query highlights")


class FileSearchResponse(BaseModel):
    """File search response model."""
    query: str = Field(..., description="Original search query")
    results: List[FileSearchResult] = Field(..., description="Search results")
    total_results: int = Field(..., description="Total number of results")
    search_time: float = Field(..., description="Search execution time")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Additional search metadata")
