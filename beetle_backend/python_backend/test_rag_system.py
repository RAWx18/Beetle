#!/usr/bin/env python3
"""
Comprehensive test script for the entire RAG system.
Tests all major components: chunking, embeddings, LLM providers, and pipeline.
"""

import sys
import os
import asyncio
import time
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from rag.preprocessing.chunker import TextChunker, get_text_chunker
from embeddings.providers.sentence_transformers_provider import SentenceTransformersEmbeddingsProvider
from llm.providers.litellm_provider import LiteLLMProvider
from llm.base.base_llm import LLMRequest
from embeddings.base_provider import EmbeddingRequest
from models.api.file_models import FileType
from typing import List, Optional, Dict, Any


async def test_chunking_system():
    """Test the chunking system with various content types."""
    
    print("🧪 Testing Chunking System")
    print("=" * 50)
    
    # Create chunker
    chunker = TextChunker(chunk_size=200, chunk_overlap=50, strategy="recursive")
    
    # Test 1: Text content
    print("\n📋 Test 1: Text Content Chunking")
    print("-" * 30)
    
    try:
        sample_text = """
        This is a sample document for testing the chunking system.
        
        It contains multiple paragraphs with different content types.
        
        Here's a Python function example:
        def hello_world():
            print("Hello, World!")
            return "success"
        
        And some JavaScript code:
        function greet(name) {
            console.log(`Hello, ${name}!`);
            return true;
        }
        
        Finally, some regular text content that should be chunked appropriately.
        """
        
        chunks = chunker.chunk_text(
            text=sample_text,
            file_id="test_file_001",
            file_type=FileType.TEXT,
            filename="test_text.txt"
        )
        
        print(f"✅ Generated {len(chunks)} chunks from text")
        
        for i, chunk in enumerate(chunks[:3]):
            print(f"  Chunk {i+1}: {len(chunk.content)} chars")
            print(f"    Preview: {chunk.content[:100]}...")
            print(f"    Metadata: {chunk.metadata.chunk_type}, lines {chunk.metadata.start_line}-{chunk.metadata.end_line}")
            print()
        
        if len(chunks) > 3:
            print(f"  ... and {len(chunks) - 3} more chunks")
            
    except Exception as e:
        print(f"❌ Text chunking failed: {e}")
    
    # Test 2: Code content
    print("\n📋 Test 2: Code Content Chunking")
    print("-" * 30)
    
    try:
        sample_code = """
        import os
        from typing import List, Optional
        
        class DataProcessor:
            def __init__(self, data: List[str]):
                self.data = data
                self.processed = False
            
            def process(self) -> bool:
                try:
                    for item in self.data:
                        if self._validate_item(item):
                            self._transform_item(item)
                    self.processed = True
                    return True
                except Exception as e:
                    print(f"Processing failed: {e}")
                    return False
            
            def _validate_item(self, item: str) -> bool:
                return len(item) > 0
            
            def _transform_item(self, item: str) -> None:
                # Transform the item
                transformed = item.upper()
                print(f"Transformed: {transformed}")
        """
        
        chunks = chunker.chunk_text(
            text=sample_code,
            file_id="test_code_001",
            file_type=FileType.CODE,
            language="python",
            filename="test_code.py"
        )
        
        print(f"✅ Generated {len(chunks)} chunks from code")
        
        for i, chunk in enumerate(chunks[:3]):
            print(f"  Chunk {i+1}: {len(chunk.content)} chars")
            print(f"    Preview: {chunk.content[:100]}...")
            print(f"    Language: {chunk.metadata.language}")
            print()
        
    except Exception as e:
        print(f"❌ Code chunking failed: {e}")
    
    # Test 3: Different strategies
    print("\n📋 Test 3: Different Chunking Strategies")
    print("-" * 30)
    
    try:
        strategies = ["recursive", "sentence", "token"]
        
        for strategy in strategies:
            strategy_chunker = TextChunker(
                chunk_size=200,
                chunk_overlap=50,
                strategy=strategy
            )
            
            chunks = strategy_chunker.chunk_text(
                text="This is a test sentence. It has multiple sentences. Each should be chunked appropriately.",
                file_id=f"test_{strategy}",
                file_type=FileType.TEXT,
                filename=f"test_{strategy}.txt"
            )
            
            print(f"✅ {strategy.upper()} strategy: {len(chunks)} chunks")
        
    except Exception as e:
        print(f"❌ Strategy testing failed: {e}")


