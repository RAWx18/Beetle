"""
Authentication routes for GitHub OAuth and user management
"""

import os
import json
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Any
from fastapi import APIRouter, HTTPException, Depends, Request, Response, Query
from fastapi.responses import RedirectResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from models.api.auth_models import (
    GitHubOAuthURLResponse, AuthStatusResponse, TokenValidationResponse,
    LogoutResponse, TokenRefreshResponse, UserProfileResponse,
    UserProfileUpdateRequest, UserNotesResponse, UserFiltersResponse,
    UserPinsResponse, UserSettingsResponse, UserSettingsUpdateRequest,
    UserSettingsResetResponse, User, UserNote, UserSavedFilter,
    UserPinnedItem, UserSettings
)
from utils.auth_utils import (
    github_oauth, jwt_handler, security_utils, rate_limit_manager,
    get_demo_user, get_demo_settings
)
from core.session_manager import get_session_manager
from .dependencies import get_current_user, require_auth

logger = logging.getLogger(__name__)
router = APIRouter()
security = HTTPBearer(auto_error=False)

from .sessions import user_sessions, save_sessions

oauth_states: Dict[str, Dict[str, Any]] = {}
user_data: Dict[int, Dict[str, Any]] = {}
user_notes: Dict[int, List[UserNote]] = {}
user_filters: Dict[int, List[UserSavedFilter]] = {}
user_pins: Dict[int, List[UserPinnedItem]] = {}
user_settings: Dict[int, Dict[str, Any]] = {}


@router.get("/github/url", response_model=GitHubOAuthURLResponse)
async def get_github_oauth_url(request: Request):
    """Generate GitHub OAuth authorization URL."""
    # Rate limiting
    client_ip = request.client.host
    if rate_limit_manager.is_rate_limited(f"oauth_initiate_{client_ip}", max_requests=10, window_minutes=15):
        raise HTTPException(status_code=429, detail="Too many OAuth requests")
    
    # Generate secure state token
    state = security_utils.generate_secure_token(32)
    
    # Validate redirect URI
    allowed_origins = github_oauth.get_allowed_origins()
    if not security_utils.validate_redirect_uri(github_oauth.callback_url, allowed_origins):
        raise HTTPException(status_code=400, detail="Invalid redirect URI configuration")
    
    # Store state with metadata
    oauth_states[state] = {
        'client_ip': client_ip,
        'user_agent': request.headers.get('user-agent'),
        'timestamp': datetime.now(),
        'used': False,
        'expires_at': datetime.now() + timedelta(minutes=10)
    }
    
    # Generate auth URL
    auth_url = github_oauth.generate_auth_url(state)
    
    return GitHubOAuthURLResponse(auth_url=auth_url, state=state)


