"""
Session configuration for the RAG system.
Aligned with JavaScript backend session management.
"""

from typing import Dict, Any
from pydantic_settings import BaseSettings


class SessionConfig(BaseSettings):
    """Session management configuration."""
    
    # Session timeout settings
    session_timeout_seconds: int = 30 * 60  # 30 minutes
    max_sessions_per_user: int = 10
    cleanup_interval_seconds: int = 5 * 60  # 5 minutes
    
    # Context limits
    max_files_per_session: int = 50
    max_tokens_per_session: int = 100000
    max_file_size_bytes: int = 100 * 1024 * 1024  # 100MB (fixed comment)
    
    # Performance settings
    enable_session_caching: bool = True
    cache_ttl_seconds: int = 300  # 5 minutes
    
    # Security settings
    enable_session_validation: bool = True
    require_user_authentication: bool = True
    
    # Database settings (for future use)
    use_persistent_storage: bool = False
    database_url: str = ""
    
    class Config:
        env_prefix = "SESSION_"
        case_sensitive = False


# Global session config instance
_session_config: SessionConfig = None


def get_session_config() -> SessionConfig:
    """Get the global session configuration instance."""
    global _session_config
    if _session_config is None:
        _session_config = SessionConfig()
    return _session_config


def get_session_settings() -> Dict[str, Any]:
    """Get session settings as a dictionary."""
    config = get_session_config()
    return {
        "session_timeout": config.session_timeout_seconds,
        "max_sessions_per_user": config.max_sessions_per_user,
        "cleanup_interval": config.cleanup_interval_seconds,
        "max_files_per_session": config.max_files_per_session,
        "max_tokens_per_session": config.max_tokens_per_session,
        "max_file_size": config.max_file_size_bytes,
        "enable_caching": config.enable_session_caching,
        "cache_ttl": config.cache_ttl_seconds,
        "enable_validation": config.enable_session_validation,
        "require_auth": config.require_user_authentication
    }
