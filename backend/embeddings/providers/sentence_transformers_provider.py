"""
Sentence Transformers embeddings provider for local embedding generation.
Handles text embedding generation with local models.
"""

import asyncio
from typing import List, Optional, Dict, Any, Union
import numpy as np
import structlog
from config.settings import get_settings

from .base_provider import BaseEmbeddingsProvider, EmbeddingRequest, EmbeddingResponse

logger = structlog.get_logger(__name__)
settings = get_settings()


class SentenceTransformersEmbeddingsProvider(BaseEmbeddingsProvider):
    """Local sentence transformers embeddings provider."""
    
    def __init__(self, model_name: str = None, **kwargs):
        """Initialize sentence transformers embeddings provider."""
        super().__init__(**kwargs)
        self.provider_name = "SentenceTransformers"
        
        # Model configuration
        self.model_name = model_name or settings.default_embedding_model
        self.model = None
        self._load_model()
        
        # Configuration
        self.max_batch_size = kwargs.get("max_batch_size", 32)  # GPU memory friendly
        self.max_retries = kwargs.get("max_retries", 1)  # Local model, no retries needed
        self.retry_delay = kwargs.get("retry_delay", 0)
        
        # Model info cache
        self._model_info = None
    
    def _load_model(self):
        """Load the sentence transformers model."""
        try:
            from sentence_transformers import SentenceTransformer
            self.model = SentenceTransformer(self.model_name)
            logger.info(f"Loaded sentence transformers model: {self.model_name}")
        except ImportError:
            raise ImportError(
                "sentence-transformers not installed. "
                "Install with: pip install sentence-transformers"
            )
        except Exception as e:
            logger.error(f"Failed to load model {self.model_name}", error=str(e))
            raise
    
    async def embed_texts(self, request: EmbeddingRequest) -> EmbeddingResponse:
        """Generate embeddings for a list of texts using local model."""
        if not request.texts:
            return EmbeddingResponse([], request.model)
        
        # Use provider's default model if request doesn't specify one
        model_name = request.model or self.model_name
        model_name = self._ensure_local_model(model_name)
        
        try:
            # Process in batches (CPU-friendly)
            all_embeddings = []
            
            for i in range(0, len(request.texts), self.max_batch_size):
                batch_texts = request.texts[i:i + self.max_batch_size]
                
                # Run in thread pool to avoid blocking
                batch_embeddings = await asyncio.get_event_loop().run_in_executor(
                    None, 
                    self.model.encode, 
                    batch_texts
                )
                
                # Convert to list format
                batch_embeddings = [embedding.tolist() for embedding in batch_embeddings]
                all_embeddings.extend(batch_embeddings)
            
            return EmbeddingResponse(
                embeddings=all_embeddings,
                model=model_name,
                usage={}  # Local model, no usage tracking
            )
            
        except Exception as e:
            logger.error("Local embedding generation failed", error=str(e), model=model_name)
            raise

    async def embed_text(self, text: str, model: str = None, **kwargs) -> List[float]:
        """Generate embedding for a single text (alias for embed_single)."""
        return await self.embed_single(text, model, **kwargs)
    
    def get_supported_models(self) -> List[str]:
        """Get list of supported local models."""
        return [
            "all-MiniLM-L6-v2",
            "all-MiniLM-L12-v2",
            "all-distilroberta-v1",
            "all-mpnet-base-v2",
            "multi-qa-MiniLM-L6-cos-v1",
            "multi-qa-mpnet-base-dot-v1",
            "paraphrase-MiniLM-L6-v2",
            "paraphrase-mpnet-base-v2"
        ]
    
    async def get_model_info(self, model_name: str) -> Optional[Dict[str, Any]]:
        """Get information about a local embedding model."""
        if self._model_info:
            return self._model_info
        
        model_info = self._get_local_model_info(model_name)
        if model_info:
            self._model_info = model_info
        return model_info
    
    def _get_local_model_info(self, model_name: str) -> Optional[Dict[str, Any]]:
        """Get information about local sentence transformers models."""
        local_models = {
            "all-MiniLM-L6-v2": {
                "name": "all-MiniLM-L6-v2",
                "dimensions": 384,
                "max_tokens": 512,
                "pricing": {"input": 0},  # Free local model
                "provider": "huggingface"
            },
            "all-MiniLM-L12-v2": {
                "name": "all-MiniLM-L12-v2",
                "dimensions": 384,
                "max_tokens": 512,
                "pricing": {"input": 0},
                "provider": "huggingface"
            },
            "all-mpnet-base-v2": {
                "name": "all-mpnet-base-v2",
                "dimensions": 768,
                "max_tokens": 512,
                "pricing": {"input": 0},
                "provider": "huggingface"
            }
        }
        
        return local_models.get(model_name, {
            "name": model_name,
            "dimensions": 384,  # Default assumption
            "max_tokens": 512,
            "pricing": {"input": 0},
            "provider": "huggingface"
        })
    
    def _ensure_local_model(self, model: str) -> str:
        """Ensure the model is a local sentence transformers model."""
        # Handle None or empty model names gracefully
        if not model:
            return "all-MiniLM-L6-v2"  # Default model without warning
        
        supported_models = self.get_supported_models()
        
        if model in supported_models:
            return model
        
        # Only warn for explicitly specified unsupported models, not for None/empty
        if model and model.strip():
            logger.warning(f"Unsupported local model: {model}, using all-MiniLM-L6-v2")
        
        return "all-MiniLM-L6-v2"
    
    async def estimate_cost(self, texts: List[str], model: str = None) -> Optional[float]:
        """Estimate the cost of local embedding generation (always free)."""
        return 0.0  # Local models are free
    
    async def health_check(self) -> bool:
        """Check if local embeddings provider is healthy."""
        try:
            if self.model is None:
                return False
            
            # Test embedding
            embedding = await asyncio.get_event_loop().run_in_executor(
                None,
                self.model.encode,
                ["test"]
            )
            return len(embedding[0]) > 0
        except Exception as e:
            logger.error("Local embeddings health check failed", error=str(e))
            return False 