"""
Enhanced vector retrieval system for the RAG pipeline.
Handles semantic search, result ranking, and context retrieval with Chonkie + FastEmbed integration.
"""

from typing import List, Optional, Dict, Any, Tuple
import structlog
from datetime import datetime
import numpy as np

from embeddings import get_embeddings_provider
from vectorstore.qdrant.client import get_enhanced_qdrant_client
from models.api.file_models import FileSearchResult, FileSearchResponse

logger = structlog.get_logger(__name__)


class EnhancedVectorRetriever:
    """Enhanced vector-based document retrieval system with Chonkie + FastEmbed."""
    
    def __init__(self):
        """Initialize the enhanced vector retriever."""
        self.embeddings_provider = get_embeddings_provider()
        self.qdrant_client = get_enhanced_qdrant_client()
        self.default_limit = 10  # Increased for better coverage
        self.default_score_threshold = 0.75  # Slightly higher threshold
        
        # Chonkie integration for better chunking
        self._use_fastembed = False
        self._setup_fastembed()
    
    def _setup_fastembed(self):
        """Setup FastEmbed integration for local embeddings."""
        try:
            from vectorstore.qdrant.client import get_enhanced_qdrant_client
            client = get_enhanced_qdrant_client()
            self._use_fastembed = hasattr(client, '_use_fastembed') and client._use_fastembed
            logger.info(f"FastEmbed integration: {'enabled' if self._use_fastembed else 'disabled'}")
        except Exception:
            self._use_fastembed = False
    
    async def retrieve_relevant_chunks(
        self, 
        query: str, 
        limit: int = None,
        score_threshold: float = None,
        filters: Optional[Dict[str, Any]] = None,
        use_fastembed: bool = False
    ) -> List[Dict[str, Any]]:
        """Retrieve relevant document chunks for a query."""
        try:
            # Generate query embedding
            if use_fastembed and self._use_fastembed:
                # Use FastEmbed for local embeddings
                query_embedding = await self.qdrant_client.generate_embeddings_with_fastembed([query])
                query_embedding = query_embedding[0] if query_embedding else None
            else:
                # Use external embeddings provider
                query_embedding = await self.embeddings_provider.embed_single(query)
            
            if not query_embedding:
                logger.error("Failed to generate query embedding")
                return []
            
            # Enhanced search with batch capabilities
            search_results = await self.qdrant_client.search_similar(
                query_embedding=query_embedding,
                limit=limit or self.default_limit,
                score_threshold=score_threshold or self.default_score_threshold,
                filters=filters
            )
            
            # Process and rank results with enhanced scoring
            processed_results = await self._process_enhanced_results(search_results, query)
            
            logger.info("Retrieved relevant chunks", 
                       query_length=len(query), 
                       results_count=len(processed_results),
                       threshold=score_threshold or self.default_score_threshold)
            
            return processed_results
            
        except Exception as e:
            logger.error("Enhanced vector retrieval failed", error=str(e), query=query[:100])
            return []
    
    async def retrieve_relevant_chunks_batch(
        self,
        queries: List[str],
        limit: int = 5,
        score_threshold: float = 0.75,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[List[Dict[str, Any]]]:
        """Batch retrieve relevant chunks for multiple queries."""
        try:
            # Generate embeddings for all queries
            query_embeddings = []
            for query in queries:
                if self._use_fastembed:
                    embeddings = await self.qdrant_client.generate_embeddings_with_fastembed([query])
                    query_embeddings.append(embeddings[0] if embeddings else None)
                else:
                    embedding = await self.embeddings_provider.embed_single(query)
                    query_embeddings.append(embedding)
            
            # Filter out None embeddings
            valid_embeddings = [(idx, emb) for idx, emb in enumerate(query_embeddings) if emb]
            
            if not valid_embeddings:
                return [[] for _ in queries]
            
            # Batch search
            embeddings_only = [emb for _, emb in valid_embeddings]
            batch_results = await self.qdrant_client.search_similar_batch(
                query_embeddings=embeddings_only,
                limit=limit,
                score_threshold=score_threshold,
                filters=filters
            )
            
            # Map results back to original query indices
            full_results = [[] for _ in queries]
            for (orig_idx, _), results in zip(valid_embeddings, batch_results):
                processed = await self._process_enhanced_results(results, queries[orig_idx])
                full_results[orig_idx] = processed
            
            return full_results
            
        except Exception as e:
            logger.error("Batch vector retrieval failed", error=str(e))
            return [[] for _ in queries]
    
    async def _process_enhanced_results(
        self, 
        search_results: List[Dict[str, Any]], 
        query: str
    ) -> List[Dict[str, Any]]:
        """Process and enhance search results with advanced scoring."""
        processed_results = []
        
        # Calculate query statistics for better scoring
        query_terms = set(query.lower().split())
        query_length = len(query)
        
        for result in search_results:
            try:
                payload = result.get("payload", {})
                content = payload.get("content", "")
                
                # Enhanced scoring
                enhanced_score = await self._calculate_enhanced_score(
                    result["score"], 
                    content, 
                    query, 
                    query_terms,
                    payload
                )
                
                # Extract highlights with better context
                highlights = await self._extract_smart_highlights(content, query)
                
                # Create enhanced result
                enhanced_result = {
                    "chunk_id": result["chunk_id"],
                    "original_score": result["score"],
                    "enhanced_score": enhanced_score,
                    "content": content,
                    "file_id": payload.get("file_id", ""),
                    "filename": payload.get("filename", "Unknown"),
                    "language": payload.get("language"),
                    "chunk_type": payload.get("chunk_type"),
                    "start_line": payload.get("start_line"),
                    "end_line": payload.get("end_line"),
                    "start_char": payload.get("start_char"),
                    "end_char": payload.get("end_char"),
                    "complexity_score": payload.get("complexity_score", 0.0),
                    "created_at": payload.get("created_at"),
                    "token_count": payload.get("token_count", 0),
                    "word_count": payload.get("word_count", 0),
                    "char_count": payload.get("char_count", 0),
                    "file_size": payload.get("file_size"),
                    "file_type": payload.get("file_type"),
                    "highlights": highlights,
                    "relevance_explanation": await self._generate_enhanced_explanation(
                        enhanced_score, payload, query
                    ),
                    "metadata": {
                        "query_overlap": len(query_terms.intersection(set(content.lower().split()))) / len(query_terms) if query_terms else 0,
                        "content_length": len(content),
                        "position_in_file": payload.get("chunk_index", 0)
                    }
                }
                
                processed_results.append(enhanced_result)
                
            except Exception as e:
                logger.warning("Failed to process search result", error=str(e))
                continue
        
        # Sort by enhanced score (descending)
        processed_results.sort(key=lambda x: x["enhanced_score"], reverse=True)
        
        return processed_results
    
    async def _calculate_enhanced_score(
        self,
        original_score: float,
        content: str,
        query: str,
        query_terms: set,
        payload: Dict[str, Any]
    ) -> float:
        """Calculate enhanced relevance score."""
        try:
            # Base score from vector similarity
            enhanced_score = original_score
            
            # Length penalty (prefer balanced lengths)
            content_length = len(content)
            query_length = len(query)
            
            # Length ratio bonus (avoid very short or very long chunks)
            if 0.5 <= content_length / query_length <= 10:
                enhanced_score += 0.05
            
            # Query overlap bonus
            content_terms = set(content.lower().split())
            overlap_ratio = len(query_terms.intersection(content_terms)) / len(query_terms) if query_terms else 0
            enhanced_score += overlap_ratio * 0.1
            
            # Complexity score bonus (if available)
            complexity_score = payload.get("complexity_score", 0.5)
            if complexity_score > 0.7:
                enhanced_score += 0.02
            
            # Position bonus (earlier chunks might be more relevant)
            chunk_index = payload.get("chunk_index", 0)
            if chunk_index < 5:
                enhanced_score += 0.01
            
            # Language match bonus
            if payload.get("language") and "python" in query.lower() and payload["language"] == "python":
                enhanced_score += 0.03
            
            return min(enhanced_score, 1.0)  # Cap at 1.0
            
        except Exception:
            return original_score
    
    async def _extract_smart_highlights(
        self, 
        content: str, 
        query: str, 
        max_highlights: int = 3,
        context_chars: int = 100
    ) -> List[str]:
        """Extract smart query highlights with context."""
        highlights = []
        query_terms = query.lower().split()
        
        # Split content into sentences for better context
        import re
        sentences = re.split(r'[.!?]+', content)
        
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
                
            sentence_lower = sentence.lower()
            if any(term in sentence_lower for term in query_terms):
                # Find query term positions
                term_positions = []
                for term in query_terms:
                    pos = sentence_lower.find(term)
                    if pos != -1:
                        term_positions.append((pos, pos + len(term)))
                
                if term_positions:
                    # Build highlight with context
                    start_pos = max(0, min(pos[0] for pos in term_positions) - context_chars)
                    end_pos = min(len(sentence), max(pos[1] for pos in term_positions) + context_chars)
                    
                    highlight = sentence[start_pos:end_pos].strip()
                    
                    # Add ellipsis if truncated
                    if start_pos > 0:
                        highlight = "..." + highlight
                    if end_pos < len(sentence):
                        highlight = highlight + "..."
                    
                    # Bold the query terms
                    for term in query_terms:
                        highlight = highlight.replace(term, f"**{term}**", flags=re.IGNORECASE)
                    
                    if len(highlight) > 20:  # Minimum meaningful length
                        highlights.append(highlight)
        
        return highlights[:max_highlights]
    
    async def _generate_enhanced_explanation(
        self,
        enhanced_score: float,
        payload: Dict[str, Any],
        query: str
    ) -> str:
        """Generate detailed relevance explanation."""
        explanations = []
        
        # Base similarity
        if enhanced_score > 0.9:
            explanations.append("Very high semantic similarity")
        elif enhanced_score > 0.8:
            explanations.append("High semantic similarity")
        elif enhanced_score > 0.7:
            explanations.append("Good semantic similarity")
        else:
            explanations.append("Moderate semantic similarity")
        
        # Content type
        chunk_type = payload.get("chunk_type")
        if chunk_type:
            explanations.append(f"Content type: {chunk_type}")
        
        # Language
        language = payload.get("language")
        if language:
            explanations.append(f"Language: {language}")
        
        # Complexity
        complexity = payload.get("complexity_score")
        if complexity:
            if complexity > 0.8:
                explanations.append("High complexity content")
            elif complexity < 0.3:
                explanations.append("Simple content")
        
        # File info
        filename = payload.get("filename")
        if filename:
            explanations.append(f"From: {filename}")
        
        # Position
        chunk_index = payload.get("chunk_index", 0)
        if chunk_index == 0:
            explanations.append("First chunk in file")
        
        return "; ".join(explanations)
    
    async def search_files(
        self, 
        query: str, 
        file_ids: Optional[List[str]] = None,
        languages: Optional[List[str]] = None,
        chunk_types: Optional[List[str]] = None,
        max_results: int = 10,
        similarity_threshold: float = 0.75,
        use_fastembed: bool = False
    ) -> FileSearchResponse:
        """Enhanced file search with better filtering and metadata."""
        try:
            # Build enhanced filters
            filters = {}
            if file_ids:
                filters["file_id"] = file_ids
            if languages:
                filters["language"] = languages
            if chunk_types:
                filters["chunk_type"] = chunk_types
            
            # Retrieve chunks
            chunks = await self.retrieve_relevant_chunks(
                query=query,
                limit=max_results,
                score_threshold=similarity_threshold,
                filters=filters,
                use_fastembed=use_fastembed
            )
            
            # Group by file for better organization
            file_groups = {}
            for chunk in chunks:
                file_id = chunk["file_id"]
                if file_id not in file_groups:
                    file_groups[file_id] = {
                        "chunks": [],
                        "filename": chunk["filename"],
                        "total_score": 0.0,
                        "chunk_count": 0
                    }
                
                file_groups[file_id]["chunks"].append(chunk)
                file_groups[file_id]["total_score"] += chunk["enhanced_score"]
                file_groups[file_id]["chunk_count"] += 1
            
            # Create results
            results = []
            for file_id, group in file_groups.items():
                # Average score for the file
                avg_score = group["total_score"] / group["chunk_count"]
                
                # Combine chunks for this file
                combined_content = "\n\n".join([c["content"][:200] + "..." if len(c["content"]) > 200 else c["content"] 
                                              for c in group["chunks"]])
                
                result = FileSearchResult(
                    chunk_id=group["chunks"][0]["chunk_id"],  # Use first chunk
                    file_id=file_id,
                    filename=group["filename"],
                    content=combined_content,
                    similarity_score=avg_score,
                    metadata={
                        "chunk_count": group["chunk_count"],
                        "chunks": group["chunks"]
                    },
                    highlights=[h for chunk in group["chunks"] for h in chunk["highlights"][:2]]
                )
                results.append(result)
            
            # Sort by average score
            results.sort(key=lambda x: x.similarity_score, reverse=True)
            
            return FileSearchResponse(
                query=query,
                results=results,
                total_results=len(results),
                search_time=0.0,
                metadata={
                    "filters_applied": filters,
                    "similarity_threshold": similarity_threshold,
                    "use_fastembed": use_fastembed,
                    "grouped_by_file": True
                }
            )
            
        except Exception as e:
            logger.error("Enhanced file search failed", error=str(e), query=query)
            return FileSearchResponse(
                query=query,
                results=[],
                total_results=0,
                search_time=0.0,
                metadata={"error": str(e)}
            )
    
    async def get_context_for_query(
        self, 
        query: str, 
        max_chunks: int = 5,
        include_metadata: bool = True,
        use_fastembed: bool = False
    ) -> str:
        """Get enhanced formatted context for a query."""
        try:
            # Retrieve relevant chunks
            chunks = await self.retrieve_relevant_chunks(
                query=query,
                limit=max_chunks,
                use_fastembed=use_fastembed
            )
            
            if not chunks:
                return ""
            
            # Format context with better structure
            context_parts = []
            
            # Add query summary
            context_parts.append(f"Query: {query}\n")
            context_parts.append("=" * 50 + "\n")
            
            for i, chunk in enumerate(chunks, 1):
                context_part = f"\n[{i}] Relevant Content (Score: {chunk['enhanced_score']:.3f})\n"
                context_part += "-" * 30 + "\n"
                
                if include_metadata:
                    metadata_lines = []
                    if chunk.get("filename"):
                        metadata_lines.append(f"File: {chunk['filename']}")
                    if chunk.get("language"):
                        metadata_lines.append(f"Language: {chunk['language']}")
                    if chunk.get("chunk_type"):
                        metadata_lines.append(f"Type: {chunk['chunk_type']}")
                    if chunk.get("start_line") is not None:
                        metadata_lines.append(f"Lines: {chunk['start_line']}-{chunk['end_line']}")
                    
                    if metadata_lines:
                        context_part += " | ".join(metadata_lines) + "\n\n"
                
                context_part += chunk["content"]
                
                # Add highlights if available
                if chunk.get("highlights"):
                    context_part += "\n\nKey highlights:\n"
                    for highlight in chunk["highlights"]:
                        context_part += f"  • {highlight}\n"
                
                context_parts.append(context_part)
            
            return "\n\n".join(context_parts)
            
        except Exception as e:
            logger.error("Failed to get enhanced context for query", error=str(e))
            return ""
    
    async def get_context_for_queries(
        self,
        queries: List[str],
        max_chunks_per_query: int = 3,
        include_metadata: bool = True,
        use_fastembed: bool = False
    ) -> List[str]:
        """Get context for multiple queries in batch."""
        try:
            # Batch retrieve chunks for all queries
            all_chunks = await self.retrieve_relevant_chunks_batch(
                queries=queries,
                limit=max_chunks_per_query,
                use_fastembed=use_fastembed
            )
            
            contexts = []
            for query, chunks in zip(queries, all_chunks):
                if not chunks:
                    contexts.append("")
                    continue
                
                # Format each context
                context = await self.get_context_for_query(
                    query=query,
                    max_chunks=len(chunks),
                    include_metadata=include_metadata,
                    use_fastembed=use_fastembed
                )
                contexts.append(context)
            
            return contexts
            
        except Exception as e:
            logger.error("Failed to get contexts for queries", error=str(e))
            return ["" for _ in queries]
    
    async def health_check(self) -> bool:
        """Enhanced health check with FastEmbed support."""
        try:
            # Check embeddings provider
            embeddings_healthy = await self.embeddings_provider.health_check()
            if not embeddings_healthy:
                logger.error("Embeddings provider is not healthy")
                return False
            
            # Check Qdrant client
            qdrant_healthy = await self.qdrant_client.is_healthy()
            if not qdrant_healthy:
                logger.error("Qdrant client is not healthy")
                return False
            
            # Check FastEmbed if enabled
            if self._use_fastembed:
                try:
                    test_embedding = await self.qdrant_client.generate_embeddings_with_fastembed(["test"])
                    if not test_embedding or len(test_embedding[0]) == 0:
                        logger.error("FastEmbed is not working properly")
                        return False
                except Exception as e:
                    logger.error("FastEmbed health check failed", error=str(e))
                    return False
            
            return True
            
        except Exception as e:
            logger.error("Enhanced vector retriever health check failed", error=str(e))
            return False


# Global enhanced vector retriever instance
enhanced_vector_retriever = EnhancedVectorRetriever()


def get_enhanced_vector_retriever() -> EnhancedVectorRetriever:
    """Get the global enhanced vector retriever instance."""
    return enhanced_vector_retriever
