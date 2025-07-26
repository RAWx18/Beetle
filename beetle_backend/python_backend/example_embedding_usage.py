"""
Example usage of the multi-provider embedding system.
Demonstrates how to use different embedding providers and models.
"""

import asyncio
import os
from typing import List

# Import the embedding functions
from embeddings import (
    embed_texts,
    embed_single,
    embed_batch,
    get_available_providers,
    get_provider_for_model,
    get_embeddings_provider
)


async def example_basic_usage():
    """Example of basic embedding usage with different providers."""
    print("=== Basic Embedding Usage ===\n")
    
    # Sample texts
    texts = [
        "Hello, how are you today?",
        "The weather is beautiful outside.",
        "I love programming in Python."
    ]
    
    # 1. Use default provider (OpenAI)
    print("1. Using default provider (OpenAI):")
    try:
        embeddings = await embed_batch(texts)
        print(f"   Generated {len(embeddings)} embeddings")
        print(f"   First embedding dimension: {len(embeddings[0])}")
    except Exception as e:
        print(f"   Error: {e}")
    
    print()
    
    # 2. Use specific provider
    print("2. Using Sentence Transformers provider:")
    try:
        embeddings = await embed_batch(texts, provider_name="sentence_transformers")
        print(f"   Generated {len(embeddings)} embeddings")
        print(f"   First embedding dimension: {len(embeddings[0])}")
    except Exception as e:
        print(f"   Error: {e}")
    
    print()
    
    # 3. Use specific model
    print("3. Using specific model (text-embedding-3-small):")
    try:
        embeddings = await embed_batch(texts, model="text-embedding-3-small")
        print(f"   Generated {len(embeddings)} embeddings")
        print(f"   First embedding dimension: {len(embeddings[0])}")
    except Exception as e:
        print(f"   Error: {e}")


async def example_single_embedding():
    """Example of single text embedding."""
    print("\n=== Single Text Embedding ===\n")
    
    text = "This is a single text for embedding."
    
    # Use different providers
    providers = ["openai", "sentence_transformers", "jina"]
    
    for provider in providers:
        print(f"Using {provider} provider:")
        try:
            embedding = await embed_single(text, provider_name=provider)
            print(f"   Embedding dimension: {len(embedding)}")
            print(f"   First 5 values: {embedding[:5]}")
        except Exception as e:
            print(f"   Error: {e}")
        print()


async def example_provider_info():
    """Example of getting provider information."""
    print("\n=== Provider Information ===\n")
    
    # Get available providers
    providers = get_available_providers()
    
    print("Available providers:")
    for name, info in providers.items():
        print(f"\n{name}:")
        print(f"  Class: {info.get('class', 'N/A')}")
        print(f"  Provider Name: {info.get('provider_name', 'N/A')}")
        
        models = info.get('supported_models', [])
        print(f"  Supported Models ({len(models)}):")
        for model in models[:3]:  # Show first 3 models
            print(f"    - {model}")
        if len(models) > 3:
            print(f"    ... and {len(models) - 3} more")
    
    print()
    
    # Find provider for specific model
    test_models = [
        "text-embedding-3-small",
        "sentence-transformers/all-MiniLM-L6-v2",
        "jina-embeddings-v2-base-en"
    ]
    
    print("Provider for specific models:")
    for model in test_models:
        provider = get_provider_for_model(model)
        print(f"  {model} -> {provider or 'Not found'}")


async def example_direct_provider_usage():
    """Example of using providers directly."""
    print("\n=== Direct Provider Usage ===\n")
    
    # Get provider instance
    try:
        provider = get_embeddings_provider("sentence_transformers")
        print(f"Using provider: {provider.get_provider_name()}")
        
        # Get supported models
        models = provider.get_supported_models()
        print(f"Supported models: {len(models)}")
        
        # Health check
        is_healthy = await provider.health_check()
        print(f"Provider healthy: {is_healthy}")
        
    except Exception as e:
        print(f"Error: {e}")


async def example_cost_estimation():
    """Example of cost estimation."""
    print("\n=== Cost Estimation ===\n")
    
    texts = [
        "This is a short text.",
        "This is a longer text with more words to estimate cost for embedding generation.",
        "Another text for cost estimation."
    ]
    
    providers = ["openai", "sentence_transformers", "jina"]
    
    for provider in providers:
        print(f"Cost estimation for {provider}:")
        try:
            provider_instance = get_embeddings_provider(provider)
            cost = await provider_instance.estimate_cost(texts)
            if cost is not None:
                print(f"  Estimated cost: ${cost:.6f}")
            else:
                print(f"  Cost estimation not available")
        except Exception as e:
            print(f"  Error: {e}")
        print()


async def main():
    """Main function to run all examples."""
    print("Multi-Provider Embedding System Examples")
    print("=" * 50)
    
    # Check if required environment variables are set
    if not os.getenv("OPENAI_API_KEY"):
        print("Warning: OPENAI_API_KEY not set. OpenAI examples may fail.")
    
    if not os.getenv("JINA_API_KEY"):
        print("Warning: JINA_API_KEY not set. Jina examples may fail.")
    
    print()
    
    # Run examples
    await example_basic_usage()
    await example_single_embedding()
    await example_provider_info()
    await example_direct_provider_usage()
    await example_cost_estimation()
    
    print("\nExamples completed!")


if __name__ == "__main__":
    # Run the examples
    asyncio.run(main()) 