"""
User-related database models.
Maps your existing auth_models.py Pydantic models to SQLAlchemy.
"""

from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from .base import Base, BaseModel, JSON, GUID

class UserModel(Base, BaseModel):
    """User database model mapping to auth_models.User."""
    __tablename__ = "users"

    # GitHub integration fields
    github_id = Column(Integer, unique=True, nullable=False, index=True)
    login = Column(String(255), nullable=False, index=True)
    
    # Profile fields
    name = Column(String(255))
    email = Column(String(320))  # RFC 5322 max email length
    avatar_url = Column(Text)
    bio = Column(Text)
    location = Column(String(255))
    company = Column(String(255))
    blog = Column(Text)
    twitter_username = Column(String(255))
    
    # GitHub stats
    public_repos = Column(Integer, default=0)
    followers = Column(Integer, default=0)
    following = Column(Integer, default=0)
    
    # User management
    role = Column(String(50), default="user")  # user, admin, moderator
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime(timezone=True))
    
    # Relationships
    sessions = relationship("UserSessionModel", back_populates="user", cascade="all, delete-orphan")
    notes = relationship("UserNoteModel", back_populates="user", cascade="all, delete-orphan")
    filters = relationship("UserSavedFilterModel", back_populates="user", cascade="all, delete-orphan")
    pins = relationship("UserPinnedItemModel", back_populates="user", cascade="all, delete-orphan")
    settings = relationship("UserSettingsModel", back_populates="user", uselist=False, cascade="all, delete-orphan")
    projects = relationship("ProjectModel", back_populates="creator", cascade="all, delete-orphan")
    chat_sessions = relationship("ChatSessionModel", back_populates="user", cascade="all, delete-orphan")

class UserSessionModel(Base, BaseModel):
    """User session database model mapping to auth_models.UserSession."""
    __tablename__ = "user_sessions"

    session_id = Column(String(255), unique=True, nullable=False, index=True)
    user_id = Column(GUID(), ForeignKey("users.id"), nullable=False)
    github_id = Column(Integer, nullable=False)
    
    # Session data
    login = Column(String(255), nullable=False)
    name = Column(String(255))
    avatar_url = Column(Text)
    access_token = Column(Text, nullable=False)  # Encrypted
    
    # Session management
    last_activity = Column(DateTime(timezone=True), default=datetime.now)
    expires_at = Column(DateTime(timezone=True))
    is_active = Column(Boolean, default=True)
    
    # Relationships
    user = relationship("UserModel", back_populates="sessions")

class UserNoteModel(Base, BaseModel):
    """User note database model mapping to auth_models.UserNote."""
    __tablename__ = "user_notes"

    user_id = Column(GUID(), ForeignKey("users.id"), nullable=False)
    title = Column(String(500), nullable=False)
    content = Column(Text, nullable=False)
    tags = Column(JSON)  # List[str]
    
    # Relationships
    user = relationship("UserModel", back_populates="notes")

class UserSavedFilterModel(Base, BaseModel):
    """User saved filter database model mapping to auth_models.UserSavedFilter."""
    __tablename__ = "user_saved_filters"

    user_id = Column(GUID(), ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    filter_data = Column(JSON, nullable=False)  # Dict[str, Any]
    category = Column(String(100), default="general")
    
    # Relationships
    user = relationship("UserModel", back_populates="filters")

class UserPinnedItemModel(Base, BaseModel):
    """User pinned item database model mapping to auth_models.UserPinnedItem."""
    __tablename__ = "user_pinned_items"

    user_id = Column(GUID(), ForeignKey("users.id"), nullable=False)
    item_type = Column(String(50), nullable=False)  # repo, issue, pr, etc.
    item_id = Column(String(255), nullable=False)
    title = Column(String(500), nullable=False)
    url = Column(Text, nullable=False)
    meta_data = Column(JSON)  # Optional[Dict[str, Any]]
    
    # Relationships
    user = relationship("UserModel", back_populates="pins")

class UserSettingsModel(Base, BaseModel):
    """User settings database model mapping to auth_models.UserSettings."""
    __tablename__ = "user_settings"

    user_id = Column(GUID(), ForeignKey("users.id"), nullable=False, unique=True)
    
    # Settings as JSON columns
    profile = Column(JSON, default=dict)  # Dict[str, Any]
    notifications = Column(JSON, default=dict)  # Dict[str, Any]
    security = Column(JSON, default=dict)  # Dict[str, Any]
    appearance = Column(JSON, default=dict)  # Dict[str, Any]
    integrations = Column(JSON, default=dict)  # Dict[str, Any]
    preferences = Column(JSON, default=dict)  # Dict[str, Any]
    
    # Relationships
    user = relationship("UserModel", back_populates="settings")

