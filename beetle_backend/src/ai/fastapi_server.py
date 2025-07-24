import logging
import signal
import sys
import asyncio
import os
from contextlib import asynccontextmanager
from typing import Any, Dict, List, Optional
from pathlib import Path
import google.generativeai as genai
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
import numpy as np
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field
import uvicorn
from dotenv import load_dotenv

# Configure logging before other imports
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('api.log')
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Check required environment variables
required_vars = ["QDRANT_URL", "QDRANT_API_KEY"]
missing = [var for var in required_vars if not os.getenv(var)]
if missing:
    logger.error(f"Missing required environment variables: {', '.join(missing)}")
    sys.exit(1)

# Initialize pipeline bridge
bridge = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global bridge
    logger.info("Initializing application...")
    try:
        from pipeline_bridge import PipelineBridge
        bridge = PipelineBridge()
        logger.info("Pipeline bridge initialized successfully")
        yield
    except Exception as e:
        logger.error(f"Failed to initialize pipeline bridge: {str(e)}")
        sys.exit(1)
    finally:
        # Shutdown
        logger.info("Shutting down application...")
        if bridge:
            # Add any cleanup code here if needed
            pass

app = FastAPI(
    title="Beetle RAG API",
    version="1.0",
    lifespan=lifespan
)

# Handle graceful shutdown
def handle_shutdown(signum, frame):
    logger.info("Received shutdown signal. Shutting down gracefully...")
    sys.exit(0)

signal.signal(signal.SIGINT, handle_shutdown)
signal.signal(signal.SIGTERM, handle_shutdown)

class ProcessRepoRequest(BaseModel):
    repository: str
    repository_id: str
    branch: str = "main"
    source_type: str
    files: List[Dict[str, Any]]
    chunk_index: Optional[int] = None
    total_chunks: Optional[int] = None

class ImportRequest(BaseModel):
    repository_id: str = "default"
    branch: str = "main"
    source_type: str = "file"
    files: list

class ImportGithubRequest(BaseModel):
    repository: str
    repository_id: str
    branch: str = "main"
    github_token: str
    files: list
    source_type: str = "github"
    data_types: list = ["files"]

class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    repository_id: str = "default"
    branch: str = "main"
    max_tokens: int = 1000
    temperature: float = 0.7

class DocumentChunk(BaseModel):
    id: str
    content: str
    metadata: dict
    embedding: List[float]

class SearchResult(BaseModel):
    id: str
    content: str
    metadata: dict
    score: float

class SearchRequest(BaseModel):
    query: str
    repository_id: str = "default"
    branch: str = "main"
    max_results: int = 10
    similarity_threshold: float = 0.3

def check_bridge_initialized():
    if bridge is None:
        raise HTTPException(
            status_code=503,
            detail="Service is initializing. Please try again in a few seconds."
        )

@app.post("/process-repo")
async def process_repo(request: ProcessRepoRequest):
    """Process a repository by ingesting its files into the vector database."""
    try:
        logger.info(f"Processing repository: {request.repository} (ID: {request.repository_id})")
        
        processed_files = []
        errors = []
        
        for file in request.files:
            try:
                file_path = file.get('path')
                content = file.get('content', '')
                
                # Generate embedding for the file content
                embedding = embedding_model.encode(content).tolist()
                
                # Create a document ID
                doc_id = f"{request.repository_id}:{file_path}"
                
                # Prepare document metadata
                metadata = {
                    "repository": request.repository,
                    "repository_id": request.repository_id,
                    "branch": request.branch,
                    "file_path": file_path,
                    "source_type": request.source_type,
                    "chunk_index": request.chunk_index,
                    "total_chunks": request.total_chunks
                }
                
                # Store in Qdrant
                qdrant_client.upsert(
                    collection_name=COLLECTION_NAME,
                    points=[
                        PointStruct(
                            id=doc_id,
                            vector=embedding,
                            payload={
                                "content": content,
                                "metadata": metadata
                            }
                        )
                    ]
                )
                
                processed_files.append({
                    "file_path": file_path,
                    "status": "processed",
                    "vector_id": doc_id
                })
                
                logger.debug(f"Processed file: {file_path}")
                
            except Exception as e:
                error_msg = f"Error processing file {file.get('path')}: {str(e)}"
                logger.error(error_msg)
                errors.append({
                    "file_path": file.get('path'),
                    "error": str(e)
                })
        
        return {
            "success": True,
            "data": {
                "repository": request.repository,
                "repository_id": request.repository_id,
                "branch": request.branch,
                "processed_files": processed_files,
                "errors": errors,
                "chunk_index": request.chunk_index,
                "total_chunks": request.total_chunks
            }
        }
        
    except Exception as e:
        logger.error(f"Error in process_repo: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/import")
