from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

# --- Aggregated Data Models ---

class RepositoryReference(BaseModel):
    """Reference to a repository in aggregated data"""
    name: str = Field(..., description="Repository name")
    full_name: str = Field(..., description="Full repository name (owner/repo)")
    owner: Dict[str, Any] = Field(..., description="Repository owner information")

class AggregatedPullRequest(BaseModel):
    """Pull request with repository context"""
    # Standard GitHub PR fields
    id: int = Field(..., description="Pull request ID")
    number: int = Field(..., description="Pull request number")
    title: str = Field(..., description="Pull request title")
    body: Optional[str] = Field(None, description="Pull request body")
    state: str = Field(..., description="Pull request state")
    draft: bool = Field(default=False, description="Whether PR is a draft")
    merged: bool = Field(default=False, description="Whether PR is merged")
    mergeable: Optional[bool] = Field(None, description="Whether PR is mergeable")
    mergeable_state: Optional[str] = Field(None, description="Mergeable state")
    html_url: str = Field(..., description="PR HTML URL")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    closed_at: Optional[datetime] = Field(None, description="Close timestamp")
    merged_at: Optional[datetime] = Field(None, description="Merge timestamp")
    
    # User information
    user: Dict[str, Any] = Field(..., description="PR author")
    assignees: List[Dict[str, Any]] = Field(default_factory=list, description="Assigned users")
    requested_reviewers: List[Dict[str, Any]] = Field(default_factory=list, description="Requested reviewers")
    
    # Branch information
    head: Dict[str, Any] = Field(..., description="Head branch")
    base: Dict[str, Any] = Field(..., description="Base branch")
    
    # Labels and metadata
    labels: List[Dict[str, Any]] = Field(default_factory=list, description="PR labels")
    milestone: Optional[Dict[str, Any]] = Field(None, description="PR milestone")
    
    # Repository context (added for aggregated view)
    repository: RepositoryReference = Field(..., description="Repository information")
    repository_url: str = Field(..., description="Repository URL")

class AggregatedIssue(BaseModel):
    """Issue with repository context"""
    # Standard GitHub issue fields
    id: int = Field(..., description="Issue ID")
    number: int = Field(..., description="Issue number")
    title: str = Field(..., description="Issue title")
    body: Optional[str] = Field(None, description="Issue body")
    state: str = Field(..., description="Issue state")
    locked: bool = Field(default=False, description="Whether issue is locked")
    html_url: str = Field(..., description="Issue HTML URL")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    closed_at: Optional[datetime] = Field(None, description="Close timestamp")
    
    # User information
    user: Dict[str, Any] = Field(..., description="Issue author")
    assignees: List[Dict[str, Any]] = Field(default_factory=list, description="Assigned users")
    
    # Labels and metadata
    labels: List[Dict[str, Any]] = Field(default_factory=list, description="Issue labels")
    milestone: Optional[Dict[str, Any]] = Field(None, description="Issue milestone")
    
    # Repository context (added for aggregated view)
    repository: RepositoryReference = Field(..., description="Repository information")
    repository_url: str = Field(..., description="Repository URL")

class ActivitySummary(BaseModel):
    """Summary of activity across repositories"""
    repositories: int = Field(..., description="Number of repositories")
    total_stars: int = Field(..., description="Total stars across repositories")
    total_forks: int = Field(..., description="Total forks across repositories")
    open_prs: int = Field(..., description="Total open pull requests")
    open_issues: int = Field(..., description="Total open issues")
    languages: Dict[str, int] = Field(..., description="Language distribution")
    recent_activity: List[Dict[str, Any]] = Field(..., description="Recent activity items")

# --- Query Parameters ---

class AggregatedQueryParams(BaseModel):
    """Base query parameters for aggregated endpoints"""
    limit: int = Field(default=10, ge=1, le=100, description="Number of repositories to check")
    state: str = Field(default="all", pattern="^(open|closed|all)$", description="State filter")

class PullRequestQueryParams(AggregatedQueryParams):
    """Query parameters for aggregated pull requests"""
    pass

class IssueQueryParams(AggregatedQueryParams):
    """Query parameters for aggregated issues"""
    pass

class SummaryQueryParams(BaseModel):
    """Query parameters for activity summary"""
    limit: int = Field(default=10, ge=1, le=50, description="Number of repositories to analyze")

# --- Response Models ---

class AggregatedPullRequestsResponse(BaseModel):
    """Response for aggregated pull requests"""
    pull_requests: List[AggregatedPullRequest] = Field(..., description="Aggregated pull requests")
    total: int = Field(..., description="Total number of pull requests")
    repositories: int = Field(..., description="Number of repositories checked")
    summary: Dict[str, Any] = Field(..., description="Summary statistics")

class AggregatedIssuesResponse(BaseModel):
    """Response for aggregated issues"""
    issues: List[AggregatedIssue] = Field(..., description="Aggregated issues")
    total: int = Field(..., description="Total number of issues")
    repositories: int = Field(..., description="Number of repositories checked")
    summary: Dict[str, Any] = Field(..., description="Summary statistics")

class ActivitySummaryResponse(BaseModel):
    """Response for activity summary"""
    summary: ActivitySummary = Field(..., description="Activity summary")
    generated_at: datetime = Field(default_factory=datetime.now, description="Summary generation time")

# --- Error Models ---

class AggregationError(BaseModel):
    """Error in data aggregation"""
    error: str = Field(default="Aggregation failed", description="Error type")
    message: str = Field(..., description="Error message")
    failed_repositories: List[str] = Field(default_factory=list, description="Repositories that failed")
    partial_results: bool = Field(default=False, description="Whether partial results are available")
