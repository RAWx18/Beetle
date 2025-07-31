"""
Beetle RAG System - FastAPI Application
Main entry point for the RAG system with agent registry, context management, and observability.
"""

import asyncio
import os
from contextlib import asynccontextmanager
from typing import Dict, Any
import structlog

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Import core components
from core.orchestrator import RAGOrchestrator
from agents.registry import AgentRegistry
from agents.base.base_agent import get_enhanced_agent_registry
from config.features import is_agent_enabled, is_provider_enabled
from config.settings import get_settings
from utils.tracing import trace
from utils.prompt_loader import render_prompt

# Import API routes
from api.v1.routes import chat, health

logger = structlog.get_logger(__name__)
settings = get_settings()

# Global orchestrator instance
orchestrator: RAGOrchestrator = None
agent_registry = get_enhanced_agent_registry()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    global orchestrator
    
    # Startup
    logger.info("🚀 Starting Beetle RAG System...")
    
    try:
        # Initialize orchestrator
        orchestrator = RAGOrchestrator()
        await orchestrator.initialize()
        
        # Load and register agents based on feature flags
        await _load_enabled_agents()
        
        # Health check
        health_status = await orchestrator.health_check()
        if not health_status:
            logger.error("❌ System health check failed")
            raise RuntimeError("System initialization failed")
        
        logger.info("✅ Beetle RAG System started successfully")
        trace("app_started", {"status": "success", "agents_loaded": len(agent_registry.get_all_agents())})
        
    except Exception as e:
        logger.error("❌ Failed to start Beetle RAG System", error=str(e))
        trace("app_started", {"status": "failed", "error": str(e)})
        raise
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down Beetle RAG System...")
    try:
        if orchestrator:
            await orchestrator.cleanup()
        trace("app_shutdown", {"status": "success"})
    except Exception as e:
        logger.error("❌ Error during shutdown", error=str(e))
        trace("app_shutdown", {"status": "failed", "error": str(e)})


