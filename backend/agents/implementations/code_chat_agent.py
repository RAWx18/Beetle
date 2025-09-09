"""
Code Chat Agent with Instructor support for structured outputs.
Handles code analysis, debugging assistance, and programming guidance with intelligent query classification.
"""

import time
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
import structlog
from datetime import datetime

from agents.base.base_agent import BaseAgent, AgentCapability, AgentTask, AgentResult
from rag.generation.response_generator import get_enhanced_response_generator
from rag.retrieval.vector_retriever import get_enhanced_vector_retriever
from config.settings import get_settings

logger = structlog.get_logger(__name__)
settings = get_settings()


# Pydantic models for structured outputs
class CodeAnalysisOutput(BaseModel):
    """Structured code analysis output."""
    summary: str = Field(description="Brief summary of what the code does")
    functionality: str = Field(description="Detailed functionality explanation")
    complexity_analysis: Dict[str, Any] = Field(description="Complexity metrics")
    key_insights: List[str] = Field(description="Key insights from the analysis")
    improvement_suggestions: List[str] = Field(description="Suggested improvements")


class DebuggingOutput(BaseModel):
    """Structured debugging assistance output."""
    issue_identification: str = Field(description="Identified issue description")
    root_cause: str = Field(description="Root cause analysis")
    suggested_fixes: List[str] = Field(description="List of suggested fixes")
    code_examples: List[str] = Field(description="Code examples for fixes")
    prevention_tips: List[str] = Field(description="Tips to prevent similar issues")


