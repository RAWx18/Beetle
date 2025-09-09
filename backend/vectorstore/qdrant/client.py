"""
Enhanced Qdrant vector database client with FastEmbed integration.
Handles vector storage, retrieval, and management operations with local embeddings support.
"""

import asyncio
from typing import List, Optional, Dict, Any, Tuple
import structlog
from datetime import datetime
import uuid

from config.settings import get_settings
from models.api.file_models import DocumentChunk, ChunkMetadata

# Try to import Qdrant components, but handle import errors gracefully
try:
    from qdrant_client import AsyncQdrantClient
    from qdrant_client.models import (
        Distance, VectorParams, PointStruct, Filter, FieldCondition,
        Range, MatchValue, SearchRequest, CreateCollection, UpdateStatus,
        HnswConfigDiff, OptimizersConfigDiff, WalConfigDiff
    )
    from qdrant_client.http import models as rest
    QDRANT_AVAILABLE = True
except ImportError as e:
    logger = structlog.get_logger(__name__)
    logger.warning(f"Qdrant client not available: {e}")
    QDRANT_AVAILABLE = False
    AsyncQdrantClient = None
    Distance = None
    VectorParams = None
    PointStruct = None
    Filter = None
    FieldCondition = None
    Range = None
    MatchValue = None
    SearchRequest = None
    CreateCollection = None
    UpdateStatus = None
    HnswConfigDiff = None
    OptimizersConfigDiff = None
    WalConfigDiff = None
    rest = None

logger = structlog.get_logger(__name__)
settings = get_settings()


