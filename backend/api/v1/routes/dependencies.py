from typing import Optional
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import structlog

from models.api.auth_models import User
from utils.auth_utils import security_utils, jwt_handler
from .sessions import user_sessions, load_sessions

logger = structlog.get_logger(__name__)
security = HTTPBearer(auto_error=False)

def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[User]:
    """Get current authenticated user."""
    load_sessions()
    if not credentials:
        return None
    
    token = credentials.credentials
    
    # Handle demo token
    if token == 'demo-token':
        from utils.auth_utils import get_demo_user
        return User(**get_demo_user())
    
    try:
        payload = jwt_handler.verify_token(token)
        session_id = payload.get('session_id')
        
        if session_id in user_sessions:
            session = user_sessions[session_id]
            return User(**session)
        
        return None
    except Exception as e:
        logger.error(f"Token verification failed: {e}")
        return None

def get_github_token(user: Optional[User] = Depends(get_current_user)) -> str:
    """
    Dependency to get the authenticated user's GitHub access token.
    Handles both regular and demo users.
    """
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")

    if user.login == 'demo-user':
        return 'demo-github-token'

    if not hasattr(user, 'access_token') or not user.access_token:
        raise HTTPException(status_code=401, detail="GitHub token not found in session")

    try:
        token = security_utils.decrypt_token(user.access_token)
        # print(f"Decrypted token: {token}")
        if not token:
            raise HTTPException(status_code=500, detail="Failed to decrypt token")
        return token
    except Exception as e:
        logger.error(f"Failed to decrypt token for user {user.login}: {e}")
        raise HTTPException(status_code=500, detail="Token decryption error")



def require_auth(token: Optional[str] = Depends(get_github_token)) -> str:
    """Require authentication for protected endpoints."""
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")
    return token
