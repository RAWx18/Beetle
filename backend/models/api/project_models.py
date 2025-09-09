from pydantic import BaseModel, Field, HttpUrl
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from uuid import uuid4

# --- Base Project Models ---

class ProjectSettings(BaseModel):
    """Project-specific settings"""
    auto_import_branches: bool = Field(default=True, description="Automatically import new branches")
    webhook_enabled: bool = Field(default=False, description="Enable webhook integration")
    ai_suggestions: bool = Field(default=True, description="Enable AI-powered suggestions")
    notification_settings: Dict[str, bool] = Field(
        default_factory=lambda: {
            "new_issues": True,
            "new_prs": True,
            "commits": False
        },
        description="Notification preferences"
    )
    branch_protection_rules: List[str] = Field(
        default_factory=list,
        description="Branch protection rule patterns"
    )

class ProjectBranch(BaseModel):
    """Project branch information"""
    name: str = Field(..., description="Branch name")
    protected: bool = Field(default=False, description="Branch protection status")
    last_commit: Optional[Dict[str, Any]] = Field(None, description="Last commit information")
    
class ProjectAnalytics(BaseModel):
    """Basic project analytics"""
    total_commits: int = Field(default=0, description="Total commit count")
    total_prs: int = Field(default=0, description="Total pull request count")
    total_issues: int = Field(default=0, description="Total issue count")
    open_issues: Optional[int] = Field(None, description="Open issue count")
    open_pull_requests: Optional[int] = Field(None, description="Open pull request count")

class RecentActivity(BaseModel):
    """Recent project activity"""
    commits: List[Dict[str, Any]] = Field(default_factory=list, description="Recent commits")
    issues: List[Dict[str, Any]] = Field(default_factory=list, description="Recent issues")
    pull_requests: List[Dict[str, Any]] = Field(default_factory=list, description="Recent pull requests")

# --- Core Project Models ---

class ProjectBase(BaseModel):
    """Base project information"""
    name: str = Field(..., min_length=1, max_length=100, description="Project name")
    description: Optional[str] = Field(None, max_length=500, description="Project description")
    repository_url: Optional[HttpUrl] = Field(None, description="Associated repository URL")

class ProjectCreate(ProjectBase):
    """Project creation model"""
    branches: List[str] = Field(default_factory=list, description="Project branches")
    settings: ProjectSettings = Field(default_factory=ProjectSettings, description="Project settings")

class ProjectUpdate(BaseModel):
    """Project update model"""
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="Project name")
    description: Optional[str] = Field(None, max_length=500, description="Project description")
    repository_url: Optional[HttpUrl] = Field(None, description="Associated repository URL")
    branches: Optional[List[str]] = Field(None, description="Project branches")
    settings: Optional[ProjectSettings] = Field(None, description="Project settings")

