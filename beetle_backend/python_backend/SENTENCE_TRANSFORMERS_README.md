# Sentence Transformers Provider

This document describes the updated Sentence Transformers provider that handles local embedding generation using HuggingFace models.

## Overview

The `SentenceTransformersEmbeddingsProvider` class is a specialized implementation for local embedding generation using Sentence Transformers models. This provides cost-effective, privacy-focused embedding generation without requiring external API calls.

## Key Features

### 🏠 **Local Processing**
- **No API Calls**: All processing happens locally
- **Privacy-First**: No data leaves your system
- **Cost-Free**: No per-token charges or API costs
- **Offline Capable**: Works without internet connection

### ⚡ **Performance Optimized**
- **Async Processing**: Non-blocking embedding generation
- **Batch Processing**: Efficient handling of multiple texts
- **Memory Friendly**: Configurable batch sizes for GPU/CPU optimization
- **Thread Pool**: CPU-intensive operations run in background

### 🛠️ **Easy Integration**
- **Simple Setup**: Minimal configuration required
- **Model Validation**: Automatic model name validation and fallback
- **Error Handling**: Robust error handling and recovery
- **Health Checks**: Built-in health monitoring

## Supported Models

### **General Purpose Models**
- **all-MiniLM-L6-v2**: Fast, 384-dimensional embeddings
- **all-MiniLM-L12-v2**: Balanced performance, 384-dimensional
- **all-mpnet-base-v2**: High quality, 768-dimensional

### **Specialized Models**
- **all-distilroberta-v1**: Distilled RoBERTa model
- **multi-qa-MiniLM-L6-cos-v1**: Optimized for question-answering
- **multi-qa-mpnet-base-dot-v1**: High-quality QA embeddings
- **paraphrase-MiniLM-L6-v2**: Optimized for paraphrase detection
- **paraphrase-mpnet-base-v2**: High-quality paraphrase embeddings

### **Model Specifications**

| Model | Dimensions | Max Tokens | Use Case | Performance |
|-------|------------|------------|----------|-------------|
| all-MiniLM-L6-v2 | 384 | 512 | General purpose | Fast |
| all-MiniLM-L12-v2 | 384 | 512 | General purpose | Balanced |
| all-mpnet-base-v2 | 768 | 512 | High quality | Slower |
| multi-qa-MiniLM-L6-cos-v1 | 384 | 512 | Question answering | Fast |
| paraphrase-MiniLM-L6-v2 | 384 | 512 | Paraphrase detection | Fast |

## Usage

### Basic Usage

```python
from embeddings.providers.sentence_transformers_provider import SentenceTransformersEmbeddingsProvider
from embeddings.base_provider import EmbeddingRequest

# Create provider
provider = SentenceTransformersEmbeddingsProvider()

# Basic embedding request
request = EmbeddingRequest(
    texts=["Hello world", "This is a test sentence"],
    model="all-MiniLM-L6-v2"
)

response = await provider.embed_texts(request)
print(f"Generated {len(response.embeddings)} embeddings")
print(f"Each embedding has {len(response.embeddings[0])} dimensions")
```

### Custom Model Configuration

```python
# Use specific model
provider = SentenceTransformersEmbeddingsProvider(
    model_name="all-mpnet-base-v2",
    max_batch_size=16  # Smaller batches for GPU memory
)

# Generate embeddings
request = EmbeddingRequest(
    texts=["High quality embedding text"],
    model="all-mpnet-base-v2"
)

response = await provider.embed_texts(request)
# 768-dimensional embeddings
```

### Batch Processing

```python
# Process large batches efficiently
texts = [f"Document {i}" for i in range(1000)]

request = EmbeddingRequest(
    texts=texts,
    model="all-MiniLM-L6-v2"
)

response = await provider.embed_texts(request)
print(f"Processed {len(response.embeddings)} documents")
```

## Model Information

### Get Supported Models

```python
supported_models = provider.get_supported_models()
for model in supported_models:
    print(f"- {model}")
```

### Get Model Information

```python
model_info = await provider.get_model_info("all-MiniLM-L6-v2")
if model_info:
    print(f"Model: {model_info['name']}")
    print(f"Dimensions: {model_info['dimensions']}")
    print(f"Max tokens: {model_info['max_tokens']}")
    print(f"Provider: {model_info['provider']}")
    print(f"Pricing: {model_info['pricing']}")  # Always free
```

## Configuration

### Environment Variables

The provider respects these environment variables:

- `DEFAULT_LOCAL_EMBEDDING_MODEL` - Default model to use
- `SENTENCE_TRANSFORMERS_CACHE_DIR` - Model cache directory

