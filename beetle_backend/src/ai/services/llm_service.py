import os
import asyncio
from typing import List, Dict, Any, Optional, Union, AsyncGenerator
from openai import AsyncOpenAI, OpenAI
from anthropic import AsyncAnthropic, Anthropic
import logging
from datetime import datetime
import time
import json

from config.settings import get_settings
from config.models_config import ModelRegistry, ModelSelectionStrategy, LLMConfig, EmbeddingConfig

logger = logging.getLogger(__name__)

# Get settings
settings = get_settings()


class LLMService:
    """LLM service for multiple provider support"""
    
    def __init__(self):
        self.openai_client = None
        self.anthropic_client = None
        self.openai_sync_client = None
        self.anthropic_sync_client = None
        self.initialized = False
        self.model_registry = ModelRegistry()
        self.available_models = {}
        self.model_configs = {}
    
    async def initialize(self):
        """Initialize LLM clients"""
        try:
            logger.info("Initializing LLM service...")
            
            # Initialize OpenAI client
            if settings.openai_api_key:
                self.openai_client = AsyncOpenAI(api_key=settings.openai_api_key)
                self.openai_sync_client = OpenAI(api_key=settings.openai_api_key)
                logger.info("OpenAI client initialized")
            
            # Initialize Anthropic client
            if settings.anthropic_api_key:
                self.anthropic_client = AsyncAnthropic(api_key=settings.anthropic_api_key)
                self.anthropic_sync_client = Anthropic(api_key=settings.anthropic_api_key)
                logger.info("Anthropic client initialized")
            
            # Load available models
            await self._load_available_models()
            
            self.initialized = True
            logger.info("LLM service initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize LLM service: {e}")
            raise
    
    async def _load_available_models(self):
        """Load available models from registry"""
        try:
            # Load OpenAI models
            if self.openai_client:
                openai_models = self.model_registry.get_models_by_provider("openai")
                for model in openai_models:
                    self.available_models[model.name] = model
                    self.model_configs[model.name] = model
            
            # Load Anthropic models
            if self.anthropic_client:
                anthropic_models = self.model_registry.get_models_by_provider("anthropic")
                for model in anthropic_models:
                    self.available_models[model.name] = model
                    self.model_configs[model.name] = model
            
            logger.info(f"Loaded {len(self.available_models)} available models")
            
        except Exception as e:
            logger.error(f"Failed to load available models: {e}")
    
    async def generate_text(
        self,
        prompt: str,
        model: str = None,
        max_tokens: int = None,
        temperature: float = None,
        system_prompt: str = None,
        stream: bool = False
    ) -> Union[str, AsyncGenerator[str, None]]:
        """Generate text using LLM"""
        try:
            if not self.initialized:
                await self.initialize()
            
            # Get model configuration
            model_config = self._get_model_config(model)
            if not model_config:
                raise ValueError(f"Model {model} not found or not available")
            
            # Set default parameters
            max_tokens = max_tokens or model_config.max_tokens
            temperature = temperature or model_config.temperature
            system_prompt = system_prompt or model_config.system_prompt
            
            # Generate based on provider
            if model_config.provider == "openai":
                return await self._generate_openai(
                    prompt, model, max_tokens, temperature, system_prompt, stream
                )
            elif model_config.provider == "anthropic":
                return await self._generate_anthropic(
                    prompt, model, max_tokens, temperature, system_prompt, stream
                )
            else:
                raise ValueError(f"Unsupported provider: {model_config.provider}")
                
        except Exception as e:
            logger.error(f"Failed to generate text: {e}")
            raise
    
    async def _generate_openai(
        self,
        prompt: str,
        model: str,
        max_tokens: int,
        temperature: float,
        system_prompt: str,
        stream: bool
    ) -> Union[str, AsyncGenerator[str, None]]:
        """Generate text using OpenAI"""
        try:
            messages = []
            
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            
            messages.append({"role": "user", "content": prompt})
            
            if stream:
                return self._stream_openai_response(model, messages, max_tokens, temperature)
            else:
                response = await self.openai_client.chat.completions.create(
                    model=model,
                    messages=messages,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    stream=False
                )
                return response.choices[0].message.content
                
        except Exception as e:
            logger.error(f"OpenAI generation failed: {e}")
            raise
    
    async def _generate_anthropic(
        self,
        prompt: str,
        model: str,
        max_tokens: int,
        temperature: float,
        system_prompt: str,
        stream: bool
    ) -> Union[str, AsyncGenerator[str, None]]:
        """Generate text using Anthropic"""
        try:
            if stream:
                return self._stream_anthropic_response(model, prompt, max_tokens, temperature, system_prompt)
            else:
                response = await self.anthropic_client.messages.create(
                    model=model,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    system=system_prompt,
                    messages=[{"role": "user", "content": prompt}]
                )
                return response.content[0].text
                
        except Exception as e:
            logger.error(f"Anthropic generation failed: {e}")
            raise
    
    async def _stream_openai_response(
        self,
        model: str,
        messages: List[Dict[str, str]],
        max_tokens: int,
        temperature: float
    ) -> AsyncGenerator[str, None]:
        """Stream OpenAI response"""
        try:
            stream = await self.openai_client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
                stream=True
            )
            
            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
                    
        except Exception as e:
            logger.error(f"OpenAI streaming failed: {e}")
            raise
    
    async def _stream_anthropic_response(
        self,
        model: str,
        prompt: str,
        max_tokens: int,
        temperature: float,
        system_prompt: str
    ) -> AsyncGenerator[str, None]:
        """Stream Anthropic response"""
        try:
            stream = await self.anthropic_client.messages.create(
                model=model,
                max_tokens=max_tokens,
                temperature=temperature,
                system=system_prompt,
                messages=[{"role": "user", "content": prompt}],
                stream=True
            )
            
            async for chunk in stream:
                if chunk.type == "content_block_delta":
                    yield chunk.delta.text
                    
        except Exception as e:
            logger.error(f"Anthropic streaming failed: {e}")
            raise
    
    async def generate_embeddings(
        self,
        texts: List[str],
        model: str = None
    ) -> List[List[float]]:
        """Generate embeddings for texts"""
        try:
            if not self.initialized:
                await self.initialize()
            
            # Get model configuration
            model_config = self._get_embedding_model_config(model)
            if not model_config:
                raise ValueError(f"Embedding model {model} not found or not available")
            
            # Generate embeddings based on provider
            if model_config.provider == "openai":
                return await self._generate_openai_embeddings(texts, model)
            else:
                raise ValueError(f"Unsupported embedding provider: {model_config.provider}")
                
        except Exception as e:
            logger.error(f"Failed to generate embeddings: {e}")
            raise
    
    async def _generate_openai_embeddings(
        self,
        texts: List[str],
        model: str
    ) -> List[List[float]]:
        """Generate embeddings using OpenAI"""
        try:
            embeddings = []
            
            # Process in batches
            batch_size = 100
            for i in range(0, len(texts), batch_size):
                batch = texts[i:i + batch_size]
                
                response = await self.openai_client.embeddings.create(
                    model=model,
                    input=batch
                )
                
                batch_embeddings = [data.embedding for data in response.data]
                embeddings.extend(batch_embeddings)
            
            return embeddings
            
        except Exception as e:
            logger.error(f"OpenAI embedding generation failed: {e}")
            raise
    
    def _get_model_config(self, model_name: str) -> Optional[LLMConfig]:
        """Get model configuration"""
        if not model_name:
            model_name = settings.default_llm_model
        
        return self.model_configs.get(model_name)
    
    def _get_embedding_model_config(self, model_name: str) -> Optional[EmbeddingConfig]:
        """Get embedding model configuration"""
        if not model_name:
            model_name = settings.default_embedding_model
        
        model_config = self.model_configs.get(model_name)
        if isinstance(model_config, EmbeddingConfig):
            return model_config
        return None
    
    async def select_optimal_model(
        self,
        task_type: str,
        max_cost: float = None,
        required_capabilities: List[str] = None
    ) -> Optional[str]:
        """Select optimal model for task"""
        try:
            available_models = list(self.available_models.values())
            
            # Filter by cost if specified
            if max_cost:
                available_models = ModelSelectionStrategy.select_by_cost(available_models, max_cost)
            
            # Filter by capabilities if specified
            if required_capabilities:
                available_models = ModelSelectionStrategy.select_by_capability(available_models, required_capabilities)
            
            # Select optimal model
            optimal_model = ModelSelectionStrategy.select_optimal(available_models, task_type)
            
            return optimal_model.name if optimal_model else None
            
        except Exception as e:
            logger.error(f"Failed to select optimal model: {e}")
            return None
    
    async def get_model_info(self, model_name: str) -> Dict[str, Any]:
        """Get model information"""
        try:
            model_config = self.model_configs.get(model_name)
            if not model_config:
                return {}
            
            return {
                "name": model_config.name,
                "provider": model_config.provider,
                "model_type": model_config.model_type,
                "description": model_config.description,
                "capabilities": model_config.capabilities,
                "limitations": model_config.limitations,
                "cost_per_1k_tokens": model_config.cost_per_1k_tokens,
                "max_tokens": model_config.max_tokens,
                "temperature": model_config.temperature,
                "metadata": model_config.metadata
            }
            
        except Exception as e:
            logger.error(f"Failed to get model info: {e}")
            return {}
    
    async def estimate_cost(
        self,
        model_name: str,
        input_tokens: int,
        output_tokens: int = 0
    ) -> float:
        """Estimate cost for token usage"""
        try:
            model_config = self.model_configs.get(model_name)
            if not model_config or not model_config.cost_per_1k_tokens:
                return 0.0
            
            total_tokens = input_tokens + output_tokens
            cost = (total_tokens / 1000) * model_config.cost_per_1k_tokens
            
            return round(cost, 6)
            
        except Exception as e:
            logger.error(f"Failed to estimate cost: {e}")
            return 0.0
    
    async def health_check(self) -> bool:
        """Check LLM service health"""
        try:
            if not self.initialized:
                await self.initialize()
            
            # Test with a simple prompt
            test_prompt = "Hello, this is a health check."
            
            # Try OpenAI if available
            if self.openai_client:
                try:
                    await self.generate_text(test_prompt, "gpt-3.5-turbo", max_tokens=10)
                    return True
                except Exception as e:
                    logger.warning(f"OpenAI health check failed: {e}")
            
            # Try Anthropic if available
            if self.anthropic_client:
                try:
                    await self.generate_text(test_prompt, "claude-3-haiku-20240307", max_tokens=10)
                    return True
                except Exception as e:
                    logger.warning(f"Anthropic health check failed: {e}")
            
            return False
            
        except Exception as e:
            logger.error(f"LLM service health check failed: {e}")
            return False
    
    async def close(self):
        """Close LLM service connections"""
        try:
            if self.openai_client:
                await self.openai_client.close()
            if self.anthropic_client:
                await self.anthropic_client.close()
            logger.info("LLM service connections closed")
        except Exception as e:
            logger.error(f"Error closing LLM service connections: {e}")