class EnhancedQdrantClient:
    """Enhanced Qdrant client with FastEmbed integration and advanced features."""
    
    def __init__(self, url: str = None, api_key: str = None):
        """Initialize enhanced Qdrant client."""
        if not QDRANT_AVAILABLE:
            logger.warning("Qdrant client not available, using mock client")
            self.client = None
            self._is_healthy = False
            return
            
        # Use environment variables directly for online mode
        if settings.is_qdrant_online:
            # For online mode, use environment variables directly
            self.url = settings.qdrant_url or url
            self.api_key = api_key or settings.qdrant_api_key
            logger.info("Initializing Qdrant client in ONLINE mode", 
                     url=self.url, 
                       mode=settings.qdrant_mode,
                       has_api_key=bool(self.api_key),
                       )
        else:
            # For local mode, use localhost
            self.url = url or "http://localhost:6333"
            self.api_key = None  # No API key needed for local
            logger.info("Initializing Qdrant client in LOCAL mode", url=self.url)
        
        self.collection_name = settings.qdrant_collection_name
        
        # Initialize client with FastEmbed support
        client_kwargs = {
            "url": self.url,
            "prefer_grpc": False,  # Use gRPC for better performance
            **({"api_key": self.api_key} if self.api_key else {})
        }
        
        self.client = AsyncQdrantClient(**client_kwargs)
        
        # Configuration - Use 384 for Sentence Transformers (all-MiniLM-L6-v2)
        self.vector_size = 384  # Default for all-MiniLM-L6-v2
        self.distance = Distance.COSINE
        
        # FastEmbed integration
        self._fastembed_models = {}
        self._use_fastembed = False
        
        # Health status
        self._is_healthy = False
        self._last_health_check = None
    
    async def initialize(self) -> bool:
        """Initialize the vector database and create collection with FastEmbed."""
        if not QDRANT_AVAILABLE or not self.client:
            logger.warning("Qdrant not available, skipping initialization")
            return False
            
        try:
            # Check if FastEmbed is available
            await self._setup_fastembed()
            
            # Check if collection exists
            collections = await self.client.get_collections()
            collection_names = [col.name for col in collections.collections]
            
            if self.collection_name not in collection_names:
                await self._create_enhanced_collection()
                logger.info("Created enhanced Qdrant collection", collection=self.collection_name)
            else:
                logger.info("Qdrant collection already exists", collection=self.collection_name)
                # Check if collection has correct vector size for Sentence Transformers
                collection_info = await self.client.get_collection(self.collection_name)
                existing_vector_size = collection_info.config.params.vectors.size
                
                if existing_vector_size != self.vector_size:
                    logger.warning(f"Collection vector size mismatch: expected {self.vector_size}, got {existing_vector_size}")
                    logger.info("Deleting and recreating collection with correct vector size for Sentence Transformers")
                    
                    # Delete existing collection
                    await self.client.delete_collection(self.collection_name)
                    logger.info("Deleted existing collection with wrong vector size")
                    
                    # Recreate with correct vector size
                    await self._create_enhanced_collection()
                    logger.info("Recreated Qdrant collection with correct vector size", vector_size=self.vector_size)
                else:
                    # Update vector size based on collection info
                    self.vector_size = existing_vector_size
                    logger.info("Collection vector size matches expected size", vector_size=self.vector_size)
            
            # Create payload indexes
            await self._create_enhanced_indexes()
            
            self._is_healthy = True
            self._last_health_check = datetime.now()
            
            return True
            
        except Exception as e:
            logger.error("Failed to initialize enhanced Qdrant client", error=str(e))
            self._is_healthy = False
            return False
    
    async def _setup_fastembed(self) -> None:
        """Setup FastEmbed integration for local embeddings."""
        try:
            from fastembed import TextEmbedding
            self._fastembed_models['default'] = TextEmbedding()
            self._use_fastembed = True
            logger.info("FastEmbed integration enabled")
        except ImportError:
            logger.info("FastEmbed not available, using external embeddings")
            self._use_fastembed = False
    
    async def _create_enhanced_collection(self) -> None:
        """Create collection with optimized configuration."""
        try:
            # Optimized HNSW configuration
            hnsw_config = HnswConfigDiff(
                m=16,  # Number of edges per node
                ef_construct=100,  # Construction parameter
                full_scan_threshold=10000,  # Full scan threshold
                max_indexing_threads=0,  # Auto-detect threads
                on_disk=True  # Store HNSW index on disk
            )
            
            # Optimizers configuration
            optimizers_config = OptimizersConfigDiff(
                deleted_threshold=0.2,
                vacuum_min_vector_number=1000,
                default_segment_number=0,
                max_segment_size=None,
                memmap_threshold=50000,
                indexing_threshold=50000,
                flush_interval_sec=5,
                max_optimization_threads=0
            )
            
            # WAL configuration for durability
            wal_config = WalConfigDiff(
                wal_capacity_mb=32,
                wal_segments_ahead=0
            )
            
            await self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(
                    size=self.vector_size,
                    distance=self.distance,
                    on_disk=True,
                    hnsw_config=hnsw_config,
                    quantization_config=rest.ScalarQuantization(
                        scalar=rest.ScalarQuantizationConfig(
                            type=rest.ScalarType.INT8,
                            quantile=0.99
                        )
                    )
                ),
                optimizers_config=optimizers_config,
                wal_config=wal_config,
                shard_number=1,  # Single shard for simplicity
                replication_factor=1  # No replication for MVP
            )
            
        except Exception as e:
            logger.error("Failed to create enhanced Qdrant collection", error=str(e))
            raise
    
    async def _create_enhanced_indexes(self) -> None:
        """Create enhanced payload indexes for efficient filtering."""
        # Disabled index creation to eliminate warnings
        # Indexes are not critical for basic functionality and can be added later if needed
        logger.debug("Enhanced indexes creation disabled to eliminate warnings")
        pass
    
    async def generate_embeddings_with_fastembed(
        self, 
        texts: List[str], 
        model_name: str = "BAAI/bge-small-en-v1.5"
    ) -> List[List[float]]:
        """Generate embeddings using FastEmbed for local processing."""
        if not self._use_fastembed:
            raise ValueError("FastEmbed not available")
        
        try:
            if model_name not in self._fastembed_models:
                from fastembed import TextEmbedding
                self._fastembed_models[model_name] = TextEmbedding(model_name)
            
            embeddings = list(self._fastembed_models[model_name].embed(texts))
            return [emb.tolist() for emb in embeddings]
            
        except Exception as e:
            logger.error("FastEmbed generation failed", error=str(e))
            raise
    
    async def upsert_chunks_with_embeddings(
        self, 
        chunks: List[DocumentChunk],
        generate_embeddings: bool = False,
        orchestrator=None
    ) -> bool:
        """Upsert chunks with optional local embedding generation."""
        if not chunks:
            return True
        
        try:
            # Generate embeddings if requested
            if generate_embeddings:
                texts = [chunk.content for chunk in chunks if chunk.content]
                if texts:
                    embeddings = []
                    
                    # Try FastEmbed first
                    if self._use_fastembed:
                        try:
                            embeddings = await self.generate_embeddings_with_fastembed(texts)
                            logger.info(f"Generated {len(embeddings)} embeddings using FastEmbed")
                        except Exception as e:
                            logger.warning(f"FastEmbed failed, falling back to orchestrator embeddings: {e}")
                            embeddings = []
                    
                    # Fallback to orchestrator embeddings provider
                    if not embeddings and orchestrator and hasattr(orchestrator, 'embeddings_provider'):
                        try:
                            embeddings = []
                            for text in texts:
                                embedding = await orchestrator.embeddings_provider.embed_text(text)
                                embeddings.append(embedding)
                            logger.info(f"Generated {len(embeddings)} embeddings using orchestrator provider")
                        except Exception as e:
                            logger.error(f"Orchestrator embeddings failed: {e}")
                            embeddings = []
                    
                    # Assign embeddings to chunks
                    if embeddings and len(embeddings) == len(chunks):
                        for chunk, embedding in zip(chunks, embeddings):
                            chunk.embedding = embedding
                    else:
                        logger.warning(f"Embedding count mismatch: {len(embeddings)} embeddings for {len(chunks)} chunks")
            
            return await self.upsert_chunks(chunks)
            
        except Exception as e:
            logger.error("Upsert with embeddings failed", error=str(e))
            return False
    
    async def upsert_chunks(self, chunks: List[DocumentChunk]) -> bool:
        """Upsert document chunks with enhanced payload."""
        if not chunks:
            return True
        
        try:
            # Prepare points for insertion
            points = []
            for chunk in chunks:
                if not chunk.embedding:
                    logger.warning("Chunk has no embedding, skipping", chunk_id=chunk.chunk_id)
                    continue
                
                # Validate embedding dimension
                embedding_dim = len(chunk.embedding)
                if embedding_dim != self.vector_size:
                    logger.error(f"Embedding dimension mismatch: expected {self.vector_size}, got {embedding_dim}", 
                               chunk_id=chunk.chunk_id, embedding_dim=embedding_dim, expected_dim=self.vector_size)
                    continue
                
                # Enhanced payload with more metadata
                payload = {
                    "file_id": chunk.file_id,
                    "content": chunk.content,
                    "chunk_index": chunk.metadata.chunk_index,
                    "start_line": chunk.metadata.start_line,
                    "end_line": chunk.metadata.end_line,
                    "start_char": chunk.metadata.start_char,
                    "end_char": chunk.metadata.end_char,
                    "chunk_type": chunk.metadata.chunk_type,
                    "language": chunk.metadata.language,
                    "complexity_score": chunk.metadata.complexity_score,
                    "created_at": chunk.created_at.isoformat(),
                    "filename": getattr(chunk.metadata, 'filename', None),
                    "file_size": getattr(chunk.metadata, 'file_size', None),
                    "file_type": getattr(chunk.metadata, 'file_type', None),
                    "token_count": len(chunk.content.split()),
                    "word_count": len(chunk.content.split()),
                    "char_count": len(chunk.content)
                }
                
                # Add any additional metadata
                if hasattr(chunk.metadata, 'additional_metadata'):
                    payload.update(chunk.metadata.additional_metadata)
                
                point = PointStruct(
                    id=chunk.chunk_id or str(uuid.uuid4()),
                    vector=chunk.embedding,
                    payload=payload
                )
                points.append(point)
            
            if not points:
                logger.warning("No valid points to upsert")
                return True
            
            # Upsert points with batching
            batch_size = 100
            for i in range(0, len(points), batch_size):
                batch = points[i:i + batch_size]
                await self.client.upsert(
                    collection_name=self.collection_name,
                    points=batch
                )
            
            logger.info("Successfully upserted chunks", count=len(points))
            return True
            
        except Exception as e:
            logger.error("Failed to upsert chunks", error=str(e))
            return False
    
    async def search_similar(
        self, 
        query_embedding: List[float], 
        limit: int = 5,
        score_threshold: float = 0.7,
        filters: Optional[Dict[str, Any]] = None,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Enhanced search with filtering and pagination."""
        try:
            # Validate query embedding dimension
            query_dim = len(query_embedding)
            if query_dim != self.vector_size:
                logger.error(f"Query embedding dimension mismatch: expected {self.vector_size}, got {query_dim}", 
                           query_dim=query_dim, expected_dim=self.vector_size)
                return []
            
            # Build search filter
            search_filter = self._build_enhanced_filter(filters) if filters else None
            
            # Perform search
            search_results = await self.client.search(
                collection_name=self.collection_name,
                query_vector=query_embedding,
                limit=limit,
                score_threshold=score_threshold,
                query_filter=search_filter,
                with_payload=True,
                with_vectors=False,
                offset=offset
            )
            
            # Format results with enhanced metadata
            results = []
            for result in search_results:
                results.append({
                    "chunk_id": result.id,
                    "score": result.score,
                    "payload": result.payload,
                    "rank": len(results) + 1 + offset
                })
            
            return results
            
        except Exception as e:
            logger.error("Enhanced vector search failed", error=str(e))
            return []
    
    async def search_similar_batch(
        self, 
        query_embeddings: List[List[float]], 
        limit: int = 5,
        score_threshold: float = 0.7,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[List[Dict[str, Any]]]:
        """Batch search for multiple query vectors."""
        try:
            # Validate all query embedding dimensions
            for i, embedding in enumerate(query_embeddings):
                query_dim = len(embedding)
                if query_dim != self.vector_size:
                    logger.error(f"Query embedding dimension mismatch at index {i}: expected {self.vector_size}, got {query_dim}", 
                               index=i, query_dim=query_dim, expected_dim=self.vector_size)
                    return [[] for _ in query_embeddings]
            
            search_filter = self._build_enhanced_filter(filters) if filters else None
            
            # Perform batch search
            search_requests = [
                SearchRequest(
                    vector=embedding,
                    limit=limit,
                    score_threshold=score_threshold,
                    filter=search_filter,
                    with_payload=True,
                    with_vectors=False
                )
                for embedding in query_embeddings
            ]
            
            batch_results = await self.client.search_batch(
                collection_name=self.collection_name,
                requests=search_requests
            )
            
            # Format batch results
            formatted_results = []
            for results in batch_results:
                formatted_batch = []
                for result in results:
                    formatted_batch.append({
                        "chunk_id": result.id,
                        "score": result.score,
                        "payload": result.payload
                    })
                formatted_results.append(formatted_batch)
            
            return formatted_results
            
        except Exception as e:
            logger.error("Batch vector search failed", error=str(e))
            return [[] for _ in query_embeddings]
    
    def _build_enhanced_filter(self, filters: Dict[str, Any]) -> Filter:
        """Build enhanced Qdrant filter with more conditions."""
        conditions = []
        
        for field, value in filters.items():
            if field == "file_id" and value:
                if isinstance(value, list):
                    conditions.append(FieldCondition(
                        key="file_id",
                        match=rest.MatchAny(any=value)
                    ))
                else:
                    conditions.append(FieldCondition(
                        key="file_id",
                        match=MatchValue(value=value)
                    ))
            
            elif field == "language" and value:
                if isinstance(value, list):
                    conditions.append(FieldCondition(
                        key="language",
                        match=rest.MatchAny(any=value)
                    ))
                else:
                    conditions.append(FieldCondition(
                        key="language",
                        match=MatchValue(value=value)
                    ))
            
            elif field == "chunk_type" and value:
                if isinstance(value, list):
                    conditions.append(FieldCondition(
                        key="chunk_type",
                        match=rest.MatchAny(any=value)
                    ))
                else:
                    conditions.append(FieldCondition(
                        key="chunk_type",
                        match=MatchValue(value=value)
                    ))
            
            elif field == "complexity_score" and value:
                if isinstance(value, dict):
                    range_filter = Range()
                    if "min" in value:
                        range_filter.gte = value["min"]
                    if "max" in value:
                        range_filter.lte = value["max"]
                    conditions.append(FieldCondition(
                        key="complexity_score",
                        range=range_filter
                    ))
            
            elif field == "date_range" and value:
                start_date = value.get("start")
                end_date = value.get("end")
                
                if start_date or end_date:
                    date_filter = FieldCondition(
                        key="created_at",
                        range=Range()
                    )
                    
                    if start_date:
                        date_filter.range.gte = start_date.isoformat()
                    if end_date:
                        date_filter.range.lte = end_date.isoformat()
                    
                    conditions.append(date_filter)
            
            elif field == "text_search" and value:
                # Full-text search
                conditions.append(FieldCondition(
                    key="content",
                    match=rest.MatchText(text=value)
                ))
        
        return Filter(must=conditions) if conditions else None
    
    async def delete_by_file_id(self, file_id: str) -> bool:
        """Delete all chunks for a specific file."""
        try:
            await self.client.delete(
                collection_name=self.collection_name,
                points_selector=rest.FilterSelector(
                    filter=Filter(
                        must=[
                            FieldCondition(
                                key="file_id",
                                match=MatchValue(value=file_id)
                            )
                        ]
                    )
                )
            )
            
            logger.info("Deleted chunks for file", file_id=file_id)
            return True
            
        except Exception as e:
            logger.error("Failed to delete chunks", error=str(e), file_id=file_id)
            return False
    
    async def get_collection_stats(self) -> Dict[str, Any]:
        """Get enhanced collection statistics."""
        try:
            collection_info = await self.client.get_collection(self.collection_name)
            
            # Get additional stats
            try:
                points_count = await self.client.count(self.collection_name)
            except:
                points_count = None
            
            return {
                "collection_name": self.collection_name,
                "vector_size": collection_info.config.params.vectors.size,
                "distance": str(collection_info.config.params.vectors.distance),
                "points_count": points_count.count if points_count else collection_info.points_count,
                "indexed_vectors_count": collection_info.indexed_vectors_count,
                "segments_count": collection_info.segments_count,
                "config": collection_info.config.dict() if hasattr(collection_info.config, 'dict') else str(collection_info.config),
                "status": str(collection_info.status),
                "optimizer_status": str(collection_info.optimizer_status),
                "payload_schema": collection_info.payload_schema
            }
            
        except Exception as e:
            logger.error("Failed to get collection stats", error=str(e))
            return {}
    
    async def optimize_collection(self) -> bool:
        """Optimize the collection for better performance."""
        try:
            await self.client.update_collection(
                collection_name=self.collection_name,
                optimizers_config=OptimizersConfigDiff(
                    indexing_threshold=1000,
                    memmap_threshold=1000
                )
            )
            logger.info("Collection optimization triggered")
            return True
        except Exception as e:
            logger.error("Failed to optimize collection", error=str(e))
            return False
    
    async def health_check(self) -> bool:
        """Enhanced health check with FastEmbed support."""
        try:
            # Check if we can connect and list collections
            collections = await self.client.get_collections()
            
            # Check if our collection exists and is accessible
            if self.collection_name in [col.name for col in collections.collections]:
                collection_info = await self.client.get_collection(self.collection_name)
                # Use a more robust status check that works across different qdrant-client versions
                try:
                    # Try the newer enum structure first
                    if hasattr(collection_info.status, 'value'):
                        self._is_healthy = collection_info.status.value == 'green'
                    else:
                        # Fallback to string comparison
                        self._is_healthy = str(collection_info.status).lower() in ['green', 'ok', 'active']
                except AttributeError:
                    # If status doesn't have expected attributes, assume healthy if collection exists
                    self._is_healthy = True
            else:
                self._is_healthy = False
            
            self._last_health_check = datetime.now()
            return self._is_healthy
            
        except Exception as e:
            logger.error("Enhanced Qdrant health check failed", error=str(e))
            self._is_healthy = False
            return False
    
    async def is_healthy(self) -> bool:
        """Get cached health status."""
        # If we haven't checked recently, do a health check
        if (not self._last_health_check or 
            (datetime.now() - self._last_health_check).seconds > 300):  # 5 minutes
            return await self.health_check()
        
        return self._is_healthy
    
    async def close(self) -> None:
        """Close the Qdrant client connection."""
        try:
            await self.client.close()
            logger.info("Enhanced Qdrant client connection closed")
        except Exception as e:
            logger.error("Error closing enhanced Qdrant client", error=str(e))
    
    # FastEmbed convenience methods
    async def embed_and_upsert(
        self, 
        texts: List[str], 
        metadata: List[Dict[str, Any]],
        model_name: str = "BAAI/bge-small-en-v1.5"
    ) -> bool:
        """Generate embeddings with FastEmbed and upsert directly."""
        if not self._use_fastembed:
            logger.error("FastEmbed not available for embed_and_upsert")
            return False
        
        try:
            # Generate embeddings
            embeddings = await self.generate_embeddings_with_fastembed(texts, model_name)
            
            # Create chunks
            chunks = []
            for text, embedding, meta in zip(texts, embeddings, metadata):
                chunk = DocumentChunk(
                    chunk_id=str(uuid.uuid4()),
                    file_id=meta.get("file_id", "unknown"),
                    content=text,
                    embedding=embedding,
                    metadata=ChunkMetadata(
                        chunk_index=meta.get("chunk_index", 0),
                        start_line=meta.get("start_line", 0),
                        end_line=meta.get("end_line", 0),
                        start_char=meta.get("start_char", 0),
                        end_char=meta.get("end_char", len(text)),
                        chunk_type=meta.get("chunk_type", "text"),
                        language=meta.get("language", "unknown"),
                        complexity_score=meta.get("complexity_score", 0.0),
                        filename=meta.get("filename"),
                        file_size=meta.get("file_size"),
                        file_type=meta.get("file_type")
                    ),
                    created_at=datetime.now()
                )
                chunks.append(chunk)
            
            return await self.upsert_chunks(chunks)
            
        except Exception as e:
            logger.error("Embed and upsert failed", error=str(e))
            return False


# Global enhanced Qdrant client instance
enhanced_qdrant_client = EnhancedQdrantClient()


def get_enhanced_qdrant_client() -> EnhancedQdrantClient:
    """Get the global enhanced Qdrant client instance."""
    if not QDRANT_AVAILABLE:
        logger.warning("Qdrant not available, returning mock client")
    return enhanced_qdrant_client
