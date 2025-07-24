# RAG Chat Feature Documentation

This document provides an overview of the RAG (Retrieval-Augmented Generation) chat feature implementation and how to use it.

## Overview

The RAG chat feature allows users to ask questions about their codebase and get relevant answers using Gemini LLM with semantic search over the codebase. The system consists of:

1. **Python Backend (FastAPI)**
   - Handles document processing and embedding
   - Implements semantic search using Qdrant
   - Generates responses using Gemini

2. **JavaScript Backend (Express)**
   - Manages chat sessions
   - Proxies requests to Python backend
   - Handles file uploads and processing

## Setup Instructions

### Prerequisites

1. Python 3.8+
2. Node.js 16+
3. Qdrant server (local or cloud)
4. Gemini API key

### Environment Variables

Create a `.env` file in the `beetle_backend` directory with:

```
# Required
GEMINI_API_KEY=your_gemini_api_key
QDRANT_URL=your_qdrant_url
QDRANT_API_KEY=your_qdrant_api_key

# Optional
PYTHON_BACKEND_URL=http://localhost:8000
JS_BACKEND_URL=http://localhost:3000
```

### Installation

1. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Install Node.js dependencies:
   ```bash
   cd beetle_backend
   npm install
   ```

## API Endpoints

### Process Repository

```
POST /api/ai/process-repo
```

Process files for RAG chat.

**Request Body:**
```json
{
  "repository": "repository-name",
  "repository_id": "unique-repo-id",
  "branch": "main",
  "source_type": "github|local",
  "files": [
    {
      "path": "relative/file/path",
      "content": "file content",
      "size": 1234
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "session_id": "unique-session-id",
  "data": {
    "repository": "repository-name",
    "branch": "main",
    "files_processed": 10,
    "files_failed": 0,
    "timestamp": "2023-01-01T00:00:00Z"
  }
}
```

### Chat

```
POST /api/ai/chat
```

Send a message to the RAG chat.

**Request Body:**
```json
{
  "session_id": "existing-session-id",
  "message": "Your question here",
  "repository_id": "unique-repo-id" // Required if no session_id
}
```

**Response:**
```json
{
  "success": true,
  "session_id": "session-id",
  "message": "Assistant's response",
  "sources": [
    {
      "id": "doc-123",
      "score": 0.95,
      "metadata": {
        "file_path": "src/file.py",
        "line_number": 42
      },
      "content": "Relevant code snippet..."
    }
  ]
}
```

### Get Chat Session

```
GET /api/ai/chat/:sessionId
```

Get chat session details.

**Response:**
```json
{
  "success": true,
  "session_id": "session-id",
  "data": {
    "repository_id": "repo-123",
    "branch": "main",
    "created_at": "2023-01-01T00:00:00Z",
    "last_activity": "2023-01-01T01:23:45Z",
    "message_count": 5
  }
}
```

### Get Chat Messages

```
GET /api/ai/chat/:sessionId/messages
```

Get chat messages for a session.

**Response:**
```json
{
  "success": true,
  "session_id": "session-id",
  "messages": [
    {
      "role": "user",
      "content": "Hello",
      "timestamp": "2023-01-01T01:23:45Z"
    },
    {
      "role": "assistant",
      "content": "Hi there! How can I help you today?",
      "timestamp": "2023-01-01T01:23:46Z"
    }
  ]
}
```

## Testing

1. Start the Python backend:
   ```bash
   cd beetle_backend
   uvicorn src.ai.fastapi_server:app --reload
   ```

2. Start the JavaScript backend:
   ```bash
   cd beetle_backend
   npm start
   ```

3. Run the test script (update TEST_REPO_PATH in the script first):
   ```bash
   python test_rag_chat.py
   ```

## Error Handling

- **400 Bad Request**: Invalid input data
- **404 Not Found**: Session not found
- **500 Internal Server Error**: Server-side error (check logs)

## Security Considerations

- All API endpoints require authentication
- Sensitive data (API keys) are stored in environment variables
- File uploads are validated for size and type
- Rate limiting is recommended for production use

## Performance Considerations

- Large codebases may require chunked processing
- Consider caching frequently accessed documents
- Monitor Qdrant performance for large vector collections
