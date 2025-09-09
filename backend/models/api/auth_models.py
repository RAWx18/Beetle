"""
Authentication and User Management Models
"""

from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, validator
from enum import Enum


class UserRole(str, Enum):
    """User role enumeration."""
    USER = "user"
    ADMIN = "admin"
    MODERATOR = "moderator"


class GitHubUser(BaseModel):
    """GitHub user profile model."""
    id: int = Field(..., description="GitHub user ID")
    login: str = Field(..., description="GitHub login/username")
    name: Optional[str] = Field(default=None, description="Display name")
    email: Optional[str] = Field(default=None, description="Email address")
    avatar_url: str = Field(..., description="Avatar URL")
    bio: Optional[str] = Field(default=None, description="User bio")
    location: Optional[str] = Field(default=None, description="Location")
    company: Optional[str] = Field(default=None, description="Company")
    blog: Optional[str] = Field(default=None, description="Blog URL")
    twitter_username: Optional[str] = Field(default=None, description="Twitter username")
    public_repos: int = Field(default=0, description="Number of public repositories")
    followers: int = Field(default=0, description="Number of followers")
    following: int = Field(default=0, description="Number of following")
    created_at: str = Field(..., description="Account creation date")
    updated_at: str = Field(..., description="Last update date")


class User(BaseModel):
    """Internal user model."""
    id: int = Field(..., description="Internal user ID")
    github_id: int = Field(..., description="GitHub user ID")
    login: str = Field(..., description="GitHub login/username")
    name: Optional[str] = Field(default=None, description="Display name")
    email: Optional[str] = Field(default=None, description="Email address")
    avatar_url: str = Field(..., description="Avatar URL")
    bio: Optional[str] = Field(default=None, description="User bio")
    location: Optional[str] = Field(default=None, description="Location")
    company: Optional[str] = Field(default=None, description="Company")
    blog: Optional[str] = Field(default=None, description="Blog URL")
    twitter_username: Optional[str] = Field(default=None, description="Twitter username")
    public_repos: int = Field(default=0, description="Number of public repositories")
    followers: int = Field(default=0, description="Number of followers")
    following: int = Field(default=0, description="Number of following")
    role: UserRole = Field(default=UserRole.USER, description="User role")
    is_active: bool = Field(default=True, description="Whether user is active")
    last_login: Optional[datetime] = Field(default=None, description="Last login timestamp")
    created_at: datetime = Field(default_factory=datetime.now, description="Account creation date")
    updated_at: datetime = Field(default_factory=datetime.now, description="Last update date")
    session_id: Optional[str] = Field(default=None, description="Session identifier")
    access_token: Optional[str] = Field(default=None, description="Encrypted GitHub access token")


class UserSession(BaseModel):
    """User session model."""
    session_id: str = Field(..., description="Session identifier")
    user_id: int = Field(..., description="User ID")
    github_id: int = Field(..., description="GitHub user ID")
    login: str = Field(..., description="GitHub login")
    name: Optional[str] = Field(default=None, description="Display name")
    avatar_url: str = Field(..., description="Avatar URL")
    access_token: str = Field(..., description="Encrypted GitHub access token")
    created_at: datetime = Field(default_factory=datetime.now, description="Session creation time")
    last_activity: datetime = Field(default_factory=datetime.now, description="Last activity time")
    expires_at: Optional[datetime] = Field(default=None, description="Session expiration time")
    is_active: bool = Field(default=True, description="Whether session is active")


class OAuthState(BaseModel):
    """OAuth state model for security."""
    state: str = Field(..., description="OAuth state token")
    client_ip: str = Field(..., description="Client IP address")
    user_agent: Optional[str] = Field(default=None, description="User agent")
    timestamp: datetime = Field(default_factory=datetime.now, description="Creation timestamp")
    used: bool = Field(default=False, description="Whether state has been used")
    expires_at: datetime = Field(..., description="State expiration time")


