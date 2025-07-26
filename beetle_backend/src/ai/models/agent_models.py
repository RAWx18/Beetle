from datetime import datetime
from typing import Dict, List, Optional, Any, Union
from pydantic import BaseModel, Field, ConfigDict
from enum import Enum
from .workflow_models import AgentType


class AgentStatus(str, Enum):
    """Agent operational status"""
    IDLE = "idle"
    BUSY = "busy"
    OFFLINE = "offline"
    ERROR = "error"
    INITIALIZING = "initializing"
    MAINTENANCE = "maintenance"


class TaskPriority(str, Enum):
    """Task priority levels"""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    CRITICAL = "critical"
    URGENT = "urgent"


class CommunicationType(str, Enum):
    """Types of inter-agent communication"""
    TASK_REQUEST = "task_request"
    TASK_RESPONSE = "task_response"
    DATA_SHARE = "data_share"
    STATUS_UPDATE = "status_update"
    ERROR_REPORT = "error_report"
    COLLABORATION_REQUEST = "collaboration_request"
    HEARTBEAT = "heartbeat"


class AgentConfig(BaseModel):
    """Enhanced agent configuration"""
    model_config = ConfigDict(protected_namespaces=())
    
    agent_id: str = Field(..., description="Unique agent identifier")
    agent_type: AgentType = Field(..., description="Type of agent")
    name: str = Field(..., description="Agent name")
    description: str = Field(..., description="Agent description")
    version: str = Field(default="1.0.0", description="Agent version")
    
    # Performance settings
    max_concurrent_tasks: int = Field(default=5, description="Maximum concurrent tasks")
    task_timeout: int = Field(default=300, description="Task timeout in seconds")
    max_retries: int = Field(default=3, description="Maximum retries per task")
    retry_delay: float = Field(default=1.0, description="Delay between retries in seconds")
    
    # Resource settings
    memory_limit: Optional[int] = Field(None, description="Memory limit in MB")
    cpu_limit: Optional[float] = Field(None, description="CPU limit (0.0-1.0)")
    gpu_enabled: bool = Field(default=False, description="Enable GPU acceleration")
    
    # Communication settings
    heartbeat_interval: int = Field(default=30, description="Heartbeat interval in seconds")
    communication_timeout: int = Field(default=60, description="Communication timeout in seconds")
    
    # Model settings
    model_configs: Dict[str, Any] = Field(default_factory=dict, description="Model-specific configurations")
    
    # Logging settings
    log_level: str = Field(default="INFO", description="Logging level")
    enable_metrics: bool = Field(default=True, description="Enable metrics collection")
    
    # Security settings
    authentication_required: bool = Field(default=False, description="Require authentication")
    encryption_enabled: bool = Field(default=True, description="Enable communication encryption")
    
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional configuration metadata")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class AgentRegistration(BaseModel):
    """Agent registration information"""
    model_config = ConfigDict(protected_namespaces=())
    
    agent_id: str = Field(..., description="Unique agent identifier")
    agent_type: AgentType = Field(..., description="Agent type")
    config: AgentConfig = Field(..., description="Agent configuration")
    capabilities: List[str] = Field(..., description="Agent capabilities")
    endpoint: Optional[str] = Field(None, description="Agent endpoint URL")
    health_check_url: Optional[str] = Field(None, description="Health check endpoint")
    registration_time: datetime = Field(default_factory=datetime.utcnow)
    last_seen: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = Field(default=True, description="Whether agent is active")


class AgentTask(BaseModel):
    """Enhanced agent task definition"""
    model_config = ConfigDict(protected_namespaces=())
    
    task_id: str = Field(..., description="Unique task identifier")
    agent_id: str = Field(..., description="Assigned agent ID")
    task_type: str = Field(..., description="Type of task")
    priority: TaskPriority = Field(default=TaskPriority.NORMAL, description="Task priority")
    
    # Task data
    input_data: Dict[str, Any] = Field(default_factory=dict, description="Task input data")
    expected_output: Dict[str, Any] = Field(default_factory=dict, description="Expected output format")
    
    # Execution settings
    timeout: int = Field(default=300, description="Task timeout in seconds")
    max_retries: int = Field(default=3, description="Maximum retries")
    retry_delay: float = Field(default=1.0, description="Delay between retries")
    
    # Dependencies and constraints
    dependencies: List[str] = Field(default_factory=list, description="Task dependencies")
    required_capabilities: List[str] = Field(default_factory=list, description="Required agent capabilities")
    resource_requirements: Dict[str, Any] = Field(default_factory=dict, description="Resource requirements")
    
    # Scheduling
    scheduled_time: Optional[datetime] = Field(None, description="Scheduled execution time")
    deadline: Optional[datetime] = Field(None, description="Task deadline")
    
    # Status tracking
    status: str = Field(default="pending", description="Task status")
    progress: float = Field(default=0.0, description="Task progress (0.0-1.0)")
    current_retry: int = Field(default=0, description="Current retry attempt")
    
    # Results
    output_data: Optional[Dict[str, Any]] = Field(None, description="Task output data")
    error_message: Optional[str] = Field(None, description="Error message if failed")
    
    # Timing
    created_at: datetime = Field(default_factory=datetime.utcnow)
    started_at: Optional[datetime] = Field(None, description="Task start time")
    completed_at: Optional[datetime] = Field(None, description="Task completion time")
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Task metadata")


