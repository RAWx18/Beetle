"""
Project-related database models.
Maps your existing project_models.py Pydantic models to SQLAlchemy.
"""

from sqlalchemy import Column, String, Integer, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship

from .base import Base, BaseModel, JSON, GUID

class ProjectModel(Base, BaseModel):
    """Project database model mapping to project_models.Project."""
    __tablename__ = "projects"

    # Basic project info
    name = Column(String(100), nullable=False)
    description = Column(String(500))
    repository_url = Column(Text)
    full_name = Column(String(255))  # owner/repo format
    
    # GitHub-specific fields
    language = Column(String(100))
    stars = Column(Integer, default=0)
    forks = Column(Integer, default=0)
    issues = Column(Integer, default=0)
    html_url = Column(Text)
    
    # Project management
    created_by = Column(GUID(), ForeignKey("users.id"), nullable=False)
    is_beetle_project = Column(Boolean, default=False)
    
    # JSON fields for complex data
    settings = Column(JSON, default=dict)  # ProjectSettings
    analytics = Column(JSON, default=dict)  # ProjectAnalytics
    recent_activity = Column(JSON)  # Optional[RecentActivity]
    
    # Relationships
    creator = relationship("UserModel", back_populates="projects")
    branches = relationship("ProjectBranchModel", back_populates="project", cascade="all, delete-orphan")

class ProjectBranchModel(Base, BaseModel):
    """Project branch database model mapping to project_models.ProjectBranch."""
    __tablename__ = "project_branches"

    project_id = Column(GUID(), ForeignKey("projects.id"), nullable=False)
    name = Column(String(255), nullable=False)
    protected = Column(Boolean, default=False)
    last_commit = Column(JSON)  # Optional[Dict[str, Any]]
    
    # Relationships
    project = relationship("ProjectModel", back_populates="branches")

