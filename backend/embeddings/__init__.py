"""
Embeddings module for the RAG system.
Provides unified interface for multiple embedding providers.
"""

from typing import List, Optional, Dict, Any, Union
import structlog

from .providers.base_provider import BaseEmbeddingsProvider, EmbeddingRequest, EmbeddingResponse
from .providers.openai_embeddings import OpenAIEmbeddingsProvider
from .providers.sentence_transformers_provider import SentenceTransformersEmbeddingsProvider
from .providers.jina_provider import JinaEmbeddingsProvider
from .providers import (
    get_embedding_registry,
    get_embeddings_provider,
    embed_texts,
    embed_single,
    embed_batch,
    get_available_providers,
    get_provider_for_model
)

logger = structlog.get_logger(__name__)

# Export main classes and functions
__all__ = [
    # Base classes
    "BaseEmbeddingsProvider",
    "EmbeddingRequest", 
    "EmbeddingResponse",
    
    # Provider implementations
    "OpenAIEmbeddingsProvider",
    "SentenceTransformersEmbeddingsProvider", 
    "JinaEmbeddingsProvider",
    
    # Registry functions
    "get_embedding_registry",
    "get_embeddings_provider",
    
    # High-level embedding functions
    "embed_texts",
    "embed_single", 
    "embed_batch",
    
    # Utility functions
    "get_available_providers",
    "get_provider_for_model"
]


# Convenience function for backward compatibility
def get_embeddings_provider_legacy(provider_name: str = None) -> BaseEmbeddingsProvider:
    """Legacy function for backward compatibility.
    
    Args:
        provider_name: Name of the provider to use. If None, uses default.
        
    Returns:
        Embeddings provider instance.
    """
    return get_embeddings_provider(provider_name)