async def test_embeddings_system():
    """Test the embeddings system with local models."""
    
    print("\n🧪 Testing Embeddings System")
    print("=" * 50)
    
    # Create embeddings provider
    provider = SentenceTransformersEmbeddingsProvider()
    
    # Test 1: Basic embedding generation
    print("\n📋 Test 1: Basic Embedding Generation")
    print("-" * 30)
    
    try:
        request = EmbeddingRequest(
            texts=["Hello world", "This is a test sentence", "Embedding generation works"],
            model="all-MiniLM-L6-v2"
        )
        
        response = await provider.embed_texts(request)
        print(f"✅ Generated {len(response.embeddings)} embeddings")
        print(f"   Model used: {response.model}")
        print(f"   First embedding dimensions: {len(response.embeddings[0])}")
        print(f"   All embeddings have same dimensions: {all(len(emb) == len(response.embeddings[0]) for emb in response.embeddings)}")
        
    except Exception as e:
        print(f"❌ Basic embedding generation failed: {e}")
    
    # Test 2: Different models
    print("\n📋 Test 2: Different Models")
    print("-" * 30)
    
    try:
        models_to_test = ["all-MiniLM-L6-v2", "all-MiniLM-L12-v2"]
        
        for model_name in models_to_test:
            model_provider = SentenceTransformersEmbeddingsProvider(model_name=model_name)
            
            request = EmbeddingRequest(
                texts=["Test sentence"],
                model=model_name
            )
            
            response = await model_provider.embed_texts(request)
            print(f"✅ {model_name}: {len(response.embeddings[0])} dimensions")
        
    except Exception as e:
        print(f"❌ Different models test failed: {e}")
    
    # Test 3: Batch processing
    print("\n📋 Test 3: Batch Processing")
    print("-" * 30)
    
    try:
        texts = [f"Document {i} for batch processing test" for i in range(50)]
        
        request = EmbeddingRequest(
            texts=texts,
            model="all-MiniLM-L6-v2"
        )
        
        start_time = time.time()
        response = await provider.embed_texts(request)
        end_time = time.time()
        
        print(f"✅ Batch processing completed:")
        print(f"   Input texts: {len(texts)}")
        print(f"   Output embeddings: {len(response.embeddings)}")
        print(f"   Processing time: {end_time - start_time:.2f}s")
        print(f"   Average time per text: {(end_time - start_time) / len(texts):.3f}s")
        
    except Exception as e:
        print(f"❌ Batch processing test failed: {e}")
    
    # Test 4: Model information
    print("\n📋 Test 4: Model Information")
    print("-" * 30)
    
    try:
        model_info = await provider.get_model_info("all-MiniLM-L6-v2")
        if model_info:
            print(f"✅ Model info retrieved:")
            print(f"   Name: {model_info['name']}")
            print(f"   Dimensions: {model_info['dimensions']}")
            print(f"   Max tokens: {model_info['max_tokens']}")
            print(f"   Provider: {model_info['provider']}")
        
    except Exception as e:
        print(f"❌ Model information test failed: {e}")


async def test_llm_system():
    """Test the LLM system with OpenAI provider."""
    
    print("\n🧪 Testing LLM System")
    print("=" * 50)
    
    # Create LLM provider
    provider = OpenAIProvider(api_key="test_key")
    
    # Test 1: Model information
    print("\n📋 Test 1: Model Information")
    print("-" * 30)
    
    try:
        models = await provider.get_models()
        print(f"✅ Available OpenAI models: {len(models)}")
        
        for model in models[:3]:  # Show first 3 models
            print(f"   - {model.name}")
            print(f"     Context: {model.context_length}, Streaming: {model.supports_streaming}")
            print(f"     Functions: {model.supports_functions}, Vision: {model.supports_vision}")
        
        if len(models) > 3:
            print(f"   ... and {len(models) - 3} more models")
        
    except Exception as e:
        print(f"❌ Model information failed: {e}")
    
    # Test 2: Request preparation
    print("\n📋 Test 2: Request Preparation")
    print("-" * 30)
    
    try:
        request = LLMRequest(
            messages=[{"role": "user", "content": "Hello, world!"}],
            model="gpt-4o-mini",
            temperature=0.7,
            max_tokens=100
        )
        
        print(f"✅ Request prepared successfully")
        print(f"   Model: {request.model}")
        print(f"   Temperature: {request.temperature}")
        print(f"   Max tokens: {request.max_tokens}")
        print(f"   Messages: {len(request.messages)}")
        
    except Exception as e:
        print(f"❌ Request preparation failed: {e}")
    
    # Test 3: Tool calling preparation
    print("\n📋 Test 3: Tool Calling Preparation")
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
    
    # Test 4: Model validation
    print("\n📋 Test 4: Model Validation")
    print("-" * 30)
    
    try:
        # Test OpenAI model
        openai_model = provider._ensure_openai_model("openai/gpt-4o-mini")
        print(f"✅ OpenAI model validation: {openai_model}")
        
        # Test non-OpenAI model (should default to gpt-4o-mini)
        non_openai_model = provider._ensure_openai_model("anthropic/claude-3")
        print(f"✅ Non-OpenAI model handling: {non_openai_model}")
        
    except Exception as e:
        print(f"❌ Model validation failed: {e}")


