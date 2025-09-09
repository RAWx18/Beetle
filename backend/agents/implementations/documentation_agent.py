"""
Documentation Agent with Instructor support for structured documentation generation.
Handles docstring generation, API documentation, and technical writing with typed outputs.
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
class DocstringOutput(BaseModel):
    """Structured docstring generation output."""
    docstring: str = Field(description="The generated docstring")
    style: str = Field(description="Docstring style used")
    parameters: List[Dict[str, str]] = Field(description="Parameter descriptions")
    returns: Optional[str] = Field(description="Return value description")
    examples: List[str] = Field(description="Usage examples")
    notes: List[str] = Field(description="Additional notes")


class APIDocumentationOutput(BaseModel):
    """Structured API documentation output."""
    overview: str = Field(description="API overview")
    endpoints: List[Dict[str, Any]] = Field(description="API endpoints documentation")
    examples: List[str] = Field(description="Usage examples")
    parameters: List[Dict[str, str]] = Field(description="Common parameters")
    responses: List[Dict[str, str]] = Field(description="Response descriptions")


class ReadmeOutput(BaseModel):
    """Structured README generation output."""
    title: str = Field(description="Project title")
    description: str = Field(description="Project description")
    installation: str = Field(description="Installation instructions")
    usage: str = Field(description="Usage instructions")
    examples: List[str] = Field(description="Usage examples")
    contributing: str = Field(description="Contributing guidelines")


class DocumentationAgent(BaseAgent):
    """Documentation Agent with structured documentation generation."""
    
    def __init__(self, agent_id: str = None):
        """Initialize the documentation agent."""
        super().__init__(
            agent_id=agent_id,
            name="Documentation Agent",
            description="Agent for documentation generation with structured outputs"
        )
        
        self.response_generator = get_enhanced_response_generator()
        self.vector_retriever = get_enhanced_vector_retriever()
    
    def _initialize_capabilities(self) -> None:
        """Initialize agent capabilities."""
        self.capabilities = [
            AgentCapability(
                name="docstring_generation",
                description="Generate comprehensive docstrings with structured output",
                parameters={
                    "style": "google",
                    "include_examples": True,
                    "structured_output": True
                }
            ),
            AgentCapability(
                name="api_documentation",
                description="Generate structured API documentation",
                parameters={
                    "format": "markdown",
                    "include_examples": True,
                    "structured_output": True
                }
            ),
            AgentCapability(
                name="readme_generation",
                description="Generate structured README files",
                parameters={
                    "include_installation": True,
                    "include_usage": True,
                    "structured_output": True
                }
            ),
            AgentCapability(
                name="technical_writing",
                description="Create technical documentation with structure",
                parameters={
                    "structured_output": True
                }
            )
        ]
    
    async def execute(self, task: AgentTask) -> AgentResult:
        """Execute documentation task."""
        start_time = time.time()
        
        try:
            # Validate task
            if not self._validate_task(task):
                return await self._create_result(
                    task=task,
                    success=False,
                    output={},
                    error_message="Invalid task data",
                    execution_time=time.time() - start_time
                )
            
            # Extract task data
            query = task.input_data.get("query", "")
            code_content = task.input_data.get("code_content", "")
            context_chunks = task.input_data.get("context_chunks")
            
            # Execute based on task type
            if task.task_type == "docstring_generation":
                output = await self._generate_docstring_structured(code_content, context_chunks, task.parameters)
            elif task.task_type == "api_documentation":
                output = await self._generate_api_docs_structured(code_content, context_chunks, task.parameters)
            elif task.task_type == "readme_generation":
                output = await self._generate_readme_structured(query, context_chunks, task.parameters)
            elif task.task_type == "technical_writing":
                output = await self._create_technical_docs_structured(query, context_chunks, task.parameters)
            else:
                output = await self._general_documentation_structured(query, context_chunks, task.parameters)
            
            return await self._create_result(
                task=task,
                success=True,
                output=output,
                execution_time=time.time() - start_time
            )
            
        except Exception as e:
            logger.error("Documentation agent execution failed", error=str(e))
            return await self._create_result(
                task=task,
                success=False,
                output={"error": str(e)},
                error_message=str(e),
                execution_time=time.time() - start_time
            )
    
    def _validate_task(self, task: AgentTask) -> bool:
        """Validate task data."""
        if not task.input_data:
            return False
        
        task_type = task.task_type
        if task_type in ["docstring_generation", "api_documentation"]:
            return "code_content" in task.input_data
        
        return "query" in task.input_data
    
    async def _generate_docstring_structured(self, code_content: str, context_chunks: list, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Generate structured docstrings."""
        if not context_chunks:
            context_chunks = await self.vector_retriever.retrieve_relevant_chunks("docstring generation", limit=3)
        
        style = parameters.get("style", "google")
        
        docstring = await self.response_generator.generate_structured_response(
            query=f"Generate {style} docstring for: {code_content[:200]}...",
            response_model=DocstringOutput,
            context_chunks=context_chunks,
            agent_type="documentation"
        )
        
        return docstring.dict()
    
    async def _generate_api_docs_structured(self, code_content: str, context_chunks: list, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Generate structured API documentation."""
        if not context_chunks:
            context_chunks = await self.vector_retriever.retrieve_relevant_chunks("API documentation", limit=5)
        
        api_docs = await self.response_generator.generate_structured_response(
            query=f"Generate API docs for: {code_content[:200]}...",
            response_model=APIDocumentationOutput,
            context_chunks=context_chunks,
            agent_type="documentation"
        )
        
        return api_docs.dict()
    
    async def _generate_readme_structured(self, query: str, context_chunks: list, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Generate structured README."""
        if not context_chunks:
            context_chunks = await self.vector_retriever.retrieve_relevant_chunks(f"README: {query}", limit=5)
        
        readme = await self.response_generator.generate_structured_response(
            query=f"Generate README for: {query}",
            response_model=ReadmeOutput,
            context_chunks=context_chunks,
            agent_type="documentation"
        )
        
        return readme.dict()
    
    async def _create_technical_docs_structured(self, query: str, context_chunks: list, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Create structured technical documentation."""
        if not context_chunks:
            context_chunks = await self.vector_retriever.retrieve_relevant_chunks(f"technical docs: {query}", limit=5)
        
        tech_docs = await self.response_generator.generate_structured_response(
            query=f"Create technical docs for: {query}",
            response_model=Dict[str, Any],  # Flexible for now
            context_chunks=context_chunks,
            agent_type="documentation"
        )
        
        return tech_docs
    
    async def _general_documentation_structured(self, query: str, context_chunks: list, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """General documentation with structure."""
        if not context_chunks:
            context_chunks = await self.vector_retriever.retrieve_relevant_chunks(f"documentation: {query}", limit=5)
        
        documentation = await self.response_generator.generate_structured_response(
            query=f"Documentation request: {query}",
            response_model=Dict[str, Any],
            context_chunks=context_chunks,
            agent_type="documentation"
        )
        
        return documentation
    
    async def health_check(self) -> bool:
        """Check agent health."""
        try:
            base_healthy = await super().health_check()
            response_healthy = await self.response_generator.health_check()
            retriever_healthy = await self.vector_retriever.health_check()
            return base_healthy and response_healthy and retriever_healthy
        except Exception:
            return False
