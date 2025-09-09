"""
Health check API routes for the RAG system.
Aligned with JavaScript backend health checks.
"""

from fastapi import APIRouter
from core.session_manager import get_session_manager

router = APIRouter()


@router.get("/health")
async def health_check():
    """Comprehensive health check endpoint aligned with JavaScript backend."""
    try:
        # Get session manager stats
        session_manager = get_session_manager()
        session_stats = session_manager.get_manager_stats()
        
        return {
            "status": "healthy",
            "message": "Python RAG backend is healthy",
            "session_management": {
                "enabled": True,
                "total_sessions": session_stats.get("total_sessions", 0),
                "active_sessions": session_stats.get("active_sessions", 0),
                "total_messages": session_stats.get("total_messages", 0)
            },
            "version": "2.0.0",
            "features": {
                "session_based_context": True,
                "rag_processing": True,
                "multi_agent_support": True
            }
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "session_management": {
                "enabled": False
            }
        }
