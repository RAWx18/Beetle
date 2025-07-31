"""
OpenAI embeddings provider for the RAG system using LiteLLM.
Handles text embedding generation with batch processing and OpenAI-only models.
"""

import asyncio
from typing import List, Optional, Dict, Any, Union
import litellm
import numpy as np
import structlog
from config.settings import get_settings

from .base_provider import BaseEmbeddingsProvider, EmbeddingRequest, EmbeddingResponse

logger = structlog.get_logger(__name__)
settings = get_settings()


class OpenAIEmbeddingsProvider(BaseEmbeddingsProvider):
    """OpenAI embeddings provider using LiteLLM's unified interface."""
    
    def __init__(self, api_key: str = None, base_url: Optional[str] = None, **kwargs):
        """Initialize OpenAI embeddings provider."""
        super().__init__(**kwargs)
        self.provider_name = "OpenAI"
        
        # Configuration
        self.api_key = api_key or settings.openai_api_key
        self.base_url = base_url  # No longer in settings, use provided or None
        
        # Configuration
        self.max_batch_size = kwargs.get("max_batch_size", 2048)  # OpenAI's actual limit
        self.max_retries = kwargs.get("max_retries", 3)
        self.retry_delay = kwargs.get("retry_delay", 1.0)
        
        # Cache for model information
        self._model_cache: Dict[str, Dict[str, Any]] = {}
    
    async def embed_texts(self, request: EmbeddingRequest) -> EmbeddingResponse:
        """Generate embeddings for a list of texts."""
        if not request.texts:
            return EmbeddingResponse([], request.model)
        
        # Ensure OpenAI embedding model
        model_name = self._ensure_openai_embedding_model(request.model)
        
        try:
            # Process in batches
            all_embeddings = []
            total_usage = {"prompt_tokens": 0, "total_tokens": 0}
            
            for i in range(0, len(request.texts), self.max_batch_size):
                batch_texts = request.texts[i:i + self.max_batch_size]
                
                # Retry logic
                for attempt in range(self.max_retries):
                    try:
                        # Use LiteLLM's aembedding interface for OpenAI
                        response = await litellm.aembedding(
                            model=model_name,
                            input=batch_texts,
                            api_key=self.api_key,
                            api_base=self.base_url,
                            encoding_format="float"
                        )
                        
                        # Extract embeddings from LiteLLM response
                        batch_embeddings = [data["embedding"] for data in response["data"]]
                        all_embeddings.extend(batch_embeddings)
                        
                        # Accumulate usage
                        if "usage" in response:
                            total_usage["prompt_tokens"] += response["usage"].get("prompt_tokens", 0)
                            total_usage["total_tokens"] += response["usage"].get("total_tokens", 0)
                        
                        break  # Success, exit retry loop
                        
                    except Exception as e:
                        if attempt == self.max_retries - 1:
                            logger.error("OpenAI embedding generation failed after retries", 
                                       error=str(e), model=model_name)
                            raise
                        
                        logger.warning(f"Embedding attempt {attempt + 1} failed, retrying...", 
                                     error=str(e))
                        await asyncio.sleep(self.retry_delay * (2 ** attempt))
            
            return EmbeddingResponse(
                embeddings=all_embeddings,
                model=model_name,
                usage=total_usage
            )
            
        except Exception as e:
            logger.error("OpenAI embedding generation failed", error=str(e), model=model_name)
            raise
    
    def get_supported_models(self) -> List[str]:
        """Get list of supported OpenAI models."""
        return list(self._get_openai_embedding_models().keys())
    
    async def get_model_info(self, model_name: str) -> Optional[Dict[str, Any]]:
        """Get information about an OpenAI embedding model."""
        if model_name in self._model_cache:
            return self._model_cache[model_name]
        
        model_info = self._get_openai_embedding_models().get(model_name)
        if model_info:
            self._model_cache[model_name] = model_info
        return model_info
    
    def _get_openai_embedding_models(self) -> Dict[str, Dict[str, Any]]:
        """Get OpenAI's embedding models."""
        return {
            "text-embedding-3-small": {
                "name": "text-embedding-3-small",
                "dimensions": 1536,
                "max_tokens": 8192,
                "pricing": {"input": 0.00002},  # per 1K tokens
                "provider": "openai"
            },
            "text-embedding-3-large": {
                "name": "text-embedding-3-large",
                "dimensions": 3072,
                "max_tokens": 8192,
                "pricing": {"input": 0.00013},  # per 1K tokens
                "provider": "openai"
            },
            "text-embedding-ada-002": {
                "name": "text-embedding-ada-002",
                "dimensions": 1536,
                "max_tokens": 8192,
                "pricing": {"input": 0.0001},  # per 1K tokens
                "provider": "openai"
            }
        }
    
    def _ensure_openai_embedding_model(self, model: str) -> str:
        """Ensure the model is an OpenAI embedding model."""
        openai_models = {
            "text-embedding-3-small",
            "text-embedding-3-large", 
            "text-embedding-ada-002"
        }
        
        # If it's already OpenAI model, return as-is
        if model in openai_models:
            return model
        
        # Default fallback
        logger.warning(f"Non-OpenAI embedding model: {model}, using text-embedding-3-small")
        return "text-embedding-3-small"
    
    async def estimate_cost(self, texts: List[str], model: str = None) -> Optional[float]:
        """Estimate the cost of OpenAI embedding generation."""
        try:
            model_name = self._ensure_openai_embedding_model(model or settings.default_embedding_model)
            model_info = await self.get_model_info(model_name)
            
            if not model_info or not model_info.get("pricing"):
                return None
            
            # Use LiteLLM's token counter for accurate counting
            total_tokens = 0
            for text in texts:
                try:
                    tokens = litellm.token_counter(model=model_name, text=text)
                    total_tokens += tokens
                except:
                    # Fallback to word count estimation
                    total_tokens += len(text.split()) * 1.3
            
            # Calculate cost
            cost_per_1k = model_info["pricing"]["input"]
            total_cost = (total_tokens / 1000) * cost_per_1k
            
            return total_cost
            
        except Exception as e:
            logger.error("Cost estimation failed", error=str(e))
            return None
    
    async def health_check(self) -> bool:
        """Check if OpenAI embeddings provider is healthy."""
        try:
            # Try to embed with LiteLLM
            response = await litellm.aembedding(
                model="text-embedding-3-small",
                input=["test"],
                api_key=self.api_key,
                api_base=self.base_url
            )
            return len(response["data"][0]["embedding"]) > 0
        except Exception as e:
            logger.error("OpenAI embeddings health check failed", error=str(e))
            return False
    





