from datetime import datetime
from typing import Dict, List, Optional, Any, Union
from pydantic import BaseModel, Field, ConfigDict
from enum import Enum
from .document import SourceType


class WorkflowStatus(str, Enum):
    """Workflow execution status"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    PAUSED = "paused"


class TaskStatus(str, Enum):
    """Individual task status"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"
    CANCELLED = "cancelled"


class AgentType(str, Enum):
    """Types of agents in the system"""
    DOCUMENT_PROCESSOR = "document_processor"
    CHUNKING = "chunking"
    EMBEDDING = "embedding"
    RETRIEVAL = "retrieval"
    RERANKING = "reranking"
    GENERATION = "generation"
    CODE_ANALYSIS = "code_analysis"
    DOCUMENTATION = "documentation"
    TESTING = "testing"
    OPTIMIZATION = "optimization"
    DECISION = "decision"
    COLLABORATION = "collaboration"


class WorkflowDefinition(BaseModel):
    """Workflow structure and steps"""
    model_config = ConfigDict(protected_namespaces=())
    
    id: str = Field(..., description="Unique workflow ID")
    name: str = Field(..., description="Workflow name")
    description: str = Field(..., description="Workflow description")
    version: str = Field(default="1.0.0", description="Workflow version")
    steps: List[Dict[str, Any]] = Field(..., description="Workflow steps")
    dependencies: Dict[str, List[str]] = Field(default_factory=dict, description="Step dependencies")
    max_retries: int = Field(default=3, description="Maximum retries per step")
    timeout: int = Field(default=300, description="Workflow timeout in seconds")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Workflow metadata")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class WorkflowExecution(BaseModel):
    """Execution state and progress"""
    model_config = ConfigDict(protected_namespaces=())
    
    id: str = Field(..., description="Unique execution ID")
    workflow_id: str = Field(..., description="Associated workflow ID")
    status: WorkflowStatus = Field(default=WorkflowStatus.PENDING, description="Execution status")
    current_step: Optional[str] = Field(None, description="Current step being executed")
    completed_steps: List[str] = Field(default_factory=list, description="Completed steps")
    failed_steps: List[str] = Field(default_factory=list, description="Failed steps")
    progress: float = Field(default=0.0, description="Progress percentage")
    start_time: Optional[datetime] = Field(None, description="Execution start time")
    end_time: Optional[datetime] = Field(None, description="Execution end time")
    duration: Optional[float] = Field(None, description="Execution duration in seconds")
    input_data: Dict[str, Any] = Field(default_factory=dict, description="Input data")
    output_data: Dict[str, Any] = Field(default_factory=dict, description="Output data")
    error_message: Optional[str] = Field(None, description="Error message if failed")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Execution metadata")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class AgentTask(BaseModel):
    """Individual agent task definition"""
    model_config = ConfigDict(protected_namespaces=())
    
    id: str = Field(..., description="Unique task ID")
    workflow_execution_id: str = Field(..., description="Associated workflow execution")
    step_id: str = Field(..., description="Workflow step ID")
    agent_type: AgentType = Field(..., description="Agent type to execute")
    status: TaskStatus = Field(default=TaskStatus.PENDING, description="Task status")
    input_data: Dict[str, Any] = Field(default_factory=dict, description="Task input data")
    output_data: Dict[str, Any] = Field(default_factory=dict, description="Task output data")
    dependencies: List[str] = Field(default_factory=list, description="Task dependencies")
    retry_count: int = Field(default=0, description="Number of retries")
    max_retries: int = Field(default=3, description="Maximum retries")
    start_time: Optional[datetime] = Field(None, description="Task start time")
    end_time: Optional[datetime] = Field(None, description="Task end time")
    duration: Optional[float] = Field(None, description="Task duration in seconds")
    error_message: Optional[str] = Field(None, description="Error message if failed")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Task metadata")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class CollaborationContext(BaseModel):
    """Multi-agent collaboration data"""
    model_config = ConfigDict(protected_namespaces=())
    
    id: str = Field(..., description="Unique collaboration ID")
    workflow_execution_id: str = Field(..., description="Associated workflow execution")
    agents_involved: List[str] = Field(..., description="Agent IDs involved")
    shared_data: Dict[str, Any] = Field(default_factory=dict, description="Shared data between agents")
    communication_log: List[Dict[str, Any]] = Field(default_factory=list, description="Communication history")
    consensus_data: Dict[str, Any] = Field(default_factory=dict, description="Consensus results")
    conflicts: List[Dict[str, Any]] = Field(default_factory=list, description="Resolved conflicts")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Collaboration metadata")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class WorkflowResult(BaseModel):
    """Final workflow output"""
    model_config = ConfigDict(protected_namespaces=())
    
    id: str = Field(..., description="Unique result ID")
    workflow_execution_id: str = Field(..., description="Associated workflow execution")
    success: bool = Field(..., description="Whether workflow succeeded")
    output_data: Dict[str, Any] = Field(default_factory=dict, description="Final output data")
    quality_score: Optional[float] = Field(None, description="Output quality score")
    processing_time: float = Field(..., description="Total processing time")
    resource_usage: Dict[str, Any] = Field(default_factory=dict, description="Resource usage metrics")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Result metadata")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AgentCapability(BaseModel):
    """Agent skills and limitations"""
    model_config = ConfigDict(protected_namespaces=())
    
    agent_type: AgentType = Field(..., description="Agent type")
    capabilities: List[str] = Field(..., description="List of capabilities")
    limitations: List[str] = Field(default_factory=list, description="List of limitations")
    input_types: List[str] = Field(..., description="Supported input types")
    output_types: List[str] = Field(..., description="Supported output types")
    performance_metrics: Dict[str, float] = Field(default_factory=dict, description="Performance metrics")
    resource_requirements: Dict[str, Any] = Field(default_factory=dict, description="Resource requirements")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Capability metadata")


class AgentMessage(BaseModel):
    """Inter-agent communication"""
    model_config = ConfigDict(protected_namespaces=())
    
    id: str = Field(..., description="Unique message ID")
    sender_agent: str = Field(..., description="Sending agent ID")
    receiver_agent: str = Field(..., description="Receiving agent ID")
    message_type: str = Field(..., description="Message type")
    content: Dict[str, Any] = Field(..., description="Message content")
    priority: int = Field(default=1, description="Message priority (1-10)")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Message metadata")


class TaskDelegation(BaseModel):
    """Task assignment between agents"""
    model_config = ConfigDict(protected_namespaces=())
    
    id: str = Field(..., description="Unique delegation ID")
    delegator_agent: str = Field(..., description="Delegating agent ID")
    delegate_agent: str = Field(..., description="Delegated agent ID")
    task_id: str = Field(..., description="Associated task ID")
    reason: str = Field(..., description="Reason for delegation")
    priority: int = Field(default=1, description="Delegation priority")
    deadline: Optional[datetime] = Field(None, description="Task deadline")
    status: str = Field(default="pending", description="Delegation status")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Delegation metadata")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class AgentState(BaseModel):
    """Current agent processing state"""
    model_config = ConfigDict(protected_namespaces=())
    
    agent_id: str = Field(..., description="Agent ID")
    status: str = Field(..., description="Agent status")
    current_task: Optional[str] = Field(None, description="Current task ID")
    queue_length: int = Field(default=0, description="Task queue length")
    processing_capacity: int = Field(..., description="Processing capacity")
    resource_usage: Dict[str, Any] = Field(default_factory=dict, description="Current resource usage")
    performance_metrics: Dict[str, float] = Field(default_factory=dict, description="Performance metrics")
    last_heartbeat: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict, description="State metadata") 