# Create FastAPI app
app = FastAPI(
    title="Beetle RAG System",
    description="Advanced RAG system with multi-agent architecture, structured outputs, and enhanced features",
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
app.include_router(chat.router, prefix="/api/v1", tags=["chat"])
app.include_router(health.router, prefix="/api/v1", tags=["health"])


# Pydantic models for API
class ChatRequest(BaseModel):
    query: str
    agent_type: str = "code_chat"
    context_chunks: list = []
    use_structured: bool = True
    temperature: float = 0.7
    max_tokens: int = 1000


class ChatResponse(BaseModel):
    response: str
    agent_used: str
    context_chunks_used: int
    processing_time: float
    metadata: Dict[str, Any] = {}


class SystemStatus(BaseModel):
    status: str
    agents: Dict[str, bool]
    providers: Dict[str, bool]
    health: Dict[str, Any]


# API Routes
@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Beetle RAG System",
        "version": "2.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """System health check."""
    try:
        if not orchestrator:
            raise HTTPException(status_code=503, detail="System not initialized")
        
        health_status = await orchestrator.health_check()
        return {"status": "healthy" if health_status else "unhealthy"}
    
    except Exception as e:
        logger.error("Health check failed", error=str(e))
        raise HTTPException(status_code=503, detail=str(e))


@app.get("/status")
async def system_status() -> SystemStatus:
    """Get comprehensive system status."""
    try:
        # Check agent status
        agents_status = {}
        for agent in agent_registry.get_all_agents():
            agents_status[agent.name] = await agent.health_check()
        
        # Check provider status
        providers_status = {
            "litellm": is_provider_enabled("litellm"),
            "anthropic": is_provider_enabled("anthropic")
        }
        
        # Get orchestrator health
        orchestrator_health = await orchestrator.health_check() if orchestrator else False
        
        return SystemStatus(
            status="running" if orchestrator_health else "error",
            agents=agents_status,
            providers=providers_status,
            health={
                "orchestrator": orchestrator_health,
                "vector_store": await orchestrator.vector_retriever.health_check() if orchestrator else False,
                "llm_provider": await orchestrator.response_generator.health_check() if orchestrator else False
            }
        )
    
    except Exception as e:
        logger.error("Status check failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat")
async def chat(request: ChatRequest, background_tasks: BackgroundTasks) -> ChatResponse:
    """Main chat endpoint with agent routing."""
    try:
        start_time = asyncio.get_event_loop().time()
        
        # Trace the request
        trace("chat_request", {
            "query": request.query[:100],
            "agent_type": request.agent_type,
            "use_structured": request.use_structured
        })
        
        # Validate agent type
        if not is_agent_enabled(request.agent_type):
            raise HTTPException(
                status_code=400, 
                detail=f"Agent type '{request.agent_type}' is not enabled"
            )
        
        # Get appropriate agent
        agent = _get_agent_by_type(request.agent_type)
        if not agent:
            raise HTTPException(
                status_code=400,
                detail=f"Agent type '{request.agent_type}' not found"
            )
        
        # Create task
        from agents.base.base_agent import AgentTask
        task = AgentTask(
            task_type=request.agent_type,
            input_data={
                "query": request.query,
                "context_chunks": request.context_chunks
            },
            parameters={
                "temperature": request.temperature,
                "max_tokens": request.max_tokens,
                "use_structured": request.use_structured
            }
        )
        
        # Execute task
        result = await agent.execute(task)
        
        if not result.success:
            raise HTTPException(
                status_code=500,
                detail=f"Agent execution failed: {result.error_message}"
            )
        
        processing_time = asyncio.get_event_loop().time() - start_time
        
        # Trace the response
        trace("chat_response", {
            "agent_type": request.agent_type,
            "processing_time": processing_time,
            "success": result.success
        })
        
        return ChatResponse(
            response=result.output.get("response", str(result.output)),
            agent_used=request.agent_type,
            context_chunks_used=len(request.context_chunks),
            processing_time=processing_time,
            metadata={
                "execution_time": result.execution_time,
                "structured_output": result.structured_output is not None
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Chat request failed", error=str(e))
        trace("chat_error", {"error": str(e)})
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/agents")
async def list_agents():
    """List all available agents."""
    agents = []
    for agent in agent_registry.get_all_agents():
        agents.append({
            "name": agent.name,
            "description": agent.description,
            "capabilities": [cap.name for cap in agent.get_capabilities()],
            "enabled": is_agent_enabled(agent.name.lower().replace(" ", "_"))
        })
    
    return {"agents": agents}


@app.get("/agents/{agent_name}/health")
async def agent_health(agent_name: str):
    """Check health of a specific agent."""
    agent = _get_agent_by_name(agent_name)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    health_status = await agent.health_check()
    return {"agent": agent_name, "healthy": health_status.is_healthy if hasattr(health_status, 'is_healthy') else health_status}


@app.post("/upload")
async def upload_file(background_tasks: BackgroundTasks):
    """Upload and process files."""
    # TODO: Implement file upload endpoint
    return {"message": "File upload endpoint - to be implemented"}


# Helper functions
async def _load_enabled_agents():
    """Load and register agents based on feature flags."""
    logger.info("Loading enabled agents...")
    
    # Import agent modules to trigger registration
    try:
        from agents.implementations.code_chat_agent import CodeChatAgent
        from agents.implementations.documentation_agent import DocumentationAgent
        
        # Register agents if enabled
        if is_agent_enabled("code_chat"):
            agent_registry.register(CodeChatAgent())
            logger.info("✅ Code Chat Agent registered")
        
        if is_agent_enabled("documentation"):
            agent_registry.register(DocumentationAgent())
            logger.info("✅ Documentation Agent registered")
        
        logger.info(f"Loaded {len(agent_registry.get_all_agents())} agents")
        
    except Exception as e:
        logger.error("Failed to load agents", error=str(e))
        raise


def _get_agent_by_type(agent_type: str):
    """Get agent by type name."""
    for agent in agent_registry.get_all_agents():
        if agent.name.lower().replace(" ", "_") == agent_type:
            return agent
    return None


def _get_agent_by_name(agent_name: str):
    """Get agent by name."""
    for agent in agent_registry.get_all_agents():
        if agent.name == agent_name:
            return agent
    return None


if __name__ == "__main__":
    import uvicorn
    
    # Get configuration
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    reload = os.getenv("RELOAD", "false").lower() == "true"
    
    logger.info(f"Starting server on {host}:{port}")
    
    uvicorn.run(
        "app:app",
        host=host,
        port=port,
        reload=reload,
        log_level="info"
    )