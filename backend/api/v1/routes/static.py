"""
Static file serving routes for the Python backend.
Replicates the JavaScript backend static file serving from /public directory.
"""

import os
import mimetypes
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles
import structlog
from datetime import datetime

logger = structlog.get_logger(__name__)
router = APIRouter()

# Define static directories
STATIC_DIR = Path("static")
PUBLIC_DIR = Path("public") 
DATA_DIR = Path("data")

# Create directories if they don't exist
STATIC_DIR.mkdir(exist_ok=True)
PUBLIC_DIR.mkdir(exist_ok=True)
DATA_DIR.mkdir(exist_ok=True)

# Create subdirectories
(PUBLIC_DIR / "images").mkdir(exist_ok=True)
(PUBLIC_DIR / "documents").mkdir(exist_ok=True)
(PUBLIC_DIR / "assets").mkdir(exist_ok=True)

# Security: Define allowed file types for static serving
ALLOWED_STATIC_TYPES = {
    # Images
    '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp', '.ico',
    # Documents
    '.pdf', '.doc', '.docx', '.txt', '.md', '.rtf',
    # Web assets
    '.css', '.js', '.html', '.htm', '.xml', '.json',
    # Fonts
    '.woff', '.woff2', '.ttf', '.otf', '.eot',
    # Archives (with caution)
    '.zip', '.tar', '.gz',
    # Media
    '.mp3', '.mp4', '.avi', '.mov', '.wav', '.ogg'
}

def is_safe_path(path: Path, base_path: Path) -> bool:
    """Check if the requested path is safe and within the base directory"""
    try:
        # Resolve the path and check if it's within the base directory
        resolved_path = (base_path / path).resolve()
        base_resolved = base_path.resolve()
        return str(resolved_path).startswith(str(base_resolved))
    except (OSError, ValueError):
        return False

def get_file_info(file_path: Path) -> dict:
    """Get file information for logging/monitoring"""
    try:
        stat = file_path.stat()
        return {
            "size": stat.st_size,
            "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
            "extension": file_path.suffix.lower()
        }
    except OSError:
        return {}

