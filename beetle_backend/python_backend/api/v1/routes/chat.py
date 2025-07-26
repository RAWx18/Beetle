"""
Chat API routes for the RAG system.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any

router = APIRouter()


class ChatRequest(BaseModel):
    query: str
    agent_type: str = "code_chat"


class ChatResponse(BaseModel):
    response: str
    metadata: Dict[str, Any] = {}


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Basic chat endpoint."""
    return ChatResponse(
        response="Chat endpoint - use main /chat endpoint for full functionality",
        metadata={"note": "This is a placeholder endpoint"}
    )
