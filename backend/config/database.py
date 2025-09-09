"""
Database configuration and management for PostgreSQL and Supabase.
Supports both local PostgreSQL and hosted Supabase with automatic provider detection.
"""

import os
import asyncio
from typing import Optional, Dict, Any, Union, AsyncGenerator
from enum import Enum
from abc import ABC, abstractmethod
from contextlib import asynccontextmanager
import structlog

from pydantic import Field, validator
from pydantic_settings import BaseSettings
from sqlalchemy import text

logger = structlog.get_logger(__name__)

class DatabaseProvider(str, Enum):
    """Supported database providers."""
    POSTGRESQL = "postgresql"
    SUPABASE = "supabase"
    SQLITE = "sqlite"  # Development fallback

class DatabaseSettings(BaseSettings):
    """Database configuration settings."""
    
    # ========================
    # DATABASE CONFIGURATION
    # ========================
    
    # Provider Selection
    database_provider: str = Field(default="sqlite", env="DATABASE_PROVIDER")
    
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
    
    # Generic Database URL (overrides individual settings)
    database_url: Optional[str] = Field(default=None, env="DATABASE_URL")
    
    # Connection Pool Settings
    pool_size: int = Field(default=10, env="DB_POOL_SIZE")
    max_overflow: int = Field(default=20, env="DB_MAX_OVERFLOW")
    pool_timeout: int = Field(default=30, env="DB_POOL_TIMEOUT")
    pool_recycle: int = Field(default=3600, env="DB_POOL_RECYCLE")
    
    # Development Settings
    sqlite_path: str = Field(default="./beetle_dev.db", env="SQLITE_PATH")
    create_tables: bool = Field(default=True, env="DB_CREATE_TABLES")
    
    class Config:
        env_prefix = "DB_"
        case_sensitive = False
    
    @validator('database_provider')
    def validate_provider(cls, v):
        """Validate database provider."""
        if v not in [provider.value for provider in DatabaseProvider]:
            raise ValueError(f"Invalid database provider: {v}")
        return v
    
    @property
    def is_supabase(self) -> bool:
        """Check if using Supabase."""
        return (self.database_provider == DatabaseProvider.SUPABASE or 
                (self.supabase_url is not None and self.supabase_anon_key is not None))
    
    @property
    def is_postgresql(self) -> bool:
        """Check if using PostgreSQL."""
        return self.database_provider == DatabaseProvider.POSTGRESQL
    
    @property
    def is_sqlite(self) -> bool:
        """Check if using SQLite."""
        return self.database_provider == DatabaseProvider.SQLITE
    
    def get_connection_string(self) -> str:
        """Get the appropriate connection string."""
        # If database_url is provided, use it directly
        if self.database_url:
            return self.database_url
        
        # Auto-detect provider based on available settings
        if self.is_supabase and self.supabase_url:
            # Extract PostgreSQL connection from Supabase URL
            supabase_host = self.supabase_url.replace('https://', '').replace('http://', '')
            return (f"postgresql://{self.postgres_user}:{self.postgres_password}@"
                   f"db.{supabase_host}:5432/{self.postgres_db}?sslmode=require")
        
        elif self.is_postgresql:
            # Standard PostgreSQL connection
            return (f"postgresql://{self.postgres_user}:{self.postgres_password}@"
                   f"{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
                   f"?sslmode={self.postgres_ssl}")
        
        elif self.is_sqlite:
            # SQLite for development
            return f"sqlite:///{self.sqlite_path}"
        
        else:
            raise ValueError("No valid database configuration found")
    
    def get_async_connection_string(self) -> str:
        """Get async connection string."""
        conn_str = self.get_connection_string()
        if conn_str.startswith('postgresql://'):
            # Replace sslmode with ssl parameter for asyncpg
            async_str = conn_str.replace('postgresql://', 'postgresql+asyncpg://')
            if '?sslmode=' in async_str:
                async_str = async_str.replace('?sslmode=prefer', '?ssl=prefer')
                async_str = async_str.replace('?sslmode=require', '?ssl=require')
                async_str = async_str.replace('?sslmode=disable', '?ssl=disable')
            return async_str
        elif conn_str.startswith('sqlite://'):
            return conn_str.replace('sqlite://', 'sqlite+aiosqlite://')
        return conn_str