@router.get("/github/callback")
async def github_oauth_callback(
    request: Request,
    code: Optional[str] = Query(None),
    state: Optional[str] = Query(None)
):
    """Handle GitHub OAuth callback."""
    client_ip = request.client.host
    
    # Rate limiting
    if rate_limit_manager.is_rate_limited(f"oauth_callback_{client_ip}", max_requests=20, window_minutes=5):
        return _redirect_with_error("Rate Limit Exceeded", "Too many authentication attempts. Please try again later.")
    
    # Validate state
    if not state or state not in oauth_states:
        return _redirect_with_error("OAuth State Error", "Invalid OAuth state. Please try again.")
    
    state_data = oauth_states[state]
    
    # Check if state already used
    if state_data['used']:
        return _redirect_with_error("OAuth State Error", "OAuth state already used. Please try again.")
    
    # Check state expiration
    if datetime.now() > state_data['expires_at']:
        del oauth_states[state]
        return _redirect_with_error("OAuth State Error", "OAuth state expired. Please try again.")
    
    # Security checks
    if state_data['client_ip'] != client_ip:
        return _redirect_with_error("Security Error", "Security validation failed. Please try again.")
    
    # Mark state as used
    state_data['used'] = True
    
    if not code:
        return _redirect_with_error("Authorization code required", "GitHub authorization code is missing")
    
    try:
        # Exchange code for token
        token_response = await github_oauth.exchange_code_for_token(code)
        access_token = token_response['access_token']
        # print(f"Access token from GitHub: {access_token}")
        
        # Get user profile
        user_profile = await github_oauth.get_user_profile(access_token)
        
        # Create or update user
        github_id = user_profile['id']
        login = user_profile['login']
        
        user_info = {
            'id': github_id,
            'github_id': github_id,
            'login': login,
            'name': user_profile.get('name'),
            'email': user_profile.get('email'),
            'avatar_url': user_profile['avatar_url'],
            'bio': user_profile.get('bio'),
            'location': user_profile.get('location'),
            'company': user_profile.get('company'),
            'blog': user_profile.get('blog'),
            'twitter_username': user_profile.get('twitter_username'),
            'public_repos': user_profile.get('public_repos', 0),
            'followers': user_profile.get('followers', 0),
            'following': user_profile.get('following', 0),
            'created_at': user_profile.get('created_at'),
            'updated_at': user_profile.get('updated_at'),
            'last_login': datetime.now().isoformat()
        }
        
        # Store user data
        user_data[github_id] = user_info
        
        # Create session
        session_id = security_utils.generate_secure_token(32)
        session_data = {
            'id': github_id,
            'session_id': session_id,
            'user_id': github_id,
            'github_id': github_id,
            'login': login,
            'name': user_profile.get('name'),
            'avatar_url': user_profile['avatar_url'],
            'access_token': security_utils.encrypt_token(access_token),
            'created_at': datetime.now(),
            'last_activity': datetime.now()
        }
        
        user_sessions[session_id] = session_data
        save_sessions()
        
        # Generate JWT token
        jwt_payload = {
            'session_id': session_id,
            'github_id': github_id,
            'login': login
        }
        jwt_token = jwt_handler.create_access_token(jwt_payload)
        
        # Clean up OAuth state
        del oauth_states[state]
        
        # Redirect to frontend with token
        frontend_url = _get_frontend_url()
        redirect_url = f"{frontend_url}/auth/callback?auth_token={jwt_token}&auth_user={login}"
        
        return RedirectResponse(url=redirect_url)
        
    except Exception as e:
        logger.error(f"OAuth callback error: {e}")
        return _redirect_with_error("Authentication failed", str(e))


@router.get("/status", response_model=AuthStatusResponse)
async def get_auth_status(user: Optional[Dict[str, Any]] = Depends(get_current_user)):
    """Get authentication status."""
    if not user:
        return AuthStatusResponse(authenticated=False, mode="none")
    
    # Handle demo mode
    if user.get('login') == 'demo-user':
        return AuthStatusResponse(
            authenticated=True,
            user=User(**user),
            mode="demo"
        )
    
    # Test GitHub API access
    github_api_test = "success"
    github_user = user.get('login')
    github_error = None
    
    try:
        # In a real implementation, test GitHub API access here
        pass
    except Exception as e:
        github_api_test = "failed"
        github_error = str(e)
    
    return AuthStatusResponse(
        authenticated=True,
        user=User(**user),
        mode="github",
        github_api_test=github_api_test,
        github_user=github_user,
        github_error=github_error
    )


@router.get("/validate", response_model=TokenValidationResponse)
async def validate_token(user: Optional[User] = Depends(get_current_user)):
    """Validate authentication token."""
    if not user:
        return TokenValidationResponse(valid=False)
    
    return TokenValidationResponse(valid=True, user=user)


@router.post("/logout", response_model=LogoutResponse)
async def logout(user: User = Depends(get_current_user)):
    """Logout user."""
    if not user:
        return LogoutResponse(success=False, message="Not authenticated")
    session_id = user.session_id
    if session_id and session_id in user_sessions:
        del user_sessions[session_id]
        save_sessions()
    
    return LogoutResponse(success=True, message="Successfully logged out")