async def test_rag_pipeline():
    """Test the complete RAG pipeline integration."""
    
    print("\n🧪 Testing RAG Pipeline Integration")
    print("=" * 50)
    
    # Test 1: End-to-end workflow simulation
    print("\n📋 Test 1: End-to-End Workflow Simulation")
    print("-" * 30)
    
    try:
        # Step 1: Document chunking
        print("   Step 1: Document Chunking")
        chunker = TextChunker(chunk_size=200, chunk_overlap=50)
        
        document_text = """
        Artificial Intelligence (AI) is a branch of computer science that aims to create intelligent machines.
        These machines can perform tasks that typically require human intelligence, such as visual perception,
        speech recognition, decision-making, and language translation.
        
        Machine Learning is a subset of AI that enables computers to learn and improve from experience
        without being explicitly programmed. It uses algorithms to identify patterns in data and make
        predictions or decisions based on those patterns.
        
        Deep Learning is a subset of machine learning that uses neural networks with multiple layers
        to model and understand complex patterns in data. It has been particularly successful in
        areas like image recognition, natural language processing, and speech recognition.
        """
        
        chunks = chunker.chunk_text(
            text=document_text,
            file_id="ai_document_001",
            file_type=FileType.TEXT,
            filename="ai_document.txt"
        )
        
        print(f"   ✅ Generated {len(chunks)} chunks")
        
        # Step 2: Generate embeddings
        print("   Step 2: Generate Embeddings")
        embeddings_provider = SentenceTransformersEmbeddingsProvider()
        
        chunk_texts = [chunk.content for chunk in chunks]
        embedding_request = EmbeddingRequest(
            texts=chunk_texts,
            model="all-MiniLM-L6-v2"
        )
        
        embedding_response = await embeddings_provider.embed_texts(embedding_request)
        print(f"   ✅ Generated {len(embedding_response.embeddings)} embeddings")
        
        # Step 3: Simulate retrieval (find most similar chunks)
        print("   Step 3: Simulate Retrieval")
        query = "What is machine learning?"
        
        query_embedding_request = EmbeddingRequest(
            texts=[query],
            model="all-MiniLM-L6-v2"
        )
        
        query_embedding_response = await embeddings_provider.embed_texts(query_embedding_request)
        query_embedding = query_embedding_response.embeddings[0]
        
        # Simple cosine similarity (for demonstration)
        import numpy as np
        
        similarities = []
        for chunk_embedding in embedding_response.embeddings:
            similarity = np.dot(query_embedding, chunk_embedding) / (
                np.linalg.norm(query_embedding) * np.linalg.norm(chunk_embedding)
            )
            similarities.append(similarity)
        
        # Get top 2 most similar chunks
        top_indices = np.argsort(similarities)[-2:][::-1]
        retrieved_chunks = [chunks[i] for i in top_indices]
        
        print(f"   ✅ Retrieved {len(retrieved_chunks)} most relevant chunks")
        for i, chunk in enumerate(retrieved_chunks):
            print(f"     Chunk {i+1}: {chunk.content[:100]}...")
        
        # Step 4: Prepare LLM request
        print("   Step 4: Prepare LLM Request")
        context = "\n\n".join([chunk.content for chunk in retrieved_chunks])
        
        llm_request = LLMRequest(
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant. Answer questions based on the provided context."
                },
                {
                    "role": "user",
                    "content": f"Context:\n{context}\n\nQuestion: {query}"
                }
            ],
            model="gpt-4o-mini",
            temperature=0.7,
            max_tokens=200
        )
        
        print(f"   ✅ LLM request prepared with context and question")
        print(f"     Context length: {len(context)} characters")
        print(f"     Question: {query}")
        
    except Exception as e:
        print(f"❌ RAG pipeline test failed: {e}")
    
    # Test 2: Performance metrics
    print("\n📋 Test 2: Performance Metrics")
    print("-" * 30)
    
    try:
        # Test chunking performance
        start_time = time.time()
        chunks = chunker.chunk_text(
            text=document_text,
            file_id="perf_test_001",
            file_type=FileType.TEXT
        )
        chunking_time = time.time() - start_time
        
        # Test embedding performance
        start_time = time.time()
        embedding_request = EmbeddingRequest(
            texts=[chunk.content for chunk in chunks],
            model="all-MiniLM-L6-v2"
        )
        embedding_response = await embeddings_provider.embed_texts(embedding_request)
        embedding_time = time.time() - start_time
        
        print(f"✅ Performance metrics:")
        print(f"   Chunking: {chunking_time:.3f}s for {len(chunks)} chunks")
        print(f"   Embedding: {embedding_time:.3f}s for {len(chunks)} chunks")
        print(f"   Total processing: {chunking_time + embedding_time:.3f}s")
        
    except Exception as e:
        print(f"❌ Performance metrics test failed: {e}")


