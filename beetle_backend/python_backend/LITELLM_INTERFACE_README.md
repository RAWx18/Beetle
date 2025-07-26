# LiteLLM-Based LLM Interface

This document describes the new LiteLLM-based LLM interface that provides a unified abstraction layer for all LLM providers in the Beetle RAG system.

## Overview

The new `BaseLLM` interface leverages LiteLLM to provide a standardized way to interact with multiple LLM providers (OpenAI, Anthropic, Google, etc.) through a single, consistent API. This enables easy provider switching, cost optimization, and feature parity across different models.

## Key Features

### 🔄 **Multi-Provider Support**
- **OpenAI**: GPT-4, GPT-3.5-turbo, and variants
- **Anthropic**: Claude-3, Claude-2, Claude Instant
- **Google**: Gemini Pro, Gemini Flash
- **Mistral**: Mixtral, Mistral-7B
- **Custom**: Any provider supported by LiteLLM

### 🛠️ **Advanced Features**
- **Tool Calling**: Function calling with structured parameters
- **Structured Outputs**: JSON and other structured response formats
- **Streaming**: Real-time response streaming
- **Cost Estimation**: Built-in cost calculation using LiteLLM pricing
- **Token Counting**: Accurate token counting for any model
- **Vision Support**: Multi-modal models with image input

### 📊 **Enhanced Models**
- **Rich Metadata**: Detailed model information and capabilities
- **Pricing Data**: Real-time cost per token information
- **Capability Detection**: Automatic feature support detection
- **Context Length**: Model-specific context window information

## Usage

### Basic Usage

```python
from llm.base.base_llm import LLMRequest, LLMResponse

# Create a request
request = LLMRequest(
    messages=[{"role": "user", "content": "Hello, world!"}],
    model="openai/gpt-4",
    temperature=0.7,
    max_tokens=100
)

# Generate response
response = await llm_provider.generate(request)
print(response.content)
```

### Tool Calling

```python
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
    model="anthropic/claude-3-sonnet",
    tools=tools,
    tool_choice="auto"
)

response = await llm_provider.generate(request)
if response.tool_calls:
    for tool_call in response.tool_calls:
        print(f"Tool: {tool_call['function']['name']}")
        print(f"Arguments: {tool_call['function']['arguments']}")
```

### Structured Outputs

```python
request = LLMRequest(
    messages=[{"role": "user", "content": "Return user info as JSON"}],
    model="openai/gpt-4",
    response_format={"type": "json_object"}
)

response = await llm_provider.generate(request)
# response.content will be valid JSON
```

### Streaming

```python
request = LLMRequest(
    messages=[{"role": "user", "content": "Tell me a story"}],
    model="openai/gpt-4",
    stream=True
)

async for chunk in llm_provider.stream(request):
    print(chunk.content, end="", flush=True)
    if chunk.is_complete:
        print(f"\nUsage: {chunk.usage}")
        break
```

### Cost Estimation

```python
request = LLMRequest(
    messages=[{"role": "user", "content": "Explain quantum computing"}],
    model="openai/gpt-4",
    max_tokens=500
)

# Estimate cost before making request
estimated_cost = await llm_provider.estimate_cost(request)
print(f"Estimated cost: ${estimated_cost:.6f}")

# Make the actual request
response = await llm_provider.generate(request)
actual_cost = response.usage.get("total_cost", 0)
print(f"Actual cost: ${actual_cost:.6f}")
```

## Model Information

### Get Available Models

```python
models = await llm_provider.get_models()
for model in models:
    print(f"Model: {model.name}")
    print(f"  Provider: {model.provider}")
    print(f"  Context Length: {model.context_length}")
    print(f"  Supports Streaming: {model.supports_streaming}")
    print(f"  Supports Functions: {model.supports_functions}")
    print(f"  Supports Vision: {model.supports_vision}")
    print(f"  Input Cost: ${model.input_cost_per_token}/token")
    print(f"  Output Cost: ${model.output_cost_per_token}/token")
```

### Get Specific Model Info

```python
model_info = await llm_provider.get_model_info("openai/gpt-4")
if model_info:
    print(f"Capabilities: {model_info.capabilities}")
    print(f"Max Output Tokens: {model_info.max_output_tokens}")
```

## Request Models

### LLMRequest

```python
class LLMRequest(BaseModel):
    messages: List[Dict[str, str]]           # Conversation messages
    model: str                               # Model identifier (provider/model)
    temperature: float = 0.7                 # Generation temperature
    max_tokens: Optional[int] = None         # Max tokens to generate
    stream: bool = False                     # Enable streaming
    response_format: Optional[Dict] = None   # Structured output format
    tools: Optional[List[Dict]] = None       # Function/tool definitions
    tool_choice: Optional[str] = None        # Tool choice specification
    stop: Optional[List[str]] = None         # Stop sequences
    presence_penalty: float = 0.0            # Presence penalty
    frequency_penalty: float = 0.0           # Frequency penalty
    top_p: float = 1.0                      # Top-p sampling
    n: int = 1                              # Number of completions
    logit_bias: Optional[Dict] = None        # Logit bias
    user: Optional[str] = None              # User identifier
    timeout: Optional[float] = 60.0         # Request timeout
    api_base: Optional[str] = None          # Custom API base URL
    api_version: Optional[str] = None       # API version
```

