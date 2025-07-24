import numpy as np
from typing import Dict, List, Any, Optional
from datetime import datetime
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from models.document import NormalizedDocument, EmbeddedDocument, SourceType, DocumentStatus
from .base_agent import BaseAgent, AgentConfig, AgentResult


class EmbeddingAgentConfig(AgentConfig):
    """Configuration for embedding agent with Qdrant Cloud support"""
    model_name: str = "sentence-transformers/all-MiniLM-L6-v2"
    batch_size: int = 32
    max_length: int = 512
    normalize_embeddings: bool = True
    qdrant_url: str = None  # Full Qdrant Cloud URL (e.g., https://xxx-xxx-xxx-xxx-xxx.us-east-1-0.aws.cloud.qdrant.io:6333)
    qdrant_api_key: str = None  # Qdrant Cloud API key
    collection_name: str = "documents"
    vector_size: int = 384  # Default for all-MiniLM-L6-v2
    distance_metric: Distance = Distance.COSINE


class EmbeddingAgent(BaseAgent):
    """Agent for computing and storing document embeddings"""
    
    def __init__(self, config: EmbeddingAgentConfig):
        super().__init__(config)
        self.config = config
        self.model = None
        self.qdrant_client = None
    
    def load_model(self):
        """Load the sentence transformer model"""
        if not self.model:
            self.log_info("Loading embedding model", model=self.config.model_name)
            self.model = SentenceTransformer(self.config.model_name)
            self.log_info("Embedding model loaded successfully")
    
    def connect_qdrant(self):
        """Connect to Qdrant vector database (supports both local and Qdrant Cloud)"""
        if not self.qdrant_client:
            if not self.config.qdrant_url:
                raise ValueError("QDRANT_URL environment variable is required")
                
            if 'cloud.qdrant.io' in self.config.qdrant_url:
                # Qdrant Cloud connection
                if not self.config.qdrant_api_key:
                    raise ValueError("QDRANT_API_KEY is required for Qdrant Cloud")
                    
                self.log_info("Connecting to Qdrant Cloud", url=self.config.qdrant_url)
                self.qdrant_client = QdrantClient(
                    url=self.config.qdrant_url,
                    api_key=self.config.qdrant_api_key
                )
            else:
                # Local Qdrant connection (for backward compatibility)
                port = 6333  # Default Qdrant port
                host = self.config.qdrant_url
                
                # Handle URL format like 'localhost:6333'
                if ':' in host:
                    host, port_str = host.split(':', 1)
                    try:
                        port = int(port_str)
                    except ValueError:
                        self.log_warning(f"Invalid port in QDRANT_URL, using default port 6333")
                
                self.log_info("Connecting to local Qdrant", host=host, port=port)
                self.qdrant_client = QdrantClient(
                    host=host,
                    port=port
                )
                
            self.log_info("Connected to Qdrant successfully")
    
    def ensure_collection_exists(self):
        """Ensure the Qdrant collection exists"""
        try:
            collections = self.qdrant_client.get_collections()
            collection_names = [col.name for col in collections.collections]
            
            if self.config.collection_name not in collection_names:
                self.log_info("Creating Qdrant collection", name=self.config.collection_name)
                self.qdrant_client.create_collection(
                    collection_name=self.config.collection_name,
                    vectors_config=VectorParams(
                        size=self.config.vector_size,
                        distance=self.config.distance_metric
                    )
                )
                self.log_info("Qdrant collection created successfully")
            else:
                self.log_info("Qdrant collection already exists", name=self.config.collection_name)
                
        except Exception as e:
            self.log_error("Error ensuring collection exists", error=e)
            raise
    
    def chunk_content(self, content: str, max_length: int = None) -> List[str]:
        """Split content into chunks for embedding"""
        if max_length is None:
            max_length = self.config.max_length
        
        # Simple chunking by sentences
        sentences = content.split('. ')
        chunks = []
        current_chunk = ""
        
        for sentence in sentences:
            if len(current_chunk) + len(sentence) < max_length:
                current_chunk += sentence + ". "
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = sentence + ". "
        
        if current_chunk:
            chunks.append(current_chunk.strip())
        
        # If no chunks created, create a single chunk
        if not chunks:
            chunks = [content[:max_length]]
        
        return chunks
    
    def compute_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Compute embeddings for a list of texts"""
        try:
            embeddings = self.model.encode(
                texts,
                batch_size=self.config.batch_size,
                normalize_embeddings=self.config.normalize_embeddings,
                show_progress_bar=False
            )
            
            # Convert to list of lists
            if isinstance(embeddings, np.ndarray):
                embeddings = embeddings.tolist()
            
            return embeddings
            
        except Exception as e:
            self.log_error("Error computing embeddings", error=e)
            raise
    
    def store_embeddings(self, documents: List[EmbeddedDocument]) -> bool:
        """Store embeddings in Qdrant"""
        try:
            points = []
            
            for doc in documents:
                point = PointStruct(
                    id=doc.id,
                    vector=doc.embedding,
                    payload={
                        'content': doc.content,
                        'title': doc.title,
                        'source_type': doc.source_type.value,
                        'source_url': doc.source_url,
                        'tags': doc.tags,
                        'language': doc.language,
                        'word_count': doc.word_count,
                        'repository_id': doc.repository_id,
                        'branch': doc.branch,
                        'metadata': doc.metadata,
                        'timestamp': doc.timestamp.isoformat()
                    }
                )
                points.append(point)
            
            # Upsert points in batches
            batch_size = 100
            for i in range(0, len(points), batch_size):
                batch = points[i:i + batch_size]
                self.qdrant_client.upsert(
                    collection_name=self.config.collection_name,
                    points=batch
                )
            
            self.log_info("Embeddings stored successfully", count=len(documents))
            return True
            
        except Exception as e:
            self.log_error("Error storing embeddings", error=e)
            return False
    
    def process(self, normalized_documents: List[NormalizedDocument]) -> List[EmbeddedDocument]:
        """Process normalized documents and compute embeddings"""
        self.log_info("Starting embedding computation", count=len(normalized_documents))
        
        # Load model and connect to Qdrant
        self.load_model()
        self.connect_qdrant()
        self.ensure_collection_exists()
        
        embedded_documents = []
        
        for doc in normalized_documents:
            try:
                if doc.status != DocumentStatus.NORMALIZED:
                    self.log_warning("Skipping non-normalized document", doc_id=doc.id, status=doc.status)
                    continue
                
                # Chunk content if needed
                chunks = self.chunk_content(doc.content)
                
                if len(chunks) == 1:
                    # Single chunk - compute embedding directly
                    embeddings = self.compute_embeddings([doc.content])
                    embedding = embeddings[0]
                else:
                    # Multiple chunks - compute embeddings for each and average
                    chunk_embeddings = self.compute_embeddings(chunks)
                    embedding = np.mean(chunk_embeddings, axis=0).tolist()
                
                # Create embedded document
                embedded_doc = EmbeddedDocument(
                    id=doc.id,
                    source_type=doc.source_type,
                    source_url=doc.source_url,
                    title=doc.title,
                    content=doc.content,
                    summary=doc.summary,
                    tags=doc.tags,
                    language=doc.language,
                    word_count=doc.word_count,
                    metadata=doc.metadata,
                    embedding=embedding,
                    embedding_model=self.config.model_name,
                    timestamp=datetime.utcnow(),
                    repository_id=doc.repository_id,
                    branch=doc.branch,
                    status=DocumentStatus.EMBEDDED
                )
                
                embedded_documents.append(embedded_doc)
                
            except Exception as e:
                self.log_error("Error processing document for embedding", error=e, doc_id=doc.id)
                # Create error document
                error_doc = EmbeddedDocument(
                    id=doc.id,
                    source_type=doc.source_type,
                    source_url=doc.source_url,
                    content=doc.content,
                    word_count=doc.word_count,
                    metadata=doc.metadata,
                    embedding=[],
                    embedding_model=self.config.model_name,
                    timestamp=datetime.utcnow(),
                    repository_id=doc.repository_id,
                    branch=doc.branch,
                    status=DocumentStatus.ERROR,
                    error_message=str(e)
                )
                embedded_documents.append(error_doc)
        
        # Store embeddings in Qdrant
        successful_docs = [d for d in embedded_documents if d.status == DocumentStatus.EMBEDDED]
        if successful_docs:
            store_success = self.store_embeddings(successful_docs)
            if not store_success:
                self.log_error("Failed to store embeddings in Qdrant")
        
        self.log_info("Embedding computation completed", 
                     input_count=len(normalized_documents),
                     output_count=len(embedded_documents),
                     successful_count=len(successful_docs))
        
        return embedded_documents
    
    def run(self, input_data: List[NormalizedDocument]) -> AgentResult:
        """Run embedding agent with error handling"""
        try:
            embedded_docs = self.process(input_data)
            return AgentResult(
                success=True,
                data=embedded_docs,
                metadata={
                    'input_count': len(input_data),
                    'output_count': len(embedded_docs),
                    'successful_count': len([d for d in embedded_docs if d.status == DocumentStatus.EMBEDDED]),
                    'model_used': self.config.model_name
                }
            )
        except Exception as e:
            return AgentResult(
                success=False,
                error_message=str(e),
                metadata={
                    'input_count': len(input_data) if input_data else 0,
                    'model_used': self.config.model_name
                }
            ) 