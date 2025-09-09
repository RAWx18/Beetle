"""
WebSocket routes for real-time chat functionality.
Replicates the JavaScript backend WebSocket server at /api/ai/chat/ws
"""

import json
import asyncio
from typing import Dict, Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Depends, Query
from fastapi.websockets import WebSocketState
import structlog
import uuid
from datetime import datetime

from core.session_manager import get_session_manager
from core.orchestrator import get_orchestrator
from utils.auth_utils import jwt_handler
from models.api.session_models import SessionMessage

logger = structlog.get_logger(__name__)
router = APIRouter()

# Store active WebSocket connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.session_connections: Dict[str, Set[str]] = {}  # session_id -> set of connection_ids
    
    async def connect(self, websocket: WebSocket, connection_id: str, session_id: str = None):
        """Accept a WebSocket connection and store it"""
        await websocket.accept()
        self.active_connections[connection_id] = websocket
        
        if session_id:
            if session_id not in self.session_connections:
                self.session_connections[session_id] = set()
            self.session_connections[session_id].add(connection_id)
        
        logger.info("WebSocket connected", connection_id=connection_id, session_id=session_id)
    
    def disconnect(self, connection_id: str, session_id: str = None):
        """Remove a WebSocket connection"""
        if connection_id in self.active_connections:
            del self.active_connections[connection_id]
        
        if session_id and session_id in self.session_connections:
            self.session_connections[session_id].discard(connection_id)
            if not self.session_connections[session_id]:
                del self.session_connections[session_id]
        
        logger.info("WebSocket disconnected", connection_id=connection_id, session_id=session_id)
    
    async def send_personal_message(self, message: dict, connection_id: str):
        """Send a message to a specific connection"""
        if connection_id in self.active_connections:
            websocket = self.active_connections[connection_id]
            if websocket.client_state == WebSocketState.CONNECTED:
                try:
                    await websocket.send_text(json.dumps(message))
                except Exception as e:
                    logger.error("Failed to send WebSocket message", connection_id=connection_id, error=str(e))
                    self.disconnect(connection_id)
    
    async def broadcast_to_session(self, message: dict, session_id: str):
        """Broadcast a message to all connections in a session"""
        if session_id in self.session_connections:
            for connection_id in self.session_connections[session_id].copy():
                await self.send_personal_message(message, connection_id)

# Global connection manager
manager = ConnectionManager()

def verify_websocket_token(token: str = None) -> dict:
    """Verify JWT token for WebSocket authentication"""
    if not token:
        return None
    
    try:
        payload = jwt_handler.verify_token(token)
        return payload
    except Exception as e:
        logger.error("WebSocket token verification failed", error=str(e))
        return None

@router.websocket("/chat/ws")
async def websocket_chat_endpoint(
    websocket: WebSocket,
    session_id: str = Query(None, description="Chat session ID"),
    token: str = Query(None, description="JWT authentication token")
):
    """
    WebSocket endpoint for real-time chat
    
    URL: /api/v1/chat/ws?session_id=<session_id>&token=<jwt_token>
    
    Expected message format:
    {
        "type": "message",
        "data": {
            "message": "user message content",
            "files": [optional file context],
            "repository_id": "optional repo id"
        }
    }
    
    Response format:
    {
        "type": "message" | "error" | "system",
        "data": {
            "response": "assistant response",
            "referenced_files": [...],
            "code_snippets": [...],
            "session_id": "session_id"
        },
        "timestamp": "2024-01-01T00:00:00Z"
    }
    """
    connection_id = str(uuid.uuid4())
    user_data = None
    
    try:
        # Verify authentication
        user_data = verify_websocket_token(token)
        if not user_data and token:  # If token provided but invalid
            await websocket.close(code=4001, reason="Invalid authentication token")
            return
        
        # Connect WebSocket
        await manager.connect(websocket, connection_id, session_id)
        
        # Send connection confirmation
        await manager.send_personal_message({
            "type": "system",
            "data": {
                "message": "Connected to real-time chat",
                "session_id": session_id,
                "connection_id": connection_id
            },
            "timestamp": datetime.now().isoformat()
        }, connection_id)
        
        # Get session manager and orchestrator
        session_manager = get_session_manager()
        orchestrator = get_orchestrator()
        
        if not orchestrator:
            await manager.send_personal_message({
                "type": "error",
                "data": {"error": "AI system not initialized"},
                "timestamp": datetime.now().isoformat()
            }, connection_id)
            return
        
        # WebSocket message loop
        while True:
            try:
                # Receive message from client
                data = await websocket.receive_text()
                message_data = json.loads(data)
                
                logger.info("Received WebSocket message", 
                           connection_id=connection_id, 
                           session_id=session_id,
                           message_type=message_data.get("type"))
                
                if message_data.get("type") == "message":
                    await handle_chat_message(
                        message_data, 
                        session_id, 
                        connection_id, 
                        user_data,
                        session_manager,
                        orchestrator
                    )
                elif message_data.get("type") == "ping":
                    # Handle ping/pong for connection keepalive
                    await manager.send_personal_message({
                        "type": "pong",
                        "data": {"timestamp": datetime.now().isoformat()},
                        "timestamp": datetime.now().isoformat()
                    }, connection_id)
                else:
                    await manager.send_personal_message({
                        "type": "error",
                        "data": {"error": f"Unknown message type: {message_data.get('type')}"},
                        "timestamp": datetime.now().isoformat()
                    }, connection_id)
                    
            except WebSocketDisconnect:
                break
            except json.JSONDecodeError:
                await manager.send_personal_message({
                    "type": "error",
                    "data": {"error": "Invalid JSON format"},
                    "timestamp": datetime.now().isoformat()
                }, connection_id)
            except Exception as e:
                logger.error("WebSocket message handling error", 
                           connection_id=connection_id, 
                           error=str(e))
                await manager.send_personal_message({
                    "type": "error",
                    "data": {"error": f"Message processing error: {str(e)}"},
                    "timestamp": datetime.now().isoformat()
                }, connection_id)
                
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error("WebSocket connection error", 
                    connection_id=connection_id, 
                    error=str(e))
    finally:
        manager.disconnect(connection_id, session_id)

