import logging
import time
import uuid
from datetime import datetime
from typing import Dict, Any, Optional, List
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum

from models.agent_models import AgentStatus, TaskPriority


class AgentResult:
    """Result of agent processing"""
    
    def __init__(self, success: bool, data: Dict[str, Any] = None, 
                 error_message: str = None, processing_time: float = 0.0):
        self.success = success
        self.data = data or {}
        self.error_message = error_message
        self.processing_time = processing_time
        self.timestamp = datetime.utcnow()
        self.result_id = str(uuid.uuid4())
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert result to dictionary"""
        return {
            "success": self.success,
            "data": self.data,
            "error_message": self.error_message,
            "processing_time": self.processing_time,
            "timestamp": self.timestamp.isoformat(),
            "result_id": self.result_id,
        }


@dataclass
class AgentConfig:
    """Base configuration for agents"""
    agent_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = "BaseAgent"
    description: str = "Base agent for processing tasks"
    version: str = "1.0.0"
    
    # Performance settings
    max_concurrent_tasks: int = 5
    task_timeout: int = 300
    max_retries: int = 3
    retry_delay: float = 1.0
    
    # Resource settings
    memory_limit: Optional[int] = None  # MB
    cpu_limit: Optional[float] = None  # 0.0-1.0
    gpu_enabled: bool = False
    
    # Communication settings
    heartbeat_interval: int = 30
    communication_timeout: int = 60
    
    # Logging settings
    log_level: str = "INFO"
    enable_metrics: bool = True
    
    # Security settings
    authentication_required: bool = False
    encryption_enabled: bool = True
    
    # Metadata
    metadata: Dict[str, Any] = field(default_factory=dict)


class BaseAgent(ABC):
    """Base class for all agents in the system"""
    
    def __init__(self, config: AgentConfig):
        self.config = config
        self.agent_id = config.agent_id
        self.name = config.name
        self.description = config.description
        self.version = config.version
        
        # Status and state
        self.status = AgentStatus.IDLE
        self.current_task = None
        self.task_queue = []
        self.completed_tasks = []
        self.failed_tasks = []
        
        # Performance tracking
        self.start_time = datetime.utcnow()
        self.total_processing_time = 0.0
        self.tasks_processed = 0
        self.tasks_failed = 0
        
        # Metrics
        self.metrics = {
            "tasks_completed": 0,
            "tasks_failed": 0,
            "average_processing_time": 0.0,
            "total_processing_time": 0.0,
            "success_rate": 1.0,
        }
        
        # Setup logging
        self.logger = self._setup_logger()
        
        # Initialize agent
        self._initialize()
    
    def _setup_logger(self) -> logging.Logger:
        """Setup agent-specific logger"""
        logger = logging.getLogger(f"agent.{self.name}")
        logger.setLevel(getattr(logging, self.config.log_level))
        
        # Create handler if not exists
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        
        return logger
    
    def _initialize(self):
        """Initialize agent resources"""
        try:
            self.logger.info(f"Initializing agent: {self.name} (ID: {self.agent_id})")
            self.status = AgentStatus.INITIALIZING
            
            # Perform agent-specific initialization
            self.initialize()
            
            self.status = AgentStatus.IDLE
            self.logger.info(f"Agent {self.name} initialized successfully")
            
        except Exception as e:
            self.logger.error(f"Failed to initialize agent {self.name}: {e}")
            self.status = AgentStatus.ERROR
            raise
    
    @abstractmethod
    def initialize(self):
        """Agent-specific initialization - to be implemented by subclasses"""
        pass
    
    def process(self, input_data: Dict[str, Any]) -> AgentResult:
        """Process input data and return result"""
        task_id = str(uuid.uuid4())
        start_time = time.time()
        
        try:
            self.logger.info(f"Starting task {task_id} for agent {self.name}")
            self.status = AgentStatus.BUSY
            self.current_task = task_id
            
            # Validate input
            if not self._validate_input(input_data):
                return AgentResult(
                    success=False,
                    error_message="Invalid input data",
                    processing_time=time.time() - start_time
                )
            
            # Process the task
            result = self._process_task(input_data)
            
            # Update metrics
            processing_time = time.time() - start_time
            self._update_metrics(True, processing_time)
            
            self.logger.info(f"Task {task_id} completed successfully in {processing_time:.2f}s")
            return result
            
        except Exception as e:
            processing_time = time.time() - start_time
            self._update_metrics(False, processing_time)
            
            self.logger.error(f"Task {task_id} failed: {e}")
            return AgentResult(
                success=False,
                error_message=str(e),
                processing_time=processing_time
            )
        finally:
            self.status = AgentStatus.IDLE
            self.current_task = None
    
    @abstractmethod
    def _process_task(self, input_data: Dict[str, Any]) -> AgentResult:
        """Process the actual task - to be implemented by subclasses"""
        pass
    
    def _validate_input(self, input_data: Dict[str, Any]) -> bool:
        """Validate input data"""
        if not input_data:
            self.logger.warning("Empty input data received")
            return False
        
        # Basic validation - can be overridden by subclasses
        return True
    
    def _update_metrics(self, success: bool, processing_time: float):
        """Update agent metrics"""
        self.total_processing_time += processing_time
        self.tasks_processed += 1
        
        if success:
            self.metrics["tasks_completed"] += 1
        else:
            self.metrics["tasks_failed"] += 1
            self.tasks_failed += 1
        
        # Update success rate
        total_tasks = self.metrics["tasks_completed"] + self.metrics["tasks_failed"]
        if total_tasks > 0:
            self.metrics["success_rate"] = self.metrics["tasks_completed"] / total_tasks
        
        # Update average processing time
        if self.metrics["tasks_completed"] > 0:
            self.metrics["average_processing_time"] = (
                self.total_processing_time / self.metrics["tasks_completed"]
            )
        
        self.metrics["total_processing_time"] = self.total_processing_time
    
    def get_status(self) -> Dict[str, Any]:
        """Get current agent status"""
        return {
            "agent_id": self.agent_id,
            "name": self.name,
            "status": self.status.value,
            "current_task": self.current_task,
            "queue_length": len(self.task_queue),
            "uptime": (datetime.utcnow() - self.start_time).total_seconds(),
            "metrics": self.metrics.copy(),
            "version": self.version,
        }
    
    def get_health(self) -> Dict[str, Any]:
        """Get agent health information"""
        return {
            "agent_id": self.agent_id,
            "name": self.name,
            "status": self.status.value,
            "is_responsive": True,
            "can_process_tasks": self.status in [AgentStatus.IDLE, AgentStatus.BUSY],
            "has_required_resources": True,  # Can be enhanced with actual resource checks
            "is_authenticated": True,  # Can be enhanced with actual auth checks
            "last_heartbeat": datetime.utcnow().isoformat(),
            "uptime": (datetime.utcnow() - self.start_time).total_seconds(),
            "success_rate": self.metrics["success_rate"],
            "average_processing_time": self.metrics["average_processing_time"],
        }
    
    def start_processing(self):
        """Mark start of processing"""
        self.status = AgentStatus.BUSY
    
    def end_processing(self) -> float:
        """Mark end of processing and return duration"""
        self.status = AgentStatus.IDLE
        return 0.0  # Can be enhanced to track actual duration
    
    def log_info(self, message: str, **kwargs):
        """Log info message with context"""
        self.logger.info(f"[{self.name}] {message}", extra=kwargs)
    
    def log_warning(self, message: str, **kwargs):
        """Log warning message with context"""
        self.logger.warning(f"[{self.name}] {message}", extra=kwargs)
    
    def log_error(self, message: str, error: Exception = None, **kwargs):
        """Log error message with context"""
        if error:
            self.logger.error(f"[{self.name}] {message}: {error}", extra=kwargs, exc_info=True)
        else:
            self.logger.error(f"[{self.name}] {message}", extra=kwargs)
    
    def log_debug(self, message: str, **kwargs):
        """Log debug message with context"""
        self.logger.debug(f"[{self.name}] {message}", extra=kwargs)
    
    def add_task_to_queue(self, task_data: Dict[str, Any], priority: TaskPriority = TaskPriority.NORMAL):
        """Add task to processing queue"""
        task = {
            "id": str(uuid.uuid4()),
            "data": task_data,
            "priority": priority,
            "created_at": datetime.utcnow(),
            "status": "pending",
        }
        
        # Insert based on priority
        if priority == TaskPriority.URGENT:
            self.task_queue.insert(0, task)
        elif priority == TaskPriority.HIGH:
            # Find position after urgent tasks
            insert_pos = 0
            for i, queued_task in enumerate(self.task_queue):
                if queued_task["priority"] == TaskPriority.URGENT:
                    insert_pos = i + 1
                else:
                    break
            self.task_queue.insert(insert_pos, task)
        else:
            self.task_queue.append(task)
        
        self.logger.info(f"Added task to queue: {task['id']} (priority: {priority.value})")
    
    def get_next_task(self) -> Optional[Dict[str, Any]]:
        """Get next task from queue"""
        if not self.task_queue:
            return None
        
        task = self.task_queue.pop(0)
        task["status"] = "processing"
        task["started_at"] = datetime.utcnow()
        
        self.logger.info(f"Retrieved task from queue: {task['id']}")
        return task
    
    def complete_task(self, task_id: str, result: AgentResult):
        """Mark task as completed"""
        task_info = {
            "task_id": task_id,
            "result": result,
            "completed_at": datetime.utcnow(),
        }
        
        if result.success:
            self.completed_tasks.append(task_info)
            self.logger.info(f"Task {task_id} completed successfully")
        else:
            self.failed_tasks.append(task_info)
            self.logger.warning(f"Task {task_id} failed: {result.error_message}")
    
    def retry_task(self, task_id: str, max_retries: int = None) -> bool:
        """Retry a failed task"""
        if max_retries is None:
            max_retries = self.config.max_retries
        
        # Find failed task
        failed_task = None
        for task in self.failed_tasks:
            if task["task_id"] == task_id:
                failed_task = task
                break
        
        if not failed_task:
            self.logger.warning(f"Task {task_id} not found in failed tasks")
            return False
        
        # Check retry count
        retry_count = failed_task.get("retry_count", 0)
        if retry_count >= max_retries:
            self.logger.warning(f"Task {task_id} exceeded max retries ({max_retries})")
            return False
        
        # Add back to queue with higher priority
        task_data = failed_task.get("original_data", {})
        self.add_task_to_queue(task_data, TaskPriority.HIGH)
        
        # Update retry count
        failed_task["retry_count"] = retry_count + 1
        failed_task["last_retry"] = datetime.utcnow()
        
        self.logger.info(f"Retrying task {task_id} (attempt {retry_count + 1}/{max_retries})")
        return True
    
    def get_queue_status(self) -> Dict[str, Any]:
        """Get queue status information"""
        return {
            "queue_length": len(self.task_queue),
            "completed_tasks": len(self.completed_tasks),
            "failed_tasks": len(self.failed_tasks),
            "current_task": self.current_task,
            "queue_items": [
                {
                    "id": task["id"],
                    "priority": task["priority"].value,
                    "created_at": task["created_at"].isoformat(),
                    "status": task["status"],
                }
                for task in self.task_queue
            ],
        }
    
    def clear_queue(self):
        """Clear all tasks from queue"""
        cleared_count = len(self.task_queue)
        self.task_queue.clear()
        self.logger.info(f"Cleared {cleared_count} tasks from queue")
    
    def shutdown(self):
        """Shutdown agent gracefully"""
        self.logger.info(f"Shutting down agent {self.name}")
        self.status = AgentStatus.OFFLINE
        
        # Complete any pending tasks
        if self.current_task:
            self.logger.warning(f"Agent shutdown while processing task {self.current_task}")
        
        # Clear queue
        self.clear_queue()
        
        self.logger.info(f"Agent {self.name} shutdown complete")
    
    def __str__(self) -> str:
        return f"{self.name} (ID: {self.agent_id}, Status: {self.status.value})"
    
    def __repr__(self) -> str:
        return f"<{self.__class__.__name__}(name='{self.name}', id='{self.agent_id}')>" 