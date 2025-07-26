"""
Base LLM interface for provider abstraction using LiteLLM.
Provides unified interface for all LLM providers.
"""

from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any, AsyncGenerator
from pydantic import BaseModel, Field
from datetime import datetime
import structlog

logger = structlog.get_logger(__name__)


class LLMRequest(BaseModel):
    """Standardized LLM request model."""
    messages: List[Dict[str, str]] = Field(..., description="List of messages")
    model: str = Field(..., description="Model identifier (format: provider/model)")
    temperature: float = Field(default=0.7, ge=0.0, le=2.0, description="Temperature for generation")
    max_tokens: Optional[int] = Field(default=None, description="Maximum tokens to generate")
    stream: bool = Field(default=False, description="Whether to stream the response")
    response_format: Optional[Dict[str, Any]] = Field(default=None, description="Response format (for structured outputs)")
    tools: Optional[List[Dict[str, Any]]] = Field(default=None, description="Function/tool definitions")
    tool_choice: Optional[str] = Field(default=None, description="Tool choice specification")
    stop: Optional[List[str]] = Field(default=None, description="Stop sequences")
    presence_penalty: float = Field(default=0.0, ge=-2.0, le=2.0, description="Presence penalty")
    frequency_penalty: float = Field(default=0.0, ge=-2.0, le=2.0, description="Frequency penalty")
    top_p: float = Field(default=1.0, ge=0.0, le=1.0, description="Top-p sampling")
    n: int = Field(default=1, ge=1, le=10, description="Number of completions")
    logit_bias: Optional[Dict[str, float]] = Field(default=None, description="Logit bias")
    user: Optional[str] = Field(default=None, description="User identifier")
    timeout: Optional[float] = Field(default=60.0, description="Request timeout in seconds")
    api_base: Optional[str] = Field(default=None, description="Custom API base URL")
    api_version: Optional[str] = Field(default=None, description="API version")


class LLMResponse(BaseModel):
    """Standardized LLM response model."""
    content: str = Field(..., description="Generated content")
    model: str = Field(..., description="Model used")
    usage: Optional[Dict[str, int]] = Field(default=None, description="Token usage information")
    finish_reason: Optional[str] = Field(default=None, description="Reason for completion")
    tool_calls: Optional[List[Dict[str, Any]]] = Field(default=None, description="Tool calls if applicable")
    response_format: Optional[Dict[str, Any]] = Field(default=None, description="Structured response if used")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Additional metadata")
    created_at: datetime = Field(default_factory=datetime.now, description="Response timestamp")


class LLMStreamChunk(BaseModel):
    """Streaming response chunk model."""
    content: str = Field(..., description="Content chunk")
    is_complete: bool = Field(default=False, description="Whether this is the final chunk")
    finish_reason: Optional[str] = Field(default=None, description="Reason for completion")
    usage: Optional[Dict[str, int]] = Field(default=None, description="Token usage information")
    tool_calls: Optional[List[Dict[str, Any]]] = Field(default=None, description="Tool calls in chunk")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Additional metadata")


class ModelInfo(BaseModel):
    """Model information model."""
    name: str = Field(..., description="Model identifier (provider/model)")
    provider: str = Field(..., description="Provider name")
    context_length: int = Field(..., description="Maximum context length")
    supports_streaming: bool = Field(default=True, description="Whether streaming is supported")
    supports_functions: bool = Field(default=False, description="Whether function calling is supported")
    supports_embeddings: bool = Field(default=False, description="Whether embeddings are supported")
    supports_vision: bool = Field(default=False, description="Whether vision is supported")
    pricing: Optional[Dict[str, float]] = Field(default=None, description="Pricing information (per 1K tokens)")
    input_cost_per_token: Optional[float] = Field(default=None, description="Cost per input token")
    output_cost_per_token: Optional[float] = Field(default=None, description="Cost per output token")
    capabilities: List[str] = Field(default_factory=list, description="Model capabilities")
    max_output_tokens: Optional[int] = Field(default=None, description="Maximum output tokens")


class BaseLLM(ABC):
    """Abstract base class for all LLM providers using LiteLLM."""
    
    def __init__(self, api_key: str, base_url: Optional[str] = None, **kwargs):
        """Initialize the LLM provider."""
        self.api_key = api_key
        self.base_url = base_url
        self.config = kwargs
        self.logger = structlog.get_logger(self.__class__.__name__)
    
    @abstractmethod
    async def generate(self, request: LLMRequest) -> LLMResponse:
        """Generate a response from the LLM."""
        pass
    
    @abstractmethod
    async def stream(self, request: LLMRequest) -> AsyncGenerator[LLMStreamChunk, None]:
        """Stream a response from the LLM."""
        pass
    
    @abstractmethod
    async def get_models(self) -> List[ModelInfo]:
        """Get available models from the provider."""
        pass
    
    @abstractmethod
    async def get_model_info(self, model_name: str) -> Optional[ModelInfo]:
        """Get information about a specific model."""
        pass
    
    async def count_tokens(self, text: str, model: str) -> int:
        """Count tokens in text for a specific model."""
        # Use LiteLLM's token counting
        try:
            import litellm
            return litellm.token_counter(model=model, text=text)
        except Exception:
            # Fallback to simple estimation
            return len(text.split()) * 1.3
    
    async def estimate_cost(self, request: LLMRequest) -> Optional[float]:
        """Estimate the cost of a request using LiteLLM pricing."""
        try:
            import litellm
            model_info = await self.get_model_info(request.model)
            if not model_info:
                return None
            
            # Count input tokens
            input_text = " ".join([msg.get("content", "") for msg in request.messages])
            input_tokens = await self.count_tokens(input_text, request.model)
            
            # Use LiteLLM pricing data
            cost_per_token = litellm.model_cost.get(request.model, {})
            input_cost = input_tokens * cost_per_token.get("input_cost_per_token", 0)
            output_cost = (request.max_tokens or 1000) * cost_per_token.get("output_cost_per_token", 0)
            
            return input_cost + output_cost
            
        except Exception as e:
            self.logger.error("Cost estimation failed", error=str(e))
            return None
    
    async def health_check(self) -> bool:
        """Check if the provider is healthy and accessible."""
        try:
            models = await self.get_models()
            return len(models) > 0
        except Exception as e:
            self.logger.error("Health check failed", error=str(e))
            return False
    
    def _validate_request(self, request: LLMRequest) -> None:
        """Validate the LLM request."""
        if not request.messages:
            raise ValueError("Messages cannot be empty")
        
        if request.temperature < 0 or request.temperature > 2:
            raise ValueError("Temperature must be between 0 and 2")
        
        if request.max_tokens is not None and request.max_tokens <= 0:
            raise ValueError("Max tokens must be positive")
        
        if request.n < 1 or request.n > 10:
            raise ValueError("N must be between 1 and 10")
    
    def _create_standard_response(self, content: str, model: str, **kwargs) -> LLMResponse:
        """Create a standardized response."""
        return LLMResponse(
            content=content,
            model=model,
            **kwargs
        )
    
    def _create_stream_chunk(self, content: str, is_complete: bool = False, **kwargs) -> LLMStreamChunk:
        """Create a streaming response chunk."""
        return LLMStreamChunk(
            content=content,
            is_complete=is_complete,
            **kwargs
        )


class LLMProviderRegistry:
    """Registry for LLM providers."""
    
    def __init__(self):
        self.providers: Dict[str, type] = {}
    
    def register(self, name: str, provider_class: type) -> None:
        """Register a provider class."""
        if not issubclass(provider_class, BaseLLM):
            raise ValueError("Provider must inherit from BaseLLM")
        self.providers[name] = provider_class
    
    def get_provider(self, name: str) -> Optional[type]:
        """Get a provider class by name."""
        return self.providers.get(name)
    
    def list_providers(self) -> List[str]:
        """List all registered providers."""
        return list(self.providers.keys())
    
    def create_provider(self, name: str, **kwargs) -> Optional[BaseLLM]:
        """Create a provider instance."""
        provider_class = self.get_provider(name)
        if provider_class:
            return provider_class(**kwargs)
        return None


# Global provider registry
provider_registry = LLMProviderRegistry()