### Custom Configuration

```python
provider = SentenceTransformersEmbeddingsProvider(
    model_name="all-mpnet-base-v2",
    max_batch_size=16,      # GPU memory friendly
    max_retries=1,          # Local model, no retries needed
    retry_delay=0           # No delay needed
)
```

## Performance

### Batch Size Optimization

```python
# For CPU processing
provider = SentenceTransformersEmbeddingsProvider(max_batch_size=32)

# For GPU processing (memory limited)
provider = SentenceTransformersEmbeddingsProvider(max_batch_size=8)

# For high-memory GPU
provider = SentenceTransformersEmbeddingsProvider(max_batch_size=64)
```

### Async Processing

The provider uses async processing to avoid blocking:

```python
# Non-blocking embedding generation
response = await provider.embed_texts(request)

# Multiple concurrent requests
tasks = [
    provider.embed_texts(request1),
    provider.embed_texts(request2),
    provider.embed_texts(request3)
]
responses = await asyncio.gather(*tasks)
```

## Error Handling

### Common Errors

1. **Model Not Found**: Use supported model names
2. **Memory Issues**: Reduce batch size
3. **Import Error**: Install sentence-transformers
4. **Model Loading**: Check internet connection for first download

### Error Recovery

```python
try:
    response = await provider.embed_texts(request)
except Exception as e:
    logger.error(f"Embedding generation failed: {e}")
    
    # Retry with smaller batch size
    provider.max_batch_size = 8
    response = await provider.embed_texts(request)
```

## Testing

Run the test script to verify functionality:

```bash
cd beetle_backend/python_backend
python test_sentence_transformers_provider.py
```

This will test:
- Provider initialization
- Supported models
- Model information
- Model validation
- Basic embedding generation
- Batch processing
- Cost estimation
- Health checks
- Different models
- Error handling

## Installation

### Dependencies

```bash
pip install sentence-transformers
pip install torch  # PyTorch backend
```

### Optional Dependencies

```bash
# For GPU acceleration
pip install torch[cu118]  # CUDA 11.8

# For better performance
pip install transformers
pip install accelerate
```

## Best Practices

### 1. **Choose Appropriate Models**
- **Speed**: Use `all-MiniLM-L6-v2` for fast processing
- **Quality**: Use `all-mpnet-base-v2` for high-quality embeddings
- **Specialized**: Use domain-specific models for specialized tasks

### 2. **Optimize Batch Sizes**
- **CPU**: 32-64 batch size
- **GPU**: 8-16 batch size (memory dependent)
- **High Memory GPU**: 32-64 batch size

### 3. **Handle Large Datasets**
```python
# Process in chunks for large datasets
chunk_size = 1000
for i in range(0, len(texts), chunk_size):
    chunk = texts[i:i + chunk_size]
    request = EmbeddingRequest(texts=chunk, model="all-MiniLM-L6-v2")
    response = await provider.embed_texts(request)
    # Process response.embeddings
```

### 4. **Monitor Performance**
```python
import time

start_time = time.time()
response = await provider.embed_texts(request)
end_time = time.time()

print(f"Processed {len(request.texts)} texts in {end_time - start_time:.2f}s")
print(f"Average time per text: {(end_time - start_time) / len(request.texts):.3f}s")
```

## Troubleshooting

### Common Issues

1. **Import Error**: Ensure `sentence-transformers` is installed
2. **Model Download**: First run downloads models (requires internet)
3. **Memory Issues**: Reduce batch size or use smaller models
4. **Slow Performance**: Use GPU acceleration if available

### Debug Mode

Enable debug logging:

```python
import structlog
structlog.configure(processors=[structlog.dev.ConsoleRenderer()])
```

### Health Checks

```python
is_healthy = await provider.health_check()
if not is_healthy:
    print("Sentence Transformers provider is not responding")
```

## Migration from Legacy Provider

The new provider has simplified API:

```python
# Old way
provider = SentenceTransformersProvider()
response = await provider.embed_texts(texts, model)

# New way
provider = SentenceTransformersEmbeddingsProvider(model_name=model)
request = EmbeddingRequest(texts=texts, model=model)
response = await provider.embed_texts(request)
```

## Future Enhancements

- [ ] Add support for more models
- [ ] Implement model caching strategies
- [ ] Add GPU memory optimization
- [ ] Implement model quantization
- [ ] Add performance monitoring
- [ ] Support for custom model loading
- [ ] Multi-language model support
- [ ] Advanced batch processing strategies 