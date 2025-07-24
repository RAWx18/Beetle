import numpy as np
from typing import Dict, List, Any, Optional
from datetime import datetime
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue, Range
from models.document import SearchQuery, SearchResult, SourceType
from .base_agent import BaseAgent, AgentConfig, AgentResult


class RetrievalAgentConfig(AgentConfig):
    """Configuration for retrieval agent with Qdrant Cloud support"""
    model_name: str = "sentence-transformers/all-MiniLM-L6-v2"
    qdrant_url: str = None  # Full Qdrant Cloud URL or localhost:port
    qdrant_api_key: str = None  # Required for Qdrant Cloud
    collection_name: str = "documents"
    default_limit: int = 10
    max_limit: int = 50
    min_score: float = 0.3
    use_hybrid_search: bool = True
    keyword_weight: float = 0.3
    vector_weight: float = 0.7


class RetrievalAgent(BaseAgent):
    """Agent for retrieving relevant documents using vector similarity search"""
    
    def __init__(self, config: RetrievalAgentConfig):
        super().__init__(config)
        self.config = config
        self.model = None
        self.qdrant_client = None
    
    def load_model(self):
        """Load the sentence transformer model"""
        if not self.model:
            self.log_info("Loading embedding model for retrieval", model=self.config.model_name)
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
    
    def compute_query_embedding(self, query: str) -> List[float]:
        """Compute embedding for the search query"""
        try:
            embedding = self.model.encode([query])
            if isinstance(embedding, np.ndarray):
                embedding = embedding.tolist()
            return embedding[0]
        except Exception as e:
            self.log_error("Error computing query embedding", error=e)
            raise
    
    def build_search_filter(self, search_query: SearchQuery) -> Optional[Filter]:
        """Build filter for Qdrant search"""
        conditions = []
        
        # Filter by repository if specified
        if search_query.repository_id:
            conditions.append(
                FieldCondition(
                    key="repository_id",
                    match=MatchValue(value=search_query.repository_id)
                )
            )
        
        # Filter by branch if specified
        if search_query.branch:
            conditions.append(
                FieldCondition(
                    key="branch",
                    match=MatchValue(value=search_query.branch)
                )
            )
        
        # Filter by source types if specified
        if search_query.source_types:
            source_type_values = [st.value for st in search_query.source_types]
            conditions.append(
                FieldCondition(
                    key="source_type",
                    match=MatchValue(value=source_type_values)
                )
            )
        
        # Filter by minimum word count
        conditions.append(
            FieldCondition(
                key="word_count",
                range=Range(gte=10)  # Minimum 10 words
            )
        )
        
        if conditions:
            return Filter(must=conditions)
        
        return None
    
    def extract_keywords(self, query: str) -> List[str]:
        """Extract keywords from query for hybrid search"""
        # Simple keyword extraction - split by spaces and filter
        words = query.lower().split()
        # Remove common stop words
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'}
        keywords = [word for word in words if word not in stop_words and len(word) > 2]
        return keywords
    
    def search_vector_similarity(self, query_embedding: List[float], search_query: SearchQuery) -> List[Dict[str, Any]]:
        """Search using vector similarity"""
        try:
            filter_condition = self.build_search_filter(search_query)
            
            search_result = self.qdrant_client.search(
                collection_name=self.config.collection_name,
                query_vector=query_embedding,
                query_filter=filter_condition,
                limit=search_query.max_results,
                score_threshold=search_query.similarity_threshold
            )
            
            return search_result
            
        except Exception as e:
            self.log_error("Error in vector similarity search", error=e)
            return []
    
    def search_keyword(self, keywords: List[str], search_query: SearchQuery) -> List[Dict[str, Any]]:
        """Search using keyword matching"""
        try:
            if not keywords:
                return []
            
            # Build keyword filter
            keyword_conditions = []
            for keyword in keywords:
                keyword_conditions.append(
                    FieldCondition(
                        key="content",
                        match=MatchValue(value=keyword)
                    )
                )
            
            # Combine with other filters
            base_filter = self.build_search_filter(search_query)
            if base_filter:
                keyword_filter = Filter(
                    must=base_filter.must + keyword_conditions
                )
            else:
                keyword_filter = Filter(must=keyword_conditions)
            
            # Search with dummy vector (all zeros)
            dummy_vector = [0.0] * 384  # Default vector size
            
            search_result = self.qdrant_client.search(
                collection_name=self.config.collection_name,
                query_vector=dummy_vector,
                query_filter=keyword_filter,
                limit=search_query.max_results,
                score_threshold=0.1  # Lower threshold for keyword search
            )
            
            return search_result
            
        except Exception as e:
            self.log_error("Error in keyword search", error=e)
            return []
    
    def merge_search_results(self, vector_results: List[Dict], keyword_results: List[Dict]) -> List[Dict]:
        """Merge vector and keyword search results"""
        # Create a map of document IDs to their scores
        doc_scores = {}
        
        # Add vector search results
        for result in vector_results:
            doc_id = result.id
            vector_score = result.score
            doc_scores[doc_id] = {
                'vector_score': vector_score,
                'keyword_score': 0.0,
                'combined_score': vector_score * self.config.vector_weight,
                'payload': result.payload
            }
        
        # Add keyword search results
        for result in keyword_results:
            doc_id = result.id
            keyword_score = result.score
            
            if doc_id in doc_scores:
                # Document found in both searches
                doc_scores[doc_id]['keyword_score'] = keyword_score
                doc_scores[doc_id]['combined_score'] += keyword_score * self.config.keyword_weight
            else:
                # Document only found in keyword search
                doc_scores[doc_id] = {
                    'vector_score': 0.0,
                    'keyword_score': keyword_score,
                    'combined_score': keyword_score * self.config.keyword_weight,
                    'payload': result.payload
                }
        
        # Sort by combined score and return top results
        sorted_results = sorted(
            doc_scores.items(),
            key=lambda x: x[1]['combined_score'],
            reverse=True
        )
        
        return [
            {
                'id': doc_id,
                'score': data['combined_score'],
                'payload': data['payload']
            }
            for doc_id, data in sorted_results
        ]
    
    def create_search_result(self, result: Dict[str, Any]) -> SearchResult:
        """Create SearchResult from Qdrant result"""
        payload = result['payload']
        
        # Extract content snippet
        content = payload.get('content', '')
        if len(content) > 300:
            content = content[:300] + '...'
        
        return SearchResult(
            document_id=result['id'],
            title=payload.get('title'),
            content=content,
            source_url=payload.get('source_url'),
            source_type=SourceType(payload.get('source_type', 'text')),
            similarity_score=result['score'],
            metadata=payload.get('metadata', {}),
            repository_id=payload.get('repository_id'),
            branch=payload.get('branch')
        )
    
    def process(self, search_query: SearchQuery) -> List[SearchResult]:
        """Process search query and return relevant results"""
        self.log_info("Starting document retrieval", query=search_query.query[:50] + "...")
        
        # Load model and connect to Qdrant
        self.load_model()
        self.connect_qdrant()
        
        # Compute query embedding
        query_embedding = self.compute_query_embedding(search_query.query)
        
        # Perform vector similarity search
        vector_results = self.search_vector_similarity(query_embedding, search_query)
        
        if self.config.use_hybrid_search:
            # Perform keyword search
            keywords = self.extract_keywords(search_query.query)
            keyword_results = self.search_keyword(keywords, search_query)
            
            # Merge results
            merged_results = self.merge_search_results(vector_results, keyword_results)
        else:
            # Use only vector search results
            merged_results = [
                {
                    'id': result.id,
                    'score': result.score,
                    'payload': result.payload
                }
                for result in vector_results
            ]
        
        # Convert to SearchResult objects
        search_results = []
        for result in merged_results[:search_query.max_results]:
            search_result = self.create_search_result(result)
            search_results.append(search_result)
        
        self.log_info("Document retrieval completed", 
                     query_length=len(search_query.query),
                     results_count=len(search_results),
                     top_score=search_results[0].similarity_score if search_results else 0.0)
        
        return search_results
    
    def run(self, input_data: SearchQuery) -> AgentResult:
        """Run retrieval agent with error handling"""
        try:
            search_results = self.process(input_data)
            return AgentResult(
                success=True,
                data=search_results,
                metadata={
                    'query': input_data.query[:50] + "..." if len(input_data.query) > 50 else input_data.query,
                    'results_count': len(search_results),
                    'repository_id': input_data.repository_id,
                    'branch': input_data.branch,
                    'max_results': input_data.max_results,
                    'similarity_threshold': input_data.similarity_threshold
                }
            )
        except Exception as e:
            return AgentResult(
                success=False,
                error_message=str(e),
                metadata={
                    'query': input_data.query[:50] + "..." if len(input_data.query) > 50 else input_data.query,
                    'repository_id': input_data.repository_id,
                    'branch': input_data.branch
                }
            ) 