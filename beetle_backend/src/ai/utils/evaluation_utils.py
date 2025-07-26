import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
import json
import re
from collections import Counter
import numpy as np

logger = logging.getLogger(__name__)


class EvaluationUtils:
    """Utility functions for RAG system evaluation and metrics calculation"""
    
    def __init__(self):
        self.metrics = {}
    
    def calculate_retrieval_metrics(
        self,
        query: str,
        retrieved_docs: List[Dict[str, Any]],
        relevant_docs: List[Dict[str, Any]],
        k: int = 10
    ) -> Dict[str, float]:
        """Calculate retrieval performance metrics"""
        if not retrieved_docs:
            return {
                "precision": 0.0,
                "recall": 0.0,
                "f1_score": 0.0,
                "mrr": 0.0,
                "ndcg": 0.0,
            }
        
        # Get relevant document IDs
        relevant_ids = {doc.get("id") for doc in relevant_docs}
        
        # Calculate precision@k
        retrieved_ids = [doc.get("id") for doc in retrieved_docs[:k]]
        relevant_retrieved = len(set(retrieved_ids) & relevant_ids)
        precision = relevant_retrieved / len(retrieved_ids) if retrieved_ids else 0.0
        
        # Calculate recall@k
        recall = relevant_retrieved / len(relevant_ids) if relevant_ids else 0.0
        
        # Calculate F1 score
        f1_score = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
        
        # Calculate Mean Reciprocal Rank (MRR)
        mrr = self._calculate_mrr(retrieved_docs, relevant_ids)
        
        # Calculate Normalized Discounted Cumulative Gain (NDCG)
        ndcg = self._calculate_ndcg(retrieved_docs, relevant_ids, k)
        
        return {
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1_score": round(f1_score, 4),
            "mrr": round(mrr, 4),
            "ndcg": round(ndcg, 4),
        }
    
    def _calculate_mrr(self, retrieved_docs: List[Dict[str, Any]], relevant_ids: set) -> float:
        """Calculate Mean Reciprocal Rank"""
        for i, doc in enumerate(retrieved_docs):
            if doc.get("id") in relevant_ids:
                return 1.0 / (i + 1)
        return 0.0
    
    def _calculate_ndcg(
        self,
        retrieved_docs: List[Dict[str, Any]],
        relevant_ids: set,
        k: int
    ) -> float:
        """Calculate Normalized Discounted Cumulative Gain"""
        dcg = 0.0
        idcg = 0.0
        
        # Calculate DCG
        for i, doc in enumerate(retrieved_docs[:k]):
            relevance = 1.0 if doc.get("id") in relevant_ids else 0.0
            dcg += relevance / (np.log2(i + 2))  # log2(i+2) for discounting
        
        # Calculate IDCG (ideal DCG)
        num_relevant = min(len(relevant_ids), k)
        for i in range(num_relevant):
            idcg += 1.0 / (np.log2(i + 2))
        
        return dcg / idcg if idcg > 0 else 0.0
    
    def calculate_generation_metrics(
        self,
        generated_answer: str,
        reference_answer: str,
        context: List[Dict[str, Any]]
    ) -> Dict[str, float]:
        """Calculate answer generation quality metrics"""
        # Calculate BLEU score (simplified)
        bleu_score = self._calculate_bleu_score(generated_answer, reference_answer)
        
        # Calculate ROUGE score (simplified)
        rouge_score = self._calculate_rouge_score(generated_answer, reference_answer)
        
        # Calculate answer relevance
        relevance_score = self._calculate_answer_relevance(generated_answer, context)
        
        # Calculate factual consistency
        consistency_score = self._calculate_factual_consistency(generated_answer, context)
        
        # Calculate answer completeness
        completeness_score = self._calculate_answer_completeness(generated_answer, reference_answer)
        
        return {
            "bleu_score": round(bleu_score, 4),
            "rouge_score": round(rouge_score, 4),
            "relevance_score": round(relevance_score, 4),
            "consistency_score": round(consistency_score, 4),
            "completeness_score": round(completeness_score, 4),
        }
    
    def _calculate_bleu_score(self, generated: str, reference: str) -> float:
        """Calculate simplified BLEU score"""
        # Tokenize
        gen_tokens = generated.lower().split()
        ref_tokens = reference.lower().split()
        
        if not gen_tokens:
            return 0.0
        
        # Calculate n-gram overlaps
        overlaps = 0
        for i in range(len(gen_tokens)):
            for j in range(len(ref_tokens)):
                if gen_tokens[i] == ref_tokens[j]:
                    overlaps += 1
                    break
        
        precision = overlaps / len(gen_tokens)
        
        # Calculate brevity penalty
        bp = 1.0 if len(gen_tokens) >= len(ref_tokens) else np.exp(1 - len(ref_tokens) / len(gen_tokens))
        
        return bp * precision
    
    def _calculate_rouge_score(self, generated: str, reference: str) -> float:
        """Calculate simplified ROUGE score"""
        # Tokenize
        gen_tokens = set(generated.lower().split())
        ref_tokens = set(reference.lower().split())
        
        if not ref_tokens:
            return 0.0
        
        # Calculate overlap
        overlap = len(gen_tokens & ref_tokens)
        recall = overlap / len(ref_tokens)
        
        return recall
    
    def _calculate_answer_relevance(self, answer: str, context: List[Dict[str, Any]]) -> float:
        """Calculate answer relevance to context"""
        if not context:
            return 0.0
        
        # Extract key terms from context
        context_text = " ".join([doc.get("content", "") for doc in context])
        context_terms = set(self._extract_key_terms(context_text))
        
        # Extract key terms from answer
        answer_terms = set(self._extract_key_terms(answer))
        
        if not context_terms:
            return 0.0
        
        # Calculate overlap
        overlap = len(answer_terms & context_terms)
        relevance = overlap / len(context_terms)
        
        return min(relevance, 1.0)
    
    def _calculate_factual_consistency(self, answer: str, context: List[Dict[str, Any]]) -> float:
        """Calculate factual consistency with context"""
        if not context:
            return 0.0
        
        # Extract facts from context
        context_facts = self._extract_facts(" ".join([doc.get("content", "") for doc in context]))
        answer_facts = self._extract_facts(answer)
        
        if not context_facts:
            return 1.0  # No facts to check against
        
        # Check for contradictions
        contradictions = 0
        for fact in answer_facts:
            if self._is_contradictory(fact, context_facts):
                contradictions += 1
        
        consistency = 1.0 - (contradictions / len(answer_facts)) if answer_facts else 1.0
        return max(consistency, 0.0)
    
    def _calculate_answer_completeness(self, generated: str, reference: str) -> float:
        """Calculate answer completeness compared to reference"""
        if not reference:
            return 1.0
        
        # Extract key information from reference
        ref_info = self._extract_key_information(reference)
        gen_info = self._extract_key_information(generated)
        
        if not ref_info:
            return 1.0
        
        # Calculate coverage
        covered = len(ref_info & gen_info)
        completeness = covered / len(ref_info)
        
        return completeness
    
    def _extract_key_terms(self, text: str) -> List[str]:
        """Extract key terms from text"""
        # Simple key term extraction
        words = re.findall(r'\b\w+\b', text.lower())
        
        # Filter out common stop words
        stop_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
            'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'
        }
        
        key_terms = [word for word in words if len(word) > 2 and word not in stop_words]
        return key_terms
    
    def _extract_facts(self, text: str) -> List[str]:
        """Extract factual statements from text"""
        # Simple fact extraction based on patterns
        facts = []
        
        # Look for statements with numbers, dates, names
        patterns = [
            r'\d+',  # Numbers
            r'\b\d{4}\b',  # Years
            r'\b[A-Z][a-z]+ [A-Z][a-z]+\b',  # Names
            r'\b[A-Z][a-z]+ [A-Z][a-z]+ [A-Z][a-z]+\b',  # Full names
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text)
            facts.extend(matches)
        
        return list(set(facts))
    
    def _is_contradictory(self, fact: str, context_facts: List[str]) -> bool:
        """Check if a fact contradicts context facts"""
        # Simple contradiction detection
        fact_lower = fact.lower()
        
        for context_fact in context_facts:
            context_fact_lower = context_fact.lower()
            
            # Check for direct contradictions
            if fact_lower != context_fact_lower and len(fact_lower) > 3:
                # This is a simplified check - in practice, you'd want more sophisticated logic
                return False
        
        return False
    
    def _extract_key_information(self, text: str) -> set:
        """Extract key information from text"""
        # Extract important phrases and concepts
        key_info = set()
        
        # Look for important patterns
        patterns = [
            r'\b[A-Z][a-z]+ [A-Z][a-z]+\b',  # Proper nouns
            r'\b\d+[.,]\d+\b',  # Numbers with decimals
            r'\b[A-Z]{2,}\b',  # Acronyms
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text)
            key_info.update(matches)
        
        return key_info
    
    def calculate_rag_metrics(
        self,
        query: str,
        retrieved_docs: List[Dict[str, Any]],
        generated_answer: str,
        reference_answer: str,
        relevant_docs: List[Dict[str, Any]],
        context: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Calculate comprehensive RAG metrics"""
        # Retrieval metrics
        retrieval_metrics = self.calculate_retrieval_metrics(
            query, retrieved_docs, relevant_docs
        )
        
        # Generation metrics
        generation_metrics = self.calculate_generation_metrics(
            generated_answer, reference_answer, context
        )
        
        # Combined metrics
        combined_metrics = {
            "retrieval": retrieval_metrics,
            "generation": generation_metrics,
            "overall_score": self._calculate_overall_score(retrieval_metrics, generation_metrics),
        }
        
        return combined_metrics
    
    def _calculate_overall_score(
        self,
        retrieval_metrics: Dict[str, float],
        generation_metrics: Dict[str, float]
    ) -> float:
        """Calculate overall RAG performance score"""
        # Weighted combination of metrics
        weights = {
            "retrieval": {
                "precision": 0.2,
                "recall": 0.2,
                "f1_score": 0.3,
                "mrr": 0.15,
                "ndcg": 0.15,
            },
            "generation": {
                "bleu_score": 0.2,
                "rouge_score": 0.2,
                "relevance_score": 0.25,
                "consistency_score": 0.2,
                "completeness_score": 0.15,
            }
        }
        
        # Calculate weighted retrieval score
        retrieval_score = sum(
            retrieval_metrics[metric] * weight
            for metric, weight in weights["retrieval"].items()
        )
        
        # Calculate weighted generation score
        generation_score = sum(
            generation_metrics[metric] * weight
            for metric, weight in weights["generation"].items()
        )
        
        # Overall score (equal weight to retrieval and generation)
        overall_score = (retrieval_score + generation_score) / 2
        
        return round(overall_score, 4)
    
    def evaluate_response_quality(
        self,
        response: str,
        criteria: List[str]
    ) -> Dict[str, float]:
        """Evaluate response quality based on specific criteria"""
        scores = {}
        
        for criterion in criteria:
            if criterion == "clarity":
                scores[criterion] = self._evaluate_clarity(response)
            elif criterion == "conciseness":
                scores[criterion] = self._evaluate_conciseness(response)
            elif criterion == "accuracy":
                scores[criterion] = self._evaluate_accuracy(response)
            elif criterion == "helpfulness":
                scores[criterion] = self._evaluate_helpfulness(response)
            else:
                scores[criterion] = 0.0
        
        return scores
    
    def _evaluate_clarity(self, response: str) -> float:
        """Evaluate response clarity"""
        if not response:
            return 0.0
        
        # Simple clarity metrics
        sentences = response.split('.')
        avg_sentence_length = sum(len(s.split()) for s in sentences) / len(sentences)
        
        # Shorter sentences are generally clearer
        clarity_score = max(0, 1 - (avg_sentence_length - 10) / 20)
        
        return min(clarity_score, 1.0)
    
    def _evaluate_conciseness(self, response: str) -> float:
        """Evaluate response conciseness"""
        if not response:
            return 0.0
        
        # Count words
        word_count = len(response.split())
        
        # Optimal length is around 50-100 words
        if 50 <= word_count <= 100:
            conciseness_score = 1.0
        elif word_count < 50:
            conciseness_score = word_count / 50
        else:
            conciseness_score = max(0, 1 - (word_count - 100) / 100)
        
        return conciseness_score
    
    def _evaluate_accuracy(self, response: str) -> float:
        """Evaluate response accuracy (placeholder)"""
        # This would require domain-specific knowledge
        # For now, return a neutral score
        return 0.5
    
    def _evaluate_helpfulness(self, response: str) -> float:
        """Evaluate response helpfulness"""
        if not response:
            return 0.0
        
        # Check for helpful indicators
        helpful_indicators = [
            'here', 'example', 'solution', 'answer', 'explanation',
            'because', 'therefore', 'however', 'additionally'
        ]
        
        response_lower = response.lower()
        helpful_count = sum(1 for indicator in helpful_indicators if indicator in response_lower)
        
        helpfulness_score = min(helpful_count / 5, 1.0)
        
        return helpfulness_score
    
    def generate_evaluation_report(
        self,
        evaluation_results: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Generate comprehensive evaluation report"""
        if not evaluation_results:
            return {"error": "No evaluation results provided"}
        
        # Aggregate metrics
        total_queries = len(evaluation_results)
        
        # Calculate averages
        avg_metrics = {}
        for result in evaluation_results:
            for category, metrics in result.items():
                if category not in avg_metrics:
                    avg_metrics[category] = {}
                
                for metric, value in metrics.items():
                    if metric not in avg_metrics[category]:
                        avg_metrics[category][metric] = []
                    avg_metrics[category][metric].append(value)
        
        # Calculate averages
        for category in avg_metrics:
            for metric in avg_metrics[category]:
                values = avg_metrics[category][metric]
                avg_metrics[category][metric] = {
                    "mean": round(sum(values) / len(values), 4),
                    "min": round(min(values), 4),
                    "max": round(max(values), 4),
                    "std": round(self._calculate_std(values), 4),
                }
        
        # Generate report
        report = {
            "summary": {
                "total_queries": total_queries,
                "evaluation_date": datetime.utcnow().isoformat(),
            },
            "metrics": avg_metrics,
            "recommendations": self._generate_recommendations(avg_metrics),
        }
        
        return report
    
    def _calculate_std(self, values: List[float]) -> float:
        """Calculate standard deviation"""
        if len(values) < 2:
            return 0.0
        
        mean = sum(values) / len(values)
        variance = sum((x - mean) ** 2 for x in values) / (len(values) - 1)
        return variance ** 0.5
    
    def _generate_recommendations(self, metrics: Dict[str, Any]) -> List[str]:
        """Generate recommendations based on metrics"""
        recommendations = []
        
        # Check retrieval performance
        if "retrieval" in metrics:
            retrieval = metrics["retrieval"]
            
            if retrieval.get("precision", {}).get("mean", 0) < 0.5:
                recommendations.append("Consider improving retrieval precision by refining search algorithms or embeddings")
            
            if retrieval.get("recall", {}).get("mean", 0) < 0.5:
                recommendations.append("Consider improving retrieval recall by expanding search scope or improving indexing")
        
        # Check generation performance
        if "generation" in metrics:
            generation = metrics["generation"]
            
            if generation.get("consistency_score", {}).get("mean", 0) < 0.7:
                recommendations.append("Consider improving factual consistency by enhancing context understanding")
            
            if generation.get("relevance_score", {}).get("mean", 0) < 0.7:
                recommendations.append("Consider improving answer relevance by better prompt engineering")
        
        if not recommendations:
            recommendations.append("System performance is good. Consider fine-tuning for specific use cases")
        
        return recommendations


# Global evaluation utils instance
evaluation_utils = EvaluationUtils()


def get_evaluation_utils() -> EvaluationUtils:
    """Get the global evaluation utils instance"""
    return evaluation_utils 