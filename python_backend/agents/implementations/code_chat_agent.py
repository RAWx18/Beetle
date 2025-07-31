"""
Code Chat Agent with Instructor support for structured outputs.
Handles code analysis, debugging assistance, and programming guidance.
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
    """Code Chat Agent with Instructor support."""
    
    def __init__(self, agent_id: str = None):
        """Initialize the code chat agent."""
        super().__init__(
            agent_id=agent_id,
            name="Code Chat Agent",
            description="Agent for code analysis, debugging, and programming assistance with structured outputs"
        )
        
        self.response_generator = get_enhanced_response_generator()
        self.vector_retriever = get_enhanced_vector_retriever()
    
    def _initialize_capabilities(self) -> None:
        """Initialize agent capabilities."""
        self.capabilities = [
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
            )
        ]
    
    async def execute(self, task: AgentTask) -> AgentResult:
        """Execute code chat task."""
        start_time = time.time()
        
        try:
            query = task.input_data.get("query", "")
            task_type = task.task_type
            
            # Get context
            max_chunks = task.parameters.get("max_context_chunks", 5)
            context_chunks = await self.vector_retriever.retrieve_relevant_chunks(query, limit=max_chunks)
            
            # Execute based on task type
            if task_type == "code_analysis":
                output = await self._analyze_code_structured(query, context_chunks)
            elif task_type == "debugging_assistance":
                output = await self._debug_code_structured(query, context_chunks)
            else:
                output = await self._general_chat(query, context_chunks)
            
            return self._create_result(
                task=task,
                success=True,
                output=output,
                execution_time=time.time() - start_time
            )
            
        except Exception as e:
            logger.error("Code chat execution failed", error=str(e))
            return self._create_result(
                task=task,
                success=False,
                output={"error": str(e)},
                error_message=str(e),
                execution_time=time.time() - start_time
            )
    
    async def _analyze_code_structured(self, query: str, context_chunks: list) -> Dict[str, Any]:
        """Analyze code with structured output."""
        analysis = await self.response_generator.generate_structured_code_analysis(
            code_chunks=context_chunks,
            query=query
        )
        return analysis.dict()
    
    async def _debug_code_structured(self, query: str, context_chunks: list) -> Dict[str, Any]:
        """Debug code with structured output."""
        debugging = await self.response_generator.generate_structured_response(
            query=f"Debug: {query}",
            response_model=DebuggingOutput,
            context_chunks=context_chunks
        )
        return debugging.dict()
    
    async def _general_chat(self, query: str, context_chunks: list) -> Dict[str, Any]:
        """General code chat."""
        response = await self.response_generator.generate_response(
            query=query,
            context_chunks=context_chunks,
            agent_type="code_chat"
        )
        return {"response": response}
    
    async def health_check(self) -> bool:
        """Check agent health."""
        try:
            base_healthy = await super().health_check()
            response_healthy = await self.response_generator.health_check()
            retriever_healthy = await self.vector_retriever.health_check()
            return base_healthy and response_healthy and retriever_healthy
        except Exception:
            return False


# Register the agent
from agents.base.base_agent import get_enhanced_agent_registry
agent_registry = get_enhanced_agent_registry()
code_chat_agent = CodeChatAgent()
agent_registry.register(code_chat_agent)
