#!/usr/bin/env python3
"""
Test script for the updated Sentence Transformers provider.
Run this to verify the local embedding provider works correctly.
"""

import sys
import os
import asyncio
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from embeddings.providers.sentence_transformers_provider import SentenceTransformersEmbeddingsProvider
from embeddings.base_provider import EmbeddingRequest, EmbeddingResponse
from typing import List, Optional, Dict, Any


async def test_sentence_transformers_provider():
    """Test the Sentence Transformers provider with various features."""
    
    print("🧪 Testing Sentence Transformers Provider")
    print("=" * 50)
    
    # Create provider
    provider = SentenceTransformersEmbeddingsProvider()
    
    # Test 1: Provider initialization
    print("\n📋 Test 1: Provider Initialization")
    print("-" * 30)
    
    try:
        print(f"✅ Provider name: {provider.provider_name}")
        print(f"✅ Model name: {provider.model_name}")
        print(f"✅ Max batch size: {provider.max_batch_size}")
        print(f"✅ Model loaded: {provider.model is not None}")
        
    except Exception as e:
        print(f"❌ Provider initialization failed: {e}")
    
    # Test 2: Supported models
    print("\n📋 Test 2: Supported Models")
    print("-" * 30)
    
    try:
        supported_models = provider.get_supported_models()
        print(f"✅ Supported models: {len(supported_models)}")
        
        for model in supported_models:
            print(f"   - {model}")
        
    except Exception as e:
        print(f"❌ Supported models test failed: {e}")
    
    # Test 3: Model information
    print("\n📋 Test 3: Model Information")
    print("-" * 30)
    
    try:
        model_info = await provider.get_model_info("all-MiniLM-L6-v2")
        if model_info:
            print(f"✅ Model info retrieved:")
            print(f"   Name: {model_info['name']}")
            print(f"   Dimensions: {model_info['dimensions']}")
            print(f"   Max tokens: {model_info['max_tokens']}")
            print(f"   Provider: {model_info['provider']}")
            print(f"   Pricing: {model_info['pricing']}")
        
    except Exception as e:
        print(f"❌ Model information test failed: {e}")
    
    # Test 4: Model validation
    print("\n📋 Test 4: Model Validation")
    print("-" * 30)
    
    try:
        # Test supported model
        valid_model = provider._ensure_local_model("all-MiniLM-L6-v2")
        print(f"✅ Valid model validation: {valid_model}")
        
        # Test unsupported model (should fallback)
        invalid_model = provider._ensure_local_model("unsupported-model")
        print(f"✅ Invalid model handling: {invalid_model}")
        
    except Exception as e:
        print(f"❌ Model validation test failed: {e}")
    
    # Test 5: Basic embedding generation
    print("\n📋 Test 5: Basic Embedding Generation")
    print("-" * 30)
    
    try:
        request = EmbeddingRequest(
            texts=["Hello world", "This is a test sentence"],
            model="all-MiniLM-L6-v2"
        )
        
        response = await provider.embed_texts(request)
        print(f"✅ Embeddings generated: {len(response.embeddings)}")
        print(f"   Model used: {response.model}")
        print(f"   First embedding dimensions: {len(response.embeddings[0])}")
        print(f"   Usage: {response.usage}")
        
    except Exception as e:
        print(f"❌ Basic embedding generation failed: {e}")
    
    # Test 6: Batch processing
    print("\n📋 Test 6: Batch Processing")
    print("-" * 30)
    
    try:
        # Create multiple texts to test batching
        texts = [f"Test sentence {i}" for i in range(50)]
        request = EmbeddingRequest(
            texts=texts,
            model="all-MiniLM-L6-v2"
        )
        
        response = await provider.embed_texts(request)
        print(f"✅ Batch processing completed:")
        print(f"   Input texts: {len(texts)}")
        print(f"   Output embeddings: {len(response.embeddings)}")
        print(f"   All embeddings have same dimensions: {all(len(emb) == len(response.embeddings[0]) for emb in response.embeddings)}")
        
    except Exception as e:
        print(f"❌ Batch processing test failed: {e}")
    
    # Test 7: Cost estimation
    print("\n📋 Test 7: Cost Estimation")
    print("-" * 30)
    
    try:
        texts = ["Test text 1", "Test text 2", "Test text 3"]
        cost = await provider.estimate_cost(texts, "all-MiniLM-L6-v2")
        print(f"✅ Cost estimation: ${cost}")
        print(f"   Expected: $0.0 (local models are free)")
        
    except Exception as e:
        print(f"❌ Cost estimation test failed: {e}")
    
    # Test 8: Health check
    print("\n📋 Test 8: Health Check")
    print("-" * 30)
    
    try:
        is_healthy = await provider.health_check()
        print(f"✅ Health check: {'Healthy' if is_healthy else 'Unhealthy'}")
        
    except Exception as e:
        print(f"❌ Health check failed: {e}")
    
    # Test 9: Different models
    print("\n📋 Test 9: Different Models")
    print("-" * 30)
    
    try:
        models_to_test = ["all-MiniLM-L6-v2", "all-MiniLM-L12-v2", "all-mpnet-base-v2"]
        
        for model_name in models_to_test:
            try:
                # Create new provider for each model
                model_provider = SentenceTransformersEmbeddingsProvider(model_name=model_name)
                
                request = EmbeddingRequest(
                    texts=["Test sentence"],
                    model=model_name
                )
                
                response = await model_provider.embed_texts(request)
                print(f"✅ {model_name}: {len(response.embeddings[0])} dimensions")
                
            except Exception as e:
                print(f"❌ {model_name}: Failed - {e}")
        
    except Exception as e:
        print(f"❌ Different models test failed: {e}")
    
    # Test 10: Error handling
    print("\n📋 Test 10: Error Handling")
    print("-" * 30)
    
    try:
        # Test empty request
        empty_request = EmbeddingRequest(texts=[], model="all-MiniLM-L6-v2")
        response = await provider.embed_texts(empty_request)
        print(f"✅ Empty request handled: {len(response.embeddings)} embeddings")
        
        # Test None request
        none_request = EmbeddingRequest(texts=None, model="all-MiniLM-L6-v2")
        response = await provider.embed_texts(none_request)
        print(f"✅ None request handled: {len(response.embeddings)} embeddings")
        
    except Exception as e:
        print(f"❌ Error handling test failed: {e}")
    
    print(f"\n🎉 All Sentence Transformers provider tests completed!")
    print("\n📝 Note: These tests verify local embedding generation.")
    print("   Make sure sentence-transformers is installed: pip install sentence-transformers")


if __name__ == "__main__":
    asyncio.run(test_sentence_transformers_provider()) 