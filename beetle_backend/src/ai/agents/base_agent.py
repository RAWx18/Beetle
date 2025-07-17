import logging
import time
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from datetime import datetime
import traceback
from pydantic import BaseModel


class AgentConfig(BaseModel):
    """Base configuration for agents"""
    name: str
    max_retries: int = 3
    retry_delay: float = 1.0
    timeout: float = 30.0
    batch_size: int = 100
    enable_logging: bool = True


class AgentResult(BaseModel):
    """Result from agent processing"""
    success: bool
    data: Optional[Any] = None
    error_message: Optional[str] = None
    processing_time: float = 0.0
    metadata: Dict[str, Any] = {}


class BaseAgent(ABC):
    """Base class for all agents in the pipeline"""
    
    def __init__(self, config: AgentConfig):
        self.config = config
        self.logger = self._setup_logger()
        self.start_time = None
        
    def _setup_logger(self) -> logging.Logger:
        """Setup logger for the agent"""
        logger = logging.getLogger(f"agent.{self.config.name}")
        if self.config.enable_logging:
            logger.setLevel(logging.INFO)
            if not logger.handlers:
                handler = logging.StreamHandler()
                formatter = logging.Formatter(
                    '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
                )
                handler.setFormatter(formatter)
                logger.addHandler(handler)
        return logger
    
    def log_info(self, message: str, **kwargs):
        """Log info message with metadata"""
        self.logger.info(f"{message} | {kwargs}")
    
    def log_error(self, message: str, error: Exception = None, **kwargs):
        """Log error message with metadata"""
        error_details = f" | Error: {str(error)}" if error else ""
        self.logger.error(f"{message}{error_details} | {kwargs}")
        if error:
            self.logger.debug(f"Traceback: {traceback.format_exc()}")
    
    def log_warning(self, message: str, **kwargs):
        """Log warning message with metadata"""
        self.logger.warning(f"{message} | {kwargs}")
    
    def start_processing(self):
        """Start processing timer"""
        self.start_time = time.time()
        self.log_info("Starting processing")
    
    def end_processing(self) -> float:
        """End processing timer and return duration"""
        if self.start_time:
            duration = time.time() - self.start_time
            self.log_info("Processing completed", duration=duration)
            return duration
        return 0.0
    
    def execute_with_retry(self, func, *args, **kwargs) -> AgentResult:
        """Execute function with retry logic"""
        last_error = None
        
        for attempt in range(self.config.max_retries):
            try:
                self.start_processing()
                result = func(*args, **kwargs)
                processing_time = self.end_processing()
                
                return AgentResult(
                    success=True,
                    data=result,
                    processing_time=processing_time,
                    metadata={"attempt": attempt + 1}
                )
                
            except Exception as e:
                last_error = e
                processing_time = self.end_processing()
                
                self.log_error(
                    f"Attempt {attempt + 1} failed",
                    error=e,
                    attempt=attempt + 1,
                    max_retries=self.config.max_retries
                )
                
                if attempt < self.config.max_retries - 1:
                    time.sleep(self.config.retry_delay * (attempt + 1))
        
        # All retries failed
        return AgentResult(
            success=False,
            error_message=str(last_error),
            processing_time=time.time() - self.start_time if self.start_time else 0.0,
            metadata={"attempts": self.config.max_retries}
        )
    
    @abstractmethod
    def process(self, input_data: Any) -> AgentResult:
        """Process input data - must be implemented by subclasses"""
        pass
    
    def validate_input(self, input_data: Any) -> bool:
        """Validate input data - can be overridden by subclasses"""
        return input_data is not None
    
    def preprocess(self, input_data: Any) -> Any:
        """Preprocess input data - can be overridden by subclasses"""
        return input_data
    
    def postprocess(self, result: Any) -> Any:
        """Postprocess result - can be overridden by subclasses"""
        return result
    
    def run(self, input_data: Any) -> AgentResult:
        """Main execution method with full pipeline"""
        try:
            # Validate input
            if not self.validate_input(input_data):
                return AgentResult(
                    success=False,
                    error_message="Invalid input data"
                )
            
            # Preprocess
            processed_input = self.preprocess(input_data)
            
            # Execute with retry
            result = self.execute_with_retry(self.process, processed_input)
            
            # Postprocess if successful
            if result.success and result.data is not None:
                result.data = self.postprocess(result.data)
            
            return result
            
        except Exception as e:
            self.log_error("Unexpected error in agent execution", error=e)
            return AgentResult(
                success=False,
                error_message=f"Unexpected error: {str(e)}"
            ) 