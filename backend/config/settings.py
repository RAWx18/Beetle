"""
Core settings configuration for the RAG system.
Handles environment variables, validation, and service configuration.
"""

import os
import yaml
from typing import Optional, List, Dict, Any
from pydantic import Field, validator
from pydantic_settings import BaseSettings
import structlog

logger = structlog.get_logger(__name__)


class Settings(BaseSettings):
    """Main application settings with environment variable support."""
    
    # ========================
    # ESSENTIAL ENVIRONMENT VARIABLES
    # ========================
    
    # API Keys & Secrets
    openai_api_key: Optional[str] = Field(default=None, env="OPENAI_API_KEY")
    gemini_api_key: Optional[str] = Field(default=None, env="GEMINI_API_KEY")
    jina_api_key: Optional[str] = Field(default=None, env="JINA_API_KEY")
    
    # External Service URLs & Keys
    qdrant_mode: str = Field(default="online", env="QDRANT_MODE")  # "online" or "local"
    qdrant_url: Optional[str] = Field(default= None, env="QDRANT_URL_ONLINE")
    qdrant_api_key: Optional[str] = Field(default=None, env="QDRANT_API_KEY")
    redis_url: str = Field(default="redis://localhost:6379", env="REDIS_URL")
    
    # Database Configuration
    database_provider: str = Field(default="sqlite", env="DATABASE_PROVIDER")
    database_url: Optional[str] = Field(default=None, env="DATABASE_URL")
    
    # PostgreSQL Settings
    postgres_host: str = Field(default="localhost", env="POSTGRES_HOST")
    postgres_port: int = Field(default=5432, env="POSTGRES_PORT")
    postgres_db: str = Field(default="gitmesh_rag", env="POSTGRES_DB")
    postgres_user: str = Field(default="GitMesh", env="POSTGRES_USER")
    postgres_password: str = Field(default="gitmeshpass", env="POSTGRES_PASSWORD")
    postgres_ssl: str = Field(default="prefer", env="POSTGRES_SSL")
    
    # Supabase Settings
    supabase_url: Optional[str] = Field(default=None, env="SUPABASE_URL")
    supabase_anon_key: Optional[str] = Field(default=None, env="SUPABASE_ANON_KEY")
    supabase_service_role_key: Optional[str] = Field(default=None, env="SUPABASE_SERVICE_ROLE_KEY")
    
    # Database Pool Settings
    db_pool_size: int = Field(default=10, env="DB_POOL_SIZE")
    db_max_overflow: int = Field(default=20, env="DB_MAX_OVERFLOW")
    db_pool_timeout: int = Field(default=30, env="DB_POOL_TIMEOUT")
    db_pool_recycle: int = Field(default=3600, env="DB_POOL_RECYCLE")
    db_create_tables: bool = Field(default=True, env="DB_CREATE_TABLES")
    
    # Security
    secret_key: str = Field(default="your-super-secret-key-change-in-production-minimum-32-chars", env="SECRET_KEY")
    jwt_secret: str = Field(default="your-jwt-secret-key-change-in-production-minimum-32-chars", env="JWT_SECRET")
    
    # GitHub Integration
    github_client_id: Optional[str] = Field(default=None, env="GITHUB_CLIENT_ID")
    github_client_secret: Optional[str] = Field(default=None, env="GITHUB_CLIENT_SECRET")
    github_callback_url: Optional[str] = Field(default=None, env="GITHUB_CALLBACK_URL")
    github_webhook_secret: Optional[str] = Field(default=None, env="GITHUB_WEBHOOK_SECRET")
    
    # Allowed origins for CORS and security
    allowed_origins: Optional[str] = Field(default=None, env="ALLOWED_ORIGINS")
    
    # Observability
    trace_file: str = Field(default="./traces.jsonl", env="TRACE_FILE")
    
    # ========================
    # YAML CONFIGURATION
    # ========================
    _yaml_config: Optional[Dict[str, Any]] = None
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._load_yaml_config()
    
    def _load_yaml_config(self):
        """Load configuration from YAML file."""
        try:
            yaml_path = os.path.join(os.path.dirname(__file__), "features.yaml")
            with open(yaml_path, 'r', encoding='utf-8') as f:
                self._yaml_config = yaml.safe_load(f)
        except Exception as e:
            print(f"Warning: Could not load YAML config: {e}")
            self._yaml_config = {}
    
    def get_yaml_config(self, key: str, default: Any = None) -> Any:
        """Get configuration value from YAML file."""
        if not self._yaml_config:
            return default
        
        keys = key.split('.')
        value = self._yaml_config
        for k in keys:
            if isinstance(value, dict) and k in value:
                value = value[k]
            else:
                return default
        return value
    
    # ========================
    # APPLICATION SETTINGS (from YAML)
    # ========================
    @property
    def app_name(self) -> str:
        return self.get_yaml_config("app.name", "Beetle RAG System")
    
    @property
    def debug(self) -> bool:
        return self.get_yaml_config("app.debug", False)
    
    @property
    def environment(self) -> str:
        return self.get_yaml_config("app.environment", "development")
    
    @property
    def api_prefix(self) -> str:
        return self.get_yaml_config("app.api_prefix", "/api/v1")
    
    @property
    def cors_origins(self) -> List[str]:
        return self.get_yaml_config("app.cors_origins", ["*"])
    
    # ========================
    # AGENT CONFIGURATION (from YAML)
    # ========================
    @property
    def agents_enabled(self) -> Dict[str, bool]:
        return {
            "code_chat": self.get_yaml_config("agents.code_chat", True),
            "documentation": self.get_yaml_config("agents.documentation", True),
            "code_review": self.get_yaml_config("agents.code_review", False),
            "registry_enabled": self.get_yaml_config("agents.registry_enabled", True),
            "context_manager_enabled": self.get_yaml_config("agents.context_manager_enabled", True)
        }
    
    # ========================
    # PROVIDER CONFIGURATION (from YAML)
    # ========================
    @property
    def providers_enabled(self) -> Dict[str, bool]:
        return {
            "litellm": self.get_yaml_config("providers.litellm", True),
            "anthropic": self.get_yaml_config("providers.anthropic", False),
            "ollama": self.get_yaml_config("providers.ollama", True),
            "gemini": self.get_yaml_config("providers.gemini", True),
            "sentence_transformers": self.get_yaml_config("providers.sentence_transformers", True),
            "jina": self.get_yaml_config("providers.jina", False)
        }
    
    # ========================
    # LLM CONFIGURATION (from YAML)
    # ========================
    @property
    def default_llm_provider(self) -> str:
        return self.get_yaml_config("llm.default_provider", "ollama")
    
    @property
    def default_llm_model(self) -> str:
        return self.get_yaml_config("llm.default_model", "ollama/llama3.2:3b")
    
    @property
    def ollama_base_url(self) -> str:
        return self.get_yaml_config("llm.ollama.base_url", "http://localhost:11434")
    
    @property
    def gemini_model(self) -> str:
        return self.get_yaml_config("llm.gemini.model", "gemini-2.0-flash")
    
    @property
    def gemini_temperature(self) -> float:
        return self.get_yaml_config("llm.gemini.temperature", 0.7)
    
    @property
    def gemini_max_tokens(self) -> int:
        return self.get_yaml_config("llm.gemini.max_tokens", 1000)
    
    # ========================
    # EMBEDDING CONFIGURATION (from YAML)
    # ========================
    @property
    def default_embedding_provider(self) -> str:
        return self.get_yaml_config("embeddings.default_provider", "sentence_transformers")
    
    @property
    def default_embedding_model(self) -> str:
        return self.get_yaml_config("embeddings.default_model", "all-MiniLM-L6-v2")
    
    @property
    def sentence_transformers_device(self) -> str:
        return self.get_yaml_config("embeddings.sentence_transformers.device", "cpu")
    
    @property
    def sentence_transformers_batch_size(self) -> int:
        return self.get_yaml_config("embeddings.sentence_transformers.batch_size", 32)
    
    @property
    def jina_base_url(self) -> str:
        return self.get_yaml_config("embeddings.jina.base_url", "https://api.jina.ai/v1")
    
    # ========================
    # VECTOR DATABASE CONFIGURATION (from YAML)
    # ========================
    @property
    def qdrant_collection_name(self) -> str:
        return self.get_yaml_config("vectorstore.qdrant.collection_name", "beetle_documents")
    
    @property
    def max_retrieval_results(self) -> int:
        return self.get_yaml_config("vectorstore.qdrant.max_retrieval_results", 5)
    
    # ========================
    # RAG SETTINGS (from YAML)
    # ========================
    @property
    def max_chunk_size(self) -> int:
        return self.get_yaml_config("rag.max_chunk_size", 1000)
    
    @property
    def chunk_overlap(self) -> int:
        return self.get_yaml_config("rag.chunk_overlap", 200)
    
    @property
    def max_context_length(self) -> int:
        return self.get_yaml_config("rag.max_context_length", 4000)
    
    @property
    def max_sources(self) -> int:
        return self.get_yaml_config("rag.max_sources", 5)
    
    @property
    def include_citations(self) -> bool:
        return self.get_yaml_config("rag.include_citations", True)
    
    @property
    def include_confidence(self) -> bool:
        return self.get_yaml_config("rag.include_confidence", True)
    
    # ========================
    # AI PIPELINE SETTINGS (from YAML)
    # ========================
    @property
    def ai_pipeline_config(self) -> Dict[str, Any]:
        return self.get_yaml_config("ai_pipeline", {})
    
    # ========================
    # CACHE CONFIGURATION (from YAML)
    # ========================
    @property
    def redis_db(self) -> int:
        return self.get_yaml_config("cache.redis_db", 0)
    
    # ========================
    # RATE LIMITING (from YAML)
    # ========================
    @property
    def rate_limit_requests(self) -> int:
        return self.get_yaml_config("rate_limiting.requests", 100)
    
    @property
    def rate_limit_window(self) -> int:
        return self.get_yaml_config("rate_limiting.window", 3600)
    
    # ========================
    # LOGGING (from YAML)
    # ========================
    @property
    def log_level(self) -> str:
        return self.get_yaml_config("logging.level", "INFO")
    
    @property
    def log_format(self) -> str:
        return self.get_yaml_config("logging.format", "json")
    
    # ========================
    # SECURITY (from YAML)
    # ========================
    @property
    def algorithm(self) -> str:
        return self.get_yaml_config("security.algorithm", "HS256")
    
    @property
    def access_token_expire_minutes(self) -> int:
        return self.get_yaml_config("security.access_token_expire_minutes", 30)
    
    # ========================
    # GITHUB INTEGRATION (Environment Variables)
    # ========================
    @property
    def GITHUB_CLIENT_ID(self) -> Optional[str]:
        return self.github_client_id
    
    @property
    def GITHUB_CLIENT_SECRET(self) -> Optional[str]:
        return self.github_client_secret
    
    @property
    def GITHUB_CALLBACK_URL(self) -> Optional[str]:
        return self.github_callback_url
    
    @property
    def GITHUB_WEBHOOK_SECRET(self) -> Optional[str]:
        return self.github_webhook_secret
    
    @property
    def JWT_SECRET(self) -> str:
        return self.jwt_secret
    
    @property
    def ALLOWED_ORIGINS(self) -> List[str]:
        if self.allowed_origins:
            return [origin.strip() for origin in self.allowed_origins.split(',')]
        return ["*"]
    
    @property
    def ENVIRONMENT(self) -> str:
        return self.environment
    
    # ========================
    # FEATURE FLAGS (from YAML)
    # ========================
    @property
    def feature_flags(self) -> Dict[str, bool]:
        return {
            "agent_registry": self.get_yaml_config("features.agent_registry", True),
            "context_manager": self.get_yaml_config("features.context_manager", True),
            "tracing": self.get_yaml_config("features.tracing", True),
            "feature_flags": self.get_yaml_config("features.feature_flags", True),
            "test_harness": self.get_yaml_config("features.test_harness", True)
        }
    
    # ========================
    # VALIDATION METHODS
    # ========================
    
    def validate_environment(self) -> str:
        """Validate environment setting."""
        env = self.environment
        allowed = ["development", "testing", "production"]
        if env not in allowed:
            raise ValueError(f"Environment must be one of {allowed}")
        return env
    
    def validate_log_level(self) -> str:
        """Validate log level setting."""
        level = self.log_level
        allowed = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        if level.upper() not in allowed:
            raise ValueError(f"Log level must be one of {allowed}")
        return level.upper()
    
    # ========================
    # HELPER METHODS
    # ========================
    
    def is_agent_enabled(self, agent_name: str) -> bool:
        """Check if an agent is enabled."""
        return self.agents_enabled.get(agent_name, False)
    
    def is_provider_enabled(self, provider_name: str) -> bool:
        """Check if a provider is enabled."""
        return self.providers_enabled.get(provider_name, False)
    
    def is_feature_enabled(self, feature_name: str) -> bool:
        """Check if a feature is enabled."""
        return self.feature_flags.get(feature_name, False)
    
    def get_ai_pipeline_setting(self, key: str, default: Any = None) -> Any:
        """Get AI pipeline setting."""
        return self.ai_pipeline_config.get(key, default)
    
    # ========================
    # QDRANT CONFIGURATION HELPERS
    # ========================
    
    @property
    def is_qdrant_online(self) -> bool:
        """Check if Qdrant is configured for online mode."""
        return self.qdrant_mode.lower() == "online"
    
    @property
    def is_qdrant_local(self) -> bool:
        """Check if Qdrant is configured for local mode."""
        return self.qdrant_mode.lower() == "local"
    
    @property
    def qdrant_connection_url(self) -> str:
        """Get the appropriate Qdrant URL based on mode."""
        if self.is_qdrant_online:
            logger.info(f"Qdrant URL: {self.qdrant_url}")
            return self.qdrant_url
        else:
            return "http://localhost:6333"
    
    @property
    def qdrant_url_from_env(self) -> str:
        """Get Qdrant URL directly from environment variable."""
        return self.qdrant_url or "http://localhost:6333"
    
    @property
    def qdrant_connection_api_key(self) -> Optional[str]:
        """Get the appropriate Qdrant API key based on mode."""
        if self.is_qdrant_online:
            return self.qdrant_api_key
        else:
            return None  # Local Qdrant doesn't need API key
    
    # ========================
    # DATABASE CONFIGURATION HELPERS
    # ========================
    
    @property
    def is_supabase_configured(self) -> bool:
        """Check if Supabase is configured."""
        return bool(self.supabase_url and self.supabase_anon_key)
    
    @property
    def is_postgresql_configured(self) -> bool:
        """Check if PostgreSQL is configured."""
        return bool(self.postgres_host and self.postgres_user and self.postgres_password)
    
    @property
    def effective_database_provider(self) -> str:
        """Get the effective database provider based on configuration."""
        # Auto-detect based on available configuration
        if self.database_url:
            if 'supabase' in self.database_url or self.is_supabase_configured:
                return "supabase"
            elif 'postgresql' in self.database_url:
                return "postgresql"
            elif 'sqlite' in self.database_url:
                return "sqlite"
        
        if self.is_supabase_configured:
            return "supabase"
        elif self.is_postgresql_configured:
            return "postgresql"
        else:
            return "sqlite"  # Development fallback
    
    def get_database_connection_string(self) -> str:
        """Get the database connection string."""
        if self.database_url:
            return self.database_url
        
        provider = self.effective_database_provider
        
        if provider == "supabase" and self.supabase_url:
            # Extract PostgreSQL connection from Supabase URL
            supabase_host = self.supabase_url.replace('https://', '').replace('http://', '')
            return (f"postgresql://{self.postgres_user}:{self.postgres_password}@"
                   f"db.{supabase_host}:5432/{self.postgres_db}?sslmode=require")
        
        elif provider == "postgresql":
            return (f"postgresql://{self.postgres_user}:{self.postgres_password}@"
                   f"{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
                   f"?sslmode={self.postgres_ssl}")
        
        else:  # sqlite
            return "sqlite:///./beetle_dev.db"
    
    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
        "extra": "ignore"
    }


# Global settings instance
settings = Settings()


def get_settings() -> Settings:
    """Get the global settings instance."""
    return settings


# Convenience functions for feature flags
def is_agent_enabled(agent_name: str) -> bool:
    """Check if an agent is enabled."""
    return settings.is_agent_enabled(agent_name)


def is_provider_enabled(provider_name: str) -> bool:
    """Check if a provider is enabled."""
    return settings.is_provider_enabled(provider_name)


def is_feature_enabled(feature_name: str) -> bool:
    """Check if a feature is enabled."""
    return settings.is_feature_enabled(feature_name)
