"""
Beetle RAG System - FastAPI Application
Main entry point for the RAG system with session-based context management.
"""

from dotenv import load_dotenv

load_dotenv()

import asyncio
import os
from contextlib import asynccontextmanager
from typing import Dict, Any
import structlog
from datetime import datetime

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Import core components
from core.orchestrator import get_orchestrator, initialize_orchestrator, shutdown_orchestrator
from agents.base.base_agent import get_enhanced_agent_registry
from config.features import is_agent_enabled, is_provider_enabled
from config.settings import get_settings
from utils.tracing import trace
from utils.prompt_loader import render_prompt

# Import API routes
from api.v1.routes import chat, health
from api.v1.routes.auth import router as auth_router
from api.v1.routes.github import router as github_router
from api.v1.routes.analytics import router as analytics_router
from api.v1.routes.projects import router as projects_router
from api.v1.routes.webhooks import router as webhooks_router
from api.v1.routes.aggregated import router as aggregated_router
from api.v1.routes.websocket import router as websocket_router
from api.v1.routes.file_upload import router as file_upload_router
from api.v1.routes.static import router as static_router
from api.v1.routes.hub import router as hub_router

logger = structlog.get_logger(__name__)
settings = get_settings()

# Global orchestrator instance
orchestrator = None
agent_registry = get_enhanced_agent_registry()


def get_global_orchestrator():
    """Get the global orchestrator instance."""
    global orchestrator
    return orchestrator


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    global orchestrator
    
    # Startup
    logger.info("🚀 Starting Beetle RAG System with session management...")
    
    try:
        # Initialize database first
        from config.database import initialize_database
        db_success = await initialize_database()
        if not db_success:
            logger.error("❌ Failed to initialize database")
            raise RuntimeError("Database initialization failed")
        
        logger.info("✅ Database initialized successfully")
        
        # Load and register agents based on feature flags
        await _load_enabled_agents()

        # Initialize orchestrator (includes session manager)
        success = await initialize_orchestrator()
        if not success:
            logger.error("❌ Failed to initialize orchestrator")
            raise RuntimeError("Orchestrator initialization failed")
        
        orchestrator = get_orchestrator()
        
        # Health check
        health_status = await orchestrator.get_orchestrator_stats()
        if health_status and "error" in health_status:
            logger.warning("⚠️ System health check has warnings", error=health_status["error"])
            # Don't fail startup for health check warnings, just log them
        elif not health_status:
            logger.error("❌ System health check failed")
            raise RuntimeError("System initialization failed")
        
        logger.info("✅ Beetle RAG System started successfully")
        logger.info(f"📊 System stats: {health_status}")
        trace("app_started", {"status": "success", "agents_loaded": len(agent_registry.get_all_agents())})
        
    except Exception as e:
        logger.error("❌ Failed to start Beetle RAG System", error=str(e))
        trace("app_started", {"status": "failed", "error": str(e)})
        raise
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down Beetle RAG System...")
    try:
        # Shutdown orchestrator first
        await shutdown_orchestrator()
        
        # Shutdown database connections
        from config.database import close_database
        await close_database()
        logger.info("✅ Database connections closed")
        
        trace("app_shutdown", {"status": "success"})
    except Exception as e:
        logger.error("❌ Error during shutdown", error=str(e))
        trace("app_shutdown", {"status": "failed", "error": str(e)})


# Create FastAPI app
app = FastAPI(
    title="Beetle RAG System",
    description="Advanced RAG system with session-based context management and multi-agent architecture",
    version="2.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(chat.router, prefix="/api/v1/chat", tags=["chat"])
app.include_router(health.router, prefix="/api/v1", tags=["health"])
app.include_router(auth_router, prefix="/api/v1/auth", tags=["authentication"])
app.include_router(github_router, prefix="/api/v1/github", tags=["github"])
app.include_router(analytics_router, prefix="/api/v1/analytics", tags=["analytics"])
app.include_router(projects_router, prefix="/api/v1/projects", tags=["projects"])
app.include_router(webhooks_router, prefix="/api/v1/webhooks", tags=["webhooks"])
app.include_router(aggregated_router, prefix="/api/v1/aggregated", tags=["aggregated"])

# Include new routes for complete JS backend compatibility
app.include_router(websocket_router, prefix="/api/v1", tags=["websocket"])
app.include_router(file_upload_router, prefix="/api/v1", tags=["file_upload"])
app.include_router(static_router, tags=["static_files"])
app.include_router(hub_router, prefix="/api/v1/hub", tags=["hub"])

# Add a test endpoint to verify the connection
@app.get("/test")
async def test_connection():
    """Test endpoint to verify the system is running."""
    return {
        "status": "ok",
        "message": "Beetle RAG System is running",
        "version": "2.0.0",
        "session_management": "enabled",
        "websocket_support": "enabled",
        "file_upload_support": "enabled", 
        "static_file_support": "enabled",
        "timestamp": datetime.now().isoformat()
    }


@app.get("/test/quick")
async def quick_test():
    """Quick test endpoint for fast response."""
    return {
        "status": "ok",
        "message": "Quick response test",
        "timestamp": datetime.now().isoformat()
    }


@app.get("/health")
async def health_check():
    """Comprehensive health check endpoint."""
    try:
        if not orchestrator:
            return {
                "status": "unhealthy",
                "error": "Orchestrator not initialized",
                "timestamp": asyncio.get_event_loop().time()
            }
        
        # Get system stats
        stats = await orchestrator.get_orchestrator_stats()
        
        # Check if any critical components are failing
        is_healthy = True
        errors = []
        
        if "error" in stats:
            is_healthy = False
            errors.append(stats["error"])
        
        # Check session manager
        session_stats = stats.get("session_manager", {})
        if not session_stats:
            is_healthy = False
            errors.append("Session manager not available")
        
        # Check agents
        agent_stats = stats.get("agents", {})
        if agent_stats.get("active_agents", 0) == 0:
            is_healthy = False
            errors.append("No active agents")
        
        return {
            "status": "healthy" if is_healthy else "unhealthy",
            "timestamp": asyncio.get_event_loop().time(),
            "components": {
                "orchestrator": True,
                "session_manager": bool(session_stats),
                "agents": agent_stats.get("active_agents", 0) > 0,
                "vector_store": "vector_store" in stats
            },
            "stats": stats,
            "errors": errors if errors else None
        }
    
    except Exception as e:
        logger.error("Health check failed", error=str(e))
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": asyncio.get_event_loop().time()
        }