class DatabaseManager:
    """Database manager with support for multiple providers."""
    
    def __init__(self, settings: DatabaseSettings = None):
        self.settings = settings or DatabaseSettings()
        self._engine = None
        self._async_engine = None
        self._session_factory = None
        self._async_session_factory = None
        self._supabase_client = None
        
        logger.info("Database manager initialized", 
                   provider=self.settings.database_provider,
                   is_supabase=self.settings.is_supabase)
    
    async def initialize(self) -> bool:
        """Initialize database connections."""
        try:
            if self.settings.is_supabase:
                await self._setup_supabase()
            
            await self._setup_sqlalchemy()
            
            if self.settings.create_tables:
                await self._create_tables()
            
            # Test connection
            await self._test_connection()
            
            logger.info("Database initialized successfully", 
                       provider=self.settings.database_provider)
            return True
            
        except Exception as e:
            logger.error("Database initialization failed", error=str(e))
            return False
    
    async def _setup_supabase(self):
        """Setup Supabase client if needed."""
        if not self.settings.is_supabase:
            return
        
        try:
            # Optional: Setup Supabase client for additional features
            # This is mainly for real-time features, auth, etc.
            from supabase import create_client
            
            if self.settings.supabase_url and self.settings.supabase_anon_key:
                self._supabase_client = create_client(
                    self.settings.supabase_url,
                    self.settings.supabase_anon_key
                )
                logger.info("Supabase client initialized")
        except ImportError:
            logger.warning("Supabase client not available, using PostgreSQL directly")
        except Exception as e:
            logger.error("Failed to setup Supabase client", error=str(e))
    
    async def _setup_sqlalchemy(self):
        """Setup SQLAlchemy engine and session factory."""
        try:
            from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
            from sqlalchemy import create_engine
            from sqlalchemy.orm import sessionmaker
            
            # Connection strings
            sync_conn_str = self.settings.get_connection_string()
            async_conn_str = self.settings.get_async_connection_string()
            
            # Create engines
            engine_kwargs = {
                "pool_size": self.settings.pool_size,
                "max_overflow": self.settings.max_overflow,
                "pool_timeout": self.settings.pool_timeout,
                "pool_recycle": self.settings.pool_recycle,
                "echo": self.settings.is_sqlite  # Only echo for SQLite in dev
            }
            
            # Remove pool settings for SQLite
            if self.settings.is_sqlite:
                engine_kwargs = {"echo": True}
            
            self._engine = create_engine(sync_conn_str, **engine_kwargs)
            self._async_engine = create_async_engine(async_conn_str, **engine_kwargs)
            
            # Session factories
            self._session_factory = sessionmaker(bind=self._engine)
            self._async_session_factory = async_sessionmaker(
                bind=self._async_engine,
                expire_on_commit=False
            )
            
            logger.info("SQLAlchemy setup completed")
            
        except Exception as e:
            logger.error("Failed to setup SQLAlchemy", error=str(e))
            raise
    
    async def _create_tables(self):
        """Create database tables."""
        try:
            from models.database import Base  # We'll create this
            
            if self.settings.is_sqlite:
                # For SQLite, create tables synchronously
                Base.metadata.create_all(self._engine)
            else:
                # For PostgreSQL/Supabase, create tables asynchronously
                async with self._async_engine.begin() as conn:
                    await conn.run_sync(Base.metadata.create_all)
            
            logger.info("Database tables created/verified")
            
        except Exception as e:
            logger.error("Failed to create tables", error=str(e))
            # Don't raise here, tables might already exist
    
    async def _test_connection(self):
        """Test database connection."""
        try:
            async with self.get_async_session() as session:
                # Simple query to test connection
                if self.settings.is_sqlite:
                    result = await session.execute(text("SELECT 1"))
                else:
                    result = await session.execute(text("SELECT version()"))
                
                result.fetchone()
                logger.info("Database connection test successful")
                
        except Exception as e:
            logger.error("Database connection test failed", error=str(e))
            raise
    
    @asynccontextmanager
    async def get_async_session(self):
        """Get async database session."""
        if not self._async_session_factory:
            raise RuntimeError("Database not initialized")
        
        async with self._async_session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()
    
    def get_session(self):
        """Get sync database session."""
        if not self._session_factory:
            raise RuntimeError("Database not initialized")
        
        return self._session_factory()
    
    @property
    def supabase_client(self):
        """Get Supabase client if available."""
        return self._supabase_client
    
    @property
    def engine(self):
        """Get SQLAlchemy engine."""
        return self._engine
    
    @property
    def async_engine(self):
        """Get async SQLAlchemy engine."""
        return self._async_engine
    
    async def health_check(self) -> Dict[str, Any]:
        """Check database health."""
        try:
            async with self.get_async_session() as session:
                if self.settings.is_sqlite:
                    await session.execute(text("SELECT 1"))
                else:
                    await session.execute(text("SELECT 1"))
                
                return {
                    "status": "healthy",
                    "provider": self.settings.database_provider,
                    "connection": "active",
                    "supabase_client": self._supabase_client is not None
                }
        except Exception as e:
            return {
                "status": "unhealthy",
                "provider": self.settings.database_provider,
                "error": str(e),
                "connection": "failed"
            }
    
    async def close(self):
        """Close database connections."""
        try:
            if self._async_engine:
                await self._async_engine.dispose()
            if self._engine:
                self._engine.dispose()
            
            logger.info("Database connections closed")
        except Exception as e:
            logger.error("Error closing database connections", error=str(e))

# Global database manager instance
_database_manager: Optional[DatabaseManager] = None

def get_database_settings() -> DatabaseSettings:
    """Get database settings."""
    return DatabaseSettings()

def get_database_manager() -> DatabaseManager:
    """Get global database manager."""
    global _database_manager
    if _database_manager is None:
        _database_manager = DatabaseManager()
    return _database_manager

async def initialize_database() -> bool:
    """Initialize the global database manager."""
    db_manager = get_database_manager()
    return await db_manager.initialize()

async def get_async_db_session():
    """Dependency for FastAPI routes to get async database session."""
    db_manager = get_database_manager()
    async with db_manager.get_async_session() as session:
        yield session

def get_db_session():
    """Get sync database session."""
    db_manager = get_database_manager()
    return db_manager.get_session()

async def close_database():
    """Close database connections."""
    global _database_manager
    if _database_manager:
        await _database_manager.close()
        _database_manager = None