async def import_files(request: ImportRequest):
    check_bridge_initialized()
    try:
        result = await bridge.handle_import(request.dict())
        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error"))
        return result
    except Exception as e:
        logger.error(f"Error in import_files: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/import-github")
async def import_github(request: ImportGithubRequest):
    check_bridge_initialized()
    try:
        result = await bridge.handle_import_github(request.dict())
        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error"))
        return result
    except Exception as e:
        logger.error(f"Error in import_github: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def get_relevant_chunks(query: str, repository_id: str, top_k: int = 5) -> List[SearchResult]:
    """Retrieve relevant document chunks using semantic search"""
    try:
        # Generate query embedding
        query_embedding = embedding_model.encode(query).tolist()
        
        # Search in Qdrant
        search_results = qdrant_client.search(
            collection_name=COLLECTION_NAME,
            query_vector=query_embedding,
            query_filter={
                "must": [
                    {"key": "metadata.repository_id", "match": {"value": repository_id}}
                ]
            },
            limit=top_k
        )
        
        # Convert to SearchResult objects
        return [
            SearchResult(
                id=hit.id,
                content=hit.payload["content"],
                metadata=hit.payload["metadata"],
                score=hit.score
            )
            for hit in search_results
        ]
    except Exception as e:
        logger.error(f"Error in semantic search: {str(e)}")
        return []

async def generate_response(messages: List[dict], context: str) -> str:
    """Generate response using Gemini"""
    try:
        model = genai.GenerativeModel('gemini-pro')
        
        # Prepare conversation history
        chat = model.start_chat(history=[])
        
        # Add context if available
        if context:
            system_message = {
                "role": "system",
                "content": f"""You are a helpful AI assistant. Use the following context to answer the user's question. 
                If you don't know the answer, just say that you don't know, don't try to make up an answer.
                
                Context:
                {context}"""
            }
            messages = [system_message] + messages
        
        # Send messages to Gemini
        response = chat.send_message(
            [msg["content"] for msg in messages],
            generation_config={
                "max_output_tokens": 1024,
                "temperature": 0.7,
            },
        )
        
        return response.text
    except Exception as e:
        logger.error(f"Error generating response: {str(e)}")
        return "I'm sorry, I encountered an error while generating a response."

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        # Get the last user message
        last_message = next(
            (msg for msg in reversed(request.messages) if msg.role == "user"),
            None
        )
        
        if not last_message:
            raise HTTPException(status_code=400, detail="No user message found in chat history")
        
        # Get relevant chunks
        chunks = await get_relevant_chunks(
            query=last_message.content,
            repository_id=request.repository_id,
            top_k=5
        )
        
        # Prepare context from chunks
        context = "\n\n".join(
            f"Document {i+1}:\n{chunk.content}"
            for i, chunk in enumerate(chunks)
        )
        
        # Generate response
        response_text = await generate_response(
            messages=[msg.dict() for msg in request.messages],
            context=context
        )
        
        # Create response message
        response_message = ChatMessage(
            role="assistant",
            content=response_text,
            timestamp=datetime.utcnow().isoformat()
        )
        
        # Include sources in response
        sources = [
            {
                "id": chunk.id,
                "score": chunk.score,
                "metadata": chunk.metadata
            }
            for chunk in chunks
        ]
        
        return {
            "success": True,
            "message": response_message,
            "sources": sources
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/search")
async def search(request: SearchRequest):
    check_bridge_initialized()
    try:
        result = await bridge.handle_search(request.dict())
        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error"))
        return result
    except Exception as e:
        logger.error(f"Error in search: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/status")
async def status():
    if bridge is None:
        return {"status": "initializing", "message": "Service is starting up..."}
    
    try:
        result = await bridge.handle_status({})
        if not result.get("success"):
            return {
                "status": "error",
                "message": result.get("error", "Unknown error")
            }
        return {"status": "running", "details": result}
    except Exception as e:
        logger.error(f"Error in status check: {str(e)}")
        return {
            "status": "error",
            "message": f"Status check failed: {str(e)}"
        }

if __name__ == "__main__":
    uvicorn.run("fastapi_server:app", host="0.0.0.0", port=int(os.getenv("PORT", 8000)), reload=True) 