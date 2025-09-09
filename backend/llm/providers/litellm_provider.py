"""
LiteLLM provider implementation supporting 100+ models including local Ollama and Gemini.
Unified interface for all LLM providers through LiteLLM.
"""

import asyncio
from typing import List, Optional, Dict, Any, AsyncGenerator
import litellm
import structlog

from llm.base.base_llm import (
    BaseLLM, LLMRequest, LLMResponse, LLMStreamChunk, 
    ModelInfo, provider_registry
)
from config.settings import get_settings

logger = structlog.get_logger(__name__)
settings = get_settings()

# Configure LiteLLM
litellm.set_verbose = False
litellm.drop_params = True
litellm.telemetry = False


class LiteLLMProvider(BaseLLM):
    """Unified LLM provider supporting Ollama, Gemini, OpenAI, and 100+ models."""
    
    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None, **kwargs):
        """Initialize LiteLLM provider."""
        super().__init__(api_key or "", base_url, **kwargs)
        
        # Provider-specific configurations
        self.provider_configs = {
            "ollama": {
                "base_url": base_url or settings.ollama_base_url,
                "api_key": "ollama",  # Ollama doesn't use API keys
            },
            "gemini": {
                "base_url": None,
                "api_key": api_key or settings.gemini_api_key,
            },
            "google": {  # Gemini uses 'google' as provider name
                "base_url": None,
                "api_key": api_key or settings.gemini_api_key,
            },
            "openai": {
                "base_url": None,  # Use provided base_url or None
                "api_key": api_key or settings.openai_api_key,
            }
        }
        
        # Cache
        self._models_cache: Dict[str, List[ModelInfo]] = {}
        self._cache_duration = 3600
    
    async def generate(self, request: LLMRequest) -> LLMResponse:
        """Generate response using LiteLLM."""
        self._validate_request(request)
        
        try:
            # Prepare LiteLLM request
            litellm_request = {
                "model": request.model,
                "messages": request.messages,
                "temperature": request.temperature,
                "max_tokens": request.max_tokens,
                "stream": False,
                "presence_penalty": request.presence_penalty,
                "frequency_penalty": request.frequency_penalty,
                "top_p": request.top_p,
                "n": request.n,
                "stop": request.stop,
                "logit_bias": request.logit_bias,
                "user": request.user,
                "timeout": request.timeout or 60.0,
            }
            
            # Add provider-specific configuration
            provider = self._get_provider_from_model(request.model)
            config = self.provider_configs.get(provider, {})
            
            if config.get("base_url"):
                litellm_request["api_base"] = config["base_url"]
            if config.get("api_key"):
                litellm_request["api_key"] = config["api_key"]
            
            # Handle structured outputs
            if request.response_format:
                litellm_request["response_format"] = request.response_format
            
            # Handle tools
            if request.tools:
                litellm_request["tools"] = request.tools
            if request.tool_choice:
                litellm_request["tool_choice"] = request.tool_choice
            
            # Make request
            response = await litellm.acompletion(**litellm_request)
            
            # Extract content
            content = response.choices[0].message.content or ""
            
            # Handle tool calls
            tool_calls = None
            if hasattr(response.choices[0].message, 'tool_calls') and response.choices[0].message.tool_calls:
                tool_calls = [
                    {
                        "id": tool_call.id,
                        "type": tool_call.type,
                        "function": {
                            "name": tool_call.function.name,
                            "arguments": tool_call.function.arguments
                        }
                    }
                    for tool_call in response.choices[0].message.tool_calls
                ]
            
            return self._create_standard_response(
                content=content,
                model=response.model,
                usage={
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                } if response.usage else None,
                finish_reason=response.choices[0].finish_reason,
                tool_calls=tool_calls,
                metadata={"provider": "litellm", "raw_response": str(response)}
            )
            
        except Exception as e:
            logger.error("LiteLLM generation failed", error=str(e), model=request.model)
            raise
    
    async def stream(self, request: LLMRequest) -> AsyncGenerator[LLMStreamChunk, None]:
        """Stream response using LiteLLM."""
        self._validate_request(request)
        
        try:
            # Prepare LiteLLM request
            litellm_request = {
                "model": request.model,
                "messages": request.messages,
                "temperature": request.temperature,
                "max_tokens": request.max_tokens,
                "stream": True,
                "presence_penalty": request.presence_penalty,
                "frequency_penalty": request.frequency_penalty,
                "top_p": request.top_p,
                "n": request.n,
                "stop": request.stop,
                "logit_bias": request.logit_bias,
                "user": request.user,
                "timeout": request.timeout or 60.0,
            }
            
            # Add provider-specific configuration
            provider = self._get_provider_from_model(request.model)
            config = self.provider_configs.get(provider, {})
            
            if config.get("base_url"):
                litellm_request["api_base"] = config["base_url"]
            if config.get("api_key"):
                litellm_request["api_key"] = config["api_key"]
            
            # Stream response
            stream = await litellm.acompletion(**litellm_request)
            
            accumulated_content = ""
            usage = None
            
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    accumulated_content += content
                    
                    yield self._create_stream_chunk(
                        content=content,
                        is_complete=False,
                        metadata={"provider": "litellm"}
                    )
                
                # Handle tool calls in streaming
                tool_calls = None
                if chunk.choices and hasattr(chunk.choices[0].delta, 'tool_calls') and chunk.choices[0].delta.tool_calls:
                    tool_calls = [
                        {
                            "id": tool_call.id,
                            "type": tool_call.type,
                            "function": {
                                "name": tool_call.function.name,
                                "arguments": tool_call.function.arguments
                            }
                        }
                        for tool_call in chunk.choices[0].delta.tool_calls
                    ]
                
                if hasattr(chunk, 'usage') and chunk.usage:
                    usage = {
                        "prompt_tokens": chunk.usage.prompt_tokens,
                        "completion_tokens": chunk.usage.completion_tokens,
                        "total_tokens": chunk.usage.total_tokens
                    }
            
            finish_reason = chunk.choices[0].finish_reason if chunk.choices else None
            yield self._create_stream_chunk(
                content="",
                is_complete=True,
                finish_reason=finish_reason,
                usage=usage,
                metadata={"provider": "litellm", "total_content": accumulated_content}
            )
            
        except Exception as e:
            logger.error("LiteLLM streaming failed", error=str(e), model=request.model)
            raise
    
    async def get_models(self) -> List[ModelInfo]:
        """Get available models from all providers."""
        models = []
        
        # Gemini models (prioritized)
        gemini_models = [
            "gemini/gemini-1.5-flash",
            "gemini/gemini-1.5-pro",
            "gemini/gemini-pro",
            "gemini/gemini-pro-vision"
        ]
        
        # Ollama models (fallback)
        ollama_models = [
            "ollama/llama3.2",
            "ollama/mistral",
            "ollama/codellama",
            "ollama/gemma2",
            "ollama/phi3",
            "ollama/neural-chat",
            "ollama/starling-lm"
        ]
        
        # OpenAI models (fallback)
        openai_models = [
            "gpt-4o-mini",
            "gpt-4o",
            "gpt-4-turbo",
            "gpt-3.5-turbo"
        ]
        
        # Build model info - prioritize Gemini
        all_models = gemini_models + ollama_models + openai_models
        
        for model_name in all_models:
            provider = self._get_provider_from_model(model_name)
            model_info = ModelInfo(
                name=model_name,
                provider=provider,
                context_length=self._get_context_length(model_name),
                supports_streaming=True,
                supports_functions=self._supports_functions(model_name),
                supports_embeddings=False,
                supports_vision=self._supports_vision(model_name),
                pricing=self._get_pricing(model_name),
                capabilities=self._get_capabilities(model_name),
                max_output_tokens=self._get_max_output_tokens(model_name)
            )
            models.append(model_info)
        
        return models
    
    async def get_model_info(self, model_name: str) -> Optional[ModelInfo]:
        """Get information about a specific model."""
        models = await self.get_models()
        for model in models:
            if model.name == model_name:
                return model
        return None
    
    def _get_provider_from_model(self, model_name: str) -> str:
        """Extract provider from model name."""
        if model_name.startswith("ollama/"):
            return "ollama"
        elif model_name.startswith("gemini/"):
            return "google"
        elif model_name.startswith("gpt-"):
            return "openai"
        else:
            return "openai"  # Default
    
    def _get_context_length(self, model_name: str) -> int:
        """Get context length for a model."""
        context_lengths = {
            # Gemini models (prioritized)
            "gemini/gemini-1.5-flash": 1000000,
            "gemini/gemini-1.5-pro": 2000000,
            "gemini/gemini-pro": 32768,
            "gemini/gemini-pro-vision": 16384,
            
            # Ollama models
            "ollama/llama3.2": 8192,
            "ollama/mistral": 8192,
            "ollama/codellama": 16384,
            "ollama/gemma2": 8192,
            "ollama/phi3": 4096,
            "ollama/neural-chat": 8192,
            "ollama/starling-lm": 8192,
            
            # OpenAI models
            "gpt-4o-mini": 128000,
            "gpt-4o": 128000,
            "gpt-4-turbo": 128000,
            "gpt-3.5-turbo": 16385
        }
        
        return context_lengths.get(model_name, 4096)
    
    def _supports_functions(self, model_name: str) -> bool:
        """Check if model supports function calling."""
        function_models = [
            # Gemini models (prioritized)
            "gemini/gemini-1.5-flash", "gemini/gemini-1.5-pro", "gemini/gemini-pro",
            # OpenAI models
            "gpt-4o-mini", "gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"
        ]
        return model_name in function_models
    
    def _supports_vision(self, model_name: str) -> bool:
        """Check if model supports vision."""
        vision_models = [
            # Gemini models (prioritized)
            "gemini/gemini-pro-vision", "gemini/gemini-1.5-pro",
            # OpenAI models
            "gpt-4o-mini", "gpt-4o", "gpt-4-turbo"
        ]
        return model_name in vision_models
    
    def _get_pricing(self, model_name: str) -> Optional[Dict[str, float]]:
        """Get pricing information."""
        pricing = {
            # OpenAI pricing
            "gpt-4o-mini": {"input": 0.00015, "output": 0.0006},
            "gpt-4o": {"input": 0.0025, "output": 0.01},
            "gpt-4-turbo": {"input": 0.01, "output": 0.03},
            "gpt-3.5-turbo": {"input": 0.0015, "output": 0.002},
        }
        
        return pricing.get(model_name)
    
    def _get_max_output_tokens(self, model_name: str) -> Optional[int]:
        """Get maximum output tokens."""
        max_tokens = {
            "gpt-4o-mini": 16384,
            "gpt-4o": 16384,
            "gpt-4-turbo": 4096,
            "gpt-3.5-turbo": 4096,
            "ollama/llama3.2": 4096,
            "gemini/gemini-pro": 8192,
            "gemini/gemini-1.5-flash": 8192
        }
        
        return max_tokens.get(model_name)
    
    async def health_check(self) -> bool:
        """Check if the provider is healthy."""
        try:
            # Test with default model from settings
            default_model = settings.default_llm_model
            test_request = LLMRequest(
                messages=[{"role": "user", "content": "test"}],
                model=default_model
            )
            
            await self.generate(test_request)
            return True
            
        except Exception as e:
            logger.error(f"Health check failed for model {default_model}", error=str(e))
            return False


# Register the unified provider
provider_registry.register("litellm", LiteLLMProvider)
provider_registry.register("default", LiteLLMProvider)