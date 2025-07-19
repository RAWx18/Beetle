# Beetle Multi-Agent AI System

## Overview

The Beetle AI system uses a sophisticated multi-agent architecture to provide intelligent document processing, embedding, retrieval, and conversational AI capabilities. The system is built with Python agents that work together through a coordinated pipeline.

## Architecture

### Core Components

1. **Pipeline Controller** (`pipeline_controller.py`)
   - Orchestrates the entire multi-agent workflow
   - Manages data flow between agents
   - Handles error recovery and logging

2. **Agents**
   - **GitHub Fetcher**: Retrieves data from GitHub repositories
   - **Web Scraper**: Extracts content from web pages
   - **Format Agent**: Normalizes and formats documents
   - **Embedding Agent**: Computes and stores vector embeddings
   - **Retrieval Agent**: Searches vector database for relevant documents
   - **Prompt Rewriter**: Enhances user queries for better responses
   - **Answering Agent**: Generates conversational responses using LLMs

3. **Vector Database (Qdrant)**
   - Stores document embeddings for semantic search
   - Enables fast similarity-based retrieval
   - Supports filtering by repository, branch, and document type

## Data Flow

### Import Pipeline
```
Raw Documents → Normalization → Embedding → Vector Database
```

### Chat Pipeline
```
User Query → Retrieval → Prompt Rewriting → Answering → Response
```

## API Endpoints

### Node.js Bridge (`routes/ai.cjs`)

- `POST /api/ai/import` - Import files and embed them
- `POST /api/ai/import-github` - Import GitHub data (PRs, issues, etc.)
- `POST /api/ai/chat` - Get AI responses using multi-agent system
- `POST /api/ai/search` - Search for relevant documents
- `GET /api/ai/status` - Get system status

### Python Bridge (`pipeline_bridge.py`)

The Python bridge connects Node.js requests to the multi-agent pipeline:

```bash
python3 pipeline_bridge.py <endpoint> <json_data>
```

## Configuration

### Environment Variables

```bash
# GitHub Integration
GITHUB_TOKEN=your_github_token

# Vector Database
QDRANT_URL=localhost
QDRANT_PORT=6333

# AI Models
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key

# Model Configuration
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
CHAT_MODEL=gemini-2.0-flash
```

## Usage Examples

### Frontend Integration

```typescript
import { aiService } from '@/lib/ai-service';

// Chat with AI
const response = await aiService.chat({
  message: "What pull requests are open?",
  repository_id: "user/repo",
  branch: "main"
});

// Import GitHub data
const importResult = await aiService.importGitHub({
  repository_id: "user/repo",
  branch: "main",
  data_types: ["pull_requests", "issues"],
  github_token: "token"
});

// Import files
const fileResult = await aiService.importFiles(
  [file1, file2],
  "user/repo",
  "main"
);
```

### Backend Direct Usage

```python
from controllers.pipeline_controller import PipelineController, PipelineConfig

# Initialize pipeline
config = PipelineConfig(...)
pipeline = PipelineController(config)

# Import documents
raw_docs = [...]  # Raw documents
norm_result = await pipeline.run_normalization_pipeline(raw_docs)
embed_result = await pipeline.run_embedding_pipeline(norm_result.data)

# Chat with AI
search_query = SearchQuery(query="What is this about?", ...)
search_result = await pipeline.run_search_pipeline(search_query)
chat_request = ChatRequest(message="Tell me more", context_results=search_result.data)
chat_result = await pipeline.run_chat_pipeline(chat_request)
```

## Agent Details

### Embedding Agent
- Uses Sentence Transformers for text embedding
- Chunks large documents for better processing
- Stores embeddings in Qdrant vector database
- Supports multiple embedding models

### Retrieval Agent
- Performs semantic search using vector similarity
- Supports hybrid search (vector + keyword)
- Filters results by repository, branch, and document type
- Configurable similarity thresholds

### Answering Agent
- Uses Google Gemini for response generation
- Incorporates retrieved context into responses
- Calculates confidence scores
- Handles error cases gracefully

## Development

### Adding New Agents

1. Create agent class inheriting from `BaseAgent`
2. Implement `process()` method
3. Add configuration class
4. Register in `PipelineController`
5. Update pipeline stages as needed

### Testing

```bash
# Test individual agents
python3 -m pytest tests/test_agents/

# Test full pipeline
python3 -m pytest tests/test_pipeline/

# Test API endpoints
npm test -- --grep "AI"
```

## Performance

- **Embedding**: ~1000 documents/minute
- **Retrieval**: <100ms for typical queries
- **Chat Response**: 2-5 seconds depending on complexity
- **Vector Search**: Sub-second response times

## Monitoring

The system includes comprehensive logging:
- Agent execution times
- Error tracking and recovery
- Performance metrics
- User interaction analytics

## Security

- All API endpoints require authentication
- GitHub tokens are encrypted in storage
- Vector database access is restricted
- Input validation and sanitization

## Troubleshooting

### Common Issues

1. **Qdrant Connection Failed**
   - Check if Qdrant is running: `docker ps | grep qdrant`
   - Verify connection settings in environment

2. **Embedding Model Loading**
   - Ensure sufficient memory (2GB+ recommended)
   - Check internet connection for model download

3. **GitHub API Rate Limits**
   - Use authenticated requests
   - Implement rate limiting in GitHub fetcher

4. **Python Bridge Errors**
   - Check Python dependencies: `pip install -r requirements.txt`
   - Verify Python path and permissions

### Debug Mode

Enable debug logging:
```bash
export LOG_LEVEL=DEBUG
export AI_DEBUG=true
```

## Future Enhancements

- [ ] Support for more document types (PDF, DOCX)
- [ ] Real-time collaboration features
- [ ] Advanced query understanding
- [ ] Multi-language support
- [ ] Custom embedding models
- [ ] Automated knowledge base updates 