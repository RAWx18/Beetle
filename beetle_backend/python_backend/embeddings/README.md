# Multi-Provider Embedding System

This module provides a unified interface for multiple embedding providers, allowing you to easily switch between different embedding services and models.

## Supported Providers

### 1. OpenAI Embeddings (via LiteLLM)
- **Provider Name**: `openai`
- **Models**: 
  - `text-embedding-3-small` (1536 dimensions)
  - `text-embedding-3-large` (3072 dimensions)
  - `text-embedding-ada-002` (1536 dimensions)
- **Cost**: Pay-per-use API
- **Requirements**: OpenAI API key, LiteLLM package
- **Features**: Uses LiteLLM's unified interface for better compatibility and token counting

### 2. Sentence Transformers (HuggingFace)
- **Provider Name**: `sentence_transformers` (aliases: `huggingface`, `hf`)
- **Models**:
  - `sentence-transformers/all-MiniLM-L6-v2` (384 dimensions)
  - `sentence-transformers/all-mpnet-base-v2` (768 dimensions)
  - `sentence-transformers/all-MiniLM-L12-v2` (384 dimensions)
  - `microsoft/codebert-base` (768 dimensions, code-specific)
  - `bigcode/starcoder` (768 dimensions, code-specific)
- **Cost**: Free (local processing)
- **Requirements**: `sentence-transformers` package

### 3. Jina AI Embeddings
- **Provider Name**: `jina`
- **Models**:
  - `jina-embeddings-v2-base-en` (768 dimensions, English)
  - `jina-embeddings-v2-base-zh` (768 dimensions, Chinese)
  - `jina-embeddings-v2-base-de` (768 dimensions, German)
  - `jina-embeddings-v2-base-es` (768 dimensions, Spanish)
  - `jina-embeddings-v2-base-code` (768 dimensions, code-specific)
- **Cost**: Pay-per-use API
- **Requirements**: Jina AI API key

## Quick Start

### Basic Usage

```python
from embeddings import embed_batch, embed_single

# Generate embeddings for multiple texts
texts = ["Hello world", "How are you?", "I love Python"]
embeddings = await embed_batch(texts)

# Generate embedding for a single text
embedding = await embed_single("Hello world")
```

### Using Specific Providers

```python
# Use OpenAI
embeddings = await embed_batch(texts, provider_name="openai")

# Use Sentence Transformers
embeddings = await embed_batch(texts, provider_name="sentence_transformers")

# Use Jina AI
embeddings = await embed_batch(texts, provider_name="jina")
```

### Using Specific Models

```python
# Use specific OpenAI model
embeddings = await embed_batch(texts, model="text-embedding-3-large")

# Use specific Sentence Transformers model
embeddings = await embed_batch(texts, model="sentence-transformers/all-mpnet-base-v2")

# Use code-specific model
embeddings = await embed_batch(code_texts, model="microsoft/codebert-base")
```

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# OpenAI
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_BASE_URL=https://api.openai.com/v1  # Optional

# Jina AI
JINA_API_KEY=your_jina_api_key_here
JINA_BASE_URL=https://api.jina.ai/v1  # Optional

# Default provider
DEFAULT_EMBEDDING_PROVIDER=openai  # or sentence_transformers, jina

# Sentence Transformers settings
SENTENCE_TRANSFORMERS_DEVICE=cpu  # or cuda
SENTENCE_TRANSFORMERS_BATCH_SIZE=32
```

### Provider-Specific Configuration

```python
from embeddings import get_embeddings_provider

# OpenAI with custom settings
openai_provider = get_embeddings_provider(
    "openai",
    max_batch_size=50,
    max_retries=5
)

# Sentence Transformers with GPU
st_provider = get_embeddings_provider(
    "sentence_transformers",
    device="cuda",
    batch_size=64
)

# Jina with custom base URL
jina_provider = get_embeddings_provider(
    "jina",
    base_url="https://custom-jina-endpoint.com/v1"
)
```

## Advanced Usage

### Getting Provider Information

```python
from embeddings import get_available_providers, get_provider_for_model