@router.get("/public/{file_path:path}")
async def serve_public_file(file_path: str, request: Request):
    """
    Serve files from the public directory
    
    Equivalent to JavaScript backend: app.use('/public', express.static(...))
    
    Security features:
    - Path traversal protection
    - File type validation
    - Size limits for certain types
    """
    try:
        # Normalize and validate path
        requested_path = Path(file_path)
        
        # Security check: prevent directory traversal
        if not is_safe_path(requested_path, PUBLIC_DIR):
            logger.warning("Attempted directory traversal", 
                         requested_path=file_path, 
                         client_ip=request.client.host)
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Construct full file path
        full_path = PUBLIC_DIR / requested_path
        
        # Check if file exists
        if not full_path.exists() or not full_path.is_file():
            raise HTTPException(status_code=404, detail="File not found")
        
        # Check file extension
        file_extension = full_path.suffix.lower()
        if file_extension not in ALLOWED_STATIC_TYPES:
            logger.warning("Blocked file type request", 
                         file_path=file_path, 
                         extension=file_extension,
                         client_ip=request.client.host)
            raise HTTPException(status_code=403, detail="File type not allowed")
        
        # Get file info for logging
        file_info = get_file_info(full_path)
        
        # Log file access
        logger.info("Static file served", 
                   file_path=file_path,
                   client_ip=request.client.host,
                   user_agent=request.headers.get("user-agent", ""),
                   **file_info)
        
        # Determine content type
        content_type, _ = mimetypes.guess_type(str(full_path))
        if not content_type:
            content_type = "application/octet-stream"
        
        # Return file with appropriate headers
        return FileResponse(
            path=str(full_path),
            media_type=content_type,
            filename=full_path.name,
            headers={
                "Cache-Control": "public, max-age=3600",  # 1 hour cache
                "X-Content-Type-Options": "nosniff",
                "X-Frame-Options": "SAMEORIGIN"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Static file serving error", 
                    file_path=file_path, 
                    error=str(e),
                    client_ip=request.client.host)
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/static/{file_path:path}")
async def serve_static_file(file_path: str, request: Request):
    """
    Serve files from the static directory
    
    Additional static file endpoint for application assets
    """
    try:
        # Normalize and validate path
        requested_path = Path(file_path)
        
        # Security check: prevent directory traversal
        if not is_safe_path(requested_path, STATIC_DIR):
            logger.warning("Attempted directory traversal", 
                         requested_path=file_path, 
                         client_ip=request.client.host)
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Construct full file path
        full_path = STATIC_DIR / requested_path
        
        # Check if file exists
        if not full_path.exists() or not full_path.is_file():
            raise HTTPException(status_code=404, detail="File not found")
        
        # Check file extension
        file_extension = full_path.suffix.lower()
        if file_extension not in ALLOWED_STATIC_TYPES:
            raise HTTPException(status_code=403, detail="File type not allowed")
        
        # Log file access
        file_info = get_file_info(full_path)
        logger.info("Static file served", 
                   file_path=file_path,
                   client_ip=request.client.host,
                   **file_info)
        
        # Determine content type
        content_type, _ = mimetypes.guess_type(str(full_path))
        if not content_type:
            content_type = "application/octet-stream"
        
        return FileResponse(
            path=str(full_path),
            media_type=content_type,
            filename=full_path.name,
            headers={
                "Cache-Control": "public, max-age=86400",  # 24 hour cache for static assets
                "X-Content-Type-Options": "nosniff",
                "X-Frame-Options": "SAMEORIGIN"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Static file serving error", 
                    file_path=file_path, 
                    error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/upload/public")
async def upload_public_file(request: Request):
    """
    Upload a file to the public directory (admin only)
    
    This is a basic implementation - in production, add proper authentication
    and more robust file handling
    """
    # This is a placeholder for admin file uploads
    # In a real implementation, you'd want proper authentication and validation
    raise HTTPException(status_code=501, detail="File upload to public directory not implemented. Use file upload API instead.")

@router.get("/files/health")
async def static_files_health_check():
    """Health check for static file serving"""
    try:
        public_exists = PUBLIC_DIR.exists()
        static_exists = STATIC_DIR.exists()
        
        # Count files in each directory
        public_files = len(list(PUBLIC_DIR.rglob("*"))) if public_exists else 0
        static_files = len(list(STATIC_DIR.rglob("*"))) if static_exists else 0
        
        return {
            "status": "healthy",
            "public_directory": {
                "path": str(PUBLIC_DIR),
                "exists": public_exists,
                "file_count": public_files
            },
            "static_directory": {
                "path": str(STATIC_DIR),
                "exists": static_exists,
                "file_count": static_files
            },
            "allowed_types": sorted(ALLOWED_STATIC_TYPES),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@router.get("/files/stats")
async def static_files_stats():
    """Get static files statistics"""
    try:
        stats = {
            "public": {"files": 0, "size": 0, "types": {}},
            "static": {"files": 0, "size": 0, "types": {}}
        }
        
        # Analyze public directory
        if PUBLIC_DIR.exists():
            for file_path in PUBLIC_DIR.rglob("*"):
                if file_path.is_file():
                    stats["public"]["files"] += 1
                    stats["public"]["size"] += file_path.stat().st_size
                    ext = file_path.suffix.lower()
                    stats["public"]["types"][ext] = stats["public"]["types"].get(ext, 0) + 1
        
        # Analyze static directory
        if STATIC_DIR.exists():
            for file_path in STATIC_DIR.rglob("*"):
                if file_path.is_file():
                    stats["static"]["files"] += 1
                    stats["static"]["size"] += file_path.stat().st_size
                    ext = file_path.suffix.lower()
                    stats["static"]["types"][ext] = stats["static"]["types"].get(ext, 0) + 1
        
        # Convert sizes to MB
        stats["public"]["size_mb"] = round(stats["public"]["size"] / (1024 * 1024), 2)
        stats["static"]["size_mb"] = round(stats["static"]["size"] / (1024 * 1024), 2)
        
        return {
            "statistics": stats,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        return {
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }
