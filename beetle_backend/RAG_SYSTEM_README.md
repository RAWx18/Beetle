# Beetle RAG System - Complete Implementation

A comprehensive Retrieval-Augmented Generation (RAG) system with agentic workflows, built for coding-related queries and document processing.

## 🚀 Features

### Core RAG Capabilities
- **Intelligent Document Processing**: Multi-format document ingestion with semantic chunking
- **Advanced Vector Search**: Qdrant-based vector database with multiple embedding models
- **Multi-LLM Support**: OpenAI, Anthropic, and local model integration
- **Context-Aware Generation**: Intelligent prompt engineering and context building
- **Real-time Query Processing**: Fast retrieval and generation pipeline

### Agentic Workflows
- **Modular Agent Architecture**: Specialized agents for different tasks
- **Workflow Orchestration**: Configurable workflows for complex operations
- **Agent Collaboration**: Inter-agent communication and task delegation
- **Dynamic Task Scheduling**: Priority-based task execution
- **Error Handling & Recovery**: Robust error management and retry mechanisms

### Advanced Features
- **Performance Monitoring**: Real-time metrics and health monitoring
- **Caching System**: Redis-based caching for improved performance
- **Evaluation Framework**: Comprehensive evaluation and benchmarking
- **Security & Authentication**: Built-in security features
- **Scalable Architecture**: Designed for high-throughput applications

## 📁 Project Structure

```
beetle_backend/src/ai/
├── __init__.py
├── fastapi_server.py          # FastAPI server implementation
├── pipeline_bridge.py         # Main pipeline orchestration
│
├── models/                    # Data models
│   ├── __init__.py
│   ├── document.py           # Document models
│   ├── rag_models.py         # RAG-specific models
│   ├── workflow_models.py    # Workflow orchestration models
│   └── agent_models.py       # Agent communication models
│
├── controllers/               # Business logic controllers
│   ├── __init__.py
│   ├── pipeline_controller.py # Main pipeline controller
│   ├── rag_controller.py     # RAG operations controller
│   ├── workflow_controller.py # Workflow management
│   └── agent_orchestrator.py # Agent orchestration
│
├── agents/                    # Agent implementations
│   ├── __init__.py
│   ├── base_agent.py         # Base agent class
│   │
│   ├── core/                 # Core RAG agents
│   │   ├── __init__.py
│   │   ├── document_processor.py
│   │   ├── chunking_agent.py
│   │   ├── embedding_agent.py
│   │   ├── retrieval_agent.py
│   │   ├── reranking_agent.py
│   │   └── generation_agent.py
│   │
│   ├── ingestion/            # Document ingestion agents
│   │   ├── __init__.py
│   │   ├── github_fetcher.py
│   │   ├── web_scraper.py
│   │   ├── file_ingestion_agent.py
│   │   └── code_parser_agent.py
│   │
│   ├── processing/           # Content processing agents
│   │   ├── __init__.py
│   │   ├── format_agent.py
│   │   ├── prompt_rewriter.py
│   │   ├── answering_agent.py
│   │   ├── code_analysis_agent.py
│   │   └── context_builder_agent.py
│   │
│   ├── workflow/             # Workflow agents
│   │   ├── __init__.py
│   │   ├── workflow_executor.py
│   │   ├── task_scheduler.py
│   │   ├── decision_agent.py
│   │   └── collaboration_agent.py
│   │
│   └── specialized/          # Specialized agents
│       ├── __init__.py
│       ├── code_review_agent.py
│       ├── documentation_agent.py
│       ├── testing_agent.py
│       └── optimization_agent.py
│
├── services/                 # Core services
│   ├── __init__.py
│   ├── vector_store_service.py # Qdrant vector database service
│   ├── llm_service.py        # LLM provider service
│   ├── cache_service.py      # Redis caching service
│   ├── monitoring_service.py # System monitoring
│   └── evaluation_service.py # Performance evaluation
│
├── workflows/                # Workflow definitions
│   ├── __init__.py
│   ├── rag_workflow.py       # RAG processing workflow
│   ├── code_analysis_workflow.py
│   ├── documentation_workflow.py
│   └── review_workflow.py
│
├── utils/                    # Utility functions
│   ├── __init__.py
│   ├── code_utils.py         # Code processing utilities
│   ├── text_utils.py         # Text processing utilities
│   ├── embedding_utils.py    # Embedding operations
│   ├── prompt_utils.py       # Prompt management
│   └── evaluation_utils.py   # Evaluation metrics
│
└── config/                   # Configuration
    ├── __init__.py
    ├── settings.py           # Application settings
    ├── models_config.py      # Model configurations
    └── workflows_config.py   # Workflow configurations
```

## 🛠️ Installation

### Prerequisites
- Python 3.8+
- PostgreSQL 12+
- Qdrant Vector Database
- Redis (optional, for caching)

### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd beetle_backend
```

2. **Install dependencies**
```bash
pip install -r requirements.txt
```

3. **Environment Configuration**
```bash
cp env.example .env
# Edit .env with your configuration
```

4. **Database Setup**
```bash
# PostgreSQL setup
createdb beetle_rag_db

