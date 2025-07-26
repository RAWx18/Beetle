import numpy as np
import logging
from typing import List, Dict, Any, Optional, Tuple
from sklearn.metrics.pairwise import cosine_similarity, euclidean_distances
from sklearn.preprocessing import normalize
import hashlib
import json

logger = logging.getLogger(__name__)


class EmbeddingUtils:
    """Utility functions for embedding operations"""
    
    def __init__(self):
        self.supported_metrics = ["cosine", "euclidean", "manhattan", "dot_product"]
    
    def normalize_embeddings(self, embeddings: List[List[float]]) -> List[List[float]]:
        """Normalize embeddings to unit length"""
        if not embeddings:
            return []
        
        embeddings_array = np.array(embeddings)
        normalized = normalize(embeddings_array, norm='l2')
        return normalized.tolist()
    
    def calculate_similarity(
        self,
        embedding1: List[float],
        embedding2: List[float],
        metric: str = "cosine"
    ) -> float:
        """Calculate similarity between two embeddings"""
        if not embedding1 or not embedding2:
            return 0.0
        
        if len(embedding1) != len(embedding2):
            logger.warning("Embedding dimensions don't match")
            return 0.0
        
        embedding1_array = np.array(embedding1).reshape(1, -1)
        embedding2_array = np.array(embedding2).reshape(1, -1)
        
        if metric == "cosine":
            similarity = cosine_similarity(embedding1_array, embedding2_array)[0][0]
        elif metric == "euclidean":
            distance = euclidean_distances(embedding1_array, embedding2_array)[0][0]
            similarity = 1.0 / (1.0 + distance)  # Convert distance to similarity
        elif metric == "manhattan":
            distance = np.sum(np.abs(embedding1_array - embedding2_array))
            similarity = 1.0 / (1.0 + distance)
        elif metric == "dot_product":
            similarity = np.dot(embedding1_array.flatten(), embedding2_array.flatten())
        else:
            raise ValueError(f"Unsupported similarity metric: {metric}")
        
        return float(similarity)
    
    def calculate_batch_similarity(
        self,
        query_embedding: List[float],
        embeddings: List[List[float]],
        metric: str = "cosine",
        top_k: Optional[int] = None
    ) -> List[Tuple[int, float]]:
        """Calculate similarity between query embedding and a batch of embeddings"""
        if not query_embedding or not embeddings:
            return []
        
        query_array = np.array(query_embedding).reshape(1, -1)
        embeddings_array = np.array(embeddings)
        
        if metric == "cosine":
            similarities = cosine_similarity(query_array, embeddings_array)[0]
        elif metric == "euclidean":
            distances = euclidean_distances(query_array, embeddings_array)[0]
            similarities = 1.0 / (1.0 + distances)
        elif metric == "manhattan":
            distances = np.sum(np.abs(query_array - embeddings_array), axis=1)
            similarities = 1.0 / (1.0 + distances)
        elif metric == "dot_product":
            similarities = np.dot(embeddings_array, query_array.flatten())
        else:
            raise ValueError(f"Unsupported similarity metric: {metric}")
        
        # Create list of (index, similarity) tuples
        similarity_pairs = [(i, float(sim)) for i, sim in enumerate(similarities)]
        
        # Sort by similarity (descending)
        similarity_pairs.sort(key=lambda x: x[1], reverse=True)
        
        # Return top_k results if specified
        if top_k is not None:
            similarity_pairs = similarity_pairs[:top_k]
        
        return similarity_pairs
    
    def find_most_similar(
        self,
        query_embedding: List[float],
        embeddings: List[List[float]],
        metric: str = "cosine",
        threshold: float = 0.0
    ) -> List[Tuple[int, float]]:
        """Find most similar embeddings above threshold"""
        similarities = self.calculate_batch_similarity(query_embedding, embeddings, metric)
        
        # Filter by threshold
        filtered_similarities = [(idx, sim) for idx, sim in similarities if sim >= threshold]
        
        return filtered_similarities
    
    def calculate_embedding_statistics(self, embeddings: List[List[float]]) -> Dict[str, Any]:
        """Calculate statistics for a set of embeddings"""
        if not embeddings:
            return {
                "count": 0,
                "dimension": 0,
                "mean_norm": 0.0,
                "std_norm": 0.0,
                "min_norm": 0.0,
                "max_norm": 0.0,
            }
        
        embeddings_array = np.array(embeddings)
        
        # Calculate norms
        norms = np.linalg.norm(embeddings_array, axis=1)
        
        stats = {
            "count": len(embeddings),
            "dimension": embeddings_array.shape[1],
            "mean_norm": float(np.mean(norms)),
            "std_norm": float(np.std(norms)),
            "min_norm": float(np.min(norms)),
            "max_norm": float(np.max(norms)),
        }
        
        return stats
    
    def detect_embedding_anomalies(
        self,
        embeddings: List[List[float]],
        threshold_std: float = 2.0
    ) -> List[int]:
        """Detect anomalous embeddings using statistical methods"""
        if not embeddings:
            return []
        
        embeddings_array = np.array(embeddings)
        norms = np.linalg.norm(embeddings_array, axis=1)
        
        mean_norm = np.mean(norms)
        std_norm = np.std(norms)
        
        # Find embeddings with norms outside threshold_std standard deviations
        anomaly_indices = []
        for i, norm in enumerate(norms):
            z_score = abs(norm - mean_norm) / std_norm
            if z_score > threshold_std:
                anomaly_indices.append(i)
        
        return anomaly_indices
    
    def calculate_embedding_centroid(self, embeddings: List[List[float]]) -> List[float]:
        """Calculate centroid of embeddings"""
        if not embeddings:
            return []
        
        embeddings_array = np.array(embeddings)
        centroid = np.mean(embeddings_array, axis=0)
        return centroid.tolist()
    
    def calculate_embedding_variance(self, embeddings: List[List[float]]) -> List[float]:
        """Calculate variance of embeddings"""
        if not embeddings:
            return []
        
        embeddings_array = np.array(embeddings)
        variance = np.var(embeddings_array, axis=0)
        return variance.tolist()
    
    def reduce_embeddings_dimensionality(
        self,
        embeddings: List[List[float]],
        target_dimension: int,
        method: str = "pca"
    ) -> List[List[float]]:
        """Reduce embedding dimensionality"""
        if not embeddings:
            return []
        
        if method == "pca":
            return self._reduce_with_pca(embeddings, target_dimension)
        elif method == "random_projection":
            return self._reduce_with_random_projection(embeddings, target_dimension)
        else:
            raise ValueError(f"Unsupported dimensionality reduction method: {method}")
    
    def _reduce_with_pca(self, embeddings: List[List[float]], target_dimension: int) -> List[List[float]]:
        """Reduce dimensionality using PCA"""
        try:
            from sklearn.decomposition import PCA
            
            embeddings_array = np.array(embeddings)
            pca = PCA(n_components=target_dimension)
            reduced_embeddings = pca.fit_transform(embeddings_array)
            
            return reduced_embeddings.tolist()
            
        except ImportError:
            logger.warning("scikit-learn not available, using random projection instead")
            return self._reduce_with_random_projection(embeddings, target_dimension)
    
    def _reduce_with_random_projection(
        self,
        embeddings: List[List[float]],
        target_dimension: int
    ) -> List[List[float]]:
        """Reduce dimensionality using random projection"""
        try:
            from sklearn.random_projection import GaussianRandomProjection
            
            embeddings_array = np.array(embeddings)
            rp = GaussianRandomProjection(n_components=target_dimension)
            reduced_embeddings = rp.fit_transform(embeddings_array)
            
            return reduced_embeddings.tolist()
            
        except ImportError:
            logger.error("scikit-learn not available for dimensionality reduction")
            return embeddings
    
    def calculate_embedding_clusters(
        self,
        embeddings: List[List[float]],
        n_clusters: int = 5,
        method: str = "kmeans"
    ) -> Dict[str, Any]:
        """Calculate clusters of embeddings"""
        if not embeddings:
            return {"clusters": [], "labels": [], "centroids": []}
        
        if method == "kmeans":
            return self._cluster_with_kmeans(embeddings, n_clusters)
        else:
            raise ValueError(f"Unsupported clustering method: {method}")
    
    def _cluster_with_kmeans(
        self,
        embeddings: List[List[float]],
        n_clusters: int
    ) -> Dict[str, Any]:
        """Cluster embeddings using K-means"""
        try:
            from sklearn.cluster import KMeans
            
            embeddings_array = np.array(embeddings)
            kmeans = KMeans(n_clusters=n_clusters, random_state=42)
            labels = kmeans.fit_predict(embeddings_array)
            centroids = kmeans.cluster_centers_
            
            return {
                "clusters": labels.tolist(),
                "labels": labels.tolist(),
                "centroids": centroids.tolist(),
            }
            
        except ImportError:
            logger.error("scikit-learn not available for clustering")
            return {"clusters": [], "labels": [], "centroids": []}
    
    def calculate_embedding_diversity(self, embeddings: List[List[float]]) -> float:
        """Calculate diversity of embeddings"""
        if not embeddings or len(embeddings) < 2:
            return 0.0
        
        embeddings_array = np.array(embeddings)
        
        # Calculate pairwise distances
        distances = euclidean_distances(embeddings_array)
        
        # Calculate average distance (excluding self-distances)
        np.fill_diagonal(distances, 0)
        total_distance = np.sum(distances)
        num_pairs = len(embeddings) * (len(embeddings) - 1)
        
        if num_pairs == 0:
            return 0.0
        
        average_distance = total_distance / num_pairs
        return float(average_distance)
    
    def generate_embedding_hash(self, embedding: List[float]) -> str:
        """Generate hash for embedding"""
        if not embedding:
            return ""
        
        # Convert embedding to bytes and hash
        embedding_bytes = json.dumps(embedding, sort_keys=True).encode()
        hash_object = hashlib.md5(embedding_bytes)
        return hash_object.hexdigest()
    
    def validate_embedding(self, embedding: List[float]) -> bool:
        """Validate embedding format and values"""
        if not embedding:
            return False
        
        # Check if all values are finite numbers
        try:
            embedding_array = np.array(embedding)
            if not np.all(np.isfinite(embedding_array)):
                return False
            
            # Check for reasonable values (not all zeros, not extreme values)
            if np.all(embedding_array == 0):
                return False
            
            if np.any(np.abs(embedding_array) > 1e6):
                return False
            
            return True
            
        except (ValueError, TypeError):
            return False
    
    def compare_embedding_sets(
        self,
        embeddings1: List[List[float]],
        embeddings2: List[List[float]],
        metric: str = "cosine"
    ) -> Dict[str, float]:
        """Compare two sets of embeddings"""
        if not embeddings1 or not embeddings2:
            return {"similarity": 0.0, "diversity_ratio": 0.0}
        
        # Calculate centroids
        centroid1 = self.calculate_embedding_centroid(embeddings1)
        centroid2 = self.calculate_embedding_centroid(embeddings2)
        
        # Calculate similarity between centroids
        centroid_similarity = self.calculate_similarity(centroid1, centroid2, metric)
        
        # Calculate diversity ratios
        diversity1 = self.calculate_embedding_diversity(embeddings1)
        diversity2 = self.calculate_embedding_diversity(embeddings2)
        
        diversity_ratio = diversity1 / diversity2 if diversity2 > 0 else 0.0
        
        return {
            "similarity": centroid_similarity,
            "diversity_ratio": diversity_ratio,
        }
    
    def create_embedding_index(
        self,
        embeddings: List[List[float]],
        method: str = "exact"
    ) -> Any:
        """Create an index for fast similarity search"""
        if not embeddings:
            return None
        
        if method == "exact":
            return self._create_exact_index(embeddings)
        elif method == "approximate":
            return self._create_approximate_index(embeddings)
        else:
            raise ValueError(f"Unsupported indexing method: {method}")
    
    def _create_exact_index(self, embeddings: List[List[float]]) -> Dict[str, Any]:
        """Create exact search index"""
        return {
            "embeddings": embeddings,
            "method": "exact",
            "count": len(embeddings),
        }
    
    def _create_approximate_index(self, embeddings: List[List[float]]) -> Any:
        """Create approximate search index"""
        try:
            from sklearn.neighbors import NearestNeighbors
            
            embeddings_array = np.array(embeddings)
            nn = NearestNeighbors(n_neighbors=min(10, len(embeddings)), metric='cosine')
            nn.fit(embeddings_array)
            
            return {
                "index": nn,
                "method": "approximate",
                "count": len(embeddings),
            }
            
        except ImportError:
            logger.warning("scikit-learn not available, using exact index")
            return self._create_exact_index(embeddings)
    
    def search_embedding_index(
        self,
        index: Any,
        query_embedding: List[float],
        top_k: int = 10
    ) -> List[Tuple[int, float]]:
        """Search embedding index"""
        if not index or not query_embedding:
            return []
        
        if index["method"] == "exact":
            return self.calculate_batch_similarity(
                query_embedding, index["embeddings"], top_k=top_k
            )
        elif index["method"] == "approximate":
            return self._search_approximate_index(index, query_embedding, top_k)
        else:
            return []
    
    def _search_approximate_index(
        self,
        index: Any,
        query_embedding: List[float],
        top_k: int
    ) -> List[Tuple[int, float]]:
        """Search approximate index"""
        try:
            query_array = np.array(query_embedding).reshape(1, -1)
            distances, indices = index["index"].kneighbors(query_array, n_neighbors=top_k)
            
            results = []
            for i, (distance, idx) in enumerate(zip(distances[0], indices[0])):
                similarity = 1.0 - distance  # Convert distance to similarity
                results.append((int(idx), float(similarity)))
            
            return results
            
        except Exception as e:
            logger.error(f"Error searching approximate index: {e}")
            return [] 