### LLMResponse

```python
class LLMResponse(BaseModel):
    content: str                             # Generated content
    model: str                              # Model used
    usage: Optional[Dict[str, int]] = None  # Token usage information
    finish_reason: Optional[str] = None     # Completion reason
    tool_calls: Optional[List[Dict]] = None # Tool calls if applicable
    response_format: Optional[Dict] = None  # Structured response format
    metadata: Optional[Dict] = None         # Additional metadata
    created_at: datetime                    # Response timestamp
```

### LLMStreamChunk

```python
class LLMStreamChunk(BaseModel):
    content: str                             # Content chunk
    is_complete: bool = False               # Whether this is the final chunk
    finish_reason: Optional[str] = None     # Completion reason
    usage: Optional[Dict[str, int]] = None  # Token usage information
    tool_calls: Optional[List[Dict]] = None # Tool calls in chunk
    metadata: Optional[Dict] = None         # Additional metadata
```

## Provider Registry

The system includes a provider registry for easy provider management:

```python
from llm.base.base_llm import provider_registry, BaseLLM

# Register a custom provider
class CustomProvider(BaseLLM):
    # Implementation...
    pass

provider_registry.register("custom", CustomProvider)

# Create provider instance
provider = provider_registry.create_provider(
    "custom", 
    api_key="your_key",
    base_url="https://api.custom.com"
)

# List available providers
providers = provider_registry.list_providers()
print(f"Available providers: {providers}")
```

## Configuration

### Environment Variables

The interface respects these environment variables:

- `OPENAI_API_KEY` - OpenAI API key
- `ANTHROPIC_API_KEY` - Anthropic API key
- `GOOGLE_API_KEY` - Google API key
- `LITELLM_MODEL_LIST` - Path to model list configuration
- `LITELLM_CACHE` - Enable/disable caching

### Model Configuration

Create a `models.json` file for custom model configurations:

```json
{
  "models": [
    {
      "model_name": "openai/gpt-4",
      "litellm_params": {
        "model": "gpt-4",
        "api_key": "your-openai-key"
      }
    },
    {
      "model_name": "anthropic/claude-3",
      "litellm_params": {
        "model": "claude-3-sonnet-20240229",
        "api_key": "your-anthropic-key"
      }
    }
  ]
}
```

## Testing

Run the test script to verify functionality:

```bash
cd beetle_backend/python_backend
python test_litellm_interface.py
```

This will test all features including:
- Basic generation
- Tool calling
- Structured outputs
- Streaming
- Model information
- Token counting
- Cost estimation
- Health checks
- Request validation

## Performance

### Caching

LiteLLM provides built-in caching for improved performance:

```python
# Enable caching
import os
os.environ["LITELLM_CACHE"] = "redis"
os.environ["REDIS_URL"] = "redis://localhost:6379"
```

### Rate Limiting

Built-in rate limiting for API calls:

```python
# Configure rate limits
import litellm
litellm.set_verbose = True
litellm.max_parallel_requests = 10
```

### Fallbacks

Automatic fallback to alternative models:

```python
request = LLMRequest(
    messages=[{"role": "user", "content": "Hello"}],
    model="openai/gpt-4,openai/gpt-3.5-turbo,anthropic/claude-3"
)
```

## Best Practices

1. **Use Model-Specific Features**: Check model capabilities before using features
2. **Implement Retries**: Use exponential backoff for failed requests
3. **Monitor Costs**: Use cost estimation to budget API usage
4. **Cache Responses**: Cache frequently requested content
5. **Validate Inputs**: Always validate request parameters
6. **Handle Errors**: Implement proper error handling for API failures
7. **Use Streaming**: For long responses, prefer streaming for better UX
8. **Optimize Prompts**: Use clear, concise prompts for better results

## Troubleshooting

### Common Issues

1. **Import Error**: Ensure `litellm` is installed
2. **API Key Issues**: Verify API keys are set correctly
3. **Model Not Found**: Check model name format (provider/model)
4. **Rate Limits**: Implement proper rate limiting
5. **Timeout Errors**: Increase timeout for complex requests

### Debug Mode

Enable debug logging:

```python
import litellm
litellm.set_verbose = True
```

### Health Checks

```python
is_healthy = await provider.health_check()
if not is_healthy:
    print("Provider is not responding")
```

## Migration from Legacy Interface

The new interface is backward compatible with minor changes:

```python
# Old way
response = await provider.generate(messages, model, temperature)

# New way
request = LLMRequest(messages=messages, model=model, temperature=temperature)
response = await provider.generate(request)
```

## Future Enhancements

- [ ] Add support for more providers
- [ ] Implement advanced caching strategies
- [ ] Add model fine-tuning support
- [ ] Implement A/B testing for models
- [ ] Add performance monitoring
- [ ] Support for custom embeddings
- [ ] Multi-modal input processing
- [ ] Advanced prompt engineering tools 