@router.post("/refresh", response_model=TokenRefreshResponse)
async def refresh_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Refresh JWT token."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Token required")
    
    try:
        new_token = jwt_handler.refresh_token(credentials.credentials)
        return TokenRefreshResponse(token=new_token, message="Token refreshed successfully")
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.get("/profile", response_model=UserProfileResponse)
async def get_user_profile(user: User = Depends(get_current_user)):
    """Get current user profile."""
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return UserProfileResponse(user=user)


@router.put("/profile", response_model=UserProfileResponse)
async def update_user_profile(
    profile_update: UserProfileUpdateRequest,
    user: User = Depends(get_current_user)
):
    """Update user profile."""
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_id = user.id
    
    # Update user data
    if user_id in user_data:
        user_data[user_id].update(profile_update.dict(exclude_none=True))
        user_data[user_id]['updated_at'] = datetime.now().isoformat()
        
        return UserProfileResponse(user=User(**user_data[user_id]))
    
    raise HTTPException(status_code=404, detail="User not found")


@router.get("/notes", response_model=UserNotesResponse)
async def get_user_notes(user: User = Depends(get_current_user)):
    """Get user notes."""
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_id = user.id
    notes = user_notes.get(user_id, [])
    return UserNotesResponse(notes=notes)


@router.post("/notes", response_model=UserNotesResponse)
async def create_user_note(
    note: UserNote,
    user: User = Depends(get_current_user)
):
    """Create user note."""
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_id = user.id
    if user_id not in user_notes:
        user_notes[user_id] = []
    
    user_notes[user_id].append(note)
    return UserNotesResponse(notes=user_notes[user_id])


@router.put("/notes/{note_id}", response_model=UserNotesResponse)
async def update_user_note(
    note_id: str,
    updates: Dict[str, Any],
    user: User = Depends(get_current_user)
):
    """Update user note."""
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_id = user.id
    notes = user_notes.get(user_id, [])
    
    for note in notes:
        if note.id == note_id:
            for key, value in updates.items():
                if hasattr(note, key):
                    setattr(note, key, value)
            note.updated_at = datetime.now()
            break
    
    return UserNotesResponse(notes=notes)


@router.delete("/notes/{note_id}", response_model=UserNotesResponse)
async def delete_user_note(
    note_id: str,
    user: User = Depends(get_current_user)
):
    """Delete user note."""
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_id = user.id
    notes = user_notes.get(user_id, [])
    user_notes[user_id] = [note for note in notes if note.id != note_id]
    
    return UserNotesResponse(notes=user_notes[user_id])


@router.get("/filters", response_model=UserFiltersResponse)
async def get_user_filters(user: User = Depends(get_current_user)):
    """Get user saved filters."""
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_id = user.id
    filters = user_filters.get(user_id, [])
    return UserFiltersResponse(filters=filters)


@router.post("/filters", response_model=UserFiltersResponse)
async def create_user_filter(
    filter_data: UserSavedFilter,
    user: User = Depends(get_current_user)
):
    """Create user saved filter."""
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_id = user.id
    if user_id not in user_filters:
        user_filters[user_id] = []
    
    user_filters[user_id].append(filter_data)
    return UserFiltersResponse(filters=user_filters[user_id])


@router.put("/filters/{filter_id}", response_model=UserFiltersResponse)
async def update_user_filter(
    filter_id: str,
    updates: Dict[str, Any],
    user: User = Depends(get_current_user)
):
    """Update user saved filter."""
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_id = user.id
    filters = user_filters.get(user_id, [])
    
    for filter_item in filters:
        if filter_item.id == filter_id:
            for key, value in updates.items():
                if hasattr(filter_item, key):
                    setattr(filter_item, key, value)
            filter_item.updated_at = datetime.now()
            break
    
    return UserFiltersResponse(filters=filters)


