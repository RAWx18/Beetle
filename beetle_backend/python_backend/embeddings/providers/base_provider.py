"""
Base embeddings provider interface.
Defines the contract that all embedding providers must implement.
"""

from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any, Union
import structlog

logger = structlog.get_logger(__name__)


class EmbeddingRequest:
    """Embedding request model."""
    
    def __init__(self, texts: Union[str, List[str]], model: str = None, **kwargs):
        self.texts = texts if isinstance(texts, list) else [texts]
        self.model = model
        self.dimensions = None  # Will be set after first embedding
        self.metadata = kwargs  # Additional provider-specific parameters


class EmbeddingResponse:
    """Embedding response model."""
    
    def __init__(self, embeddings: List[List[float]], model: str, 
                 usage: Optional[Dict[str, int]] = None, metadata: Optional[Dict[str, Any]] = None):
        self.embeddings = embeddings
        self.model = model
        self.usage = usage or {}
        self.metadata = metadata or {}
        self.dimensions = len(embeddings[0]) if embeddings else 0


class BaseEmbeddingsProvider(ABC):
    """Abstract base class for all embedding providers."""
    
    def __init__(self, **kwargs):
        """Initialize the provider with configuration."""
        self.provider_name = self.__class__.__name__
        self.config = kwargs
        self._model_cache: Dict[str, Dict[str, Any]] = {}
    
    @abstractmethod
    async def embed_texts(self, request: EmbeddingRequest) -> EmbeddingResponse:
        """Generate embeddings for a list of texts.
        
        Args:
            request: Embedding request containing texts and model info.
            
        Returns:
            EmbeddingResponse with embeddings and metadata.
        """
        pass
    
    @abstractmethod
    async def get_model_info(self, model_name: str) -> Optional[Dict[str, Any]]:
        """Get information about an embedding model.
        
        Args:
            model_name: Name of the model.
            
        Returns:
            Model information dictionary or None if not found.
        """
        pass
    
    @abstractmethod
    async def health_check(self) -> bool:
        """Check if the provider is healthy and available.
        
        Returns:
            True if healthy, False otherwise.
        """
        pass
    
    async def embed_single(self, text: str, model: str = None, **kwargs) -> List[float]:
        """Generate embedding for a single text.
        
        Args:
            text: Text to embed.
            model: Model to use for embedding.
            **kwargs: Additional provider-specific parameters.
            
        Returns:
            List of floats representing the embedding.
        """
        request = EmbeddingRequest([text], model, **kwargs)
        response = await self.embed_texts(request)
        return response.embeddings[0] if response.embeddings else []
    
    async def embed_batch(self, texts: List[str], model: str = None, **kwargs) -> List[List[float]]:
        """Generate embeddings for a batch of texts.
        
        Args:
            texts: List of texts to embed.
            model: Model to use for embedding.
            **kwargs: Additional provider-specific parameters.
            
        Returns:
            List of embeddings (each embedding is a list of floats).
        """
        request = EmbeddingRequest(texts, model, **kwargs)
        response = await self.embed_texts(request)
        return response.embeddings
    
    async def estimate_cost(self, texts: List[str], model: str = None) -> Optional[float]:
        """Estimate the cost of embedding generation.
        
        Args:
            texts: List of texts to estimate cost for.
            model: Model to use for cost estimation.
            
        Returns:
            Estimated cost in dollars, or None if not available.
        """
        # Default implementation - override in subclasses
        return None
    
    def calculate_similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        """Calculate cosine similarity between two embeddings.
        
        Args:
            embedding1: First embedding vector.
            embedding2: Second embedding vector.
            
        Returns:
            Cosine similarity score between 0 and 1.
        """
        try:
            import numpy as np
            
            vec1 = np.array(embedding1)
            vec2 = np.array(embedding2)
            
            # Normalize vectors
            norm1 = np.linalg.norm(vec1)
            norm2 = np.linalg.norm(vec2)
            
            if norm1 == 0 or norm2 == 0:
                return 0.0
            
            # Calculate cosine similarity
            similarity = np.dot(vec1, vec2) / (norm1 * norm2)
            return float(similarity)
            
        except Exception as e:
            logger.error("Similarity calculation failed", error=str(e))
            return 0.0
    
    def find_most_similar(self, query_embedding: List[float], 
                         candidate_embeddings: List[List[float]], 
                         top_k: int = 5) -> List[tuple]:
        """Find the most similar embeddings to a query embedding.
        
        Args:
            query_embedding: Query embedding vector.
            candidate_embeddings: List of candidate embedding vectors.
            top_k: Number of top results to return.
            
        Returns:
            List of tuples (index, similarity_score) sorted by similarity.
        """
        try:
            similarities = []
            for i, candidate in enumerate(candidate_embeddings):
                similarity = self.calculate_similarity(query_embedding, candidate)
                similarities.append((i, similarity))
            
            # Sort by similarity (descending)
            similarities.sort(key=lambda x: x[1], reverse=True)
            
            # Return top-k results
            return similarities[:top_k]
            
        except Exception as e:
            logger.error("Most similar search failed", error=str(e))
            return []
    
    def get_provider_name(self) -> str:
        """Get the name of this provider.
        
        Returns:
            Provider name.
        """
        return self.provider_name
    
    def get_supported_models(self) -> List[str]:
        """Get list of supported models for this provider.
        
        Returns:
            List of supported model names.
        """
        # Default implementation - override in subclasses
        return [] 