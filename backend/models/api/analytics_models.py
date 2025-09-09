from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
from datetime import datetime

# --- Base Analytics Models ---

class LanguageDistribution(BaseModel):
    distribution: Dict[str, int] = Field(..., description="Language name to count mapping")
    top_languages: List[Dict[str, Union[str, int]]] = Field(
        ..., 
        description="Top 10 languages with count"
    )

class RepositoryType(BaseModel):
    forks: int = Field(default=0, description="Number of forked repositories")
    original: int = Field(default=0, description="Number of original repositories")
    private: int = Field(default=0, description="Number of private repositories")
    public: int = Field(default=0, description="Number of public repositories")

class TopRepository(BaseModel):
    name: str = Field(..., description="Repository name")
    full_name: str = Field(..., description="Full repository name (owner/repo)")
    stars: int = Field(..., description="Number of stars")
    forks: int = Field(..., description="Number of forks")
    language: Optional[str] = Field(None, description="Primary language")
    updated_at: datetime = Field(..., description="Last update timestamp")

class ActivityTypes(BaseModel):
    total_events: int = Field(..., description="Total number of activity events")
    recent_activity: List[Dict[str, Any]] = Field(
        ..., 
        description="Recent activity events"
    )

class TrendMetrics(BaseModel):
    recent_commits: int = Field(default=0, description="Recent commit count")
    recent_prs: int = Field(default=0, description="Recent pull request count")
    recent_issues: int = Field(default=0, description="Recent issue count")

# --- User Analytics Overview ---

class AnalyticsOverview(BaseModel):
    total_repositories: int = Field(..., description="Total number of repositories")
    total_stars: int = Field(..., description="Total stars across all repositories")
    total_forks: int = Field(..., description="Total forks across all repositories")
    total_issues: int = Field(..., description="Total open issues across all repositories")
    average_stars_per_repo: float = Field(..., description="Average stars per repository")
    average_forks_per_repo: float = Field(..., description="Average forks per repository")

class UserAnalytics(BaseModel):
    overview: AnalyticsOverview = Field(..., description="Overview analytics")
    languages: LanguageDistribution = Field(..., description="Language distribution")
    activity: ActivityTypes = Field(..., description="Activity analytics")
    repositories: Dict[str, Any] = Field(..., description="Repository analytics")
    trends: TrendMetrics = Field(..., description="Trend analytics")
    last_updated: Optional[datetime] = Field(None, description="Last analytics update time")

# --- Repository Analytics ---

class RepositoryInfo(BaseModel):
    name: str = Field(..., description="Repository name")
    full_name: str = Field(..., description="Full repository name")
    description: Optional[str] = Field(None, description="Repository description")
    language: Optional[str] = Field(None, description="Primary language")
    stars: int = Field(..., description="Number of stars")
    forks: int = Field(..., description="Number of forks")
    watchers: int = Field(..., description="Number of watchers")
    size: int = Field(..., description="Repository size in KB")
    created_at: datetime = Field(..., description="Repository creation timestamp")
    updated_at: datetime = Field(..., description="Repository last update timestamp")
    pushed_at: datetime = Field(..., description="Last push timestamp")

class RepositorySummary(BaseModel):
    total_branches: int = Field(..., description="Total number of branches")
    total_issues: int = Field(..., description="Total number of issues")
    open_issues: int = Field(..., description="Number of open issues")
    closed_issues: int = Field(..., description="Number of closed issues")
    total_pull_requests: int = Field(..., description="Total number of pull requests")
    open_pull_requests: int = Field(..., description="Number of open pull requests")
    merged_pull_requests: int = Field(..., description="Number of merged pull requests")
    total_commits: int = Field(..., description="Total number of commits")
    total_contributors: int = Field(..., description="Total number of contributors")
    languages: List[str] = Field(..., description="List of programming languages used")

class BranchInfo(BaseModel):
    name: str = Field(..., description="Branch name")
    protected: bool = Field(..., description="Whether the branch is protected")
    last_commit: Dict[str, Any] = Field(..., description="Last commit information")

class BranchAnalytics(BaseModel):
    total: int = Field(..., description="Total number of branches")
    protected: int = Field(..., description="Number of protected branches")
    list: List[BranchInfo] = Field(..., description="List of branch information")

class StateAnalytics(BaseModel):
    open: int = Field(default=0, description="Number of open items")
    closed: int = Field(default=0, description="Number of closed items")
    merged: Optional[int] = Field(None, description="Number of merged items (for PRs)")

class IssueAnalytics(BaseModel):
    by_state: StateAnalytics = Field(..., description="Issues grouped by state")
    by_label: Dict[str, int] = Field(..., description="Issues grouped by label")
    recent: List[Dict[str, Any]] = Field(..., description="Recent issues")

class PullRequestAnalytics(BaseModel):
    by_state: StateAnalytics = Field(..., description="Pull requests grouped by state")
    by_label: Dict[str, int] = Field(..., description="Pull requests grouped by label")
    recent: List[Dict[str, Any]] = Field(..., description="Recent pull requests")

class CommitAnalytics(BaseModel):
    total: int = Field(..., description="Total number of commits")
    recent: List[Dict[str, Any]] = Field(..., description="Recent commits")
    by_author: Dict[str, int] = Field(..., description="Commits grouped by author")

class ContributorAnalytics(BaseModel):
    total: int = Field(..., description="Total number of contributors")
    top: List[Dict[str, Any]] = Field(..., description="Top contributors")
    contributions: Dict[str, int] = Field(..., description="Contributions by user")

class ActivityMetrics(BaseModel):
    commits_per_day: float = Field(..., description="Average commits per day")
    issues_per_day: float = Field(..., description="Average issues per day")
    pull_requests_per_day: float = Field(..., description="Average pull requests per day")