# Qdrant setup (using Docker)
docker run -p 6333:6333 qdrant/qdrant
```

5. **Initialize the system**
```bash
python -m src.ai.setup
```

## ⚙️ Configuration

### Environment Variables

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/beetle_rag_db
QDRANT_URL=http://localhost:6333

# LLM Configuration
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# Redis Configuration (optional)
REDIS_URL=redis://localhost:6379

# Application Settings
APP_ENV=production
LOG_LEVEL=INFO
DEBUG=false
```

### Model Configuration

The system supports multiple LLM providers and embedding models:

```python
# LLM Models
- OpenAI: gpt-4, gpt-3.5-turbo
- Anthropic: claude-3-sonnet, claude-3-haiku
- Local: Custom models

# Embedding Models
- OpenAI: text-embedding-ada-002, text-embedding-3-small
- Sentence Transformers: all-MiniLM-L6-v2
- Code-specific: microsoft/codebert-base
```

## 🚀 Usage

### Basic RAG Query

```python
from src.ai.controllers.rag_controller import RAGController

# Initialize controller
rag_controller = RAGController()

# Process a query
result = await rag_controller.process_query(
    query="How do I implement authentication in FastAPI?",
    context_size=5,
    include_sources=True
)

print(result.answer)
print(result.sources)
```

### Document Ingestion

```python
from src.ai.agents.ingestion.file_ingestion_agent import FileIngestionAgent

# Initialize agent
ingestion_agent = FileIngestionAgent()

# Process documents
result = await ingestion_agent.process({
    "file_path": "/path/to/document.pdf",
    "metadata": {"source": "documentation", "category": "api"}
})
```

### Workflow Execution

```python
from src.ai.controllers.workflow_controller import WorkflowController

# Initialize controller
workflow_controller = WorkflowController()

# Execute RAG workflow
result = await workflow_controller.execute_workflow(
    workflow_id="rag_workflow_v1",
    input_data={
        "documents": ["doc1.pdf", "doc2.md"],
        "query": "Explain the authentication system"
    }
)
```

## 🔧 API Endpoints

### RAG Operations

```http
POST /api/rag/query
POST /api/rag/ingest
POST /api/rag/process
GET /api/rag/status
```

### Workflow Management

```http
POST /api/workflows/execute
GET /api/workflows/list
GET /api/workflows/{workflow_id}
POST /api/workflows/create
```

### Agent Management

```http
GET /api/agents/status
POST /api/agents/execute
GET /api/agents/{agent_id}/health
```

### Monitoring

```http
GET /api/monitoring/metrics
GET /api/monitoring/health
GET /api/monitoring/alerts
```

## 📊 Monitoring & Evaluation

### Performance Metrics

The system tracks comprehensive metrics:

- **Retrieval Metrics**: Precision, Recall, F1-Score, MRR, NDCG
- **Generation Metrics**: BLEU, ROUGE, Relevance, Consistency
- **System Metrics**: CPU, Memory, Response Time
- **Custom Metrics**: User-defined performance indicators

### Evaluation Framework

```python
from src.ai.services.evaluation_service import get_evaluation_service

evaluation_service = get_evaluation_service()

# Evaluate single response
result = await evaluation_service.evaluate_rag_response(
    query="How to use FastAPI?",
    retrieved_docs=retrieved_documents,
    generated_answer="FastAPI is a modern web framework...",
    reference_answer="Reference answer here"
)

# Run benchmark
benchmark_result = await evaluation_service.run_benchmark(
    benchmark_name="fastapi_benchmark",
    test_queries=test_data,
    system_config=config
)
```

## 🔒 Security Features

- **Authentication**: JWT-based authentication
- **Authorization**: Role-based access control
- **Input Validation**: Comprehensive input sanitization
- **Rate Limiting**: API rate limiting and throttling
- **Audit Logging**: Complete audit trail
- **Encryption**: Data encryption at rest and in transit

## 🚀 Deployment

### Docker Deployment

```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "src.ai.fastapi_server:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: beetle-rag
spec:
  replicas: 3
  selector:
    matchLabels:
      app: beetle-rag
  template:
    metadata:
      labels:
        app: beetle-rag
    spec:
      containers:
      - name: beetle-rag
        image: beetle-rag:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
```

## 🧪 Testing

### Unit Tests

```bash
pytest tests/unit/
```

### Integration Tests

```bash
pytest tests/integration/
```

### Performance Tests

```bash
pytest tests/performance/
```

## 📈 Performance Optimization

### Caching Strategy

- **Query Cache**: Cache frequent queries
- **Embedding Cache**: Cache document embeddings
- **Result Cache**: Cache generated answers
- **Metadata Cache**: Cache document metadata

### Scaling Considerations

- **Horizontal Scaling**: Multiple instances
- **Load Balancing**: Distribute requests
- **Database Sharding**: Partition data
- **CDN Integration**: Static content delivery

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [Wiki](link-to-wiki)
- **Issues**: [GitHub Issues](link-to-issues)
- **Discussions**: [GitHub Discussions](link-to-discussions)
- **Email**: support@beetle-rag.com

## 🔄 Changelog

### v1.0.0 (2024-01-01)
- Initial release
- Core RAG functionality
- Agentic workflows
- Multi-LLM support
- Comprehensive monitoring
- Evaluation framework

---

**Built with ❤️ by the Beetle Team** 