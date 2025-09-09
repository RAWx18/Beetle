"""
Jina embeddings provider.
Provides embedding generation using Jina AI's embedding models.
"""

import asyncio
from typing import List, Optional, Dict, Any, Union
import structlog
from config.settings import get_settings

from .base_provider import BaseEmbeddingsProvider, EmbeddingRequest, EmbeddingResponse

logger = structlog.get_logger(__name__)
settings = get_settings()


class JinaEmbeddingsProvider(BaseEmbeddingsProvider):
    """Jina embeddings provider implementation."""
    
    def __init__(self, **kwargs):
        """Initialize Jina provider."""
        super().__init__(**kwargs)
        self.provider_name = "Jina"
        
        # Configuration
        self.api_key = kwargs.get("api_key") or settings.jina_api_key
        self.base_url = kwargs.get("base_url") or settings.jina_base_url
        self.default_model = kwargs.get("default_model", "jina-embeddings-v2-base-en")
        self.max_batch_size = kwargs.get("max_batch_size", 100)
        self.max_retries = kwargs.get("max_retries", 3)
        self.retry_delay = kwargs.get("retry_delay", 1.0)
        
        # Initialize client
        self._client = None
        
        # Supported models
        self._supported_models = {
            "jina-embeddings-v2-base-en": {
                "name": "jina-embeddings-v2-base-en",
                "dimensions": 768,
                "max_tokens": 8192,
                "language": "english",
                "type": "general",
                "pricing": {"input": 0.0001}  # per 1K tokens
            },
            "jina-embeddings-v2-base-zh": {
                "name": "jina-embeddings-v2-base-zh", 
                "dimensions": 768,
                "max_tokens": 8192,
                "language": "chinese",
                "type": "general",
                "pricing": {"input": 0.0001}
            },
            "jina-embeddings-v2-base-de": {
                "name": "jina-embeddings-v2-base-de",
                "dimensions": 768,
                "max_tokens": 8192,
                "language": "german",
                "type": "general", 
                "pricing": {"input": 0.0001}
            },
            "jina-embeddings-v2-base-es": {
                "name": "jina-embeddings-v2-base-es",
                "dimensions": 768,
                "max_tokens": 8192,
                "language": "spanish",
                "type": "general",
                "pricing": {"input": 0.0001}
            },
            "jina-embeddings-v2-base-code": {
                "name": "jina-embeddings-v2-base-code",
                "dimensions": 768,
                "max_tokens": 8192,
                "language": "multilingual",
                "type": "code",
                "pricing": {"input": 0.0001}
            }
        }
    
    def _get_client(self):
        """Get or create the Jina client."""
        if self._client is None:
            try:
                import httpx
                self._client = httpx.AsyncClient(
                    base_url=self.base_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    timeout=30.0
                )
            except ImportError:
                raise ImportError(
                    "httpx not installed. Install with: pip install httpx"
                )
        return self._client
    
    async def embed_texts(self, request: EmbeddingRequest) -> EmbeddingResponse:
        """Generate embeddings for a list of texts."""
        if not request.texts:
            return EmbeddingResponse([], request.model or self.default_model)
        
        if not self.api_key:
            raise ValueError("Jina API key is required")
        
        try:
            client = self._get_client()
            model_name = request.model or self.default_model
            
            # Process in batches
            all_embeddings = []
            total_usage = {"prompt_tokens": 0, "total_tokens": 0}
            
            for i in range(0, len(request.texts), self.max_batch_size):
                batch_texts = request.texts[i:i + self.max_batch_size]
                
                # Retry logic
                for attempt in range(self.max_retries):
                    try:
                        response = await client.post(
                            "/embeddings",
                            json={
                                "input": batch_texts,
                                "model": model_name
                            }
                        )
                        response.raise_for_status()
                        
                        data = response.json()
                        
                        # Extract embeddings
                        batch_embeddings = [item["embedding"] for item in data["data"]]
                        all_embeddings.extend(batch_embeddings)
                        
                        # Accumulate usage
                        if "usage" in data:
                            total_usage["prompt_tokens"] += data["usage"].get("prompt_tokens", 0)
                            total_usage["total_tokens"] += data["usage"].get("total_tokens", 0)
                        
                        break  # Success, exit retry loop
                        
                    except Exception as e:
                        if attempt == self.max_retries - 1:
                            logger.error("Jina embedding generation failed after retries", 
                                       error=str(e), model=model_name)
                            raise
                        
                        logger.warning(f"Jina embedding attempt {attempt + 1} failed, retrying...", 
                                     error=str(e))
                        await asyncio.sleep(self.retry_delay * (2 ** attempt))  # Exponential backoff
            
            return EmbeddingResponse(
                embeddings=all_embeddings,
                model=model_name,
                usage=total_usage,
                metadata={
                    "provider": self.provider_name,
                    "base_url": self.base_url
                }
            )
            
        except Exception as e:
            logger.error("Jina embedding generation failed", error=str(e), model=request.model)
            raise
    
    async def get_model_info(self, model_name: str) -> Optional[Dict[str, Any]]:
        """Get information about an embedding model."""
        if model_name in self._model_cache:
            return self._model_cache[model_name]
        
        try:
            model_info = self._supported_models.get(model_name)
            if model_info:
                self._model_cache[model_name] = model_info
            return model_info
            
        except Exception as e:
            logger.error("Failed to get model info", error=str(e), model=model_name)
            return None
    
    async def health_check(self) -> bool:
        """Check if the provider is healthy."""
        try:
            if not self.api_key:
                return False
            
            # Try to embed a simple test text
            test_embedding = await self.embed_single("test", self.default_model)
            return len(test_embedding) > 0
        except Exception as e:
            logger.error("Jina health check failed", error=str(e))
            return False
    
    def get_supported_models(self) -> List[str]:
        """Get list of supported models."""
        return list(self._supported_models.keys())
    
    async def estimate_cost(self, texts: List[str], model: str = None) -> Optional[float]:
        """Estimate the cost of embedding generation."""
        try:
            model_name = model or self.default_model
            model_info = await self.get_model_info(model_name)
            
            if not model_info or not model_info.get("pricing"):
                return None
            
            # Count total tokens (rough estimation)
            total_tokens = sum(len(text.split()) for text in texts)
            
            # Calculate cost
            cost_per_1k = model_info["pricing"]["input"]
            total_cost = (total_tokens / 1000) * cost_per_1k
            
            return total_cost
            
        except Exception as e:
            logger.error("Cost estimation failed", error=str(e))
            return None
    
    async def close(self):
        """Close the client connection."""
        if self._client:
            await self._client.aclose()
            self._client = None 