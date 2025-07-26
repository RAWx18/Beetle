#!/usr/bin/env python3
"""
Test script for the new LiteLLM-based LLM interface.
Run this to verify the interface works with different features.
"""

import sys
import os
import asyncio
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from llm.base.base_llm import LLMRequest, LLMResponse, LLMStreamChunk, ModelInfo, BaseLLM
from typing import List, Optional, Dict, Any, AsyncGenerator


class MockLLMProvider(BaseLLM):
    """Mock LLM provider for testing the interface."""
    
    def __init__(self, api_key: str, base_url: Optional[str] = None, **kwargs):
        super().__init__(api_key, base_url, **kwargs)
        self.mock_models = [
            ModelInfo(
                name="mock/gpt-4",
                provider="mock",
                context_length=8192,
                supports_streaming=True,
                supports_functions=True,
                supports_embeddings=False,
                supports_vision=False,
                input_cost_per_token=0.00003,
                output_cost_per_token=0.00006,
                capabilities=["text-generation", "function-calling"],
                max_output_tokens=4096
            ),
            ModelInfo(
                name="mock/claude-3",
                provider="mock",
                context_length=200000,
                supports_streaming=True,
                supports_functions=True,
                supports_embeddings=True,
                supports_vision=True,
                input_cost_per_token=0.000015,
                output_cost_per_token=0.000075,
                capabilities=["text-generation", "function-calling", "embeddings", "vision"],
                max_output_tokens=4096
            )
        ]
    
    async def generate(self, request: LLMRequest) -> LLMResponse:
        """Generate a mock response."""
        self._validate_request(request)
        
        # Mock response based on request
        content = f"Mock response for model {request.model} with temperature {request.temperature}"
        
        if request.tools:
            content += f"\nTools available: {len(request.tools)}"
        
        if request.response_format:
            content += f"\nResponse format: {request.response_format}"
        
        return LLMResponse(
            content=content,
            model=request.model,
            usage={"prompt_tokens": 10, "completion_tokens": 20, "total_tokens": 30},
            finish_reason="stop",
            tool_calls=request.tools,  # Mock tool calls
            response_format=request.response_format,
            metadata={"provider": "mock", "test": True}
        )
    
    async def stream(self, request: LLMRequest) -> AsyncGenerator[LLMStreamChunk, None]:
        """Stream a mock response."""
        self._validate_request(request)
        
        content = f"Mock streaming response for {request.model}"
        words = content.split()
        
        for i, word in enumerate(words):
            yield LLMStreamChunk(
                content=word + " ",
                is_complete=(i == len(words) - 1),
                finish_reason="stop" if i == len(words) - 1 else None,
                usage={"prompt_tokens": 10, "completion_tokens": i + 1, "total_tokens": 10 + i + 1},
                metadata={"provider": "mock", "chunk": i}
            )
            await asyncio.sleep(0.1)  # Simulate streaming delay
    
    async def get_models(self) -> List[ModelInfo]:
        """Get available mock models."""
        return self.mock_models
    
    async def get_model_info(self, model_name: str) -> Optional[ModelInfo]:
        """Get information about a specific mock model."""
        for model in self.mock_models:
            if model.name == model_name:
                return model
        return None


