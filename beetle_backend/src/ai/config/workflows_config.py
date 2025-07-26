from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field
from enum import Enum


class WorkflowType(str, Enum):
    """Types of workflows"""
    RAG = "rag"
    CODE_ANALYSIS = "code_analysis"
    DOCUMENTATION = "documentation"
    CODE_REVIEW = "code_review"
    TESTING = "testing"
    OPTIMIZATION = "optimization"
    CUSTOM = "custom"


class StepType(str, Enum):
    """Types of workflow steps"""
    SEQUENTIAL = "sequential"
    PARALLEL = "parallel"
    CONDITIONAL = "conditional"
    LOOP = "loop"
    ERROR_HANDLING = "error_handling"


class WorkflowStep(BaseModel):
    """Definition of a workflow step"""
    step_id: str = Field(..., description="Unique step identifier")
    name: str = Field(..., description="Step name")
    description: str = Field(..., description="Step description")
    step_type: StepType = Field(default=StepType.SEQUENTIAL, description="Step type")
    
    # Agent configuration
    agent_type: str = Field(..., description="Type of agent to execute")
    agent_config: Dict[str, Any] = Field(default_factory=dict, description="Agent-specific configuration")
    
    # Execution configuration
    timeout: int = Field(default=300, description="Step timeout in seconds")
    max_retries: int = Field(default=3, description="Maximum retry attempts")
    retry_delay: float = Field(default=1.0, description="Delay between retries")
    
    # Dependencies and flow control
    dependencies: List[str] = Field(default_factory=list, description="Step dependencies")
    conditions: Dict[str, Any] = Field(default_factory=dict, description="Execution conditions")
    
    # Input/output mapping
    input_mapping: Dict[str, str] = Field(default_factory=dict, description="Input parameter mapping")
    output_mapping: Dict[str, str] = Field(default_factory=dict, description="Output parameter mapping")
    
    # Error handling
    error_handler: Optional[str] = Field(default=None, description="Error handler step ID")
    continue_on_error: bool = Field(default=False, description="Continue workflow on step error")
    
    # Metadata
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")


class WorkflowDefinition(BaseModel):
    """Complete workflow definition"""
    workflow_id: str = Field(..., description="Unique workflow identifier")
    name: str = Field(..., description="Workflow name")
    description: str = Field(..., description="Workflow description")
    version: str = Field(default="1.0.0", description="Workflow version")
    workflow_type: WorkflowType = Field(..., description="Type of workflow")
    
    # Steps configuration
    steps: List[WorkflowStep] = Field(..., description="Workflow steps")
    
    # Execution configuration
    max_concurrent_steps: int = Field(default=5, description="Maximum concurrent steps")
    global_timeout: int = Field(default=3600, description="Global workflow timeout")
    enable_rollback: bool = Field(default=False, description="Enable workflow rollback")
    
    # Input/output schema
    input_schema: Dict[str, Any] = Field(default_factory=dict, description="Input data schema")
    output_schema: Dict[str, Any] = Field(default_factory=dict, description="Output data schema")
    
    # Error handling
    global_error_handler: Optional[str] = Field(default=None, description="Global error handler step")
    error_notification: Dict[str, Any] = Field(default_factory=dict, description="Error notification settings")
    
    # Monitoring and logging
    enable_monitoring: bool = Field(default=True, description="Enable workflow monitoring")
    log_level: str = Field(default="INFO", description="Workflow log level")
    
    # Security and access control
    required_permissions: List[str] = Field(default_factory=list, description="Required permissions")
    access_control: Dict[str, Any] = Field(default_factory=dict, description="Access control settings")
    
    # Metadata
    tags: List[str] = Field(default_factory=list, description="Workflow tags")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")


class WorkflowRegistry:
    """Registry for workflow definitions"""
    
    def __init__(self):
        self.workflows: Dict[str, WorkflowDefinition] = {}
        self._load_default_workflows()
    
    def register_workflow(self, workflow: WorkflowDefinition):
        """Register a workflow definition"""
        self.workflows[workflow.workflow_id] = workflow
    
    def get_workflow(self, workflow_id: str) -> Optional[WorkflowDefinition]:
        """Get workflow by ID"""
        return self.workflows.get(workflow_id)
    
    def list_workflows(self, workflow_type: Optional[WorkflowType] = None) -> List[WorkflowDefinition]:
        """List workflows, optionally filtered by type"""
        if workflow_type:
            return [w for w in self.workflows.values() if w.workflow_type == workflow_type]
        return list(self.workflows.values())
    
    def _load_default_workflows(self):
        """Load default workflow definitions"""
        # RAG Workflow
        rag_workflow = WorkflowDefinition(
            workflow_id="rag_workflow_v1",
            name="RAG Processing Workflow",
            description="Complete RAG workflow for document processing and query answering",
            workflow_type=WorkflowType.RAG,
            steps=[
                WorkflowStep(
                    step_id="document_ingestion",
                    name="Document Ingestion",
                    description="Ingest and validate documents",
                    agent_type="document_processor",
                    timeout=600,
                ),
                WorkflowStep(
                    step_id="chunking",
                    name="Document Chunking",
                    description="Split documents into semantic chunks",
                    agent_type="chunking_agent",
                    dependencies=["document_ingestion"],
                    timeout=300,
                ),
                WorkflowStep(
                    step_id="embedding_generation",
                    name="Embedding Generation",
                    description="Generate embeddings for chunks",
                    agent_type="embedding_agent",
                    dependencies=["chunking"],
                    timeout=900,
                ),
                WorkflowStep(
                    step_id="vector_storage",
                    name="Vector Storage",
                    description="Store embeddings in vector database",
                    agent_type="vector_store_service",
                    dependencies=["embedding_generation"],
                    timeout=300,
                ),
            ],
            max_concurrent_steps=3,
            global_timeout=3600,
        )
        self.register_workflow(rag_workflow)
        
        # Code Analysis Workflow
        code_analysis_workflow = WorkflowDefinition(
            workflow_id="code_analysis_workflow_v1",
            name="Code Analysis Workflow",
            description="Analyze code for quality, security, and optimization",
            workflow_type=WorkflowType.CODE_ANALYSIS,
            steps=[
                WorkflowStep(
                    step_id="code_parsing",
                    name="Code Parsing",
                    description="Parse and analyze code structure",
                    agent_type="code_parser_agent",
                    timeout=300,
                ),
                WorkflowStep(
                    step_id="quality_analysis",
                    name="Quality Analysis",
                    description="Analyze code quality metrics",
                    agent_type="code_analysis_agent",
                    dependencies=["code_parsing"],
                    timeout=600,
                ),
                WorkflowStep(
                    step_id="security_scan",
                    name="Security Scan",
                    description="Scan for security vulnerabilities",
                    agent_type="security_agent",
                    dependencies=["code_parsing"],
                    timeout=600,
                ),
                WorkflowStep(
                    step_id="optimization_suggestions",
                    name="Optimization Suggestions",
                    description="Generate optimization recommendations",
                    agent_type="optimization_agent",
                    dependencies=["quality_analysis", "security_scan"],
                    timeout=300,
                ),
            ],
            max_concurrent_steps=2,
            global_timeout=1800,
        )
        self.register_workflow(code_analysis_workflow)
        
        # Documentation Workflow
        documentation_workflow = WorkflowDefinition(
            workflow_id="documentation_workflow_v1",
            name="Documentation Generation Workflow",
            description="Generate comprehensive documentation from code",
            workflow_type=WorkflowType.DOCUMENTATION,
            steps=[
                WorkflowStep(
                    step_id="code_analysis",
                    name="Code Analysis",
                    description="Analyze code structure and functionality",
                    agent_type="code_analysis_agent",
                    timeout=600,
                ),
                WorkflowStep(
                    step_id="api_documentation",
                    name="API Documentation",
                    description="Generate API documentation",
                    agent_type="documentation_agent",
                    dependencies=["code_analysis"],
                    timeout=900,
                ),
                WorkflowStep(
                    step_id="readme_generation",
                    name="README Generation",
                    description="Generate README files",
                    agent_type="documentation_agent",
                    dependencies=["code_analysis"],
                    timeout=300,
                ),
                WorkflowStep(
                    step_id="code_comments",
                    name="Code Comments",
                    description="Add or improve code comments",
                    agent_type="documentation_agent",
                    dependencies=["code_analysis"],
                    timeout=600,
                ),
            ],
            max_concurrent_steps=2,
            global_timeout=2400,
        )
        self.register_workflow(documentation_workflow)
        
        # Code Review Workflow
        code_review_workflow = WorkflowDefinition(
            workflow_id="code_review_workflow_v1",
            name="Code Review Workflow",
            description="Comprehensive code review and feedback generation",
            workflow_type=WorkflowType.CODE_REVIEW,
            steps=[
                WorkflowStep(
                    step_id="code_analysis",
                    name="Code Analysis",
                    description="Analyze code structure and patterns",
                    agent_type="code_analysis_agent",
                    timeout=600,
                ),
                WorkflowStep(
                    step_id="best_practices_check",
                    name="Best Practices Check",
                    description="Check against coding best practices",
                    agent_type="code_review_agent",
                    dependencies=["code_analysis"],
                    timeout=300,
                ),
                WorkflowStep(
                    step_id="security_review",
                    name="Security Review",
                    description="Review for security issues",
                    agent_type="security_agent",
                    dependencies=["code_analysis"],
                    timeout=600,
                ),
                WorkflowStep(
                    step_id="performance_analysis",
                    name="Performance Analysis",
                    description="Analyze performance implications",
                    agent_type="optimization_agent",
                    dependencies=["code_analysis"],
                    timeout=300,
                ),
                WorkflowStep(
                    step_id="feedback_generation",
                    name="Feedback Generation",
                    description="Generate comprehensive review feedback",
                    agent_type="code_review_agent",
                    dependencies=["best_practices_check", "security_review", "performance_analysis"],
                    timeout=300,
                ),
            ],
            max_concurrent_steps=3,
            global_timeout=2100,
        )
        self.register_workflow(code_review_workflow)


# Global workflow registry instance
workflow_registry = WorkflowRegistry()


def get_workflow_registry() -> WorkflowRegistry:
    """Get the global workflow registry"""
    return workflow_registry


def get_workflow(workflow_id: str) -> Optional[WorkflowDefinition]:
    """Get workflow by ID"""
    return workflow_registry.get_workflow(workflow_id)


def list_workflows(workflow_type: Optional[WorkflowType] = None) -> List[WorkflowDefinition]:
    """List workflows, optionally filtered by type"""
    return workflow_registry.list_workflows(workflow_type) 