class UserNote(BaseModel):
    """User note model."""
    id: str = Field(..., description="Note ID")
    title: str = Field(..., description="Note title")
    content: str = Field(..., description="Note content")
    tags: List[str] = Field(default_factory=list, description="Note tags")
    created_at: datetime = Field(default_factory=datetime.now, description="Creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.now, description="Last update timestamp")


class UserSavedFilter(BaseModel):
    """User saved filter model."""
    id: str = Field(..., description="Filter ID")
    name: str = Field(..., description="Filter name")
    description: Optional[str] = Field(default=None, description="Filter description")
    filter_data: Dict[str, Any] = Field(..., description="Filter configuration")
    category: str = Field(default="general", description="Filter category")
    created_at: datetime = Field(default_factory=datetime.now, description="Creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.now, description="Last update timestamp")


class UserPinnedItem(BaseModel):
    """User pinned item model."""
    id: str = Field(..., description="Pin ID")
    item_type: str = Field(..., description="Type of pinned item (repo, issue, pr, etc.)")
    item_id: str = Field(..., description="Item identifier")
    title: str = Field(..., description="Item title")
    url: str = Field(..., description="Item URL")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Additional metadata")
    created_at: datetime = Field(default_factory=datetime.now, description="Pin creation timestamp")


class UserSettings(BaseModel):
    """User settings model."""
    profile: Dict[str, Any] = Field(default_factory=dict, description="Profile settings")
    notifications: Dict[str, Any] = Field(default_factory=dict, description="Notification preferences")
    security: Dict[str, Any] = Field(default_factory=dict, description="Security settings")
    appearance: Dict[str, Any] = Field(default_factory=dict, description="Appearance preferences")
    integrations: Dict[str, Any] = Field(default_factory=dict, description="Integration settings")
    preferences: Dict[str, Any] = Field(default_factory=dict, description="General preferences")
    updated_at: datetime = Field(default_factory=datetime.now, description="Last update timestamp")


# Request/Response Models

class GitHubOAuthURLResponse(BaseModel):
    """GitHub OAuth URL response."""
    auth_url: str = Field(..., description="GitHub OAuth authorization URL")
    state: str = Field(..., description="OAuth state token")


class AuthStatusResponse(BaseModel):
    """Authentication status response."""
    authenticated: bool = Field(..., description="Whether user is authenticated")
    user: Optional[User] = Field(default=None, description="User information if authenticated")
    mode: str = Field(default="github", description="Authentication mode")
    github_api_test: Optional[str] = Field(default=None, description="GitHub API test result")
    github_user: Optional[str] = Field(default=None, description="GitHub username")
    github_error: Optional[str] = Field(default=None, description="GitHub API error if any")


class TokenValidationResponse(BaseModel):
    """Token validation response."""
    valid: bool = Field(..., description="Whether token is valid")
    user: Optional[User] = Field(default=None, description="User information if valid")


class LogoutResponse(BaseModel):
    """Logout response."""
    success: bool = Field(..., description="Whether logout was successful")
    message: str = Field(..., description="Logout message")


class TokenRefreshResponse(BaseModel):
    """Token refresh response."""
    token: str = Field(..., description="New JWT token")
    message: str = Field(..., description="Refresh message")


class UserProfileResponse(BaseModel):
    """User profile response."""
    user: User = Field(..., description="User profile data")


class UserProfileUpdateRequest(BaseModel):
    """User profile update request."""
    name: Optional[str] = Field(default=None, description="Display name")
    bio: Optional[str] = Field(default=None, description="User bio")
    location: Optional[str] = Field(default=None, description="Location")
    company: Optional[str] = Field(default=None, description="Company")
    blog: Optional[str] = Field(default=None, description="Blog URL")
    twitter_username: Optional[str] = Field(default=None, description="Twitter username")

    @validator('bio')
    def validate_bio(cls, v):
        if v and len(v) > 500:
            raise ValueError('Bio must be 500 characters or less')
        return v

    @validator('name')
    def validate_name(cls, v):
        if v and len(v) > 100:
            raise ValueError('Name must be 100 characters or less')
        return v


class UserNotesResponse(BaseModel):
    """User notes response."""
    notes: List[UserNote] = Field(..., description="User notes")


class UserFiltersResponse(BaseModel):
    """User filters response."""
    filters: List[UserSavedFilter] = Field(..., description="User saved filters")


class UserPinsResponse(BaseModel):
    """User pins response."""
    pins: List[UserPinnedItem] = Field(..., description="User pinned items")


class UserSettingsResponse(BaseModel):
    """User settings response."""
    settings: UserSettings = Field(..., description="User settings")


class UserSettingsUpdateRequest(BaseModel):
    """User settings update request."""
    profile: Optional[Dict[str, Any]] = Field(default=None, description="Profile settings")
    notifications: Optional[Dict[str, Any]] = Field(default=None, description="Notification preferences")
    security: Optional[Dict[str, Any]] = Field(default=None, description="Security settings")
    appearance: Optional[Dict[str, Any]] = Field(default=None, description="Appearance preferences")
    integrations: Optional[Dict[str, Any]] = Field(default=None, description="Integration settings")
    preferences: Optional[Dict[str, Any]] = Field(default=None, description="General preferences")


class UserSettingsResetResponse(BaseModel):
    """User settings reset response."""
    settings: UserSettings = Field(..., description="Reset user settings")
    message: str = Field(..., description="Reset confirmation message")