async def _load_enabled_agents():
    """Load and register agents based on feature flags."""
    try:
        logger.info("Loading enabled agents...")
        
        # Load agents based on feature flags
        if is_agent_enabled("code_chat"):
            from agents.implementations.code_chat_agent import CodeChatAgent
            agent = CodeChatAgent()
            agent_registry.register(agent)
            logger.info(f"✅ Loaded agent: {agent.name}")
        
        if is_agent_enabled("documentation"):
            from agents.implementations.documentation_agent import DocumentationAgent
            agent = DocumentationAgent()
            agent_registry.register(agent)
            logger.info(f"✅ Loaded agent: {agent.name}")
        
        # Note: General agent doesn't exist in implementations, so removing it
        # if is_agent_enabled("general"):
        #     from agents.general.general_agent import GeneralAgent
        #     agent = GeneralAgent()
        #     agent_registry.register(agent)
        #     logger.info(f"✅ Loaded agent: {agent.name}")
        
        # Debug: list all registered agents
        all_agents = agent_registry.get_all_agents()
        agent_names = [agent.name for agent in all_agents]
        logger.info(f"Loaded {len(all_agents)} agents: {agent_names}")
    
    except Exception as e:
        logger.error(f"Failed to load agents: {e}")
        raise


# Background task for system maintenance
@app.post("/maintenance/cleanup")
async def cleanup_system(background_tasks: BackgroundTasks):
    """Trigger system cleanup tasks."""
    try:
        if not orchestrator:
            raise HTTPException(status_code=503, detail="System not initialized")
        
        # Add cleanup tasks to background
        background_tasks.add_task(_perform_cleanup)
        
        return {
            "message": "Cleanup tasks scheduled",
            "status": "scheduled"
        }
        
    except Exception as e:
        logger.error(f"Cleanup request failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def _perform_cleanup():
    """Perform system cleanup tasks."""
    try:
        logger.info("Starting system cleanup...")
        
        # Get system stats before cleanup
        stats_before = await orchestrator.get_orchestrator_stats()
        logger.info(f"System stats before cleanup: {stats_before}")
        
        # Perform cleanup tasks
        # (Add specific cleanup logic here as needed)
        
        # Get system stats after cleanup
        stats_after = await orchestrator.get_orchestrator_stats()
        logger.info(f"System stats after cleanup: {stats_after}")
        
        logger.info("System cleanup completed")
        
    except Exception as e:
        logger.error(f"Cleanup failed: {e}")


# API documentation customization
@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "Beetle RAG System",
        "version": "2.0.0",
        "description": "Advanced RAG system with session-based context management",
        "status": "✅ Complete JavaScript backend migration - Ready for production",
        "migration_complete": True,
        "features": [
            "Session-based context management",
            "Multi-agent architecture", 
            "Real-time WebSocket chat",
            "File upload and processing",
            "Static file serving",
            "GitHub OAuth authentication",
            "GitHub API integration",
            "Advanced analytics",
            "Webhook processing",
            "Vector search and retrieval"
        ],
        "endpoints": {
            "health": "/health",
            "test": "/test", 
            "auth": "/api/v1/auth",
            "github": "/api/v1/github",
            "analytics": "/api/v1/analytics",
            "projects": "/api/v1/projects",
            "chat": "/api/v1/chat",
            "websocket": "/api/v1/chat/ws",
            "file_upload": "/api/v1/import",
            "static_files": "/public/* and /static/*",
            "webhooks": "/api/v1/webhooks",
            "aggregated": "/api/v1/aggregated",
            "docs": "/docs"
        },
        "javascript_backend_compatibility": {
            "websocket_chat": "✅ Implemented at /api/v1/chat/ws",
            "file_upload": "✅ Implemented at /api/v1/import",
            "static_files": "✅ Implemented at /public/* and /static/*",
            "all_routes": "✅ All JavaScript routes migrated",
            "ready_to_remove_js": True
        }
    }


@app.get("/debug/agents")
async def debug_agents():
    """Debug endpoint to check available agents."""
    try:
        if not orchestrator:
            return {
                "status": "error",
                "message": "Orchestrator not initialized"
            }
        
        # Get agents from both registries
        global_agents = agent_registry.get_all_agents()
        orchestrator_agents = orchestrator.agent_registry.get_all_agents()
        
        return {
            "status": "ok",
            "global_agent_registry": {
                "count": len(global_agents),
                "agents": [agent.name for agent in global_agents]
            },
            "orchestrator_agent_registry": {
                "count": len(orchestrator_agents),
                "agents": [agent.name for agent in orchestrator_agents]
            },
            "feature_flags": {
                "code_chat": is_agent_enabled("code_chat"),
                "documentation": is_agent_enabled("documentation")
            }
        }
        
    except Exception as e:
        logger.error(f"Debug agents failed: {e}")
        return {
            "status": "error",
            "error": str(e)
        }


if __name__ == "__main__":
    import uvicorn
    
    # Development server configuration
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )