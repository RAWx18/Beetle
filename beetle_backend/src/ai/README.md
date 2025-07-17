# Beetle AI Pipeline

A comprehensive multi-agent pipeline for intelligent document processing, search, and chat functionality in the Beetle backend.

## Overview

The AI pipeline consists of seven specialized agents that work together to provide intelligent document processing, search, and conversational AI capabilities:

1. **Ingestion Agents** - Fetch raw content from various sources
2. **Format Agent** - Normalize and clean documents
3. **Embedding Agent** - Compute vector embeddings and store in Qdrant
4. **Retrieval Agent** - Search for relevant documents using hybrid search
5. **Prompt Rewriter** - Restructure prompts with context for chat models
6. **Answering Agent** - Generate responses using Google Gemini API

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   GitHub        │    │   Web Scraper   │    │   Text Input    │
│   Fetcher       │    │                 │    │                 │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │     Format Agent          │
                    │   (Normalization)         │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │   Embedding Agent         │
                    │   (Vector Storage)        │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │   Retrieval Agent         │
                    │   (Search)                │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │   Prompt Rewriter         │
                    │   (Context Enhancement)   │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │   Answering Agent         │
                    │   (Gemini API)            │
                    └───────────────────────────┘
```

## Agents

### 1. GitHub Fetcher Agent
- **Purpose**: Fetches content from GitHub repositories
- **Features**:
  - Supports multiple file types (code, docs, configs)
  - Recursive directory traversal
  - File size limits and filtering
  - Branch-specific content extraction
- **Input**: Repository info, branch, paths
- **Output**: Raw documents with metadata

### 2. Web Scraper Agent
- **Purpose**: Scrapes content from websites
- **Features**:
  - Playwright-based scraping
  - Content extraction with Trafilatura
  - Link following and depth control
  - Domain restriction
- **Input**: URLs to scrape
- **Output**: Raw documents from web pages

### 3. Format Agent
- **Purpose**: Normalizes and cleans raw documents
- **Features**:
  - HTML tag removal
  - Whitespace normalization
  - Language detection
  - Tag extraction
  - Summary generation
- **Input**: Raw documents
- **Output**: Normalized documents

### 4. Embedding Agent
- **Purpose**: Computes and stores vector embeddings
- **Features**:
  - Sentence Transformers integration
  - Qdrant vector database storage
  - Content chunking
  - Batch processing
- **Input**: Normalized documents
- **Output**: Embedded documents with vectors

### 5. Retrieval Agent
- **Purpose**: Searches for relevant documents
- **Features**:
  - Hybrid search (vector + keyword)
  - Repository and branch filtering
  - Similarity scoring
  - Result ranking
- **Input**: Search query
- **Output**: Ranked search results

### 6. Prompt Rewriter Agent
- **Purpose**: Enhances prompts with context
- **Features**:
  - Context formatting
  - Citation instructions
  - Style adaptation
  - Length management
- **Input**: Chat request with context
- **Output**: Enhanced prompt

### 7. Answering Agent
- **Purpose**: Generates AI responses
- **Features**:
  - Google Gemini API integration
  - Citation extraction
  - Confidence scoring
  - Response validation
- **Input**: Enhanced prompt
- **Output**: Chat response with sources

## API Endpoints

### Health Check
```
GET /api/ai/health
```

### Content Ingestion
```
POST /api/ai/ingest
{
  "github": {
    "repository": "owner/repo",
    "branch": "main",
    "paths": ["src/", "docs/"]
  },
  "web": {
    "urls": ["https://example.com/docs"]
  },
  "repository_id": "repo123",
  "branch": "main"
}
```

### Full Pipeline
```
POST /api/ai/pipeline/full
{
  "github": {
    "repository": "owner/repo",
    "branch": "main"
  },
  "repository_id": "repo123"
}
```

### Search
```
POST /api/ai/search
{
  "query": "How to implement authentication?",
  "repository_id": "repo123",
  "branch": "main",
  "max_results": 10,
  "similarity_threshold": 0.7
}
```

### Chat
```
POST /api/ai/chat
{
  "query": "What are the main features of this project?",
  "repository_id": "repo123",
  "branch": "main",
  "conversation_history": [],
  "max_tokens": 1000
}
```

### Agent Testing
```
POST /api/ai/test/github_fetcher
{
  "repository": "owner/repo",
  "branch": "main",
  "paths": ["README.md"]
}
```

### Pipeline Status
```
GET /api/ai/status
```

## Configuration

### Environment Variables

The AI pipeline uses comprehensive environment configuration. Use `npm run setup` for interactive setup, or configure manually:

```bash
# Required Variables
GEMINI_API_KEY=your_google_gemini_api_key

# Qdrant Vector Database
QDRANT_URL=localhost
QDRANT_PORT=6333

# AI Pipeline Settings
AI_MAX_DOCUMENTS=1000
AI_BATCH_SIZE=32
AI_EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
AI_CHAT_MODEL=gemini-2.0-flash

# Web Scraper Settings
AI_MAX_PAGES=10
AI_MAX_DEPTH=2
AI_SCRAPER_TIMEOUT=30000