class RepositoryAnalytics(BaseModel):
    repository: RepositoryInfo = Field(..., description="Repository information")
    summary: RepositorySummary = Field(..., description="Repository summary")
    branches: BranchAnalytics = Field(..., description="Branch analytics")
    issues: IssueAnalytics = Field(..., description="Issue analytics")
    pull_requests: PullRequestAnalytics = Field(..., description="Pull request analytics")
    commits: CommitAnalytics = Field(..., description="Commit analytics")
    contributors: ContributorAnalytics = Field(..., description="Contributor analytics")
    languages: Dict[str, int] = Field(..., description="Language statistics")
    activity: ActivityMetrics = Field(..., description="Activity metrics")

# --- Branch Analytics ---

class BranchActivityInfo(BaseModel):
    name: str = Field(..., description="Branch name")
    protected: bool = Field(..., description="Whether the branch is protected")
    last_commit: Dict[str, Any] = Field(..., description="Last commit information")
    last_activity: datetime = Field(..., description="Last activity timestamp")

class BranchSummary(BaseModel):
    total_commits: int = Field(..., description="Total commits in the branch")
    total_issues: int = Field(..., description="Total issues related to the branch")
    total_pull_requests: int = Field(..., description="Total pull requests for the branch")
    open_issues: int = Field(..., description="Open issues related to the branch")
    open_pull_requests: int = Field(..., description="Open pull requests for the branch")

class BranchCommitInfo(BaseModel):
    sha: str = Field(..., description="Commit SHA")
    message: str = Field(..., description="Commit message")
    author: str = Field(..., description="Commit author")
    date: datetime = Field(..., description="Commit date")

class BranchCommitAnalytics(BaseModel):
    total: int = Field(..., description="Total number of commits")
    recent: List[Dict[str, Any]] = Field(..., description="Recent commits")
    by_author: Dict[str, int] = Field(..., description="Commits grouped by author")
    timeline: List[BranchCommitInfo] = Field(..., description="Commit timeline")

class BranchActivityMetrics(BaseModel):
    commits_per_day: float = Field(..., description="Average commits per day")
    last_activity: datetime = Field(..., description="Last activity timestamp")
    is_active: bool = Field(..., description="Whether the branch is active (last 7 days)")

class BranchSpecificAnalytics(BaseModel):
    branch: BranchActivityInfo = Field(..., description="Branch information")
    summary: BranchSummary = Field(..., description="Branch summary")
    commits: BranchCommitAnalytics = Field(..., description="Commit analytics")
    issues: IssueAnalytics = Field(..., description="Issue analytics")
    pull_requests: PullRequestAnalytics = Field(..., description="Pull request analytics")
    activity: BranchActivityMetrics = Field(..., description="Activity metrics")

# --- Contribution Analytics ---

class ContributionSummary(BaseModel):
    total_events: int = Field(..., description="Total activity events")
    unique_repositories: int = Field(..., description="Number of unique repositories")

class ContributionTimelineItem(BaseModel):
    type: str = Field(..., description="Event type")
    repository: Optional[str] = Field(None, description="Repository name")
    date: datetime = Field(..., description="Event date")
    actor: Optional[str] = Field(None, description="Actor username")

class ContributionAnalytics(BaseModel):
    period: str = Field(..., description="Analysis period")
    username: str = Field(..., description="Target username")
    summary: ContributionSummary = Field(..., description="Contribution summary")
    by_type: Dict[str, int] = Field(..., description="Contributions by event type")
    by_repository: Dict[str, int] = Field(..., description="Contributions by repository")
    timeline: List[ContributionTimelineItem] = Field(..., description="Contribution timeline")
    recent_activity: List[Dict[str, Any]] = Field(..., description="Recent activity")

# --- AI Insights ---

class InsightMetric(BaseModel):
    score: int = Field(..., ge=0, le=100, description="Score from 0 to 100")
    trend: str = Field(..., description="Trend direction: increasing, decreasing, stable")
    recommendations: List[str] = Field(..., description="AI recommendations")

class AIInsights(BaseModel):
    productivity: InsightMetric = Field(..., description="Productivity insights")
    collaboration: InsightMetric = Field(..., description="Collaboration insights")
    code_quality: InsightMetric = Field(..., description="Code quality insights")
    branch_health: InsightMetric = Field(..., description="Branch health insights")

# --- Request/Response Models ---

class ContributionPeriod(BaseModel):
    period: Optional[str] = Field(
        "month", 
        description="Analysis period",
        pattern="^(week|month|year|all)$"
    )
    username: Optional[str] = Field(None, description="Username to analyze")

class RepositoryAnalyticsRequest(BaseModel):
    owner: str = Field(..., description="Repository owner")
    repo: str = Field(..., description="Repository name")

class BranchAnalyticsRequest(BaseModel):
    owner: str = Field(..., description="Repository owner")
    repo: str = Field(..., description="Repository name")
    branch: str = Field(..., description="Branch name")

# --- Response Wrappers ---

class UserAnalyticsResponse(BaseModel):
    analytics: UserAnalytics = Field(..., description="User analytics data")

class RepositoryAnalyticsResponse(BaseModel):
    analytics: RepositoryAnalytics = Field(..., description="Repository analytics data")

class BranchAnalyticsResponse(BaseModel):
    analytics: BranchSpecificAnalytics = Field(..., description="Branch analytics data")

class ContributionAnalyticsResponse(BaseModel):
    contributions: ContributionAnalytics = Field(..., description="Contribution analytics data")

class AIInsightsResponse(BaseModel):
    insights: AIInsights = Field(..., description="AI insights data")