class CodeChatAgent(BaseAgent):
    """Enhanced Code Chat Agent with intelligent query classification and context-aware responses."""
    
    def __init__(self, agent_id: str = None):
        """Initialize the enhanced code chat agent."""
        super().__init__(
            agent_id=agent_id,
            name="Enhanced Code Chat Agent",
            description="Intelligent agent for code analysis, debugging, and programming assistance with query classification"
        )
        
        self.response_generator = get_enhanced_response_generator()
        self.vector_retriever = get_enhanced_vector_retriever()
    
    def _initialize_capabilities(self) -> None:
        """Initialize agent capabilities."""
        self.capabilities = [
            AgentCapability(
                name="intelligent_code_chat",
                description="Intelligent code chat with query classification and context-aware responses",
                parameters={
                    "query_classification": True,
                    "context_awareness": True,
                    "conversation_flow": True,
                    "response_style_adaptation": True
                }
            ),
            AgentCapability(
                name="code_analysis",
                description="Analyze code functionality with structured insights",
                parameters={
                    "max_context_chunks": 5,
                    "include_complexity_analysis": True,
                    "structured_output": True
                }
            ),
            AgentCapability(
                name="debugging_assistance",
                description="Provide structured debugging assistance with fixes",
                parameters={
                    "error_pattern_matching": True,
                    "suggest_fixes": True,
                    "structured_output": True
                }
            ),
            AgentCapability(
                name="casual_conversation",
                description="Handle casual conversations and greetings naturally",
                parameters={
                    "conversational_tone": True,
                    "context_transition": True,
                    "personality_consistency": True
                }
            )
        ]
    
    async def execute(self, task: AgentTask) -> AgentResult:
        """Execute enhanced code chat task with intelligent classification."""
        start_time = time.time()
        
        try:
            query = task.input_data.get("query", "")
            conversation_history = task.input_data.get("conversation_history", [])
            context_files = task.input_data.get("context_files", [])
            task_type = task.task_type
            
            # Use the new classification-based response generation
            if task_type == "intelligent_code_chat":
                result = await self._generate_intelligent_response(
                    query, conversation_history, context_files, task.parameters
                )
            elif task_type == "code_analysis":
                result = await self._analyze_code_structured(query, task.parameters)
            elif task_type == "debugging_assistance":
                result = await self._debug_code_structured(query, task.parameters)
            else:
                # Fallback to intelligent response generation
                result = await self._generate_intelligent_response(
                    query, conversation_history, context_files, task.parameters
                )
            
            return await self._create_result(
                task=task,
                success=True,
                output=result,
                execution_time=time.time() - start_time
            )
            
        except Exception as e:
            logger.error("Enhanced code chat execution failed", error=str(e))
            return await self._create_result(
                task=task,
                success=False,
                output={"error": str(e)},
                error_message=str(e),
                execution_time=time.time() - start_time
            )
    
    async def _generate_intelligent_response(
        self, 
        query: str, 
        conversation_history: List[Dict[str, str]], 
        context_files: List[str],
        parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate intelligent response with query classification."""
        try:
            # Use the enhanced response generator with classification
            result = await self.response_generator.generate_response_with_classification(
                query=query,
                conversation_history=conversation_history,
                context_files=context_files,
                temperature=parameters.get("temperature", 0.7),
                max_tokens=parameters.get("max_tokens", 1000)
            )
            
            # Extract response and metadata
            response = result.get("response", "No response generated")
            classification = result.get("classification")
            metadata = result.get("metadata", {})
            
            # Add agent-specific metadata and quality metrics
            metadata.update({
                "agent_name": self.name,
                "agent_id": self.agent_id,
                "query_classification": classification.query_type if classification else "unknown",
                "response_style": classification.response_style if classification else "conversational",
                "confidence": classification.confidence if classification else 0.0,
                "response_quality": self._assess_response_quality(response, classification, query),
                "context_relevance": self._assess_context_relevance(metadata.get("context_chunks_count", 0), classification),
                "processing_time": metadata.get("processing_time", 0)
            })
            
            # Post-process response for better quality
            enhanced_response = self._enhance_response_quality(response, classification, metadata)
            
            return {
                "response": enhanced_response,
                "classification": classification.dict() if classification else {},
                "metadata": metadata,
                "context_chunks": result.get("context_chunks", [])
            }
            
        except Exception as e:
            logger.error("Intelligent response generation failed", error=str(e))
            return {
                "response": f"Sorry, I encountered an error: {str(e)}",
                "classification": {
                    "query_type": "ambiguous",
                    "response_style": "conversational",
                    "confidence": 0.0
                },
                "metadata": {"error": str(e)},
                "context_chunks": []
            }
    
    async def _analyze_code_structured(self, query: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze code with structured output."""
        try:
            # Get context chunks
            max_chunks = parameters.get("max_context_chunks", 5)
            context_chunks = await self.vector_retriever.retrieve_relevant_chunks(query, limit=max_chunks)
            
            # Generate structured analysis
            analysis = await self.response_generator.generate_structured_code_analysis(
                code_chunks=context_chunks,
                query=query
            )
            
            return {
                "analysis": analysis.dict(),
                "context_chunks": context_chunks,
                "metadata": {
                    "analysis_type": "structured_code_analysis",
                    "chunks_analyzed": len(context_chunks)
                }
            }
            
        except Exception as e:
            logger.error("Structured code analysis failed", error=str(e))
            return {
                "analysis": {
                    "summary": "Analysis failed",
                    "functionality": f"Error: {str(e)}",
                    "complexity_analysis": {},
                    "key_insights": [],
                    "improvement_suggestions": []
                },
                "context_chunks": [],
                "metadata": {"error": str(e)}
            }
    
    async def _debug_code_structured(self, query: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Debug code with structured output."""
        try:
            # Get context chunks
            max_chunks = parameters.get("max_context_chunks", 5)
            context_chunks = await self.vector_retriever.retrieve_relevant_chunks(query, limit=max_chunks)
            
            # Generate structured debugging response
            debugging = await self.response_generator.generate_structured_response(
                query=f"Debug: {query}",
                response_model=DebuggingOutput,
                context_chunks=context_chunks
            )
            
            return {
                "debugging": debugging.dict(),
                "context_chunks": context_chunks,
                "metadata": {
                    "debugging_type": "structured_debugging",
                    "chunks_analyzed": len(context_chunks)
                }
            }
            
        except Exception as e:
            logger.error("Structured debugging failed", error=str(e))
            return {
                "debugging": {
                    "issue_identification": "Debugging failed",
                    "root_cause": f"Error: {str(e)}",
                    "suggested_fixes": [],
                    "code_examples": [],
                    "prevention_tips": []
                },
                "context_chunks": [],
                "metadata": {"error": str(e)}
            }
    
    async def health_check(self) -> bool:
        """Check agent health."""
        try:
            base_healthy = await super().health_check()
            response_healthy = await self.response_generator.health_check()
            retriever_healthy = await self.vector_retriever.health_check()
            return base_healthy and response_healthy and retriever_healthy
        except Exception:
            return False
    
    def _assess_response_quality(self, response: str, classification: Any, original_query: str) -> Dict[str, Any]:
        """Assess the quality of the generated response."""
        try:
            quality_metrics = {
                "relevance_score": 0.0,
                "completeness_score": 0.0,
                "clarity_score": 0.0,
                "length_appropriateness": 0.0,
                "overall_score": 0.0
            }
            
            # Relevance assessment
            query_lower = original_query.lower()
            response_lower = response.lower()
            
            # Check if response addresses the query
            if classification and hasattr(classification, 'query_type'):
                if classification.query_type == "casual_conversation":
                    # For casual conversations, check for friendly tone
                    friendly_words = ["hi", "hello", "hey", "good", "great", "nice", "thanks", "welcome"]
                    if any(word in response_lower for word in friendly_words):
                        quality_metrics["relevance_score"] = 0.9
                    else:
                        quality_metrics["relevance_score"] = 0.5
                else:
                    # For technical queries, check for technical content
                    technical_indicators = ["code", "function", "class", "error", "debug", "analysis", "example"]
                    if any(indicator in response_lower for indicator in technical_indicators):
                        quality_metrics["relevance_score"] = 0.8
                    else:
                        quality_metrics["relevance_score"] = 0.6
            
            # Completeness assessment
            response_length = len(response)
            if classification and hasattr(classification, 'query_type'):
                if classification.query_type == "casual_conversation":
                    # Casual responses should be brief
                    if 20 <= response_length <= 200:
                        quality_metrics["completeness_score"] = 0.9
                    elif response_length < 20:
                        quality_metrics["completeness_score"] = 0.7
                    else:
                        quality_metrics["completeness_score"] = 0.5
                else:
                    # Technical responses should be more comprehensive
                    if response_length >= 100:
                        quality_metrics["completeness_score"] = 0.8
                    elif response_length >= 50:
                        quality_metrics["completeness_score"] = 0.6
                    else:
                        quality_metrics["completeness_score"] = 0.4
            
            # Clarity assessment
            if response and not response.startswith("Sorry, I encountered an error"):
                quality_metrics["clarity_score"] = 0.8
            else:
                quality_metrics["clarity_score"] = 0.3
            
            # Length appropriateness
            if classification and hasattr(classification, 'query_type'):
                if classification.query_type == "casual_conversation":
                    if response_length <= 150:
                        quality_metrics["length_appropriateness"] = 0.9
                    else:
                        quality_metrics["length_appropriateness"] = 0.5
                else:
                    if response_length >= 50:
                        quality_metrics["length_appropriateness"] = 0.8
                    else:
                        quality_metrics["length_appropriateness"] = 0.6
            
            # Calculate overall score
            quality_metrics["overall_score"] = sum(quality_metrics.values()) / len(quality_metrics)
            
            return quality_metrics
            
        except Exception as e:
            logger.error("Response quality assessment failed", error=str(e))
            return {
                "relevance_score": 0.5,
                "completeness_score": 0.5,
                "clarity_score": 0.5,
                "length_appropriateness": 0.5,
                "overall_score": 0.5
            }
    
    def _assess_context_relevance(self, context_chunks_count: int, classification: Any) -> Dict[str, Any]:
        """Assess the relevance of context used in the response."""
        try:
            relevance_metrics = {
                "context_used": context_chunks_count > 0,
                "context_count": context_chunks_count,
                "context_appropriateness": 0.0
            }
            
            if classification and hasattr(classification, 'query_type'):
                if classification.query_type in ["casual_conversation", "meta_question"]:
                    # No context needed for casual conversations
                    relevance_metrics["context_appropriateness"] = 1.0 if context_chunks_count == 0 else 0.3
                elif classification.query_type in ["technical_question", "code_analysis", "debugging"]:
                    # Technical queries benefit from context
                    if context_chunks_count > 0:
                        relevance_metrics["context_appropriateness"] = 0.8
                    else:
                        relevance_metrics["context_appropriateness"] = 0.4
                else:
                    # Other query types
                    relevance_metrics["context_appropriateness"] = 0.6
            
            return relevance_metrics
            
        except Exception as e:
            logger.error("Context relevance assessment failed", error=str(e))
            return {
                "context_used": False,
                "context_count": 0,
                "context_appropriateness": 0.5
            }
    
    def _enhance_response_quality(self, response: str, classification: Any, metadata: Dict[str, Any]) -> str:
        """Enhance response quality based on classification and metadata."""
        try:
            enhanced_response = response
            
            # Check if response needs improvement based on quality metrics
            quality_metrics = metadata.get("response_quality", {})
            overall_score = quality_metrics.get("overall_score", 0.5)
            
            if overall_score < 0.6:
                # Response quality is low, try to improve it
                if classification and hasattr(classification, 'query_type'):
                    if classification.query_type == "casual_conversation":
                        # Ensure casual responses are friendly
                        if not any(word in response.lower() for word in ["hi", "hello", "hey", "good", "great"]):
                            enhanced_response = f"Hi there! {response}"
                    elif classification.query_type == "debugging":
                        # Ensure debugging responses are structured
                        if "step" not in response.lower() and len(response.split('\n')) > 3:
                            enhanced_response = "Let me help you debug this step by step:\n\n" + response
            
            return enhanced_response
            
        except Exception as e:
            logger.error("Response enhancement failed", error=str(e))
            return response
