"""
Session manager for handling chat sessions with integrated context.
Replaces standalone context management with session-based approach.
"""

import asyncio
import time
from typing import Dict, Any, Optional, List, Set
import structlog
from datetime import datetime, timedelta
import uuid

from models.api.session_models import (
    ChatSession, SessionContext, FileContext, SessionMessage, 
    SessionStats, SessionStatus
)
from utils.file_utils import detect_language, detect_file_type
from config.session_config import get_session_config

logger = structlog.get_logger(__name__)


class SessionManager:
    """Manages chat sessions with integrated context handling."""
    
    def __init__(self):
        """Initialize the session manager."""
        # Session storage (in production, use Redis or database)
        self.sessions: Dict[str, ChatSession] = {}
        self.session_messages: Dict[str, List[SessionMessage]] = {}
        
        # Load configuration
        config = get_session_config()
        self.session_timeout = config.session_timeout_seconds
        self.max_sessions_per_user = config.max_sessions_per_user
        self.cleanup_interval = config.cleanup_interval_seconds
        
        # Cleanup task
        self.cleanup_task: Optional[asyncio.Task] = None
        
    async def start(self) -> None:
        """Start the session manager."""
        logger.info("Starting session manager")
        self.cleanup_task = asyncio.create_task(self._cleanup_loop())
        logger.info("Session manager started")
    
    async def stop(self) -> None:
        """Stop the session manager."""
        logger.info("Stopping session manager")
        if self.cleanup_task:
            self.cleanup_task.cancel()
            try:
                await self.cleanup_task
            except asyncio.CancelledError:
                pass
        logger.info("Session manager stopped")
    
    def create_session(
        self, 
        user_id: str, 
        title: str = "New Chat",
        repository_id: Optional[str] = None,
        branch: Optional[str] = None
    ) -> ChatSession:
        """Create a new chat session."""
        session_id = str(uuid.uuid4())
        
        # Create session context
        context = SessionContext(session_id=session_id)
        
        # Create session
        session = ChatSession(
            session_id=session_id,
            user_id=user_id,
            title=title,
            repository_id=repository_id,
            branch=branch,
            context=context
        )
        
        # Store session
        self.sessions[session_id] = session
        self.session_messages[session_id] = []
        
        logger.info(f"Created session {session_id} for user {user_id}")
        return session
    
    def get_session(self, session_id: str) -> Optional[ChatSession]:
        """Get a session by ID."""
        session = self.sessions.get(session_id)
        if session and self._is_session_active(session):
            session.update_activity()
            return session
        return None
    
    def get_user_sessions(self, user_id: str) -> List[ChatSession]:
        """Get all active sessions for a user."""
        user_sessions = []
        for session in self.sessions.values():
            if (session.user_id == user_id and 
                self._is_session_active(session)):
                user_sessions.append(session)
        
        # Sort by last activity (most recent first)
        user_sessions.sort(key=lambda s: s.last_activity, reverse=True)
        return user_sessions
    
    def update_session(
        self, 
        session_id: str, 
        updates: Dict[str, Any]
    ) -> Optional[ChatSession]:
        """Update session properties."""
        session = self.get_session(session_id)
        if not session:
            return None
        
        # Update allowed fields
        allowed_fields = ['title', 'repository_id', 'branch', 'status']
        for field, value in updates.items():
            if field in allowed_fields:
                setattr(session, field, value)
        
        session.update_activity()
        return session
    
    def delete_session(self, session_id: str) -> bool:
        """Delete a session."""
        if session_id in self.sessions:
            del self.sessions[session_id]
            if session_id in self.session_messages:
                del self.session_messages[session_id]
            logger.info(f"Deleted session {session_id}")
            return True
        return False
    
    def add_file_to_session(
        self, 
        session_id: str, 
        file_data: Dict[str, Any]
    ) -> bool:
        """Add a file to session context."""
        session = self.get_session(session_id)
        if not session:
            return False
        
        # Create file context
        file_context = FileContext(
            path=file_data['path'],
            branch=file_data.get('branch', 'main'),
            content=file_data['content'],
            size=file_data.get('size', len(file_data['content'])),
            language=detect_language(file_data['path'], file_data['content']),
            file_type=detect_file_type(file_data['path'], file_data['content'])
        )
        
        # Add to session context
        success = session.context.add_file(file_context)
        if success:
            session.update_activity()
            logger.info(f"Added file {file_data['path']} to session {session_id}")
        
        return success
    
    def remove_file_from_session(
        self, 
        session_id: str, 
        file_path: str, 
        branch: str = "main"
    ) -> bool:
        """Remove a file from session context."""
        session = self.get_session(session_id)
        if not session:
            return False
        
        success = session.context.remove_file(file_path, branch)
        if success:
            session.update_activity()
            logger.info(f"Removed file {file_path} from session {session_id}")
        
        return success
    
    def clear_session_files(self, session_id: str) -> bool:
        """Clear all files from session context."""
        session = self.get_session(session_id)
        if not session:
            return False
        
        session.context.clear_files()
        session.update_activity()
        logger.info(f"Cleared all files from session {session_id}")
        return True
    
    def add_message_to_session(
        self, 
        session_id: str, 
        role: str, 
        content: str,
        files_referenced: Optional[List[str]] = None,
        code_snippets: Optional[List[Dict[str, Any]]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Optional[SessionMessage]:
        """Add a message to a session."""
        session = self.get_session(session_id)
        if not session:
            return None
        
        # Create message
        message = SessionMessage(
            message_id=str(uuid.uuid4()),
            session_id=session_id,
            role=role,
            content=content,
            files_referenced=files_referenced or [],
            code_snippets=code_snippets or [],
            metadata=metadata
        )
        
        # Add to session messages
        if session_id not in self.session_messages:
            self.session_messages[session_id] = []
        
        self.session_messages[session_id].append(message)
        
        # Update session
        session.add_message()
        
        logger.info(f"Added {role} message to session {session_id}")
        return message
    
    def get_session_messages(
        self, 
        session_id: str, 
        limit: Optional[int] = None
    ) -> List[SessionMessage]:
        """Get messages for a session."""
        messages = self.session_messages.get(session_id, [])
        if limit:
            messages = messages[-limit:]
        return messages
    
    def get_session_stats(self, session_id: str) -> Optional[SessionStats]:
        """Get session statistics."""
        session = self.get_session(session_id)
        if not session:
            return None
        
        messages = self.get_session_messages(session_id)
        session_duration = (datetime.now() - session.created_at).total_seconds()
        
        avg_tokens_per_file = 0
        if session.context.total_files > 0:
            avg_tokens_per_file = session.context.total_tokens / session.context.total_files
        
        return SessionStats(
            session_id=session_id,
            total_files=session.context.total_files,
            total_tokens=session.context.total_tokens,
            average_tokens_per_file=avg_tokens_per_file,
            message_count=len(messages),
            session_duration=session_duration,
            created_at=session.created_at,
            updated_at=session.updated_at
        )
    
    def get_session_context_summary(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session context summary."""
        session = self.get_session(session_id)
        if not session:
            return None
        
        return session.context.get_context_summary()
    
    def _is_session_active(self, session: ChatSession) -> bool:
        """Check if session is still active."""
        if session.status != SessionStatus.ACTIVE:
            return False
        
        # Check timeout
        time_since_activity = (datetime.now() - session.last_activity).total_seconds()
        if time_since_activity > self.session_timeout:
            session.status = SessionStatus.EXPIRED
            return False
        
        return True
    
    async def _cleanup_loop(self) -> None:
        """Background cleanup loop."""
        while True:
            try:
                await asyncio.sleep(self.cleanup_interval)
                await self._cleanup_expired_sessions()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in cleanup loop: {e}")
    
    async def _cleanup_expired_sessions(self) -> None:
        """Clean up expired sessions."""
        expired_sessions = []
        
        for session_id, session in self.sessions.items():
            if not self._is_session_active(session):
                expired_sessions.append(session_id)
        
        for session_id in expired_sessions:
            self.delete_session(session_id)
        
        if expired_sessions:
            logger.info(f"Cleaned up {len(expired_sessions)} expired sessions")
    
    def get_manager_stats(self) -> Dict[str, Any]:
        """Get session manager statistics."""
        active_sessions = sum(1 for s in self.sessions.values() if self._is_session_active(s))
        total_messages = sum(len(msgs) for msgs in self.session_messages.values())
        
        return {
            "total_sessions": len(self.sessions),
            "active_sessions": active_sessions,
            "total_messages": total_messages,
            "session_timeout": self.session_timeout,
            "max_sessions_per_user": self.max_sessions_per_user
        }


# Global session manager instance
_session_manager: Optional[SessionManager] = None


def get_session_manager() -> SessionManager:
    """Get the global session manager instance."""
    global _session_manager
    if _session_manager is None:
        _session_manager = SessionManager()
    return _session_manager


async def initialize_session_manager() -> bool:
    """Initialize the global session manager."""
    try:
        manager = get_session_manager()
        await manager.start()
        return True
    except Exception as e:
        logger.error(f"Failed to initialize session manager: {e}")
        return False


async def shutdown_session_manager() -> None:
    """Shutdown the global session manager."""
    global _session_manager
    if _session_manager:
        await _session_manager.stop()
        _session_manager = None
