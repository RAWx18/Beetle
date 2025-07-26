#!/usr/bin/env python3
"""
Test script for the updated OpenAI provider using LiteLLM.
Run this to verify the OpenAI provider works correctly.
"""

import sys
import os
import asyncio
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from llm.providers.litellm_provider import LiteLLMProvider
from llm.base.base_llm import LLMRequest, LLMResponse, LLMStreamChunk
from typing import List, Optional, Dict, Any, AsyncGenerator


async def test_litellm_provider():
    """Test the OpenAI provider with various features."""
    
    print("🧪 Testing OpenAI Provider with LiteLLM")
    print("=" * 50)
    
    # Create OpenAI provider
    provider = OpenAIProvider(api_key="test_key")
    
    # Test 1: Model information
    print("\n📋 Test 1: Model Information")
    print("-" * 30)
    
    try:
        models = await provider.get_models()
        print(f"✅ Available OpenAI models: {len(models)}")
        
        for model in models:
            print(f"   - {model.name}")
            print(f"     Context: {model.context_length}, Streaming: {model.supports_streaming}")
            print(f"     Functions: {model.supports_functions}, Vision: {model.supports_vision}")
            print(f"     Cost: ${model.input_cost_per_token}/input, ${model.output_cost_per_token}/output")
            print(f"     Capabilities: {model.capabilities}")
        
        # Test specific model info
        model_info = await provider.get_model_info("gpt-4o-mini")
        if model_info:
            print(f"   ✅ Found model info for gpt-4o-mini")
            print(f"     Max output tokens: {model_info.max_output_tokens}")
        
    except Exception as e:
        print(f"❌ Model information failed: {e}")
    
    # Test 2: Model validation
    print("\n📋 Test 2: Model Validation")
    print("-" * 30)
    
    try:
        # Test OpenAI model
        openai_model = provider._ensure_openai_model("openai/gpt-4o-mini")
        print(f"✅ OpenAI model validation: {openai_model}")
        
        # Test non-OpenAI model (should default to gpt-4o-mini)
        non_openai_model = provider._ensure_openai_model("anthropic/claude-3")
        print(f"✅ Non-OpenAI model handling: {non_openai_model}")
        
        # Test direct model name
        direct_model = provider._ensure_openai_model("gpt-3.5-turbo")
        print(f"✅ Direct model name: {direct_model}")
        
    except Exception as e:
        print(f"❌ Model validation failed: {e}")
    
    # Test 3: Basic generation (mock)
    print("\n📋 Test 3: Basic Generation")
    print("-" * 30)
    
    try:
        request = LLMRequest(
            messages=[{"role": "user", "content": "Hello, world!"}],
            model="gpt-4o-mini",
            temperature=0.7,
            max_tokens=100
        )
        
        # Note: This will fail without a real API key, but we can test the request preparation
        print(f"✅ Request prepared successfully")
        print(f"   Model: {request.model}")
        print(f"   Temperature: {request.temperature}")
        print(f"   Max tokens: {request.max_tokens}")
        
    except Exception as e:
        print(f"❌ Basic generation failed: {e}")
    
    # Test 4: Tool calling preparation
    print("\n📋 Test 4: Tool Calling Preparation")
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
                            "location": {"type": "string"},
                            "unit": {"type": "string", "enum": ["celsius", "fahrenheit"]}
                        },
                        "required": ["location"]
                    }
                }
            }
        ]
        
        request = LLMRequest(
            messages=[{"role": "user", "content": "What's the weather in Paris?"}],
            model="gpt-4o",
            tools=tools,
            tool_choice="auto"
        )
        
        print(f"✅ Tool calling request prepared")
        print(f"   Tools: {len(request.tools)}")
        print(f"   Tool choice: {request.tool_choice}")
        
    except Exception as e:
        print(f"❌ Tool calling preparation failed: {e}")
    
    # Test 5: Structured output preparation
    print("\n📋 Test 5: Structured Output Preparation")
    print("-" * 30)
    
    try:
        request = LLMRequest(
            messages=[{"role": "user", "content": "Return user info as JSON"}],
            model="gpt-4o",
            response_format={"type": "json_object"}
        )
        
        print(f"✅ Structured output request prepared")
        print(f"   Response format: {request.response_format}")
        
    except Exception as e:
        print(f"❌ Structured output preparation failed: {e}")
    
    # Test 6: Streaming preparation
    print("\n📋 Test 6: Streaming Preparation")
    print("-" * 30)
    
    try:
        request = LLMRequest(
            messages=[{"role": "user", "content": "Tell me a story"}],
            model="gpt-4o-mini",
            stream=True
        )
        
        print(f"✅ Streaming request prepared")
        print(f"   Stream: {request.stream}")
        
    except Exception as e:
        print(f"❌ Streaming preparation failed: {e}")
    
    # Test 7: Request validation
    print("\n📋 Test 7: Request Validation")
    print("-" * 30)
    
    try:
        # Test invalid temperature
        invalid_request = LLMRequest(
            messages=[{"role": "user", "content": "test"}],
            model="gpt-4o-mini",
            temperature=3.0  # Invalid
        )
        
        provider._validate_request(invalid_request)
        print("❌ Should have failed with invalid temperature")
        
    except ValueError as e:
        print(f"✅ Correctly caught validation error: {e}")
    
    # Test 8: Provider registry
    print("\n📋 Test 8: Provider Registry")
    print("-" * 30)
    
    try:
        from llm.base.base_llm import provider_registry
        
        # Check if OpenAI provider is registered
        providers = provider_registry.list_providers()
        print(f"✅ Available providers: {providers}")
        
        if "litellm" in providers:
            print("✅ LiteLLM provider is registered")
        
        if "default" in providers:
            print("✅ Default provider is registered")
        
        # Test provider creation
        litellm_provider = provider_registry.create_provider("litellm", api_key="test_key")
        if litellm_provider:
            print("✅ LiteLLM provider created successfully")
        
    except Exception as e:
        print(f"❌ Provider registry test failed: {e}")
    
    # Test 9: LiteLLM configuration
    print("\n📋 Test 9: LiteLLM Configuration")
    print("-" * 30)
    
    try:
        import litellm
        
        print(f"✅ LiteLLM verbose: {litellm.set_verbose}")
        print(f"✅ LiteLLM drop params: {litellm.drop_params}")
        print(f"✅ LiteLLM telemetry: {litellm.telemetry}")
        
    except Exception as e:
        print(f"❌ LiteLLM configuration test failed: {e}")
    
    print(f"\n🎉 All LiteLLM provider tests completed!")
    print("\n📝 Note: Actual API calls require a valid API key.")
    print("   These tests verify the provider setup and request preparation.")


if __name__ == "__main__":
    asyncio.run(test_litellm_provider()) 