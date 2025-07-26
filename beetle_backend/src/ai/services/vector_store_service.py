import os
import asyncio
from typing import List, Dict, Any, Optional, Tuple
from qdrant_client import QdrantClient, AsyncQdrantClient
from qdrant_client.models import (
    Distance, VectorParams, PointStruct, Filter, FieldCondition, 
    MatchValue, Range, SearchRequest, ScrollRequest, UpdateStatus
)
from qdrant_client.http import models as rest
import numpy as np
import logging
from datetime import datetime
import uuid

from config.settings import get_settings
from models.rag_models import EmbeddingChunk, EmbeddingModel

logger = logging.getLogger(__name__)

# Get settings
settings = get_settings()


class VectorStoreService:
    """Vector store service for Qdrant operations"""
    
    def __init__(self):
        self.client = None
        self.async_client = None
        self.collection_name = settings.qdrant_collection_name
        self.initialized = False
        self.embedding_dimension = settings.embedding_dimension
    
    async def initialize(self):
        """Initialize Qdrant client"""
        try:
            logger.info("Initializing vector store service...")
            
            # Create sync client
            if settings.qdrant_api_key:
                self.client = QdrantClient(
                    url=settings.qdrant_url,
                    api_key=settings.qdrant_api_key,
                    timeout=settings.qdrant_timeout
                )
            else:
                self.client = QdrantClient(
                    url=settings.qdrant_url,
                    timeout=settings.qdrant_timeout
                )
            
            # Create async client
            if settings.qdrant_api_key:
                self.async_client = AsyncQdrantClient(
                    url=settings.qdrant_url,
                    api_key=settings.qdrant_api_key,
                    timeout=settings.qdrant_timeout
                )
            else:
                self.async_client = AsyncQdrantClient(
                    url=settings.qdrant_url,
                    timeout=settings.qdrant_timeout
                )
            
            # Create collection if it doesn't exist
            await self._ensure_collection_exists()
            
            self.initialized = True
            logger.info("Vector store service initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize vector store service: {e}")
            raise
    
    async def _ensure_collection_exists(self):
        """Ensure collection exists with proper configuration"""
        try:
            collections = await self.async_client.get_collections()
            collection_names = [col.name for col in collections.collections]
            
            if self.collection_name not in collection_names:
                logger.info(f"Creating collection: {self.collection_name}")
                
                # Create collection with vector parameters
                await self.async_client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(
                        size=self.embedding_dimension,
                        distance=Distance.COSINE
                    )
                )
                
                # Create payload indexes for efficient filtering
                await self.async_client.create_payload_index(
                    collection_name=self.collection_name,
                    field_name="repository_id",
                    field_schema="keyword"
                )
                
                await self.async_client.create_payload_index(
                    collection_name=self.collection_name,
                    field_name="source_type",
                    field_schema="keyword"
                )
                
                await self.async_client.create_payload_index(
                    collection_name=self.collection_name,
                    field_name="language",
                    field_schema="keyword"
                )
                
                await self.async_client.create_payload_index(
                    collection_name=self.collection_name,
                    field_name="chunk_type",
                    field_schema="keyword"
                )
                
                logger.info(f"Collection {self.collection_name} created successfully")
            else:
                logger.info(f"Collection {self.collection_name} already exists")
                
        except Exception as e:
            logger.error(f"Failed to ensure collection exists: {e}")
            raise
    
    async def upsert_embeddings(self, embeddings: List[EmbeddingChunk]) -> bool:
        """Upsert embeddings into vector store"""
        try:
            if not self.initialized:
                await self.initialize()
            
            points = []
            for embedding_chunk in embeddings:
                point = PointStruct(
                    id=embedding_chunk.id,
                    vector=embedding_chunk.embedding,
                    payload={
                        "chunk_id": embedding_chunk.chunk_id,
                        "document_id": embedding_chunk.document_id,
                        "content": embedding_chunk.content,
                        "embedding_model": embedding_chunk.embedding_model,
                        "embedding_dimension": embedding_chunk.embedding_dimension,
                        "repository_id": embedding_chunk.metadata.get("repository_id"),
                        "source_type": embedding_chunk.metadata.get("source_type"),
                        "language": embedding_chunk.metadata.get("language"),
                        "chunk_type": embedding_chunk.metadata.get("chunk_type"),
                        "start_line": embedding_chunk.metadata.get("start_line"),
                        "end_line": embedding_chunk.metadata.get("end_line"),
                        "token_count": embedding_chunk.metadata.get("token_count"),
                        "created_at": embedding_chunk.created_at.isoformat(),
                        "updated_at": embedding_chunk.updated_at.isoformat(),
                        **embedding_chunk.metadata
                    }
                )
                points.append(point)
            
            # Upsert points in batches
            batch_size = 100
            for i in range(0, len(points), batch_size):
                batch = points[i:i + batch_size]
                await self.async_client.upsert(
                    collection_name=self.collection_name,
                    points=batch
                )
            
            logger.info(f"Upserted {len(embeddings)} embeddings successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to upsert embeddings: {e}")
            return False
    
    async def search_similar(
        self,
        query_embedding: List[float],
        repository_id: Optional[str] = None,
        source_types: Optional[List[str]] = None,
        languages: Optional[List[str]] = None,
        chunk_types: Optional[List[str]] = None,
        limit: int = 10,
        score_threshold: float = 0.7
    ) -> List[Dict[str, Any]]:
        """Search for similar embeddings"""
        try:
            if not self.initialized:
                await self.initialize()
            
            # Build filter
            filter_conditions = []
            
            if repository_id:
                filter_conditions.append(
                    FieldCondition(
                        key="repository_id",
                        match=MatchValue(value=repository_id)
                    )
                )
            
            if source_types:
                filter_conditions.append(
                    FieldCondition(
                        key="source_type",
                        match=rest.MatchAny(any=source_types)
                    )
                )
            
            if languages:
                filter_conditions.append(
                    FieldCondition(
                        key="language",
                        match=rest.MatchAny(any=languages)
                    )
                )
            
            if chunk_types:
                filter_conditions.append(
                    FieldCondition(
                        key="chunk_type",
                        match=rest.MatchAny(any=chunk_types)
                    )
                )
            
            search_filter = Filter(must=filter_conditions) if filter_conditions else None
            
            # Perform search
            search_result = await self.async_client.search(
                collection_name=self.collection_name,
                query_vector=query_embedding,
                query_filter=search_filter,
                limit=limit,
                score_threshold=score_threshold,
                with_payload=True,
                with_vectors=False
            )
            
            # Format results
            results = []
            for point in search_result:
                result = {
                    "id": point.id,
                    "score": point.score,
                    "payload": point.payload
                }
                results.append(result)
            
            logger.info(f"Found {len(results)} similar embeddings")
            return results
            
        except Exception as e:
            logger.error(f"Failed to search similar embeddings: {e}")
            return []
    
    async def search_hybrid(
        self,
        query_embedding: List[float],
        query_text: str,
        repository_id: Optional[str] = None,
        source_types: Optional[List[str]] = None,
        languages: Optional[List[str]] = None,
        chunk_types: Optional[List[str]] = None,
        limit: int = 10,
        score_threshold: float = 0.7,
        vector_weight: float = 0.7,
        keyword_weight: float = 0.3
    ) -> List[Dict[str, Any]]:
        """Hybrid search combining vector and keyword search"""
        try:
            if not self.initialized:
                await self.initialize()
            
            # Build filter
            filter_conditions = []
            
            if repository_id:
                filter_conditions.append(
                    FieldCondition(
                        key="repository_id",
                        match=MatchValue(value=repository_id)
                    )
                )
            
            if source_types:
                filter_conditions.append(
                    FieldCondition(
                        key="source_type",
                        match=rest.MatchAny(any=source_types)
                    )
                )
            
            if languages:
                filter_conditions.append(
                    FieldCondition(
                        key="language",
                        match=rest.MatchAny(any=languages)
                    )
                )
            
            if chunk_types:
                filter_conditions.append(
                    FieldCondition(
                        key="chunk_type",
                        match=rest.MatchAny(any=chunk_types)
                    )
                )
            
            search_filter = Filter(must=filter_conditions) if filter_conditions else None
            
            # Perform hybrid search
            search_result = await self.async_client.search(
                collection_name=self.collection_name,
                query_vector=query_embedding,
                query_filter=search_filter,
                query_text=query_text,
                limit=limit,
                score_threshold=score_threshold,
                with_payload=True,
                with_vectors=False,
                search_params=rest.SearchParams(
                    hnsw_ef=128,
                    exact=False
                )
            )
            
            # Format results
            results = []
            for point in search_result:
                result = {
                    "id": point.id,
                    "score": point.score,
                    "payload": point.payload
                }
                results.append(result)
            
            logger.info(f"Found {len(results)} results in hybrid search")
            return results
            
        except Exception as e:
            logger.error(f"Failed to perform hybrid search: {e}")
            return []
    
    async def delete_embeddings(
        self,
        document_id: Optional[str] = None,
        repository_id: Optional[str] = None,
        chunk_ids: Optional[List[str]] = None
    ) -> bool:
        """Delete embeddings from vector store"""
        try:
            if not self.initialized:
                await self.initialize()
            
            # Build filter for deletion
            filter_conditions = []
            
            if document_id:
                filter_conditions.append(
                    FieldCondition(
                        key="document_id",
                        match=MatchValue(value=document_id)
                    )
                )
            
            if repository_id:
                filter_conditions.append(
                    FieldCondition(
                        key="repository_id",
                        match=MatchValue(value=repository_id)
                    )
                )
            
            if chunk_ids:
                filter_conditions.append(
                    FieldCondition(
                        key="chunk_id",
                        match=rest.MatchAny(any=chunk_ids)
                    )
                )
            
            if not filter_conditions:
                logger.warning("No filter conditions provided for deletion")
                return False
            
            delete_filter = Filter(must=filter_conditions)
            
            # Delete points
            delete_result = await self.async_client.delete(
                collection_name=self.collection_name,
                points_selector=delete_filter
            )
            
            logger.info(f"Deleted embeddings: {delete_result}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete embeddings: {e}")
            return False
    
    async def get_collection_info(self) -> Dict[str, Any]:
        """Get collection information"""
        try:
            if not self.initialized:
                await self.initialize()
            
            collection_info = await self.async_client.get_collection(
                collection_name=self.collection_name
            )
            
            # Get collection statistics
            collection_stats = await self.async_client.get_collection(
                collection_name=self.collection_name
            )
            
            info = {
                "name": collection_info.name,
                "status": collection_info.status,
                "vectors_count": collection_stats.vectors_count,
                "points_count": collection_stats.points_count,
                "segments_count": collection_stats.segments_count,
                "config": {
                    "vector_size": collection_info.config.params.vectors.size,
                    "distance": collection_info.config.params.vectors.distance,
                    "on_disk": collection_info.config.params.vectors.on_disk
                }
            }
            
            return info
            
        except Exception as e:
            logger.error(f"Failed to get collection info: {e}")
            return {}
    
    async def optimize_collection(self) -> bool:
        """Optimize collection for better performance"""
        try:
            if not self.initialized:
                await self.initialize()
            
            # Optimize collection
            await self.async_client.update_collection(
                collection_name=self.collection_name,
                optimizer_config=rest.OptimizersConfigDiff(
                    default_segment_number=2,
                    memmap_threshold=20000
                )
            )
            
            logger.info("Collection optimization completed")
            return True
            
        except Exception as e:
            logger.error(f"Failed to optimize collection: {e}")
            return False
    
    async def health_check(self) -> bool:
        """Check vector store health"""
        try:
            if not self.initialized:
                await self.initialize()
            
            # Check if collection exists and is accessible
            collections = await self.async_client.get_collections()
            collection_names = [col.name for col in collections.collections]
            
            if self.collection_name not in collection_names:
                logger.error(f"Collection {self.collection_name} not found")
                return False
            
            # Try a simple search to test connectivity
            await self.async_client.search(
                collection_name=self.collection_name,
                query_vector=[0.0] * self.embedding_dimension,
                limit=1
            )
            
            return True
            
        except Exception as e:
            logger.error(f"Vector store health check failed: {e}")
            return False
    
    async def close(self):
        """Close vector store connections"""
        try:
            if self.async_client:
                await self.async_client.close()
            if self.client:
                self.client.close()
            logger.info("Vector store connections closed")
        except Exception as e:
            logger.error(f"Error closing vector store connections: {e}")