async def test_system_integration():
    """Test system integration and error handling."""
    
    print("\n🧪 Testing System Integration")
    print("=" * 50)
    
    # Test 1: Component compatibility
    print("\n📋 Test 1: Component Compatibility")
    print("-" * 30)
    
    try:
        # Test that all components can work together
        chunker = TextChunker()
        embeddings_provider = SentenceTransformersEmbeddingsProvider()
        llm_provider = OpenAIProvider(api_key="test_key")
        
        print("✅ All components initialized successfully")
        print(f"   Chunker: {type(chunker).__name__}")
        print(f"   Embeddings Provider: {type(embeddings_provider).__name__}")
        print(f"   LLM Provider: {type(llm_provider).__name__}")
        
    except Exception as e:
        print(f"❌ Component compatibility test failed: {e}")
    
    # Test 2: Error handling
    print("\n📋 Test 2: Error Handling")
    print("-" * 30)
    
    try:
        # Test chunker with empty text
        chunker = TextChunker()
        chunks = chunker.chunk_text(
            text="",
            file_id="empty_test",
            file_type=FileType.TEXT
        )
        print(f"✅ Empty text handling: {len(chunks)} chunks")
        
        # Test embeddings with empty request
        embeddings_provider = SentenceTransformersEmbeddingsProvider()
        empty_request = EmbeddingRequest(texts=[], model="all-MiniLM-L6-v2")
        response = await embeddings_provider.embed_texts(empty_request)
        print(f"✅ Empty embedding request: {len(response.embeddings)} embeddings")
        
    except Exception as e:
        print(f"❌ Error handling test failed: {e}")
    
    # Test 3: Health checks
    print("\n📋 Test 3: Health Checks")
    print("-" * 30)
    
    try:
        embeddings_provider = SentenceTransformersEmbeddingsProvider()
        is_healthy = await embeddings_provider.health_check()
        print(f"✅ Embeddings provider health: {'Healthy' if is_healthy else 'Unhealthy'}")
        
    except Exception as e:
        print(f"❌ Health check test failed: {e}")


async def main():
    """Run all RAG system tests."""
    
    print("🚀 Comprehensive RAG System Test Suite")
    print("=" * 60)
    print("This test suite verifies all major components of the RAG system:")
    print("- Chunking system (Chonkie-based)")
    print("- Embeddings system (Sentence Transformers)")
    print("- LLM system (OpenAI with LiteLLM)")
    print("- Complete RAG pipeline integration")
    print("=" * 60)
    
    start_time = time.time()
    
    # Run all test suites
    await test_chunking_system()
    await test_embeddings_system()
    await test_llm_system()
    await test_rag_pipeline()
    await test_system_integration()
    
    end_time = time.time()
    
    print(f"\n🎉 All RAG system tests completed!")
    print(f"⏱️  Total test time: {end_time - start_time:.2f} seconds")
    print("\n📝 Notes:")
    print("- Some tests may fail without proper API keys or dependencies")
    print("- Install required packages: pip install sentence-transformers litellm")
    print("- Set OPENAI_API_KEY for full LLM testing")
    print("- These tests verify the system architecture and integration")


if __name__ == "__main__":
    asyncio.run(main()) 