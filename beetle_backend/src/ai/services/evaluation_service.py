import logging
import asyncio
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
import json
import time

from utils.evaluation_utils import get_evaluation_utils
from services.monitoring_service import get_monitoring_service, record_metric, record_performance

logger = logging.getLogger(__name__)


class EvaluationService:
    """Service for RAG system evaluation and performance assessment"""
    
    def __init__(self):
        self.evaluation_utils = get_evaluation_utils()
        self.monitoring_service = get_monitoring_service()
        self.evaluation_results = []
        self.benchmark_results = {}
    
    async def evaluate_rag_response(
        self,
        query: str,
        retrieved_docs: List[Dict[str, Any]],
        generated_answer: str,
        reference_answer: Optional[str] = None,
        relevant_docs: Optional[List[Dict[str, Any]]] = None,
        context: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """Evaluate a single RAG response"""
        start_time = time.time()
        
        try:
            # Calculate retrieval metrics
            retrieval_metrics = {}
            if relevant_docs:
                retrieval_metrics = self.evaluation_utils.calculate_retrieval_metrics(
                    query, retrieved_docs, relevant_docs
                )
            
            # Calculate generation metrics
            generation_metrics = {}
            if reference_answer and context:
                generation_metrics = self.evaluation_utils.calculate_generation_metrics(
                    generated_answer, reference_answer, context
                )
            
            # Calculate overall metrics
            overall_metrics = {}
            if retrieval_metrics and generation_metrics:
                overall_metrics = self.evaluation_utils.calculate_rag_metrics(
                    query, retrieved_docs, generated_answer, reference_answer, relevant_docs, context
                )
            
            # Evaluate response quality
            quality_metrics = self.evaluation_utils.evaluate_response_quality(
                generated_answer, ["clarity", "conciseness", "helpfulness"]
            )
            
            # Compile results
            evaluation_result = {
                "query": query,
                "timestamp": datetime.utcnow().isoformat(),
                "retrieval_metrics": retrieval_metrics,
                "generation_metrics": generation_metrics,
                "overall_metrics": overall_metrics,
                "quality_metrics": quality_metrics,
                "metadata": {
                    "retrieved_docs_count": len(retrieved_docs),
                    "context_docs_count": len(context) if context else 0,
                    "answer_length": len(generated_answer),
                }
            }
            
            # Record metrics
            self._record_evaluation_metrics(evaluation_result)
            
            # Store result
            self.evaluation_results.append(evaluation_result)
            
            processing_time = time.time() - start_time
            record_performance("evaluate_rag_response", processing_time, True)
            
            return evaluation_result
            
        except Exception as e:
            processing_time = time.time() - start_time
            record_performance("evaluate_rag_response", processing_time, False)
            logger.error(f"Error evaluating RAG response: {e}")
            
            return {
                "error": str(e),
                "query": query,
                "timestamp": datetime.utcnow().isoformat(),
            }
    
    async def evaluate_batch(
        self,
        evaluation_data: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Evaluate a batch of RAG responses"""
        start_time = time.time()
        
        try:
            results = []
            for data in evaluation_data:
                result = await self.evaluate_rag_response(
                    query=data.get("query"),
                    retrieved_docs=data.get("retrieved_docs", []),
                    generated_answer=data.get("generated_answer"),
                    reference_answer=data.get("reference_answer"),
                    relevant_docs=data.get("relevant_docs"),
                    context=data.get("context")
                )
                results.append(result)
            
            # Generate batch report
            batch_report = self.evaluation_utils.generate_evaluation_report(results)
            
            processing_time = time.time() - start_time
            record_performance("evaluate_batch", processing_time, True)
            
            return {
                "batch_report": batch_report,
                "individual_results": results,
                "total_evaluations": len(results),
                "timestamp": datetime.utcnow().isoformat(),
            }
            
        except Exception as e:
            processing_time = time.time() - start_time
            record_performance("evaluate_batch", processing_time, False)
            logger.error(f"Error evaluating batch: {e}")
            
            return {
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
            }
    
    async def run_benchmark(
        self,
        benchmark_name: str,
        test_queries: List[Dict[str, Any]],
        system_config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Run a benchmark test"""
        start_time = time.time()
        
        try:
            # Run evaluations
            evaluation_results = []
            for query_data in test_queries:
                result = await self.evaluate_rag_response(
                    query=query_data.get("query"),
                    retrieved_docs=query_data.get("retrieved_docs", []),
                    generated_answer=query_data.get("generated_answer"),
                    reference_answer=query_data.get("reference_answer"),
                    relevant_docs=query_data.get("relevant_docs"),
                    context=query_data.get("context")
                )
                evaluation_results.append(result)
            
            # Generate benchmark report
            benchmark_report = {
                "benchmark_name": benchmark_name,
                "system_config": system_config,
                "evaluation_report": self.evaluation_utils.generate_evaluation_report(evaluation_results),
                "timestamp": datetime.utcnow().isoformat(),
                "total_queries": len(test_queries),
            }
            
            # Store benchmark result
            self.benchmark_results[benchmark_name] = benchmark_report
            
            processing_time = time.time() - start_time
            record_performance("run_benchmark", processing_time, True)
            
            return benchmark_report
            
        except Exception as e:
            processing_time = time.time() - start_time
            record_performance("run_benchmark", processing_time, False)
            logger.error(f"Error running benchmark: {e}")
            
            return {
                "error": str(e),
                "benchmark_name": benchmark_name,
                "timestamp": datetime.utcnow().isoformat(),
            }
    
    def compare_benchmarks(
        self,
        benchmark_names: List[str]
    ) -> Dict[str, Any]:
        """Compare multiple benchmarks"""
        try:
            if not benchmark_names:
                return {"error": "No benchmark names provided"}
            
            # Get benchmark results
            benchmarks = {}
            for name in benchmark_names:
                if name in self.benchmark_results:
                    benchmarks[name] = self.benchmark_results[name]
                else:
                    logger.warning(f"Benchmark '{name}' not found")
            
            if not benchmarks:
                return {"error": "No valid benchmarks found"}
            
            # Compare metrics
            comparison = {
                "benchmarks": list(benchmarks.keys()),
                "comparison_date": datetime.utcnow().isoformat(),
                "metrics_comparison": {},
            }
            
            # Compare retrieval metrics
            retrieval_comparison = {}
            for name, benchmark in benchmarks.items():
                metrics = benchmark.get("evaluation_report", {}).get("metrics", {})
                retrieval_metrics = metrics.get("retrieval", {})
                if retrieval_metrics:
                    retrieval_comparison[name] = {
                        "precision": retrieval_metrics.get("precision", {}).get("mean", 0),
                        "recall": retrieval_metrics.get("recall", {}).get("mean", 0),
                        "f1_score": retrieval_metrics.get("f1_score", {}).get("mean", 0),
                        "mrr": retrieval_metrics.get("mrr", {}).get("mean", 0),
                        "ndcg": retrieval_metrics.get("ndcg", {}).get("mean", 0),
                    }
            
            comparison["metrics_comparison"]["retrieval"] = retrieval_comparison
            
            # Compare generation metrics
            generation_comparison = {}
            for name, benchmark in benchmarks.items():
                metrics = benchmark.get("evaluation_report", {}).get("metrics", {})
                generation_metrics = metrics.get("generation", {})
                if generation_metrics:
                    generation_comparison[name] = {
                        "bleu_score": generation_metrics.get("bleu_score", {}).get("mean", 0),
                        "rouge_score": generation_metrics.get("rouge_score", {}).get("mean", 0),
                        "relevance_score": generation_metrics.get("relevance_score", {}).get("mean", 0),
                        "consistency_score": generation_metrics.get("consistency_score", {}).get("mean", 0),
                        "completeness_score": generation_metrics.get("completeness_score", {}).get("mean", 0),
                    }
            
            comparison["metrics_comparison"]["generation"] = generation_comparison
            
            # Find best performing benchmark
            best_retrieval = max(retrieval_comparison.items(), key=lambda x: x[1]["f1_score"]) if retrieval_comparison else None
            best_generation = max(generation_comparison.items(), key=lambda x: x[1]["relevance_score"]) if generation_comparison else None
            
            comparison["best_performers"] = {
                "retrieval": best_retrieval[0] if best_retrieval else None,
                "generation": best_generation[0] if best_generation else None,
            }
            
            return comparison
            
        except Exception as e:
            logger.error(f"Error comparing benchmarks: {e}")
            return {"error": str(e)}
    
    def get_evaluation_summary(self) -> Dict[str, Any]:
        """Get summary of all evaluations"""
        try:
            if not self.evaluation_results:
                return {"message": "No evaluations performed yet"}
            
            # Calculate summary statistics
            total_evaluations = len(self.evaluation_results)
            
            # Aggregate metrics
            retrieval_scores = []
            generation_scores = []
            quality_scores = []
            
            for result in self.evaluation_results:
                # Retrieval scores
                retrieval_metrics = result.get("retrieval_metrics", {})
                if retrieval_metrics:
                    retrieval_scores.append(retrieval_metrics.get("f1_score", 0))
                
                # Generation scores
                generation_metrics = result.get("generation_metrics", {})
                if generation_metrics:
                    generation_scores.append(generation_metrics.get("relevance_score", 0))
                
                # Quality scores
                quality_metrics = result.get("quality_metrics", {})
                if quality_metrics:
                    avg_quality = sum(quality_metrics.values()) / len(quality_metrics)
                    quality_scores.append(avg_quality)
            
            summary = {
                "total_evaluations": total_evaluations,
                "average_scores": {
                    "retrieval_f1": sum(retrieval_scores) / len(retrieval_scores) if retrieval_scores else 0,
                    "generation_relevance": sum(generation_scores) / len(generation_scores) if generation_scores else 0,
                    "quality": sum(quality_scores) / len(quality_scores) if quality_scores else 0,
                },
                "score_ranges": {
                    "retrieval_f1": {
                        "min": min(retrieval_scores) if retrieval_scores else 0,
                        "max": max(retrieval_scores) if retrieval_scores else 0,
                    },
                    "generation_relevance": {
                        "min": min(generation_scores) if generation_scores else 0,
                        "max": max(generation_scores) if generation_scores else 0,
                    },
                    "quality": {
                        "min": min(quality_scores) if quality_scores else 0,
                        "max": max(quality_scores) if quality_scores else 0,
                    },
                },
                "benchmarks_count": len(self.benchmark_results),
                "last_evaluation": self.evaluation_results[-1]["timestamp"] if self.evaluation_results else None,
            }
            
            return summary
            
        except Exception as e:
            logger.error(f"Error generating evaluation summary: {e}")
            return {"error": str(e)}
    
    def export_evaluation_results(self, format: str = "json") -> str:
        """Export evaluation results"""
        try:
            data = {
                "evaluation_results": self.evaluation_results,
                "benchmark_results": self.benchmark_results,
                "summary": self.get_evaluation_summary(),
                "export_timestamp": datetime.utcnow().isoformat(),
            }
            
            if format.lower() == "json":
                return json.dumps(data, indent=2, default=str)
            else:
                raise ValueError(f"Unsupported export format: {format}")
                
        except Exception as e:
            logger.error(f"Error exporting evaluation results: {e}")
            return json.dumps({"error": str(e)})
    
    def import_evaluation_results(self, data: str, format: str = "json"):
        """Import evaluation results"""
        try:
            if format.lower() == "json":
                imported_data = json.loads(data)
                
                if "evaluation_results" in imported_data:
                    self.evaluation_results.extend(imported_data["evaluation_results"])
                
                if "benchmark_results" in imported_data:
                    self.benchmark_results.update(imported_data["benchmark_results"])
                
                logger.info("Evaluation results imported successfully")
            else:
                raise ValueError(f"Unsupported import format: {format}")
                
        except Exception as e:
            logger.error(f"Error importing evaluation results: {e}")
            raise
    
    def clear_evaluation_results(self):
        """Clear all evaluation results"""
        self.evaluation_results.clear()
        self.benchmark_results.clear()
        logger.info("Evaluation results cleared")
    
    def _record_evaluation_metrics(self, evaluation_result: Dict[str, Any]):
        """Record evaluation metrics for monitoring"""
        try:
            # Record retrieval metrics
            retrieval_metrics = evaluation_result.get("retrieval_metrics", {})
            if retrieval_metrics:
                record_metric("evaluation", "retrieval_f1", retrieval_metrics.get("f1_score", 0))
                record_metric("evaluation", "retrieval_precision", retrieval_metrics.get("precision", 0))
                record_metric("evaluation", "retrieval_recall", retrieval_metrics.get("recall", 0))
            
            # Record generation metrics
            generation_metrics = evaluation_result.get("generation_metrics", {})
            if generation_metrics:
                record_metric("evaluation", "generation_relevance", generation_metrics.get("relevance_score", 0))
                record_metric("evaluation", "generation_consistency", generation_metrics.get("consistency_score", 0))
                record_metric("evaluation", "generation_completeness", generation_metrics.get("completeness_score", 0))
            
            # Record quality metrics
            quality_metrics = evaluation_result.get("quality_metrics", {})
            if quality_metrics:
                for metric_name, value in quality_metrics.items():
                    record_metric("evaluation", f"quality_{metric_name}", value)
            
        except Exception as e:
            logger.error(f"Error recording evaluation metrics: {e}")


# Global evaluation service instance
_evaluation_service = None


def get_evaluation_service() -> EvaluationService:
    """Get global evaluation service instance"""
    global _evaluation_service
    
    if _evaluation_service is None:
        _evaluation_service = EvaluationService()
    
    return _evaluation_service 