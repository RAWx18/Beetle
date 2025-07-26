"""
Health check API routes for the RAG system.
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check():
    """Basic health check endpoint."""
    return {"status": "healthy", "message": "Health endpoint - use main /health endpoint for full functionality"}
