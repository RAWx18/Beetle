import os
import asyncio
from typing import Optional, List, Dict, Any, AsyncGenerator
from sqlalchemy import create_engine, MetaData, Table, Column, String, Integer, Float, DateTime, Boolean, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import StaticPool
from datetime import datetime
import logging
from contextlib import asynccontextmanager

from config.settings import get_settings

logger = logging.getLogger(__name__)

# Get settings
settings = get_settings()

# Create base class for models
Base = declarative_base()

# Database models
class DocumentModel(Base):
    """Document model for PostgreSQL"""
    __tablename__ = "documents"
    
    id = Column(String, primary_key=True)
    source_type = Column(String, nullable=False)
    source_url = Column(String)
    content = Column(Text, nullable=False)
    metadata = Column(JSON)
    timestamp = Column(DateTime, default=datetime.utcnow)
    repository_id = Column(String)
    branch = Column(String)
    status = Column(String, default="raw")
    error_message = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ChunkModel(Base):
    """Chunk model for PostgreSQL"""
    __tablename__ = "chunks"
    
    id = Column(String, primary_key=True)
    document_id = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    chunk_index = Column(Integer, nullable=False)
    chunk_type = Column(String, nullable=False)
    language = Column(String)
    metadata = Column(JSON)
    start_line = Column(Integer)
    end_line = Column(Integer)
    token_count = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class EmbeddingModel(Base):
    """Embedding model for PostgreSQL"""
    __tablename__ = "embeddings"
    
    id = Column(String, primary_key=True)
    chunk_id = Column(String, nullable=False)
    document_id = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    embedding = Column(JSON, nullable=False)  # Store as JSON array
    embedding_model = Column(String, nullable=False)
    embedding_dimension = Column(Integer, nullable=False)
    metadata = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class WorkflowExecutionModel(Base):
    """Workflow execution model for PostgreSQL"""
    __tablename__ = "workflow_executions"
    
    id = Column(String, primary_key=True)
    workflow_id = Column(String, nullable=False)
    status = Column(String, default="pending")
    current_step = Column(String)
    completed_steps = Column(JSON)  # Store as JSON array
    failed_steps = Column(JSON)  # Store as JSON array
    progress = Column(Float, default=0.0)
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    duration = Column(Float)
    input_data = Column(JSON)
    output_data = Column(JSON)
    error_message = Column(Text)
    metadata = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class AgentTaskModel(Base):
    """Agent task model for PostgreSQL"""
    __tablename__ = "agent_tasks"
    
    id = Column(String, primary_key=True)
    workflow_execution_id = Column(String, nullable=False)
    step_id = Column(String, nullable=False)
    agent_type = Column(String, nullable=False)
    status = Column(String, default="pending")
    input_data = Column(JSON)
    output_data = Column(JSON)
    dependencies = Column(JSON)  # Store as JSON array
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    duration = Column(Float)
    error_message = Column(Text)
    metadata = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class RAGMetricsModel(Base):
    """RAG metrics model for PostgreSQL"""
    __tablename__ = "rag_metrics"
    
    id = Column(String, primary_key=True)
    query_id = Column(String, nullable=False)
    retrieval_time = Column(Float, nullable=False)
    generation_time = Column(Float, nullable=False)
    total_time = Column(Float, nullable=False)
    retrieval_quality = Column(Float)
    generation_quality = Column(Float)
    user_feedback = Column(Integer)
    tokens_used = Column(Integer, nullable=False)
    cost_estimate = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class DatabaseService:
    """Database service for PostgreSQL operations"""
    
    def __init__(self):
        self.engine = None
        self.async_engine = None
        self.SessionLocal = None
        self.AsyncSessionLocal = None
        self.initialized = False
    
    async def initialize(self):
        """Initialize database connection"""
        try:
            logger.info("Initializing database service...")
            
            # Create async engine
            self.async_engine = create_async_engine(
                settings.database_url.replace("postgresql://", "postgresql+asyncpg://"),
                pool_size=settings.database_pool_size,
                max_overflow=settings.database_max_overflow,
                echo=settings.debug,
                pool_pre_ping=True,
                pool_recycle=3600,
            )
            
            # Create async session factory
            self.AsyncSessionLocal = async_sessionmaker(
                self.async_engine,
                class_=AsyncSession,
                expire_on_commit=False
            )
            
            # Create sync engine for migrations
            sync_url = settings.database_url.replace("postgresql+asyncpg://", "postgresql://")
            self.engine = create_engine(
                sync_url,
                pool_size=settings.database_pool_size,
                max_overflow=settings.database_max_overflow,
                echo=settings.debug,
                pool_pre_ping=True,
                pool_recycle=3600,
            )
            
            # Create sync session factory
            self.SessionLocal = sessionmaker(
                autocommit=False,
                autoflush=False,
                bind=self.engine
            )
            
            # Create tables
            await self.create_tables()
            
            self.initialized = True
            logger.info("Database service initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize database service: {e}")
            raise
    
    async def create_tables(self):
        """Create database tables"""
        try:
            async with self.async_engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            logger.info("Database tables created successfully")
        except Exception as e:
            logger.error(f"Failed to create tables: {e}")
            raise
    
    @asynccontextmanager
    async def get_session(self) -> AsyncGenerator[AsyncSession, None]:
        """Get database session"""
        if not self.initialized:
            await self.initialize()
        
        async with self.AsyncSessionLocal() as session:
            try:
                yield session
                await session.commit()
            except Exception as e:
                await session.rollback()
                logger.error(f"Database session error: {e}")
                raise
            finally:
                await session.close()
    
    def get_sync_session(self) -> Session:
        """Get synchronous database session"""
        if not self.initialized:
            asyncio.run(self.initialize())
        
        session = self.SessionLocal()
        try:
            return session
        except Exception as e:
            session.close()
            logger.error(f"Failed to get sync session: {e}")
            raise
    
    async def health_check(self) -> bool:
        """Check database health"""
        try:
            async with self.get_session() as session:
                await session.execute("SELECT 1")
            return True
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return False
    
    async def close(self):
        """Close database connections"""
        if self.async_engine:
            await self.async_engine.dispose()
        if self.engine:
            self.engine.dispose()
        logger.info("Database connections closed")


