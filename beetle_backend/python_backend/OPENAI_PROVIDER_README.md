# OpenAI Provider with LiteLLM Integration

This document describes the updated OpenAI provider that uses LiteLLM's unified interface for focused OpenAI model support.

## Overview

The `OpenAIProvider` class is a specialized implementation that handles only OpenAI GPT models through LiteLLM's unified interface. This provides focused compatibility, better performance, and simplified maintenance while removing backward compatibility code.

## Key Features

### 🎯 **OpenAI-Focused Design**
- **Exclusive OpenAI Support**: Handles only OpenAI GPT models
- **Model Validation**: Automatically validates and corrects model names
- **Fallback Handling**: Gracefully handles non-OpenAI model requests
- **Simplified Architecture**: Removed backward compatibility code

### 🚀 **LiteLLM Integration**
- **Unified Interface**: Uses LiteLLM's `acompletion` for all requests
- **Optimized Configuration**: LiteLLM configured for OpenAI-only usage
- **Better Performance**: Leverages LiteLLM's optimizations
- **Enhanced Error Handling**: Improved error messages and recovery

### 🛠️ **Advanced Features**
- **Tool Calling**: Full support for OpenAI's function calling
- **Structured Outputs**: JSON and other structured response formats
- **Streaming**: Real-time response streaming with tool call support
- **Vision Support**: Multi-modal models with image input
- **Cost Tracking**: Built-in cost estimation and usage tracking

## Supported Models

### **GPT-4 Models**
- **gpt-4o-mini**: Fast, cost-effective model (128K context)
- **gpt-4o**: High-performance model (128K context)
- **gpt-4-turbo**: Balanced performance model (128K context)

### **GPT-3.5 Models**
- **gpt-3.5-turbo**: Standard model (16K context)
- **gpt-3.5-turbo-16k**: Extended context model (16K context)

### **Model Capabilities**

| Model | Context | Streaming | Functions | Vision | Cost/1K Input | Cost/1K Output |
|-------|---------|-----------|-----------|--------|---------------|----------------|
| gpt-4o-mini | 128K | ✅ | ✅ | ✅ | $0.00015 | $0.0006 |
| gpt-4o | 128K | ✅ | ✅ | ✅ | $0.0025 | $0.01 |
| gpt-4-turbo | 128K | ✅ | ✅ | ✅ | $0.01 | $0.03 |
| gpt-3.5-turbo | 16K | ✅ | ✅ | ❌ | $0.0015 | $0.002 |
| gpt-3.5-turbo-16k | 16K | ✅ | ✅ | ❌ | $0.003 | $0.004 |

## Usage

### Basic Usage

```python
from llm.providers.openai_provider import OpenAIProvider
from llm.base.base_llm import LLMRequest

# Create provider
provider = OpenAIProvider(api_key="your-openai-api-key")

# Basic request
request = LLMRequest(
    messages=[{"role": "user", "content": "Hello, world!"}],
    model="gpt-4o-mini",
    temperature=0.7,
    max_tokens=100
)

response = await provider.generate(request)
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
    model="gpt-4o",
    tools=tools,
    tool_choice="auto"
)

response = await provider.generate(request)
if response.tool_calls:
    for tool_call in response.tool_calls:
        print(f"Tool: {tool_call['function']['name']}")
        print(f"Arguments: {tool_call['function']['arguments']}")
```

### Structured Outputs

```python
request = LLMRequest(
    messages=[{"role": "user", "content": "Return user info as JSON"}],
    model="gpt-4o",
    response_format={"type": "json_object"}
)

response = await provider.generate(request)
# response.content will be valid JSON
```

### Streaming

```python
request = LLMRequest(
    messages=[{"role": "user", "content": "Tell me a story"}],
    model="gpt-4o-mini",
    stream=True
)

async for chunk in provider.stream(request):
    print(chunk.content, end="", flush=True)
    if chunk.is_complete:
        print(f"\nUsage: {chunk.usage}")
        break
```

### Vision Support

```python
# For models with vision support (gpt-4o, gpt-4o-mini, gpt-4-turbo)
messages = [
    {
        "role": "user",
        "content": [
            {"type": "text", "text": "What's in this image?"},
            {"type": "image_url", "image_url": {"url": "data:image/jpeg;base64,..."}}
        ]
    }
]

request = LLMRequest(
    messages=messages,
    model="gpt-4o",
    max_tokens=300
)

response = await provider.generate(request)
print(response.content)
```

## Model Information

### Get Available Models

```python
models = await provider.get_models()
for model in models:
    print(f"Model: {model.name}")
    print(f"  Context Length: {model.context_length}")
    print(f"  Supports Streaming: {model.supports_streaming}")
    print(f"  Supports Functions: {model.supports_functions}")
    print(f"  Supports Vision: {model.supports_vision}")
    print(f"  Input Cost: ${model.input_cost_per_token}/token")
    print(f"  Output Cost: ${model.output_cost_per_token}/token")
    print(f"  Capabilities: {model.capabilities}")
```

### Get Specific Model Info

```python
model_info = await provider.get_model_info("gpt-4o-mini")
if model_info:
    print(f"Max Output Tokens: {model_info.max_output_tokens}")
    print(f"Capabilities: {model_info.capabilities}")
```

## Model Validation

The provider automatically validates and corrects model names:

```python
# These all work and are automatically handled:
provider._ensure_openai_model("gpt-4o-mini")           # Returns: "gpt-4o-mini"
provider._ensure_openai_model("openai/gpt-4o-mini")    # Returns: "gpt-4o-mini"
provider._ensure_openai_model("anthropic/claude-3")    # Returns: "gpt-4o-mini" (with warning)
provider._ensure_openai_model("unknown-model")         # Returns: "gpt-4o-mini" (with warning)
```

## Configuration

### LiteLLM Configuration

The provider configures LiteLLM for optimal OpenAI usage:

```python
# These settings are automatically applied:
litellm.set_verbose = False      # Disable verbose logging
litellm.drop_params = True       # Drop unsupported parameters
litellm.telemetry = False        # Disable telemetry
```

### Environment Variables

The provider respects these environment variables:

- `OPENAI_API_KEY` - OpenAI API key
- `OPENAI_BASE_URL` - Custom OpenAI API base URL (for Azure, etc.)

### Custom Configuration

```python
# Custom base URL (for Azure OpenAI)
provider = OpenAIProvider(
    api_key="your-key",
    base_url="https://your-resource.openai.azure.com/openai/deployments/your-deployment"
)

# With custom timeout
request = LLMRequest(
    messages=[{"role": "user", "content": "Hello"}],
    model="gpt-4o-mini",
    timeout=120.0  # 2 minutes
)
```

## Provider Registry

The OpenAI provider is automatically registered:

```python
from llm.base.base_llm import provider_registry

# Check available providers
providers = provider_registry.list_providers()
print(providers)  # ['openai', 'default']

# Create provider through registry
provider = provider_registry.create_provider("openai", api_key="your-key")
```

## Error Handling

### Common Errors

1. **Invalid API Key**: Check your OpenAI API key
2. **Rate Limits**: Implement exponential backoff
3. **Model Not Found**: Use supported model names
4. **Context Length Exceeded**: Reduce input or use larger model

### Error Recovery

```python
try:
    response = await provider.generate(request)
except Exception as e:
    logger.error(f"OpenAI request failed: {e}")
    
    # Retry with fallback model
    request.model = "gpt-3.5-turbo"
    response = await provider.generate(request)
```

## Testing

Run the test script to verify functionality:

```bash
cd beetle_backend/python_backend
python test_openai_provider.py
```

This will test:
- Model information retrieval
- Model validation
- Request preparation
- Tool calling setup
- Structured output setup
- Streaming setup
- Request validation
- Provider registry
- LiteLLM configuration

## Performance

### Caching

Model information is cached for 1 hour:

```python
# First call fetches from API
models = await provider.get_models()

# Subsequent calls use cache
models = await provider.get_models()  # Uses cached data
```

### Optimizations

- **LiteLLM Integration**: Leverages LiteLLM's optimizations
- **Model Validation**: Fast local validation
- **Request Preparation**: Efficient parameter handling
- **Streaming**: Optimized streaming implementation

## Best Practices

1. **Use Appropriate Models**: Choose models based on your needs
   - `gpt-4o-mini` for cost-sensitive applications
   - `gpt-4o` for high-quality responses
   - `gpt-3.5-turbo` for simple tasks

2. **Handle Rate Limits**: Implement exponential backoff
3. **Monitor Costs**: Use cost estimation features
4. **Validate Inputs**: Always validate request parameters
5. **Use Streaming**: For long responses, prefer streaming
6. **Cache Model Info**: Reuse model information when possible

## Migration from Legacy Provider

The new provider is not backward compatible. Key changes:

```python
# Old way (no longer supported)
response = await provider.generate(messages, model, temperature)

# New way
request = LLMRequest(messages=messages, model=model, temperature=temperature)
response = await provider.generate(request)
```

## Troubleshooting

### Common Issues

1. **Import Error**: Ensure `litellm` is installed
2. **API Key Issues**: Verify OpenAI API key is valid
3. **Model Not Found**: Use supported model names
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
    print("OpenAI provider is not responding")
```

## Future Enhancements

- [ ] Add support for more OpenAI models
- [ ] Implement advanced caching strategies
- [ ] Add model fine-tuning support
- [ ] Implement A/B testing for models
- [ ] Add performance monitoring
- [ ] Support for custom embeddings
- [ ] Multi-modal input processing
- [ ] Advanced prompt engineering tools 