class Project(ProjectBase):
    """Complete project model"""
    id: str = Field(default_factory=lambda: str(uuid4()), description="Unique project ID")
    branches: List[ProjectBranch] = Field(default_factory=list, description="Project branches")
    settings: ProjectSettings = Field(default_factory=ProjectSettings, description="Project settings")
    created_by: str = Field(..., description="Creator user ID")
    created_at: datetime = Field(default_factory=datetime.now, description="Creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.now, description="Last update timestamp")
    analytics: ProjectAnalytics = Field(default_factory=ProjectAnalytics, description="Project analytics")
    recent_activity: Optional[RecentActivity] = Field(None, description="Recent project activity")
    is_beetle_project: bool = Field(default=False, description="Whether this is a Beetle-enhanced project")
    
    # GitHub-specific fields (when imported from repository)
    full_name: Optional[str] = Field(None, description="Full repository name (owner/repo)")
    language: Optional[str] = Field(None, description="Primary programming language")
    stars: int = Field(default=0, description="Number of stars")
    forks: int = Field(default=0, description="Number of forks")
    issues: int = Field(default=0, description="Number of issues")
    html_url: Optional[HttpUrl] = Field(None, description="GitHub repository URL")

class ProjectListItem(BaseModel):
    """Simplified project model for listings"""
    id: str = Field(..., description="Project ID")
    name: str = Field(..., description="Project name")
    full_name: Optional[str] = Field(None, description="Full repository name")
    description: Optional[str] = Field(None, description="Project description")
    language: Optional[str] = Field(None, description="Primary language")
    stars: int = Field(default=0, description="Star count")
    forks: int = Field(default=0, description="Fork count")
    issues: int = Field(default=0, description="Issue count")
    updated_at: datetime = Field(..., description="Last update timestamp")
    html_url: Optional[HttpUrl] = Field(None, description="Repository URL")
    is_beetle_project: bool = Field(default=False, description="Beetle project status")
    analytics: ProjectAnalytics = Field(..., description="Basic analytics")

# --- Repository Import Models ---

class RepositoryImportRequest(BaseModel):
    """Repository import request model"""
    repository_url: HttpUrl = Field(..., description="Repository URL to import")
    branches: List[str] = Field(default_factory=list, description="Specific branches to import")
    settings: ProjectSettings = Field(default_factory=ProjectSettings, description="Project settings")

class RepositoryImportResponse(BaseModel):
    """Repository import response model"""
    message: str = Field(..., description="Import status message")
    project: Project = Field(..., description="Imported project data")

# --- Beetle-Specific Models ---

class BeetleProjectSummary(BaseModel):
    """Beetle project summary statistics"""
    total_branches: int = Field(..., description="Total number of branches")
    total_issues: int = Field(..., description="Total number of issues")
    total_pull_requests: int = Field(..., description="Total number of pull requests")
    total_commits: int = Field(..., description="Total number of commits")
    active_branches: int = Field(..., description="Number of active branches")

class BeetleBranchData(BaseModel):
    """Beetle-specific branch data"""
    name: str = Field(..., description="Branch name")
    protected: bool = Field(..., description="Protection status")
    last_commit: Dict[str, Any] = Field(..., description="Last commit info")
    issues: List[Dict[str, Any]] = Field(..., description="Related issues")
    pull_requests: List[Dict[str, Any]] = Field(..., description="Related pull requests")
    commits: List[Dict[str, Any]] = Field(..., description="Branch commits")

class BeetleInsights(BaseModel):
    """Beetle AI insights"""
    productivity: Dict[str, Any] = Field(..., description="Productivity metrics")
    collaboration: Dict[str, Any] = Field(..., description="Collaboration insights")
    code_quality: Dict[str, Any] = Field(..., description="Code quality analysis")
    branch_health: Dict[str, Any] = Field(..., description="Branch health assessment")

class BeetleProjectData(BaseModel):
    """Complete Beetle project data"""
    project: ProjectListItem = Field(..., description="Project information")
    branches: List[BeetleBranchData] = Field(..., description="Branch data")
    summary: BeetleProjectSummary = Field(..., description="Project summary")
    insights: BeetleInsights = Field(..., description="AI insights")

# --- Smart Suggestions Models ---

class SmartSuggestion(BaseModel):
    """Smart suggestion model"""
    id: int = Field(..., description="Suggestion ID")
    type: str = Field(..., description="Suggestion type")
    title: str = Field(..., description="Suggestion title")
    description: str = Field(..., description="Suggestion description")
    priority: str = Field(..., description="Suggestion priority")
    action: str = Field(..., description="Suggested action")

class SmartSuggestionsResponse(BaseModel):
    """Smart suggestions response"""
    suggestions: List[SmartSuggestion] = Field(..., description="List of suggestions")

# --- API Response Models ---

class ProjectListResponse(BaseModel):
    """Project list response"""
    projects: List[ProjectListItem] = Field(..., description="List of projects")
    total: int = Field(..., description="Total project count")

class ProjectDetailResponse(BaseModel):
    """Project detail response"""
    project: Project = Field(..., description="Project details")

class ProjectCreateResponse(BaseModel):
    """Project creation response"""
    message: str = Field(..., description="Success message")
    project: Project = Field(..., description="Created project")

class ProjectUpdateResponse(BaseModel):
    """Project update response"""
    message: str = Field(..., description="Success message")
    project: Project = Field(..., description="Updated project")

class ProjectBranchesResponse(BaseModel):
    """Project branches response"""
    branches: List[ProjectBranch] = Field(..., description="Project branches")

class ProjectAnalyticsResponse(BaseModel):
    """Project analytics response"""
    analytics: ProjectAnalytics = Field(..., description="Project analytics")
    recent_activity: Optional[RecentActivity] = Field(None, description="Recent activity")

class BeetleProjectResponse(BaseModel):
    """Beetle project data response"""
    beetle_data: BeetleProjectData = Field(..., description="Beetle project data")

# --- Validation Models ---

class ProjectIdValidation(BaseModel):
    """Project ID validation"""
    project_id: str = Field(..., description="Project ID")

class BranchValidation(BaseModel):
    """Branch validation"""
    branch: str = Field(..., description="Branch name")

# --- Error Models ---

class ProjectNotFoundError(BaseModel):
    """Project not found error"""
    error: str = Field(default="Project not found", description="Error type")
    message: str = Field(..., description="Error message")

class ValidationError(BaseModel):
    """Validation error model"""
    error: str = Field(default="Validation Error", description="Error type")
    details: List[Dict[str, Any]] = Field(..., description="Validation error details")