# Global database service instance
db_service = DatabaseService()


async def get_db_service() -> DatabaseService:
    """Get database service instance"""
    if not db_service.initialized:
        await db_service.initialize()
    return db_service


async def get_db_session() -> AsyncSession:
    """Get database session"""
    async with db_service.get_session() as session:
        return session


# Database operations
class DocumentRepository:
    """Repository for document operations"""
    
    def __init__(self, db_service: DatabaseService):
        self.db_service = db_service
    
    async def create_document(self, document_data: Dict[str, Any]) -> DocumentModel:
        """Create a new document"""
        async with self.db_service.get_session() as session:
            document = DocumentModel(**document_data)
            session.add(document)
            await session.commit()
            await session.refresh(document)
            return document
    
    async def get_document(self, document_id: str) -> Optional[DocumentModel]:
        """Get document by ID"""
        async with self.db_service.get_session() as session:
            result = await session.execute(
                "SELECT * FROM documents WHERE id = :document_id",
                {"document_id": document_id}
            )
            return result.fetchone()
    
    async def update_document(self, document_id: str, update_data: Dict[str, Any]) -> Optional[DocumentModel]:
        """Update document"""
        async with self.db_service.get_session() as session:
            result = await session.execute(
                "UPDATE documents SET updated_at = NOW() WHERE id = :document_id RETURNING *",
                {"document_id": document_id, **update_data}
            )
            await session.commit()
            return result.fetchone()
    
    async def delete_document(self, document_id: str) -> bool:
        """Delete document"""
        async with self.db_service.get_session() as session:
            result = await session.execute(
                "DELETE FROM documents WHERE id = :document_id",
                {"document_id": document_id}
            )
            await session.commit()
            return result.rowcount > 0
    
    async def list_documents(self, repository_id: Optional[str] = None, limit: int = 100, offset: int = 0) -> List[DocumentModel]:
        """List documents with optional filtering"""
        async with self.db_service.get_session() as session:
            query = "SELECT * FROM documents"
            params = {}
            
            if repository_id:
                query += " WHERE repository_id = :repository_id"
                params["repository_id"] = repository_id
            
            query += " ORDER BY created_at DESC LIMIT :limit OFFSET :offset"
            params.update({"limit": limit, "offset": offset})
            
            result = await session.execute(query, params)
            return result.fetchall()


class ChunkRepository:
    """Repository for chunk operations"""
    
    def __init__(self, db_service: DatabaseService):
        self.db_service = db_service
    
    async def create_chunk(self, chunk_data: Dict[str, Any]) -> ChunkModel:
        """Create a new chunk"""
        async with self.db_service.get_session() as session:
            chunk = ChunkModel(**chunk_data)
            session.add(chunk)
            await session.commit()
            await session.refresh(chunk)
            return chunk
    
    async def get_chunks_by_document(self, document_id: str) -> List[ChunkModel]:
        """Get chunks by document ID"""
        async with self.db_service.get_session() as session:
            result = await session.execute(
                "SELECT * FROM chunks WHERE document_id = :document_id ORDER BY chunk_index",
                {"document_id": document_id}
            )
            return result.fetchall()
    
    async def delete_chunks_by_document(self, document_id: str) -> bool:
        """Delete chunks by document ID"""
        async with self.db_service.get_session() as session:
            result = await session.execute(
                "DELETE FROM chunks WHERE document_id = :document_id",
                {"document_id": document_id}
            )
            await session.commit()
            return result.rowcount > 0


class EmbeddingRepository:
    """Repository for embedding operations"""
    
    def __init__(self, db_service: DatabaseService):
        self.db_service = db_service
    
    async def create_embedding(self, embedding_data: Dict[str, Any]) -> EmbeddingModel:
        """Create a new embedding"""
        async with self.db_service.get_session() as session:
            embedding = EmbeddingModel(**embedding_data)
            session.add(embedding)
            await session.commit()
            await session.refresh(embedding)
            return embedding
    
    async def get_embeddings_by_chunk(self, chunk_id: str) -> List[EmbeddingModel]:
        """Get embeddings by chunk ID"""
        async with self.db_service.get_session() as session:
            result = await session.execute(
                "SELECT * FROM embeddings WHERE chunk_id = :chunk_id",
                {"chunk_id": chunk_id}
            )
            return result.fetchall()
    
    async def delete_embeddings_by_chunk(self, chunk_id: str) -> bool:
        """Delete embeddings by chunk ID"""
        async with self.db_service.get_session() as session:
            result = await session.execute(
                "DELETE FROM embeddings WHERE chunk_id = :chunk_id",
                {"chunk_id": chunk_id}
            )
            await session.commit()
            return result.rowcount > 0 