# Global vector store service instance
vector_store_service = VectorStoreService()


async def get_vector_store_service() -> VectorStoreService:
    """Get vector store service instance"""
    if not vector_store_service.initialized:
        await vector_store_service.initialize()
    return vector_store_service


# Utility functions for vector operations
class VectorUtils:
    """Utility functions for vector operations"""
    
    @staticmethod
    def normalize_vector(vector: List[float]) -> List[float]:
        """Normalize vector to unit length"""
        vector_array = np.array(vector)
        norm = np.linalg.norm(vector_array)
        if norm == 0:
            return vector
        return (vector_array / norm).tolist()
    
    @staticmethod
    def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vectors"""
        vec1_array = np.array(vec1)
        vec2_array = np.array(vec2)
        
        dot_product = np.dot(vec1_array, vec2_array)
        norm1 = np.linalg.norm(vec1_array)
        norm2 = np.linalg.norm(vec2_array)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        return dot_product / (norm1 * norm2)
    
    @staticmethod
    def euclidean_distance(vec1: List[float], vec2: List[float]) -> float:
        """Calculate Euclidean distance between two vectors"""
        vec1_array = np.array(vec1)
        vec2_array = np.array(vec2)
        return float(np.linalg.norm(vec1_array - vec2_array))
    
    @staticmethod
    def batch_normalize_vectors(vectors: List[List[float]]) -> List[List[float]]:
        """Normalize a batch of vectors"""
        vectors_array = np.array(vectors)
        norms = np.linalg.norm(vectors_array, axis=1, keepdims=True)
        norms[norms == 0] = 1  # Avoid division by zero
        normalized_vectors = vectors_array / norms
        return normalized_vectors.tolist()
    
    @staticmethod
    def calculate_centroid(vectors: List[List[float]]) -> List[float]:
        """Calculate centroid of a list of vectors"""
        if not vectors:
            return []
        vectors_array = np.array(vectors)
        centroid = np.mean(vectors_array, axis=0)
        return centroid.tolist() 