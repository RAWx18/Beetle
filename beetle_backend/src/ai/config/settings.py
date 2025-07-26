import os
from typing import Optional, List, Dict, Any
from pydantic import BaseSettings, Field, validator
from pydantic_settings import BaseSettings as PydanticBaseSettings


class Settings(PydanticBaseSettings):
    """Application settings and configuration"""
    
    # Application settings
    app_name: str = Field(default="Beetle RAG System", description="Application name")
    app_version: str = Field(default="1.0.0", description="Application version")
    debug: bool = Field(default=False, description="Debug mode")
    environment: str = Field(default="development", description="Environment (development/production)")
    
    # Server settings
    host: str = Field(default="0.0.0.0", description="Server host")
    port: int = Field(default=8000, description="Server port")
    workers: int = Field(default=1, description="Number of workers")
    
    # Database settings
    database_url: str = Field(..., description="PostgreSQL database URL")
    database_pool_size: int = Field(default=10, description="Database connection pool size")
    database_max_overflow: int = Field(default=20, description="Database max overflow")
    
    # Vector database settings
    qdrant_url: str = Field(..., description="Qdrant vector database URL")
    qdrant_api_key: Optional[str] = Field(None, description="Qdrant API key")
    qdrant_collection_name: str = Field(default="documents", description="Qdrant collection name")
    qdrant_timeout: int = Field(default=30, description="Qdrant timeout in seconds")
    
    # LLM settings
    openai_api_key: Optional[str] = Field(None, description="OpenAI API key")
    anthropic_api_key: Optional[str] = Field(None, description="Anthropic API key")
    default_llm_provider: str = Field(default="openai", description="Default LLM provider")
    default_llm_model: str = Field(default="gpt-4", description="Default LLM model")
    
    # Embedding settings
    default_embedding_model: str = Field(default="sentence-transformers/all-MiniLM-L6-v2", description="Default embedding model")
    embedding_batch_size: int = Field(default=32, description="Embedding batch size")
    embedding_dimension: int = Field(default=384, description="Embedding dimension")
    
    # RAG settings
    default_chunk_size: int = Field(default=1000, description="Default chunk size")
    default_chunk_overlap: int = Field(default=200, description="Default chunk overlap")
    max_retrieval_results: int = Field(default=10, description="Maximum retrieval results")
    similarity_threshold: float = Field(default=0.7, description="Similarity threshold")
    
    # Caching settings
    redis_url: Optional[str] = Field(None, description="Redis URL for caching")
    cache_ttl: int = Field(default=3600, description="Cache TTL in seconds")
    enable_caching: bool = Field(default=True, description="Enable caching")
    
    # Security settings
    secret_key: str = Field(..., description="Secret key for encryption")
    algorithm: str = Field(default="HS256", description="JWT algorithm")
    access_token_expire_minutes: int = Field(default=30, description="Access token expiry")
    enable_rate_limiting: bool = Field(default=True, description="Enable rate limiting")
    rate_limit_requests: int = Field(default=100, description="Rate limit requests per minute")
    
    # Logging settings
    log_level: str = Field(default="INFO", description="Logging level")
    log_format: str = Field(default="json", description="Log format")
    enable_structured_logging: bool = Field(default=True, description="Enable structured logging")
    
    # Monitoring settings
    enable_metrics: bool = Field(default=True, description="Enable metrics collection")
    metrics_port: int = Field(default=9090, description="Metrics port")
    enable_health_checks: bool = Field(default=True, description="Enable health checks")
    
    # Agent settings
    max_concurrent_agents: int = Field(default=10, description="Maximum concurrent agents")
    agent_timeout: int = Field(default=300, description="Agent timeout in seconds")
    enable_agent_autoscaling: bool = Field(default=True, description="Enable agent autoscaling")
    
    # Workflow settings
    max_workflow_executions: int = Field(default=50, description="Maximum concurrent workflow executions")
    workflow_timeout: int = Field(default=1800, description="Workflow timeout in seconds")
    enable_workflow_persistence: bool = Field(default=True, description="Enable workflow persistence")
    
    # File processing settings
    max_file_size: int = Field(default=100 * 1024 * 1024, description="Maximum file size in bytes")
    allowed_file_types: List[str] = Field(default=[".txt", ".md", ".py", ".js", ".ts", ".java", ".cpp", ".c", ".h", ".hpp", ".cs", ".go", ".rs", ".php", ".rb", ".swift", ".kt", ".scala", ".r", ".m", ".sql", ".sh", ".yaml", ".yml", ".json", ".xml", ".html", ".css", ".scss", ".sass", ".less"], description="Allowed file types")
    temp_directory: str = Field(default="/tmp", description="Temporary directory")
    
    # GitHub settings
    github_token: Optional[str] = Field(None, description="GitHub access token")
    github_rate_limit: int = Field(default=5000, description="GitHub rate limit")
    
    # Feature flags
    enable_advanced_rag: bool = Field(default=True, description="Enable advanced RAG features")
    enable_agentic_workflows: bool = Field(default=True, description="Enable agentic workflows")
    enable_code_analysis: bool = Field(default=True, description="Enable code analysis")
    enable_documentation_generation: bool = Field(default=True, description="Enable documentation generation")
    enable_automated_testing: bool = Field(default=True, description="Enable automated testing")
    enable_performance_optimization: bool = Field(default=True, description="Enable performance optimization")
    
    # Performance settings
    enable_async_processing: bool = Field(default=True, description="Enable async processing")
    max_async_workers: int = Field(default=10, description="Maximum async workers")
    enable_batch_processing: bool = Field(default=True, description="Enable batch processing")
    batch_size: int = Field(default=100, description="Batch size for processing")
    
    # Development settings
    enable_hot_reload: bool = Field(default=False, description="Enable hot reload")
    enable_debug_endpoints: bool = Field(default=False, description="Enable debug endpoints")
    enable_test_data: bool = Field(default=False, description="Enable test data")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
    
    @validator("database_url", pre=True)
    def validate_database_url(cls, v):
        if not v:
            raise ValueError("Database URL is required")
        return v
    
    @validator("qdrant_url", pre=True)
    def validate_qdrant_url(cls, v):
        if not v:
            raise ValueError("Qdrant URL is required")
        return v
    
    @validator("secret_key", pre=True)
    def validate_secret_key(cls, v):
        if not v or len(v) < 32:
            raise ValueError("Secret key must be at least 32 characters long")
        return v
    
    @property
    def is_production(self) -> bool:
        """Check if running in production environment"""
        return self.environment.lower() == "production"
    
    @property
    def is_development(self) -> bool:
        """Check if running in development environment"""
        return self.environment.lower() == "development"
    
    @property
    def database_config(self) -> Dict[str, Any]:
        """Get database configuration"""
        return {
            "url": self.database_url,
            "pool_size": self.database_pool_size,
            "max_overflow": self.database_max_overflow,
        }
    
    @property
    def qdrant_config(self) -> Dict[str, Any]:
        """Get Qdrant configuration"""
        return {
            "url": self.qdrant_url,
            "api_key": self.qdrant_api_key,
            "collection_name": self.qdrant_collection_name,
            "timeout": self.qdrant_timeout,
        }
    
    @property
    def llm_config(self) -> Dict[str, Any]:
        """Get LLM configuration"""
        return {
            "openai_api_key": self.openai_api_key,
            "anthropic_api_key": self.anthropic_api_key,
            "default_provider": self.default_llm_provider,
            "default_model": self.default_llm_model,
        }


# Global settings instance
settings = Settings()


def get_settings() -> Settings:
    """Get application settings"""
    return settings 