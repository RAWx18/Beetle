"""
Database service layer providing high-level database operations.
Acts as a bridge between your existing code and the new database layer.
"""

from typing import Optional, List, Dict, Any, Union
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_, or_, desc, asc

from config.database import get_database_manager, get_async_db_session
from models.database import (
    UserModel, UserSessionModel, UserNoteModel, UserSavedFilterModel, 
    UserPinnedItemModel, UserSettingsModel, ProjectModel, ProjectBranchModel,
    ChatSessionModel, SessionMessageModel, FileContextModel,
    WebhookEventModel, WebhookSecurityLogModel
)
from models.api.auth_models import User, UserSession, UserNote, UserSavedFilter, UserPinnedItem, UserSettings
from models.api.project_models import Project, ProjectBranch
from models.api.session_models import ChatSession, SessionMessage, FileContext

import structlog

logger = structlog.get_logger(__name__)

class DatabaseService:
    """High-level database service providing CRUD operations."""
    
    def __init__(self):
        self.db_manager = get_database_manager()
    
    # ========================
    # USER OPERATIONS
    # ========================
    
    async def create_user(self, user_data: Dict[str, Any]) -> User:
        """Create a new user."""
        async with self.db_manager.get_async_session() as session:
            # Check if user already exists by github_id
            existing_user = await session.execute(
                select(UserModel).where(UserModel.github_id == user_data.get('github_id'))
            )
            if existing_user.scalar_one_or_none():
                raise ValueError("User already exists")
            
            # Create user
            db_user = UserModel(**user_data)
            session.add(db_user)
            await session.flush()  # Get the ID
            
            # Create default settings
            settings = UserSettingsModel(user_id=db_user.id)
            session.add(settings)
            
            return db_user.to_pydantic(User)
    
    async def get_user_by_github_id(self, github_id: int) -> Optional[User]:
        """Get user by GitHub ID."""
        async with self.db_manager.get_async_session() as session:
            result = await session.execute(
                select(UserModel).where(UserModel.github_id == github_id)
            )
            user = result.scalar_one_or_none()
            return user.to_pydantic(User) if user else None
    
    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID."""
        async with self.db_manager.get_async_session() as session:
            result = await session.execute(
                select(UserModel).where(UserModel.id == user_id)
            )
            user = result.scalar_one_or_none()
            return user.to_pydantic(User) if user else None
    
    async def update_user(self, user_id: str, updates: Dict[str, Any]) -> Optional[User]:
        """Update user data."""
        async with self.db_manager.get_async_session() as session:
            result = await session.execute(
                select(UserModel).where(UserModel.id == user_id)
            )
            user = result.scalar_one_or_none()
            if not user:
                return None
            
            user.update_from_dict(updates)
            return user.to_pydantic(User)
    
    # ========================
    # SESSION OPERATIONS
    # ========================
    
    async def create_user_session(self, session_data: Dict[str, Any]) -> UserSession:
        """Create a new user session."""
        async with self.db_manager.get_async_session() as session:
            db_session = UserSessionModel(**session_data)
            session.add(db_session)
            await session.flush()
            return db_session.to_pydantic(UserSession)
    
    async def get_user_session(self, session_id: str) -> Optional[UserSession]:
        """Get user session by session ID."""
        async with self.db_manager.get_async_session() as session:
            result = await session.execute(
                select(UserSessionModel).where(UserSessionModel.session_id == session_id)
            )
            user_session = result.scalar_one_or_none()
            return user_session.to_pydantic(UserSession) if user_session else None
    
    async def delete_user_session(self, session_id: str) -> bool:
        """Delete user session."""
        async with self.db_manager.get_async_session() as session:
            result = await session.execute(
                select(UserSessionModel).where(UserSessionModel.session_id == session_id)
            )
            user_session = result.scalar_one_or_none()
            if user_session:
                await session.delete(user_session)
                return True
            return False
    
    # ========================
    # PROJECT OPERATIONS
    # ========================
    
    async def create_project(self, project_data: Dict[str, Any]) -> Project:
        """Create a new project."""
        async with self.db_manager.get_async_session() as session:
            db_project = ProjectModel(**project_data)
            session.add(db_project)
            await session.flush()
            return db_project.to_pydantic(Project)
    
    async def get_project(self, project_id: str) -> Optional[Project]:
        """Get project by ID."""
        async with self.db_manager.get_async_session() as session:
            result = await session.execute(
                select(ProjectModel).where(ProjectModel.id == project_id)
            )
            project = result.scalar_one_or_none()
            return project.to_pydantic(Project) if project else None
    
    async def get_user_projects(self, user_id: str) -> List[Project]:
        """Get all projects for a user."""
        async with self.db_manager.get_async_session() as session:
            result = await session.execute(
                select(ProjectModel)
                .where(ProjectModel.created_by == user_id)
                .order_by(desc(ProjectModel.updated_at))
            )
            projects = result.scalars().all()
            return [project.to_pydantic(Project) for project in projects]
    
    async def update_project(self, project_id: str, updates: Dict[str, Any]) -> Optional[Project]:
        """Update project data."""
        async with self.db_manager.get_async_session() as session:
            result = await session.execute(
                select(ProjectModel).where(ProjectModel.id == project_id)
            )
            project = result.scalar_one_or_none()
            if not project:
                return None
            
            project.update_from_dict(updates)
            return project.to_pydantic(Project)
    
    async def delete_project(self, project_id: str) -> bool:
        """Delete project."""
        async with self.db_manager.get_async_session() as session:
            result = await session.execute(
                select(ProjectModel).where(ProjectModel.id == project_id)
            )
            project = result.scalar_one_or_none()
            if project:
                await session.delete(project)
                return True
            return False
    
    # ========================
    # CHAT SESSION OPERATIONS
    # ========================
    
    async def create_chat_session(self, session_data: Dict[str, Any]) -> ChatSession:
        """Create a new chat session."""
        async with self.db_manager.get_async_session() as session:
            db_session = ChatSessionModel(**session_data)
            session.add(db_session)
            await session.flush()
            return db_session.to_pydantic(ChatSession)
    
    async def get_chat_session(self, session_id: str) -> Optional[ChatSession]:
        """Get chat session by ID."""
        async with self.db_manager.get_async_session() as session:
            result = await session.execute(
                select(ChatSessionModel).where(ChatSessionModel.session_id == session_id)
            )
            chat_session = result.scalar_one_or_none()
            return chat_session.to_pydantic(ChatSession) if chat_session else None
    
    async def get_user_chat_sessions(self, user_id: str) -> List[ChatSession]:
        """Get all chat sessions for a user."""
        async with self.db_manager.get_async_session() as session:
            result = await session.execute(
                select(ChatSessionModel)
                .where(ChatSessionModel.user_id == user_id)
                .order_by(desc(ChatSessionModel.last_activity))
            )
            sessions = result.scalars().all()
            return [session.to_pydantic(ChatSession) for session in sessions]
    
    # ========================
    # WEBHOOK OPERATIONS  
    # ========================
    
    async def save_webhook_event(self, event_data: Dict[str, Any]) -> None:
        """Save webhook event for audit trail."""
        async with self.db_manager.get_async_session() as session:
            db_event = WebhookEventModel(**event_data)
            session.add(db_event)
    
    async def log_webhook_security_event(self, log_data: Dict[str, Any]) -> None:
        """Log webhook security event."""
        async with self.db_manager.get_async_session() as session:
            db_log = WebhookSecurityLogModel(**log_data)
            session.add(db_log)
    
    # ========================
    # UTILITY METHODS
    # ========================
    
    async def health_check(self) -> Dict[str, Any]:
        """Check database health."""
        return await self.db_manager.health_check()
    
    async def get_database_stats(self) -> Dict[str, Any]:
        """Get database statistics."""
        async with self.db_manager.get_async_session() as session:
            # Count records in main tables
            stats = {}
            
            # Users
            result = await session.execute(select(UserModel).count())
            stats['users'] = result.scalar()
            
            # Projects  
            result = await session.execute(select(ProjectModel).count())
            stats['projects'] = result.scalar()
            
            # Chat sessions
            result = await session.execute(select(ChatSessionModel).count())
            stats['chat_sessions'] = result.scalar()
            
            # Webhook events
            result = await session.execute(select(WebhookEventModel).count())
            stats['webhook_events'] = result.scalar()
            
            return stats

# Global service instance
_database_service: Optional[DatabaseService] = None

def get_database_service() -> DatabaseService:
    """Get global database service."""
    global _database_service
    if _database_service is None:
        _database_service = DatabaseService()
    return _database_service

# FastAPI dependency
async def get_db_service() -> DatabaseService:
    """FastAPI dependency for database service."""
    return get_database_service()

