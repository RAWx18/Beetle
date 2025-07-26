from datetime import datetime
from typing import Dict, List, Optional, Any, Union
from pydantic import BaseModel, Field, ConfigDict
from enum import Enum
from .document import SourceType, DocumentStatus


class ChunkingStrategy(str, Enum):
    """Strategies for document chunking"""
    FIXED_SIZE = "fixed_size"
    SEMANTIC = "semantic"
    CODE_AWARE = "code_aware"
    HYBRID = "hybrid"


class EmbeddingModel(str, Enum):
    """Supported embedding models"""
    OPENAI_ADA_002 = "text-embedding-ada-002"
    OPENAI_ADA_003 = "text-embedding-3-small"
    OPENAI_ADA_003_LARGE = "text-embedding-3-large"
    SENTENCE_TRANSFORMERS = "sentence-transformers/all-MiniLM-L6-v2"
    CODE_BERT = "microsoft/codebert-base"
    STARCODER = "bigcode/starcoder"


class ChunkedDocument(BaseModel):
    """Document split into semantic chunks"""
    model_config = ConfigDict(protected_namespaces=())
    
    id: str = Field(..., description="Unique chunk ID")
    document_id: str = Field(..., description="Parent document ID")
    content: str = Field(..., description="Chunk content")
    chunk_index: int = Field(..., description="Chunk position in document")
    chunk_type: str = Field(..., description="Type of chunk (code, text, etc.)")
    language: Optional[str] = Field(None, description="Programming language if code")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Chunk metadata")
    start_line: Optional[int] = Field(None, description="Start line number")
    end_line: Optional[int] = Field(None, description="End line number")
    token_count: int = Field(..., description="Number of tokens in chunk")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class EmbeddingChunk(BaseModel):
    """Chunk with vector embeddings"""
    model_config = ConfigDict(protected_namespaces=())
    
    id: str = Field(..., description="Unique embedding ID")
    chunk_id: str = Field(..., description="Associated chunk ID")
    document_id: str = Field(..., description="Parent document ID")
    content: str = Field(..., description="Chunk content")
    embedding: List[float] = Field(..., description="Vector embedding")
    embedding_model: EmbeddingModel = Field(..., description="Model used for embedding")
    embedding_dimension: int = Field(..., description="Embedding dimension")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Embedding metadata")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class RetrievalContext(BaseModel):
    """Retrieved context for generation"""
    model_config = ConfigDict(protected_namespaces=())
    
    query: str = Field(..., description="Original query")
    retrieved_chunks: List[EmbeddingChunk] = Field(..., description="Retrieved chunks")
    similarity_scores: List[float] = Field(..., description="Similarity scores")
    total_tokens: int = Field(..., description="Total tokens in context")
    retrieval_time: float = Field(..., description="Retrieval time in seconds")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Retrieval metadata")


class GenerationRequest(BaseModel):
    """Request for answer generation"""
    model_config = ConfigDict(protected_namespaces=())
    
    query: str = Field(..., description="User query")
    context: RetrievalContext = Field(..., description="Retrieved context")
    conversation_history: List[Dict[str, str]] = Field(default_factory=list, description="Conversation history")
    max_tokens: int = Field(default=1000, description="Maximum response tokens")
    temperature: float = Field(default=0.7, description="Generation temperature")
    model: str = Field(default="gpt-4", description="LLM model to use")
    include_sources: bool = Field(default=True, description="Include source citations")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Request metadata")


class RAGResponse(BaseModel):
    """Complete RAG response with sources"""
    model_config = ConfigDict(protected_namespaces=())
    
    answer: str = Field(..., description="Generated answer")
    sources: List[Dict[str, Any]] = Field(default_factory=list, description="Cited sources")
    confidence: float = Field(..., description="Confidence score")
    model_used: str = Field(..., description="Model used for generation")
    processing_time: float = Field(..., description="Total processing time")
    tokens_used: int = Field(..., description="Tokens used in generation")
    context_tokens: int = Field(..., description="Tokens in context")
    generation_tokens: int = Field(..., description="Tokens in generation")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Response metadata")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class RAGQuery(BaseModel):
    """RAG query with advanced options"""
    model_config = ConfigDict(protected_namespaces=())
    
    query: str = Field(..., description="User query")
    repository_id: Optional[str] = Field(None, description="Repository to search in")
    branch: Optional[str] = Field(None, description="Branch to search in")
    source_types: List[SourceType] = Field(default_factory=list, description="Filter by source types")
    languages: List[str] = Field(default_factory=list, description="Filter by programming languages")
    max_results: int = Field(default=10, description="Maximum retrieval results")
    similarity_threshold: float = Field(default=0.7, description="Minimum similarity score")
    chunking_strategy: ChunkingStrategy = Field(default=ChunkingStrategy.HYBRID, description="Chunking strategy")
    embedding_model: EmbeddingModel = Field(default=EmbeddingModel.SENTENCE_TRANSFORMERS, description="Embedding model")
    include_metadata: bool = Field(default=True, description="Include metadata in response")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Query metadata")


class RAGMetrics(BaseModel):
    """RAG system performance metrics"""
    model_config = ConfigDict(protected_namespaces=())
    
    query_id: str = Field(..., description="Query identifier")
    retrieval_time: float = Field(..., description="Retrieval time in seconds")
    generation_time: float = Field(..., description="Generation time in seconds")
    total_time: float = Field(..., description="Total processing time")
    retrieval_quality: float = Field(..., description="Retrieval quality score")
    generation_quality: float = Field(..., description="Generation quality score")
    user_feedback: Optional[int] = Field(None, description="User feedback score (1-5)")
    tokens_used: int = Field(..., description="Total tokens used")
    cost_estimate: float = Field(..., description="Estimated cost in USD")
    created_at: datetime = Field(default_factory=datetime.utcnow) 