# Global LLM service instance
llm_service = LLMService()


async def get_llm_service() -> LLMService:
    """Get LLM service instance"""
    if not llm_service.initialized:
        await llm_service.initialize()
    return llm_service


# Prompt management utilities
class PromptManager:
    """Prompt management utilities"""
    
    @staticmethod
    def build_rag_prompt(
        query: str,
        context: List[Dict[str, Any]],
        system_prompt: str = None
    ) -> str:
        """Build RAG prompt with context"""
        if not system_prompt:
            system_prompt = """You are a helpful AI assistant that answers questions based on the provided context. 
            Always cite your sources and provide accurate information. If you cannot answer the question based on the context, 
            say so clearly."""
        
        context_text = "\n\n".join([
            f"Source {i+1}:\n{ctx.get('content', '')}"
            for i, ctx in enumerate(context)
        ])
        
        prompt = f"""{system_prompt}

Context:
{context_text}

Question: {query}

Answer:"""
        
        return prompt
    
    @staticmethod
    def build_code_analysis_prompt(
        code: str,
        language: str,
        analysis_type: str = "general"
    ) -> str:
        """Build code analysis prompt"""
        system_prompt = f"""You are an expert code analyst specializing in {language}. 
        Analyze the provided code and provide insights about {analysis_type}."""
        
        prompt = f"""{system_prompt}

Code:
```{language}
{code}
```

Analysis:"""
        
        return prompt
    
    @staticmethod
    def build_documentation_prompt(
        code: str,
        language: str,
        doc_type: str = "function"
    ) -> str:
        """Build documentation generation prompt"""
        system_prompt = f"""You are an expert technical writer. Generate clear, concise {doc_type} documentation 
        for the provided {language} code."""
        
        prompt = f"""{system_prompt}

Code:
```{language}
{code}
```

Documentation:"""
        
        return prompt 