async def handle_chat_message(
    message_data: dict, 
    session_id: str, 
    connection_id: str, 
    user_data: dict,
    session_manager,
    orchestrator
):
    """Handle incoming chat message via WebSocket"""
    try:
        chat_data = message_data.get("data", {})
        user_message = chat_data.get("message", "")
        files = chat_data.get("files", [])
        repository_id = chat_data.get("repository_id", "default")
        
        if not user_message.strip():
            await manager.send_personal_message({
                "type": "error",
                "data": {"error": "Message content is required"},
                "timestamp": datetime.now().isoformat()
            }, connection_id)
            return
        
        # Get or create session
        session = None
        if session_id:
            session = session_manager.get_session(session_id)
        
        if not session and user_data:
            # Create new session if authenticated user
            session = session_manager.create_session(
                user_id=user_data.get("user_id", "anonymous"),
                title="WebSocket Chat",
                repository_id=repository_id
            )
            session_id = session.session_id
            
            # Notify client of new session ID
            await manager.send_personal_message({
                "type": "system",
                "data": {
                    "message": "New chat session created",
                    "session_id": session_id
                },
                "timestamp": datetime.now().isoformat()
            }, connection_id)
        
        # Add user message to session
        if session:
            user_msg = session_manager.add_message_to_session(
                session_id=session_id,
                role="user",
                content=user_message,
                files_referenced=[f.get("path", "") for f in files] if files else None
            )
        
        # Send typing indicator
        await manager.send_personal_message({
            "type": "typing",
            "data": {"typing": True},
            "timestamp": datetime.now().isoformat()
        }, connection_id)
        
        try:
            # Process with AI
            if session_id:
                ai_response = await orchestrator.chat_with_session_context(
                    session_id=session_id,
                    message=user_message,
                    user_id=user_data.get("user_id", "anonymous") if user_data else "anonymous"
                )
            else:
                # Fallback for sessionless chat
                ai_response = {
                    "response": "I'm sorry, but I need a valid session to provide intelligent responses. Please refresh and try again.",
                    "success": True,
                    "referenced_files": [],
                    "code_snippets": []
                }
            
            # Stop typing indicator
            await manager.send_personal_message({
                "type": "typing",
                "data": {"typing": False},
                "timestamp": datetime.now().isoformat()
            }, connection_id)
            
            if ai_response.get("success", False):
                # Add assistant message to session
                if session:
                    session_manager.add_message_to_session(
                        session_id=session_id,
                        role="assistant", 
                        content=ai_response.get("response", ""),
                        files_referenced=ai_response.get("referenced_files", []),
                        code_snippets=ai_response.get("code_snippets", [])
                    )
                
                # Send response to client
                await manager.send_personal_message({
                    "type": "message",
                    "data": {
                        "response": ai_response.get("response", ""),
                        "referenced_files": ai_response.get("referenced_files", []),
                        "code_snippets": ai_response.get("code_snippets", []),
                        "session_id": session_id
                    },
                    "timestamp": datetime.now().isoformat()
                }, connection_id)
            else:
                await manager.send_personal_message({
                    "type": "error",
                    "data": {
                        "error": ai_response.get("error", "Failed to get AI response"),
                        "session_id": session_id
                    },
                    "timestamp": datetime.now().isoformat()
                }, connection_id)
                
        except Exception as e:
            # Stop typing indicator on error
            await manager.send_personal_message({
                "type": "typing",
                "data": {"typing": False},
                "timestamp": datetime.now().isoformat()
            }, connection_id)
            
            await manager.send_personal_message({
                "type": "error",
                "data": {
                    "error": f"AI processing error: {str(e)}",
                    "session_id": session_id
                },
                "timestamp": datetime.now().isoformat()
            }, connection_id)
            
    except Exception as e:
        logger.error("Chat message handling error", 
                    connection_id=connection_id, 
                    error=str(e))
        await manager.send_personal_message({
            "type": "error",
            "data": {"error": f"Message handling error: {str(e)}"},
            "timestamp": datetime.now().isoformat()
        }, connection_id)

@router.get("/chat/ws/health")
async def websocket_health_check():
    """Health check for WebSocket service"""
    return {
        "status": "healthy",
        "service": "WebSocket Chat",
        "active_connections": len(manager.active_connections),
        "active_sessions": len(manager.session_connections),
        "timestamp": datetime.now().isoformat()
    }

@router.get("/chat/ws/stats")
async def websocket_stats():
    """Get WebSocket connection statistics"""
    return {
        "active_connections": len(manager.active_connections),
        "active_sessions": len(manager.session_connections),
        "connections_by_session": {
            session_id: len(connections) 
            for session_id, connections in manager.session_connections.items()
        },
        "timestamp": datetime.now().isoformat()
    }
