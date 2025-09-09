"""
Enhanced base agent interface with Instructor support for structured outputs.
Defines core agent capabilities and protocols with Pydantic models.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List, Type, Generic, TypeVar
from pydantic import BaseModel, Field, validator
from datetime import datetime
import structlog
import uuid
import instructor

logger = structlog.get_logger(__name__)

# Type variable for structured responses
T = TypeVar('T', bound=BaseModel)

# Enhanced Pydantic models for structured agent operations
class AgentCapability(BaseModel):
    """Enhanced agent capability definition with validation."""
    name: str = Field(..., description="Capability name")
    description: str = Field(..., description="Capability description")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Capability parameters")
    enabled: bool = Field(default=True, description="Whether capability is enabled")
    version: str = Field(default="1.0", description="Capability version")
    dependencies: List[str] = Field(default_factory=list, description="Required dependencies")
    
    @validator('name')
    def validate_name(cls, v):
        if not v or not v.strip():
            raise ValueError("Capability name cannot be empty")
        return v.strip()

class AgentTask(BaseModel):
    """Enhanced agent task definition with structured parameters."""
    task_id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique task ID")
    task_type: str = Field(..., description="Type of task")
    input_data: Dict[str, Any] = Field(..., description="Task input data")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Task parameters")
    priority: int = Field(default=1, ge=1, le=10, description="Task priority (1-10)")
    created_at: datetime = Field(default_factory=datetime.now, description="Task creation time")
    timeout: Optional[int] = Field(default=None, ge=1, description="Task timeout in seconds")
    expected_output_type: Optional[str] = Field(default=None, description="Expected output type")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional task metadata")

class AgentResult(BaseModel):
    """Enhanced agent execution result with structured output."""
    task_id: str = Field(..., description="Task ID")
    success: bool = Field(..., description="Whether task was successful")
    output: Dict[str, Any] = Field(..., description="Task output")
    error_message: Optional[str] = Field(default=None, description="Error message if failed")
    execution_time: float = Field(..., description="Execution time in seconds")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
    completed_at: datetime = Field(default_factory=datetime.now, description="Completion time")
    structured_output: Optional[Dict[str, Any]] = Field(default=None, description="Structured output if available")
    
    @validator('execution_time')
    def validate_execution_time(cls, v):
        if v < 0:
            raise ValueError("Execution time must be non-negative")
        return v

class StructuredAgentResult(BaseModel, Generic[T]):
    """Structured agent result with typed output."""
    task_id: str = Field(..., description="Task ID")
    success: bool = Field(..., description="Whether task was successful")
    data: T = Field(..., description="Typed structured output")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
    completed_at: datetime = Field(default_factory=datetime.now, description="Completion time")

class AgentHealthStatus(BaseModel):
    """Agent health status report."""
    agent_id: str = Field(..., description="Agent ID")
    is_healthy: bool = Field(..., description="Overall health status")
    capabilities_status: Dict[str, bool] = Field(default_factory=dict, description="Status of each capability")
    last_check: datetime = Field(default_factory=datetime.now, description="Last health check time")
    issues: List[str] = Field(default_factory=list, description="Health issues found")
    metrics: Dict[str, float] = Field(default_factory=dict, description="Health metrics")

class BaseAgent(ABC):
    """Enhanced base agent with Instructor support for structured outputs."""
    
    def __init__(self, agent_id: str = None, name: str = None, description: str = None):
        """Initialize the agent with Instructor support."""
        self.agent_id = agent_id or str(uuid.uuid4())
        self.name = name or self.__class__.__name__
        self.description = description or f"{self.name} agent"
        self.capabilities: List[AgentCapability] = []
        self.logger = structlog.get_logger(f"{self.__class__.__name__}.{self.agent_id}")
        
        # Agent state
        self.is_active = False
        self.last_activity = None
        self.task_count = 0
        self.success_count = 0
        self.error_count = 0
        
        # Instructor integration
        self._instructor_client = None
        self._setup_instructor()
        
        # Performance tracking
        self._performance_metrics = {
            "total_tasks": 0,
            "successful_tasks": 0,
            "average_execution_time": 0.0,
            "last_24h_tasks": 0,
            "error_types": {},
            "capability_usage": {}
        }
        
        # Initialize capabilities
        self._initialize_capabilities()
    
    def _setup_instructor(self) -> None:
        """Setup Instructor client for structured outputs."""
        try:
            import instructor
            from config.settings import get_settings
            
            settings = get_settings()
            
            # Check if we have OpenAI API key for Instructor
            if not settings.openai_api_key:
                self.logger.warning("OpenAI API key not available, Instructor client disabled")
                self._instructor_client = None
                return
            
            # Create OpenAI client for Instructor (Instructor works best with OpenAI models)
            import openai
            openai_client = openai.OpenAI(
                api_key=settings.openai_api_key,
                base_url=None  # Use default OpenAI base URL
            )
            
            # Create Instructor client from the OpenAI client
            self._instructor_client = instructor.from_openai(
                client=openai_client,
                mode=instructor.Mode.TOOLS
            )
            
            self.logger.info("Instructor client initialized")
        except Exception as e:
            self.logger.warning("Failed to initialize Instructor client", error=str(e))
            self._instructor_client = None
    
    @abstractmethod
    def _initialize_capabilities(self) -> None:
        """Initialize agent capabilities. Must be implemented by subclasses."""
        pass
    
    @abstractmethod
    async def execute(self, task: AgentTask) -> AgentResult:
        """Execute a task. Must be implemented by subclasses."""
        pass
    
    async def execute_structured(self, task: AgentTask, response_model: Type[T]) -> StructuredAgentResult[T]:
        """Execute task with structured output using Instructor."""
        if not self._instructor_client:
            raise RuntimeError("Instructor client not available")
        
        try:
            start_time = datetime.now()
            
            # Get structured input for the task
            structured_input = await self._prepare_structured_input(task)
            
            # Generate structured response
            response = await self._instructor_client.chat.completions.create(
                model="gpt-4o-mini",
                response_model=response_model,
                messages=[
                    {"role": "system", "content": self._get_system_prompt(task.task_type)},
                    {"role": "user", "content": structured_input}
                ],
                max_tokens=2000,
                temperature=0.3
            )
            
            execution_time = (datetime.now() - start_time).total_seconds()
            
            return StructuredAgentResult(
                task_id=task.task_id,
                success=True,
                data=response,
                metadata={
                    "agent_id": self.agent_id,
                    "agent_name": self.name,
                    "execution_time": execution_time,
                    "response_model": response_model.__name__
                }
            )
            
        except Exception as e:
            self.logger.error("Structured execution failed", error=str(e), task_id=task.task_id)
            return StructuredAgentResult(
                task_id=task.task_id,
                success=False,
                data=None,
                metadata={"error": str(e)}
            )
    
    async def can_handle(self, task: AgentTask) -> bool:
        """Check if the agent can handle a specific task."""
        # Check capability match
        for capability in self.capabilities:
            if capability.enabled and capability.name == task.task_type:
                return True
        
        # Check task parameters
        required_capabilities = task.parameters.get("required_capabilities", [])
        for req_cap in required_capabilities:
            if not self.has_capability(req_cap):
                return False
        
        return True
    
    def get_capabilities(self) -> List[AgentCapability]:
        """Get list of agent capabilities."""
        return [cap for cap in self.capabilities if cap.enabled]
    
    def has_capability(self, capability_name: str) -> bool:
        """Check if agent has a specific capability."""
        return any(cap.name == capability_name and cap.enabled for cap in self.capabilities)
    
    async def health_check(self) -> AgentHealthStatus:
        """Enhanced health check with detailed status."""
        try:
            # Check basic health
            basic_healthy = self.is_active and len(self.get_capabilities()) > 0
            
            # Check capabilities
            capabilities_status = {}
            issues = []
            for cap in self.capabilities:
                try:
                    cap_healthy = await self._check_capability_health(cap)
                    capabilities_status[cap.name] = cap_healthy
                    if not cap_healthy:
                        issues.append(f"Capability {cap.name} failed health check")
                except Exception as e:
                    capabilities_status[cap.name] = False
                    issues.append(f"Capability {cap.name} error: {str(e)}")
            
            # Check Instructor client
            instructor_healthy = self._instructor_client is not None
            if not instructor_healthy:
                issues.append("Instructor client not available")
            
            return AgentHealthStatus(
                agent_id=self.agent_id,
                is_healthy=basic_healthy and all(capabilities_status.values()) and instructor_healthy,
                capabilities_status=capabilities_status,
                issues=issues,
                metrics={
                    "total_tasks": self.task_count,
                    "success_rate": self.success_count / max(self.task_count, 1),
                    "capability_count": len(self.capabilities)
                }
            )
            
        except Exception as e:
            self.logger.error("Enhanced health check failed", error=str(e))
            return AgentHealthStatus(
                agent_id=self.agent_id,
                is_healthy=False,
                issues=[str(e)]
            )
    
    async def _check_capability_health(self, capability: AgentCapability) -> bool:
        """Check health of a specific capability."""
        # Default implementation - can be overridden
        return capability.enabled
    
    def get_stats(self) -> Dict[str, Any]:
        """Get comprehensive agent statistics."""
        return {
            "agent_id": self.agent_id,
            "name": self.name,
            "description": self.description,
            "is_active": self.is_active,
            "last_activity": self.last_activity,
            "task_count": self.task_count,
            "success_count": self.success_count,
            "error_count": self.error_count,
            "success_rate": self.success_count / max(self.task_count, 1),
            "capabilities": [cap.dict() for cap in self.get_capabilities()],
            "performance_metrics": self._performance_metrics,
            "instructor_available": self._instructor_client is not None
        }
    
    async def _prepare_structured_input(self, task: AgentTask) -> str:
        """Prepare structured input for Instructor."""
        return (
            "Task: {}\n\nInput Data: {}\n\nParameters: {}\n\nExpected Output Type: {}".format(
                task.task_type,
                task.input_data,
                task.parameters,
                task.expected_output_type
            )
        )
    
    def _get_system_prompt(self, task_type: str) -> str:
        """Get system prompt for structured execution."""
        prompts = {
            "code_analysis": "You are a code analysis expert. Provide detailed, structured analysis.",
            "documentation": "You are a documentation expert. Create clear, comprehensive documentation.",
            "debugging": "You are a debugging expert. Identify issues and provide solutions.",
            "code_generation": "You are a code generation expert. Write clean, efficient code.",
            "general": "You are a helpful AI assistant. Provide accurate, useful responses."
        }
        
        return prompts.get(task_type, prompts["general"])
    
    async def _update_performance_metrics(self, task: AgentTask, execution_time: float, success: bool, error_type: str = None):
        """Update performance metrics."""
        self._performance_metrics["total_tasks"] += 1
        self._performance_metrics["last_24h_tasks"] += 1
        
        if success:
            self._performance_metrics["successful_tasks"] += 1
        else:
            if error_type:
                self._performance_metrics["error_types"][error_type] = \
                    self._performance_metrics["error_types"].get(error_type, 0) + 1
        
        # Update average execution time
        total_tasks = self._performance_metrics["total_tasks"]
        old_avg = self._performance_metrics["average_execution_time"]
        self._performance_metrics["average_execution_time"] = \
            (old_avg * (total_tasks - 1) + execution_time) / total_tasks
        
        # Track capability usage
        capability_name = task.task_type
        self._performance_metrics["capability_usage"][capability_name] = \
            self._performance_metrics["capability_usage"].get(capability_name, 0) + 1
    
    async def _create_result(self, task: AgentTask, success: bool, output: Dict[str, Any], 
                      error_message: str = None, execution_time: float = 0.0) -> AgentResult:
        """Create an enhanced agent result."""
        await self._update_performance_metrics(task, execution_time, success, error_message)
        
        return AgentResult(
            task_id=task.task_id,
            success=success,
            output=output,
            error_message=error_message,
            execution_time=execution_time,
            metadata={
                "agent_id": self.agent_id,
                "agent_name": self.name,
                "capabilities_used": [cap.name for cap in self.capabilities if cap.enabled],
                "instructor_available": self._instructor_client is not None
            }
        )
    
    async def start(self) -> bool:
        """Start the agent with enhanced initialization."""
        try:
            self.is_active = True
            health = await self.health_check()
            self.logger.info(
                "Agent started",
                agent_id=self.agent_id,
                name=self.name,
                healthy=health.is_healthy,
                capabilities=len(self.capabilities)
            )
            return health.is_healthy
        except Exception as e:
            self.logger.error("Failed to start agent", error=str(e))
            return False
    
    async def stop(self) -> bool:
        """Stop the agent with cleanup."""
        try:
            self.is_active = False
            self.logger.info(
                "Agent stopped",
                agent_id=self.agent_id,
                name=self.name,
                final_stats=self.get_stats()
            )
            return True
        except Exception as e:
            self.logger.error("Failed to stop agent", error=str(e))
            return False
    
    async def validate_task(self, task: AgentTask) -> bool:
        """Validate task before execution."""
        try:
            # Check if agent is active
            if not self.is_active:
                return False
            
            # Check capabilities
            if not await self.can_handle(task):
                return False
            
            # Check timeout
            if task.timeout and task.timeout < 1:
                return False
            
            return True
        except Exception as e:
            self.logger.error("Task validation failed", error=str(e), task_id=task.task_id)
            return False
    
    def __str__(self) -> str:
        """String representation of the agent."""
        return f"{self.name} (ID: {self.agent_id}) - {len(self.capabilities)} capabilities"
    
    def __repr__(self) -> str:
        """Detailed string representation of the agent."""
        return f"{self.__class__.__name__}(agent_id='{self.agent_id}', name='{self.name}', active={self.is_active})"


class EnhancedAgentRegistry:
    """Enhanced registry for managing agents with health monitoring."""
    
    def __init__(self):
        self.agents: Dict[str, BaseAgent] = {}
        self.health_cache: Dict[str, AgentHealthStatus] = {}
        self.last_health_check: datetime = None
    
    def register(self, agent: BaseAgent) -> None:
        """Register an agent with validation."""
        if not isinstance(agent, BaseAgent):
            raise ValueError("Agent must inherit from BaseAgent")
        
        if agent.agent_id in self.agents:
            logger.warning("Agent already registered, updating", agent_id=agent.agent_id)
        
        self.agents[agent.agent_id] = agent
        logger.info(
            "Agent registered",
            agent_id=agent.agent_id,
            name=agent.name,
            capabilities=len(agent.capabilities)
        )
    
    def unregister(self, agent_id: str) -> bool:
        """Unregister an agent."""
        if agent_id in self.agents:
            agent = self.agents[agent_id]
            del self.agents[agent_id]
            if agent_id in self.health_cache:
                del self.health_cache[agent_id]
            logger.info("Agent unregistered", agent_id=agent_id)
            return True
        return False
    
    async def get_agent(self, agent_id: str) -> Optional[BaseAgent]:
        """Get an agent by ID with health check."""
        agent = self.agents.get(agent_id)
        if agent and await agent.health_check():
            return agent
        return None
    
    def get_agents_by_capability(self, capability_name: str) -> List[BaseAgent]:
        """Get all agents that have a specific capability."""
        return [
            agent for agent in self.agents.values()
            if agent.has_capability(capability_name)
        ]
    
    def get_agents_by_type(self, agent_type: str) -> List[BaseAgent]:
        """Get agents by type."""
        agent_type_lower = agent_type.lower()
        matching_agents = []
        
        for agent in self.agents.values():
            agent_name_lower = agent.name.lower()
            # Check for exact match or partial match
            if (agent_type_lower in agent_name_lower or 
                agent_name_lower in agent_type_lower or
                agent_type_lower.replace('_', ' ') in agent_name_lower or
                agent_name_lower.replace(' ', '_') in agent_type_lower):
                matching_agents.append(agent)
        
        return matching_agents
    
    async def health_check_all(self) -> Dict[str, AgentHealthStatus]:
        """Check health of all agents with caching."""
        current_time = datetime.now()
        
        # Check if we need fresh health checks
        if (not self.last_health_check or 
            (current_time - self.last_health_check).seconds > 300):  # 5 minutes cache
            
            for agent_id, agent in self.agents.items():
                try:
                    self.health_cache[agent_id] = await agent.health_check()
                except Exception as e:
                    logger.error("Health check failed for agent", agent_id=agent_id, error=str(e))
            
            self.last_health_check = current_time
        
        return self.health_cache
    
    def get_all_agents(self) -> List[BaseAgent]:
        """Get all registered agents."""
        return list(self.agents.values())
    
    def list_registered_agents(self) -> List[str]:
        """List all registered agent names for debugging."""
        return [agent.name for agent in self.agents.values()]
    
    def get_agent_stats(self) -> Dict[str, Dict[str, Any]]:
        """Get comprehensive statistics for all agents."""
        return {
            agent_id: agent.get_stats()
            for agent_id, agent in self.agents.items()
        }
    
    async def start_all(self) -> Dict[str, bool]:
        """Start all agents."""
        results = {}
        for agent in self.agents.values():
            results[agent.agent_id] = await agent.start()
        return results
    
    async def stop_all(self) -> Dict[str, bool]:
        """Stop all agents."""
        results = {}
        for agent in self.agents.values():
            results[agent.agent_id] = await agent.stop()
        return results


# Global enhanced agent registry
enhanced_agent_registry = EnhancedAgentRegistry()


def get_enhanced_agent_registry() -> EnhancedAgentRegistry:
    """Get the global enhanced agent registry."""
    return enhanced_agent_registry