# Get all available providers
providers = get_available_providers()
for name, info in providers.items():
    print(f"{name}: {info['supported_models']}")

# Find which provider supports a specific model
provider = get_provider_for_model("text-embedding-3-small")
print(f"Provider for text-embedding-3-small: {provider}")
```

### Health Checks

```python
from embeddings import get_embeddings_provider

provider = get_embeddings_provider("openai")
is_healthy = await provider.health_check()
print(f"Provider healthy: {is_healthy}")
```

### Cost Estimation

```python
from embeddings import get_embeddings_provider

provider = get_embeddings_provider("openai")
cost = await provider.estimate_cost(texts, model="text-embedding-3-small")
print(f"Estimated cost: ${cost:.6f}")
```

### Similarity Calculations

```python
from embeddings import get_embeddings_provider

provider = get_embeddings_provider("sentence_transformers")

# Calculate similarity between two embeddings
similarity = provider.calculate_similarity(embedding1, embedding2)

# Find most similar embeddings
similar_indices = provider.find_most_similar(
    query_embedding, 
    candidate_embeddings, 
    top_k=5
)
```

## Integration with RAG System

The embedding system integrates seamlessly with the RAG pipeline:

```python
from core.orchestrator import RAGOrchestrator

# Initialize orchestrator (uses default embedding provider)
orchestrator = RAGOrchestrator()

# Process files with specific embedding provider
# The system will automatically use the configured provider
await orchestrator.process_file(file_metadata, file_content)
```

## Provider Selection Strategy

The system automatically selects the best provider based on:

1. **Model Availability**: If you specify a model, it finds the provider that supports it
2. **Default Provider**: Falls back to the configured default provider
3. **Cost Optimization**: Can be configured to prefer free providers (Sentence Transformers)
4. **Performance**: Can be configured to prefer local providers for latency-sensitive applications

## Error Handling

The system provides robust error handling:

```python
try:
    embeddings = await embed_batch(texts, provider_name="openai")
except ValueError as e:
    print(f"Provider error: {e}")
except Exception as e:
    print(f"Unexpected error: {e}")
```

## Performance Considerations

### Batch Processing
- All providers support batch processing for efficiency
- OpenAI: Recommended batch size of 100
- Sentence Transformers: Configurable batch size (default 32)
- Jina: Recommended batch size of 100

### Caching
- Provider instances are cached for reuse
- Model information is cached to avoid repeated API calls

### Memory Usage
- Sentence Transformers loads models into memory
- Consider using smaller models on memory-constrained systems
- GPU usage can be configured for Sentence Transformers

## Adding New Providers

To add a new provider:

1. Create a new provider class inheriting from `BaseEmbeddingsProvider`
2. Implement the required abstract methods
3. Register the provider in the registry

```python
from embeddings.providers.base_provider import BaseEmbeddingsProvider

class MyCustomProvider(BaseEmbeddingsProvider):
    async def embed_texts(self, request):
        # Implementation here
        pass
    
    async def get_model_info(self, model_name):
        # Implementation here
        pass
    
    async def health_check(self):
        # Implementation here
        pass

# Register the provider
from embeddings.providers import get_embedding_registry
registry = get_embedding_registry()
registry.register_provider("my_custom", MyCustomProvider)
```

## Troubleshooting

### Common Issues

1. **ImportError for sentence-transformers**
   ```bash
   pip install sentence-transformers
   ```

2. **OpenAI API key not set**
   ```bash
   export OPENAI_API_KEY=your_key_here
   ```

3. **Jina API key not set**
   ```bash
   export JINA_API_KEY=your_key_here
   ```

4. **CUDA not available for Sentence Transformers**
   - Install PyTorch with CUDA support
   - Or use `device="cpu"` in configuration

### Debug Mode

Enable debug logging to see detailed provider information:

```python
import structlog
structlog.configure(processors=[structlog.dev.ConsoleRenderer()])
```

## Examples

See `example_embedding_usage.py` for comprehensive examples of all features. 