@router.delete("/filters/{filter_id}", response_model=UserFiltersResponse)
async def delete_user_filter(
    filter_id: str,
    user: User = Depends(get_current_user)
):
    """Delete user saved filter."""
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_id = user.id
    filters = user_filters.get(user_id, [])
    user_filters[user_id] = [f for f in filters if f.id != filter_id]
    
    return UserFiltersResponse(filters=user_filters[user_id])


@router.get("/pins", response_model=UserPinsResponse)
async def get_user_pins(user: User = Depends(get_current_user)):
    """Get user pinned items."""
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_id = user.id
    pins = user_pins.get(user_id, [])
    return UserPinsResponse(pins=pins)


@router.post("/pins", response_model=UserPinsResponse)
async def create_user_pin(
    pin: UserPinnedItem,
    user: User = Depends(get_current_user)
):
    """Create user pinned item."""
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_id = user.id
    if user_id not in user_pins:
        user_pins[user_id] = []
    
    user_pins[user_id].append(pin)
    return UserPinsResponse(pins=user_pins[user_id])


@router.delete("/pins/{pin_id}", response_model=UserPinsResponse)
async def delete_user_pin(
    pin_id: str,
    user: User = Depends(get_current_user)
):
    """Delete user pinned item."""
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_id = user.id
    pins = user_pins.get(user_id, [])
    user_pins[user_id] = [pin for pin in pins if pin.id != pin_id]
    
    return UserPinsResponse(pins=user_pins[user_id])


@router.get("/settings", response_model=UserSettingsResponse)
async def get_user_settings(user: User = Depends(get_current_user)):
    """Get user settings."""
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_id = user.id
    
    # Handle demo mode
    if user.login == 'demo-user':
        demo_settings = get_demo_settings()
        return UserSettingsResponse(settings=UserSettings(**demo_settings))
    
    settings = user_settings.get(user_id, get_demo_settings())
    return UserSettingsResponse(settings=UserSettings(**settings))


@router.put("/settings", response_model=UserSettingsResponse)
async def update_user_settings(
    settings_update: UserSettingsUpdateRequest,
    user: User = Depends(get_current_user)
):
    """Update user settings."""
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_id = user.id
    
    # Handle demo mode
    if user.login == 'demo-user':
        demo_settings = get_demo_settings()
        demo_settings.update(settings_update.dict(exclude_none=True))
        demo_settings['updated_at'] = datetime.now().isoformat()
        return UserSettingsResponse(settings=UserSettings(**demo_settings))
    
    if user_id not in user_settings:
        user_settings[user_id] = get_demo_settings()
    
    user_settings[user_id].update(settings_update.dict(exclude_none=True))
    user_settings[user_id]['updated_at'] = datetime.now().isoformat()
    
    return UserSettingsResponse(settings=UserSettings(**user_settings[user_id]))


@router.post("/settings/reset", response_model=UserSettingsResetResponse)
async def reset_user_settings(user: User = Depends(get_current_user)):
    """Reset user settings to defaults."""
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_id = user.id
    
    default_settings = get_demo_settings()
    
    # Handle demo mode
    if user.login == 'demo-user':
        return UserSettingsResetResponse(
            settings=UserSettings(**default_settings),
            message="Settings reset to default values (demo mode)"
        )
    
    user_settings[user_id] = default_settings
    
    return UserSettingsResetResponse(
        settings=UserSettings(**default_settings),
        message="Settings reset to default values"
    )


def _get_frontend_url() -> str:
    """Get frontend URL based on environment."""
    if os.getenv('NODE_ENV') == 'production':
        return 'https://your-frontend-domain.com'
    return 'http://localhost:3000'


def _redirect_with_error(error_title: str, error_message: str) -> RedirectResponse:
    """Redirect to frontend with error parameters."""
    frontend_url = _get_frontend_url()
    
    from urllib.parse import quote
    redirect_url = f"{frontend_url}/?auth_error={quote(error_title)}&auth_message={quote(error_message)}"
    
    return RedirectResponse(url=redirect_url)
