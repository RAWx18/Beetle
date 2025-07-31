"""
Embedding providers registry.
Provides direct access to embedding providers with simple selection.
"""

from typing import Dict, Type, Optional, List, Any
import structlog
from config.settings import get_settings

from .base_provider import BaseEmbeddingsProvider, EmbeddingRequest, EmbeddingResponse
from .openai_embeddings import OpenAIEmbeddingsProvider
from .sentence_transformers_provider import SentenceTransformersEmbeddingsProvider
from .jina_provider import JinaEmbeddingsProvider

logger = structlog.get_logger(__name__)
settings = get_settings()


class EmbeddingProviderRegistry:
    """Simple registry for embedding providers."""
    
    def __init__(self):
        """Initialize the provider registry."""
        self._providers: Dict[str, Type[BaseEmbeddingsProvider]] = {
            "openai": OpenAIEmbeddingsProvider,
            "sentence_transformers": SentenceTransformersEmbeddingsProvider,
            "jina": JinaEmbeddingsProvider
        }
        
        # Provider aliases
        self._aliases = {
            "sentence-transformers": "sentence_transformers",
            "huggingface": "sentence_transformers",
            "hf": "sentence_transformers",
            "jina-ai": "jina"
        }
        
        # Provider instances cache
        self._instances: Dict[str, BaseEmbeddingsProvider] = {}
        self._default_provider = None
    
    def register_provider(self, name: str, provider_class: Type[BaseEmbeddingsProvider]) -> None:
        """Register a new provider.
        
        Args:
            name: Provider name.
            provider_class: Provider class to register.
        """
        self._providers[name] = provider_class
        logger.info("Registered embedding provider", provider=name)
    
    def get_provider(self, provider_name: str = None, **kwargs) -> BaseEmbeddingsProvider:
        """Get a provider instance.
        
        Args:
            provider_name: Name of the provider. If None, uses default.
            **kwargs: Provider-specific configuration.
            
        Returns:
            Provider instance.
        """
        provider_name = provider_name or self._default_provider or settings.default_embedding_provider
        
        # Check aliases
        if provider_name in self._aliases:
            provider_name = self._aliases[provider_name]
        
        # Check if provider exists
        if provider_name not in self._providers:
            available = list(self._providers.keys()) + list(self._aliases.keys())
            raise ValueError(f"Unknown provider '{provider_name}'. Available: {available}")
        
        # Check if instance already exists
        if provider_name in self._instances:
            return self._instances[provider_name]
        
        # Create new instance
        try:
            provider_class = self._providers[provider_name]
            provider = provider_class(**kwargs)
            self._instances[provider_name] = provider
            
            logger.info("Created embedding provider", provider=provider_name)
            return provider
            
        except Exception as e:
            logger.error("Failed to create provider", provider=provider_name, error=str(e))
            raise ValueError(f"Failed to create provider '{provider_name}': {str(e)}")
    
    def set_default_provider(self, provider_name: str) -> None:
        """Set the default provider.
        
        Args:
            provider_name: Name of the provider to set as default.
        """
        # Ensure provider exists
        self.get_provider(provider_name)
        self._default_provider = provider_name
        logger.info("Set default embedding provider", provider=provider_name)
    
    def get_available_providers(self) -> Dict[str, Dict[str, Any]]:
        """Get information about available providers.
        
        Returns:
            Dictionary mapping provider names to their information.
        """
        providers_info = {}
        
        for name, provider_class in self._providers.items():
            try:
                # Create a temporary instance to get provider info
                temp_provider = provider_class()
                providers_info[name] = {
                    "class": provider_class.__name__,
                    "supported_models": temp_provider.get_supported_models(),
                    "provider_name": temp_provider.get_provider_name()
                }
            except Exception as e:
                logger.warning("Failed to get provider info", provider=name, error=str(e))
                providers_info[name] = {
                    "class": provider_class.__name__,
                    "supported_models": [],
                    "provider_name": name,
                    "error": str(e)
                }
        
        return providers_info
    
    def get_provider_for_model(self, model_name: str) -> Optional[str]:
        """Find which provider supports a specific model.
        
        Args:
            model_name: Name of the model to find.
            
        Returns:
            Provider name that supports the model, or None if not found.
        """
        for provider_name in self._providers:
            try:
                provider = self.get_provider(provider_name)
                if model_name in provider.get_supported_models():
                    return provider_name
            except Exception:
                continue
        
        return None
    
    async def embed_texts(self, texts: List[str], provider_name: str = None, 
                         model: str = None, **kwargs) -> EmbeddingResponse:
        """Generate embeddings using the specified provider.
        
        Args:
            texts: List of texts to embed.
            provider_name: Provider to use. If None, uses default.
            model: Model to use for embedding.
            **kwargs: Additional provider-specific parameters.
            
        Returns:
            EmbeddingResponse with embeddings.
        """
        provider = self.get_provider(provider_name, **kwargs)
        request = EmbeddingRequest(texts, model, **kwargs)
        return await provider.embed_texts(request)
    
    async def embed_single(self, text: str, provider_name: str = None, 
                          model: str = None, **kwargs) -> List[float]:
        """Generate embedding for a single text.
        
        Args:
            text: Text to embed.
            provider_name: Provider to use. If None, uses default.
            model: Model to use for embedding.
            **kwargs: Additional provider-specific parameters.
            
        Returns:
            List of floats representing the embedding.
        """
        response = await self.embed_texts([text], provider_name, model, **kwargs)
        return response.embeddings[0] if response.embeddings else []
    
    async def embed_batch(self, texts: List[str], provider_name: str = None, 
                         model: str = None, **kwargs) -> List[List[float]]:
        """Generate embeddings for a batch of texts.
        
        Args:
            texts: List of texts to embed.
            provider_name: Provider to use. If None, uses default.
            model: Model to use for embedding.
            **kwargs: Additional provider-specific parameters.
            
        Returns:
            List of embeddings (each embedding is a list of floats).
        """
        response = await self.embed_texts(texts, provider_name, model, **kwargs)
        return response.embeddings
    
    async def health_check(self, provider_name: str = None) -> bool:
        """Check health of a provider.
        
        Args:
            provider_name: Provider to check. If None, checks default provider.
            
        Returns:
            True if healthy, False otherwise.
        """
        try:
            provider = self.get_provider(provider_name)
            return await provider.health_check()
        except Exception as e:
            logger.error("Health check failed", provider=provider_name, error=str(e))
            return False
    
    async def close(self):
        """Close all provider connections."""
        for provider_name, provider in self._instances.items():
            try:
                if hasattr(provider, 'close'):
                    await provider.close()
                logger.info("Closed provider connection", provider=provider_name)
            except Exception as e:
                logger.error("Failed to close provider", provider=provider_name, error=str(e))


# Global registry instance
_embedding_registry: Optional[EmbeddingProviderRegistry] = None


def get_embedding_registry() -> EmbeddingProviderRegistry:
    """Get the global embedding registry instance."""
    global _embedding_registry
    if _embedding_registry is None:
        _embedding_registry = EmbeddingProviderRegistry()
        # Set default provider from settings
        default_provider = getattr(settings, 'default_embedding_provider', 'openai')
        _embedding_registry.set_default_provider(default_provider)
    return _embedding_registry


def get_embeddings_provider(provider_name: str = None, **kwargs) -> BaseEmbeddingsProvider:
    """Get an embeddings provider instance.
    
    Args:
        provider_name: Name of the provider to use. If None, uses default from settings.
        **kwargs: Provider-specific configuration.
        
    Returns:
        Embeddings provider instance.
    """
    provider_name = provider_name or settings.default_embedding_provider
    registry = get_embedding_registry()
    return registry.get_provider(provider_name, **kwargs)


async def embed_texts(texts: List[str], provider_name: str = None, 
                     model: str = None, **kwargs) -> EmbeddingResponse:
    """Generate embeddings using the specified provider.
    
    Args:
        texts: List of texts to embed.
        provider_name: Provider to use. If None, uses default.
        model: Model to use for embedding.
        **kwargs: Additional provider-specific parameters.
        
    Returns:
        EmbeddingResponse with embeddings.
    """
    registry = get_embedding_registry()
    return await registry.embed_texts(texts, provider_name, model, **kwargs)


async def embed_single(text: str, provider_name: str = None, 
                      model: str = None, **kwargs) -> List[float]:
    """Generate embedding for a single text.
    
    Args:
        text: Text to embed.
        provider_name: Provider to use. If None, uses default.
        model: Model to use for embedding.
        **kwargs: Additional provider-specific parameters.
        
    Returns:
        List of floats representing the embedding.
    """
    registry = get_embedding_registry()
    return await registry.embed_single(text, provider_name, model, **kwargs)


async def embed_batch(texts: List[str], provider_name: str = None, 
                     model: str = None, **kwargs) -> List[List[float]]:
    """Generate embeddings for a batch of texts.
    
    Args:
        texts: List of texts to embed.
        provider_name: Provider to use. If None, uses default.
        model: Model to use for embedding.
        **kwargs: Additional provider-specific parameters.
        
    Returns:
        List of embeddings (each embedding is a list of floats).
    """
    registry = get_embedding_registry()
    return await registry.embed_batch(texts, provider_name, model, **kwargs)


def get_available_providers() -> Dict[str, Dict[str, Any]]:
    """Get information about available providers.
    
    Returns:
        Dictionary mapping provider names to their information.
    """
    registry = get_embedding_registry()
    return registry.get_available_providers()


def get_provider_for_model(model_name: str) -> Optional[str]:
    """Find which provider supports a specific model.
    
    Args:
        model_name: Name of the model to find.
        
    Returns:
        Provider name that supports the model, or None if not found.
    """
    registry = get_embedding_registry()
    return registry.get_provider_for_model(model_name)