# Format Agent Settings
AI_MIN_CONTENT_LENGTH=50
AI_MAX_CONTENT_LENGTH=100000
AI_REMOVE_HTML=true
AI_DETECT_LANGUAGE=true
AI_GENERATE_SUMMARY=true

# Embedding Settings
AI_COLLECTION_NAME=documents

# Retrieval Settings
AI_USE_HYBRID_SEARCH=true
AI_KEYWORD_WEIGHT=0.3
AI_VECTOR_WEIGHT=0.7

# Prompt Rewriter Settings
AI_MAX_CONTEXT_LENGTH=4000
AI_MAX_SOURCES=5
AI_INCLUDE_CITATIONS=true
AI_INCLUDE_CONFIDENCE=true

# Answering Settings
AI_MAX_TOKENS=1000
AI_TEMPERATURE=0.7
AI_TOP_P=0.9
AI_TOP_K=40
```

For a complete list of all environment variables, see `env.example`.

### Agent Configuration

Each agent can be configured through the `PipelineConfig`:

```javascript
const config = new PipelineConfig({
      // Note: GitHub token is not needed as the AI pipeline uses the user's GitHub access token from their OAuth session
  web_scraper_config: new WebScraperConfig({
    max_pages: 10,
    max_depth: 2,
    timeout: 30000
  }),
  format_config: new FormatAgentConfig({
    min_content_length: 50,
    max_content_length: 100000,
    detect_language: true
  }),
  embedding_config: new EmbeddingAgentConfig({
    model_name: "sentence-transformers/all-MiniLM-L6-v2",
    qdrant_url: "localhost",
    qdrant_port: 6333
  }),
  retrieval_config: new RetrievalAgentConfig({
    use_hybrid_search: true,
    keyword_weight: 0.3,
    vector_weight: 0.7
  }),
  prompt_rewriter_config: new PromptRewriterConfig({
    max_context_length: 4000,
    include_citations: true
  }),
      answering_config: new AnsweringAgentConfig({
      api_key: process.env.GEMINI_API_KEY,
      model_name: "gemini-2.0-flash",
      max_tokens: 1000
    })
    
    // Note: GitHub token is not needed as the AI pipeline uses the user's GitHub access token from their OAuth session
});
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
# Interactive setup (recommended)
npm run setup

# Or manually copy from env.example
cp env.example .env
# Then edit .env with your actual values
```

3. Install Playwright browsers:
```bash
npx playwright install chromium
```

4. Set up Qdrant (Docker):
```bash
docker run -p 6333:6333 qdrant/qdrant
```

5. Start the server:
```bash
npm start
```

6. Test the AI pipeline:
```bash
npm run test:ai
```

## Usage Examples

### Basic Ingestion
```javascript
const response = await fetch('/api/ai/ingest', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    github: {
      repository: 'facebook/react',
      branch: 'main',
      paths: ['README.md', 'docs/']
    },
    repository_id: 'react-repo'
  })
});
```

### Search and Chat
```javascript
// Search for relevant documents
const searchResponse = await fetch('/api/ai/search', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    query: 'How does React handle state updates?',
    repository_id: 'react-repo',
    max_results: 5
  })
});

// Chat with context
const chatResponse = await fetch('/api/ai/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    query: 'Explain the virtual DOM concept',
    repository_id: 'react-repo',
    conversation_history: []
  })
});
```

## Error Handling

The pipeline includes comprehensive error handling:

- **Retry Logic**: Each agent implements retry mechanisms
- **Graceful Degradation**: Failed agents don't stop the entire pipeline
- **Error Logging**: Detailed error messages and stack traces
- **Status Reporting**: Clear success/failure indicators

## Performance Optimization

- **Batch Processing**: Agents process documents in batches
- **Parallel Processing**: Multiple agents can run concurrently
- **Caching**: Embeddings and search results are cached
- **Resource Management**: Proper cleanup of browser instances and connections

## Monitoring

- **Health Checks**: `/api/ai/health` endpoint
- **Agent Status**: `/api/ai/status` endpoint
- **Processing Metrics**: Timing and success rates
- **Error Tracking**: Detailed error logs

## Security

- **Authentication**: All endpoints require valid JWT tokens
- **Rate Limiting**: Built-in rate limiting for API endpoints
- **Input Validation**: Comprehensive input validation
- **Safe Scraping**: User agent spoofing and respectful crawling

## Contributing

1. Follow the existing code structure
2. Add comprehensive tests for new agents
3. Update documentation for new features
4. Ensure proper error handling
5. Add logging for debugging

## Troubleshooting

### Common Issues

1. **Qdrant Connection Failed**
   - Ensure Qdrant is running on the specified port
   - Check firewall settings

2. **GitHub API Rate Limits**
   - Use a GitHub token with appropriate permissions
   - Implement rate limiting in the fetcher

3. **Gemini API Errors**
   - Verify API key is valid
   - Check quota limits

4. **Playwright Issues**
   - Install required browsers: `npx playwright install`
   - Ensure proper system dependencies

### Debug Mode

Enable debug logging by setting:
```bash
DEBUG=agent:*
```

## License

MIT License - see LICENSE file for details. 