async def test_litellm_interface():
    """Test the LiteLLM-based interface with various features."""
    
    print("🧪 Testing LiteLLM-based LLM Interface")
    print("=" * 50)
    
    # Create mock provider
    provider = MockLLMProvider(api_key="test_key")
    
    # Test 1: Basic generation
    print("\n📋 Test 1: Basic Generation")
    print("-" * 30)
    
    try:
        request = LLMRequest(
            messages=[{"role": "user", "content": "Hello, world!"}],
            model="mock/gpt-4",
            temperature=0.7,
            max_tokens=100
        )
        
        response = await provider.generate(request)
        print(f"✅ Generated response: {response.content[:100]}...")
        print(f"   Model: {response.model}")
        print(f"   Usage: {response.usage}")
        print(f"   Finish reason: {response.finish_reason}")
        
    except Exception as e:
        print(f"❌ Basic generation failed: {e}")
    
    # Test 2: Tool calling
    print("\n📋 Test 2: Tool Calling")
    print("-" * 30)
    
    try:
        tools = [
            {
                "type": "function",
                "function": {
                    "name": "get_weather",
                    "description": "Get weather information",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "location": {"type": "string"}
                        }
                    }
                }
            }
        ]
        
        request = LLMRequest(
            messages=[{"role": "user", "content": "What's the weather like?"}],
            model="mock/gpt-4",
            tools=tools,
            tool_choice="auto"
        )
        
        response = await provider.generate(request)
        print(f"✅ Tool calling response: {response.content[:100]}...")
        print(f"   Tool calls: {response.tool_calls}")
        
    except Exception as e:
        print(f"❌ Tool calling failed: {e}")
    
    # Test 3: Structured output
    print("\n📋 Test 3: Structured Output")
    print("-" * 30)
    
    try:
        request = LLMRequest(
            messages=[{"role": "user", "content": "Return a JSON object with name and age"}],
            model="mock/gpt-4",
            response_format={"type": "json_object"}
        )
        
        response = await provider.generate(request)
        print(f"✅ Structured output response: {response.content[:100]}...")
        print(f"   Response format: {response.response_format}")
        
    except Exception as e:
        print(f"❌ Structured output failed: {e}")
    
    # Test 4: Streaming
    print("\n📋 Test 4: Streaming")
    print("-" * 30)
    
    try:
        request = LLMRequest(
            messages=[{"role": "user", "content": "Tell me a story"}],
            model="mock/gpt-4",
            stream=True
        )
        
        print("   Streaming response:")
        async for chunk in provider.stream(request):
            print(f"   {chunk.content}", end="", flush=True)
            if chunk.is_complete:
                print(f"\n   ✅ Complete! Usage: {chunk.usage}")
                break
        
    except Exception as e:
        print(f"❌ Streaming failed: {e}")
    
    # Test 5: Model information
    print("\n📋 Test 5: Model Information")
    print("-" * 30)
    
    try:
        models = await provider.get_models()
        print(f"✅ Available models: {len(models)}")
        
        for model in models:
            print(f"   - {model.name} ({model.provider})")
            print(f"     Context: {model.context_length}, Streaming: {model.supports_streaming}")
            print(f"     Functions: {model.supports_functions}, Vision: {model.supports_vision}")
            print(f"     Cost: ${model.input_cost_per_token}/input, ${model.output_cost_per_token}/output")
        
        # Test specific model info
        model_info = await provider.get_model_info("mock/gpt-4")
        if model_info:
            print(f"   ✅ Found model info for mock/gpt-4")
            print(f"     Capabilities: {model_info.capabilities}")
        
    except Exception as e:
        print(f"❌ Model information failed: {e}")
    
    # Test 6: Token counting and cost estimation
    print("\n📋 Test 6: Token Counting & Cost Estimation")
    print("-" * 30)
    
    try:
        text = "This is a test text for token counting and cost estimation."
        token_count = await provider.count_tokens(text, "mock/gpt-4")
        print(f"✅ Token count for text: {token_count}")
        
        request = LLMRequest(
            messages=[{"role": "user", "content": text}],
            model="mock/gpt-4",
            max_tokens=50
        )
        
        cost = await provider.estimate_cost(request)
        print(f"✅ Estimated cost: ${cost:.6f}")
        
    except Exception as e:
        print(f"❌ Token counting/cost estimation failed: {e}")
    
    # Test 7: Health check
    print("\n📋 Test 7: Health Check")
    print("-" * 30)
    
    try:
        is_healthy = await provider.health_check()
        print(f"✅ Health check: {'Healthy' if is_healthy else 'Unhealthy'}")
        
    except Exception as e:
        print(f"❌ Health check failed: {e}")
    
    # Test 8: Request validation
    print("\n📋 Test 8: Request Validation")
    print("-" * 30)
    
    try:
        # Test invalid temperature
        invalid_request = LLMRequest(
            messages=[{"role": "user", "content": "test"}],
            model="mock/gpt-4",
            temperature=3.0  # Invalid
        )
        
        await provider.generate(invalid_request)
        print("❌ Should have failed with invalid temperature")
        
    except ValueError as e:
        print(f"✅ Correctly caught validation error: {e}")
    
    print(f"\n🎉 All tests completed!")


if __name__ == "__main__":
    asyncio.run(test_litellm_interface()) 