class AgentMessage(BaseModel):
    """Enhanced inter-agent communication message"""
    model_config = ConfigDict(protected_namespaces=())
    
    message_id: str = Field(..., description="Unique message identifier")
    sender_id: str = Field(..., description="Sender agent ID")
    receiver_id: str = Field(..., description="Receiver agent ID")
    message_type: CommunicationType = Field(..., description="Message type")
    
    # Message content
    content: Dict[str, Any] = Field(..., description="Message content")
    attachments: List[Dict[str, Any]] = Field(default_factory=list, description="Message attachments")
    
    # Message properties
    priority: TaskPriority = Field(default=TaskPriority.NORMAL, description="Message priority")
    encrypted: bool = Field(default=True, description="Whether message is encrypted")
    requires_acknowledgment: bool = Field(default=False, description="Requires acknowledgment")
    
    # Routing
    routing_path: List[str] = Field(default_factory=list, description="Message routing path")
    ttl: int = Field(default=3600, description="Time to live in seconds")
    
    # Status tracking
    delivered: bool = Field(default=False, description="Whether message was delivered")
    acknowledged: bool = Field(default=False, description="Whether message was acknowledged")
    delivery_time: Optional[datetime] = Field(None, description="Delivery timestamp")
    acknowledgment_time: Optional[datetime] = Field(None, description="Acknowledgment timestamp")
    
    # Timing
    created_at: datetime = Field(default_factory=datetime.utcnow)
    sent_at: Optional[datetime] = Field(None, description="Send timestamp")
    
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Message metadata")


class AgentMetrics(BaseModel):
    """Agent performance and health metrics"""
    model_config = ConfigDict(protected_namespaces=())
    
    agent_id: str = Field(..., description="Agent identifier")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    # Performance metrics
    tasks_completed: int = Field(default=0, description="Total tasks completed")
    tasks_failed: int = Field(default=0, description="Total tasks failed")
    tasks_in_progress: int = Field(default=0, description="Tasks currently in progress")
    average_task_time: float = Field(default=0.0, description="Average task completion time")
    success_rate: float = Field(default=1.0, description="Task success rate")
    
    # Resource usage
    cpu_usage: float = Field(default=0.0, description="CPU usage percentage")
    memory_usage: float = Field(default=0.0, description="Memory usage percentage")
    gpu_usage: Optional[float] = Field(None, description="GPU usage percentage")
    disk_usage: float = Field(default=0.0, description="Disk usage percentage")
    
    # Communication metrics
    messages_sent: int = Field(default=0, description="Messages sent")
    messages_received: int = Field(default=0, description="Messages received")
    communication_errors: int = Field(default=0, description="Communication errors")
    
    # Health indicators
    uptime: float = Field(default=0.0, description="Agent uptime in seconds")
    last_heartbeat: datetime = Field(default_factory=datetime.utcnow)
    health_score: float = Field(default=1.0, description="Overall health score")
    
    # Custom metrics
    custom_metrics: Dict[str, Any] = Field(default_factory=dict, description="Custom agent-specific metrics")
    
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Metrics metadata")


class AgentHealth(BaseModel):
    """Agent health status"""
    model_config = ConfigDict(protected_namespaces=())
    
    agent_id: str = Field(..., description="Agent identifier")
    status: AgentStatus = Field(..., description="Agent status")
    health_score: float = Field(..., description="Health score (0.0-1.0)")
    
    # Health checks
    is_responsive: bool = Field(..., description="Agent is responsive")
    can_process_tasks: bool = Field(..., description="Agent can process tasks")
    has_required_resources: bool = Field(..., description="Agent has required resources")
    is_authenticated: bool = Field(..., description="Agent is authenticated")
    
    # Issues
    issues: List[str] = Field(default_factory=list, description="Current issues")
    warnings: List[str] = Field(default_factory=list, description="Current warnings")
    
    # Last check
    last_health_check: datetime = Field(default_factory=datetime.utcnow)
    next_health_check: datetime = Field(..., description="Next scheduled health check")
    
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Health metadata")


class AgentCollaboration(BaseModel):
    """Multi-agent collaboration session"""
    model_config = ConfigDict(protected_namespaces=())
    
    collaboration_id: str = Field(..., description="Unique collaboration identifier")
    name: str = Field(..., description="Collaboration name")
    description: str = Field(..., description="Collaboration description")
    
    # Participants
    participants: List[str] = Field(..., description="Participating agent IDs")
    coordinator_id: str = Field(..., description="Coordinating agent ID")
    
    # Collaboration state
    status: str = Field(default="active", description="Collaboration status")
    phase: str = Field(default="planning", description="Current collaboration phase")
    
    # Shared resources
    shared_data: Dict[str, Any] = Field(default_factory=dict, description="Shared data")
    shared_context: Dict[str, Any] = Field(default_factory=dict, description="Shared context")
    
    # Communication
    communication_log: List[AgentMessage] = Field(default_factory=list, description="Communication history")
    decisions: List[Dict[str, Any]] = Field(default_factory=list, description="Collaborative decisions")
    
    # Timing
    created_at: datetime = Field(default_factory=datetime.utcnow)
    started_at: Optional[datetime] = Field(None, description="Collaboration start time")
    completed_at: Optional[datetime] = Field(None, description="Collaboration completion time")
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Collaboration metadata") 