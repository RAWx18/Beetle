"""
GitHub API integration models
"""

from datetime import datetime
from typing import Optional, Dict, Any, List, Union
from pydantic import BaseModel, Field, validator
from enum import Enum


class GitHubUserProfile(BaseModel):
    """GitHub user profile model."""
    login: str = Field(..., description="GitHub username")
    id: int = Field(..., description="GitHub user ID")
    node_id: Optional[str] = Field(default=None, description="GitHub node ID")
    avatar_url: str = Field(..., description="Avatar URL")
    gravatar_id: Optional[str] = Field(default=None, description="Gravatar ID")
    url: Optional[str] = Field(default=None, description="API URL")
    html_url: Optional[str] = Field(default=None, description="Profile URL")
    followers_url: Optional[str] = Field(default=None, description="Followers API URL")
    following_url: Optional[str] = Field(default=None, description="Following API URL")
    gists_url: Optional[str] = Field(default=None, description="Gists API URL")
    starred_url: Optional[str] = Field(default=None, description="Starred API URL")
    subscriptions_url: Optional[str] = Field(default=None, description="Subscriptions API URL")
    organizations_url: Optional[str] = Field(default=None, description="Organizations API URL")
    repos_url: Optional[str] = Field(default=None, description="Repositories API URL")
    events_url: Optional[str] = Field(default=None, description="Events API URL")
    received_events_url: Optional[str] = Field(default=None, description="Received events API URL")
    type: Optional[str] = Field(default=None, description="User type")
    site_admin: Optional[bool] = Field(default=None, description="Site admin status")
    name: Optional[str] = Field(default=None, description="Display name")
    company: Optional[str] = Field(default=None, description="Company")
    blog: Optional[str] = Field(default=None, description="Blog URL")
    location: Optional[str] = Field(default=None, description="Location")
    email: Optional[str] = Field(default=None, description="Email")
    hireable: Optional[bool] = Field(default=None, description="Hireable status")
    bio: Optional[str] = Field(default=None, description="Bio")
    twitter_username: Optional[str] = Field(default=None, description="Twitter username")
    public_repos: Optional[int] = Field(default=None, description="Public repositories count")
    public_gists: Optional[int] = Field(default=None, description="Public gists count")
    followers: Optional[int] = Field(default=None, description="Followers count")
    following: Optional[int] = Field(default=None, description="Following count")
    created_at: Optional[str] = Field(default=None, description="Account creation date")
    updated_at: Optional[str] = Field(default=None, description="Last update date")


class GitHubRepository(BaseModel):
    """GitHub repository model."""
    id: int = Field(..., description="Repository ID")
    node_id: str = Field(..., description="Repository node ID")
    name: str = Field(..., description="Repository name")
    full_name: str = Field(..., description="Full repository name")
    owner: GitHubUserProfile = Field(..., description="Repository owner")
    private: bool = Field(..., description="Private repository status")
    html_url: str = Field(..., description="Repository URL")
    description: Optional[str] = Field(default=None, description="Repository description")
    fork: bool = Field(..., description="Fork status")
    url: str = Field(..., description="API URL")
    clone_url: str = Field(..., description="Clone URL")
    git_url: str = Field(..., description="Git URL")
    ssh_url: str = Field(..., description="SSH URL")
    svn_url: str = Field(..., description="SVN URL")
    mirror_url: Optional[str] = Field(default=None, description="Mirror URL")
    homepage: Optional[str] = Field(default=None, description="Homepage URL")
    size: int = Field(..., description="Repository size")
    stargazers_count: int = Field(..., description="Stars count")
    watchers_count: int = Field(..., description="Watchers count")
    language: Optional[str] = Field(default=None, description="Primary language")
    has_issues: bool = Field(..., description="Issues enabled")
    has_projects: bool = Field(..., description="Projects enabled")
    has_wiki: bool = Field(..., description="Wiki enabled")
    has_pages: bool = Field(..., description="Pages enabled")
    has_downloads: bool = Field(..., description="Downloads enabled")
    archived: bool = Field(..., description="Archived status")
    disabled: bool = Field(..., description="Disabled status")
    open_issues_count: int = Field(..., description="Open issues count")
    license: Optional[Dict[str, Any]] = Field(default=None, description="License information")
    allow_forking: bool = Field(..., description="Allow forking")
    is_template: bool = Field(..., description="Template repository")
    topics: List[str] = Field(default_factory=list, description="Repository topics")
    visibility: str = Field(..., description="Repository visibility")
    forks: int = Field(..., description="Forks count")
    forks_count: int = Field(..., description="Forks count")
    open_issues: int = Field(..., description="Open issues count")
    watchers: int = Field(..., description="Watchers count")
    default_branch: str = Field(..., description="Default branch")
    created_at: str = Field(..., description="Creation date")
    updated_at: str = Field(..., description="Last update date")
    pushed_at: str = Field(..., description="Last push date")


class GitHubBranch(BaseModel):
    """GitHub branch model."""
    name: str = Field(..., description="Branch name")
    commit: Dict[str, Any] = Field(..., description="Last commit information")
    protected: bool = Field(..., description="Protected branch status")


class GitHubCommit(BaseModel):
    """GitHub commit model."""
    sha: str = Field(..., description="Commit SHA")
    node_id: str = Field(..., description="Node ID")
    commit: Dict[str, Any] = Field(..., description="Commit details")
    url: str = Field(..., description="Commit URL")
    html_url: str = Field(..., description="Commit HTML URL")
    comments_url: str = Field(..., description="Comments URL")
    author: Optional[GitHubUserProfile] = Field(default=None, description="Commit author")
    committer: Optional[GitHubUserProfile] = Field(default=None, description="Commit committer")
    parents: List[Dict[str, Any]] = Field(default_factory=list, description="Parent commits")


class GitHubIssue(BaseModel):
    """GitHub issue model."""
    id: int = Field(..., description="Issue ID")
    node_id: str = Field(..., description="Node ID")
    url: str = Field(..., description="API URL")
    repository_url: str = Field(..., description="Repository URL")
    labels_url: str = Field(..., description="Labels URL")
    comments_url: str = Field(..., description="Comments URL")
    events_url: str = Field(..., description="Events URL")
    html_url: str = Field(..., description="HTML URL")
    number: int = Field(..., description="Issue number")
    state: str = Field(..., description="Issue state")
    title: str = Field(..., description="Issue title")
    body: Optional[str] = Field(default=None, description="Issue body")
    user: GitHubUserProfile = Field(..., description="Issue creator")
    labels: List[Dict[str, Any]] = Field(default_factory=list, description="Issue labels")
    assignee: Optional[GitHubUserProfile] = Field(default=None, description="Issue assignee")
    assignees: List[GitHubUserProfile] = Field(default_factory=list, description="Issue assignees")
    milestone: Optional[Dict[str, Any]] = Field(default=None, description="Issue milestone")
    locked: bool = Field(..., description="Locked status")
    active_lock_reason: Optional[str] = Field(default=None, description="Lock reason")
    comments: int = Field(..., description="Comments count")
    pull_request: Optional[Dict[str, Any]] = Field(default=None, description="Pull request info")
    closed_at: Optional[str] = Field(default=None, description="Close date")
    created_at: str = Field(..., description="Creation date")
    updated_at: str = Field(..., description="Last update date")
    author_association: str = Field(..., description="Author association")


class GitHubPullRequest(BaseModel):
    """GitHub pull request model."""
    id: int = Field(..., description="PR ID")
    node_id: str = Field(..., description="Node ID")
    url: str = Field(..., description="API URL")
    html_url: str = Field(..., description="HTML URL")
    diff_url: str = Field(..., description="Diff URL")
    patch_url: str = Field(..., description="Patch URL")
    issue_url: str = Field(..., description="Issue URL")
    commits_url: str = Field(..., description="Commits URL")
    review_comments_url: str = Field(..., description="Review comments URL")
    review_comment_url: str = Field(..., description="Review comment URL")
    comments_url: str = Field(..., description="Comments URL")
    statuses_url: str = Field(..., description="Statuses URL")
    number: int = Field(..., description="PR number")
    state: str = Field(..., description="PR state")
    locked: bool = Field(..., description="Locked status")
    title: str = Field(..., description="PR title")
    user: GitHubUserProfile = Field(..., description="PR creator")
    body: Optional[str] = Field(default=None, description="PR body")
    labels: List[Dict[str, Any]] = Field(default_factory=list, description="PR labels")
    milestone: Optional[Dict[str, Any]] = Field(default=None, description="PR milestone")
    active_lock_reason: Optional[str] = Field(default=None, description="Lock reason")
    created_at: str = Field(..., description="Creation date")
    updated_at: str = Field(..., description="Last update date")
    closed_at: Optional[str] = Field(default=None, description="Close date")
    merged_at: Optional[str] = Field(default=None, description="Merge date")
    merge_commit_sha: Optional[str] = Field(default=None, description="Merge commit SHA")
    assignee: Optional[GitHubUserProfile] = Field(default=None, description="PR assignee")
    assignees: List[GitHubUserProfile] = Field(default_factory=list, description="PR assignees")
    requested_reviewers: List[GitHubUserProfile] = Field(default_factory=list, description="Requested reviewers")
    requested_teams: List[Dict[str, Any]] = Field(default_factory=list, description="Requested teams")
    head: Dict[str, Any] = Field(..., description="Head branch info")
    base: Dict[str, Any] = Field(..., description="Base branch info")
    merged: bool = Field(..., description="Merged status")
    mergeable: Optional[bool] = Field(default=None, description="Mergeable status")
    rebaseable: Optional[bool] = Field(default=None, description="Rebaseable status")
    mergeable_state: str = Field(..., description="Mergeable state")
    merged_by: Optional[GitHubUserProfile] = Field(default=None, description="Merged by user")
    comments: int = Field(..., description="Comments count")
    review_comments: int = Field(..., description="Review comments count")
    maintainer_can_modify: bool = Field(..., description="Maintainer can modify")
    commits: int = Field(..., description="Commits count")
    additions: int = Field(..., description="Additions count")
    deletions: int = Field(..., description="Deletions count")
    changed_files: int = Field(..., description="Changed files count")


class GitHubActivityActor(BaseModel):
    """GitHub activity actor model."""
    id: int = Field(..., description="Actor ID")
    login: str = Field(..., description="Actor login")
    display_login: Optional[str] = Field(default=None, description="Actor display login")
    gravatar_id: Optional[str] = Field(default=None, description="Gravatar ID")
    url: str = Field(..., description="API URL")
    avatar_url: str = Field(..., description="Avatar URL")

class GitHubActivity(BaseModel):
    """GitHub activity event model."""
    id: str = Field(..., description="Event ID")
    type: str = Field(..., description="Event type")
    actor: GitHubActivityActor = Field(..., description="Event actor")
    repo: Dict[str, Any] = Field(..., description="Repository info")
    payload: Dict[str, Any] = Field(..., description="Event payload")
    public: bool = Field(..., description="Public event")
    created_at: str = Field(..., description="Event date")


class GitHubTreeItem(BaseModel):
    """GitHub tree item model."""
    path: str = Field(..., description="File/directory path")
    mode: str = Field(..., description="File mode")
    type: str = Field(..., description="Item type (blob/tree)")
    sha: str = Field(..., description="SHA hash")
    size: Optional[int] = Field(default=None, description="File size")
    url: str = Field(..., description="API URL")


class GitHubFileContent(BaseModel):
    """GitHub file content model."""
    name: str = Field(..., description="File name")
    path: str = Field(..., description="File path")
    sha: str = Field(..., description="File SHA")
    size: int = Field(..., description="File size")
    url: str = Field(..., description="API URL")
    html_url: str = Field(..., description="HTML URL")
    git_url: str = Field(..., description="Git URL")
    download_url: str = Field(..., description="Download URL")
    type: str = Field(..., description="Content type")
    content: str = Field(..., description="Base64 encoded content")
    encoding: str = Field(..., description="Content encoding")


# Search Models

class SearchRepositoriesRequest(BaseModel):
    """Search repositories request."""
    q: str = Field(..., description="Search query")
    sort: str = Field(default="stars", description="Sort field")
    order: str = Field(default="desc", description="Sort order")
    page: int = Field(default=1, ge=1, description="Page number")
    per_page: int = Field(default=30, ge=1, le=100, description="Items per page")


class SearchUsersRequest(BaseModel):
    """Search users request."""
    q: str = Field(..., description="Search query")
    sort: str = Field(default="followers", description="Sort field")
    order: str = Field(default="desc", description="Sort order")
    page: int = Field(default=1, ge=1, description="Page number")
    per_page: int = Field(default=30, ge=1, le=100, description="Items per page")


class SearchOrganizationsRequest(BaseModel):
    """Search organizations request."""
    q: str = Field(..., description="Search query")
    sort: str = Field(default="repositories", description="Sort field")
    order: str = Field(default="desc", description="Sort order")
    page: int = Field(default=1, ge=1, description="Page number")
    per_page: int = Field(default=30, ge=1, le=100, description="Items per page")


class SearchResponse(BaseModel):
    """Search response model."""
    total_count: int = Field(..., description="Total results count")
    incomplete_results: bool = Field(..., description="Incomplete results flag")
    items: List[Dict[str, Any]] = Field(..., description="Search results")
    query: str = Field(..., description="Search query")
    pagination: Dict[str, Any] = Field(..., description="Pagination info")


# Repository Analytics Models

class RepositoryStats(BaseModel):
    """Repository statistics model."""
    repository: GitHubRepository = Field(..., description="Repository details")
    summary: Dict[str, Any] = Field(..., description="Summary statistics")
    branches: List[GitHubBranch] = Field(..., description="Repository branches")
    recent_issues: List[GitHubIssue] = Field(..., description="Recent issues")
    recent_pull_requests: List[GitHubPullRequest] = Field(..., description="Recent pull requests")
    recent_commits: List[GitHubCommit] = Field(..., description="Recent commits")
    top_contributors: List[GitHubUserProfile] = Field(..., description="Top contributors")
    languages: Dict[str, int] = Field(..., description="Language statistics")


class BranchStats(BaseModel):
    """Branch statistics model."""
    branch: GitHubBranch = Field(..., description="Branch details")
    commits: List[GitHubCommit] = Field(..., description="Branch commits")
    issues: List[GitHubIssue] = Field(..., description="Branch-related issues")
    pull_requests: List[GitHubPullRequest] = Field(..., description="Branch pull requests")
    summary: Dict[str, Any] = Field(..., description="Branch summary")


class DashboardStats(BaseModel):
    """Dashboard statistics model."""
    total_repositories: int = Field(..., description="Total repositories")
    total_stars: int = Field(..., description="Total stars")
    total_forks: int = Field(..., description="Total forks")
    total_issues: int = Field(..., description="Total issues")
    recent_activity: List[GitHubActivity] = Field(..., description="Recent activity")
    top_repositories: List[GitHubRepository] = Field(..., description="Top repositories")
    recent_repositories: List[GitHubRepository] = Field(..., description="Recent repositories")
    languages: Dict[str, int] = Field(..., description="Language distribution")


class TrendingRepositoriesRequest(BaseModel):
    """Trending repositories request."""
    since: str = Field(default="weekly", description="Time period")
    language: Optional[str] = Field(default=None, description="Programming language")
    page: int = Field(default=1, ge=1, description="Page number")
    per_page: int = Field(default=30, ge=1, le=100, description="Items per page")


class RateLimitStatus(BaseModel):
    """GitHub API rate limit status."""
    limit: int = Field(..., description="Rate limit")
    remaining: int = Field(..., description="Remaining requests")
    used: int = Field(..., description="Used requests")
    reset: int = Field(..., description="Reset timestamp")
    reset_date: str = Field(..., description="Reset date")
    is_near_limit: bool = Field(..., description="Near limit flag")
    is_rate_limited: bool = Field(..., description="Rate limited flag")
    resource: str = Field(..., description="Resource type")


class GitHubCacheStats(BaseModel):
    """GitHub cache statistics."""
    hits: int = Field(..., description="Cache hits")
    misses: int = Field(..., description="Cache misses")
    size: int = Field(..., description="Cache size")
    hit_rate: float = Field(..., description="Hit rate percentage")


# Response Models

class RepositoriesResponse(BaseModel):
    """Repositories response."""
    repositories: List[GitHubRepository] = Field(..., description="Repository list")
    pagination: Dict[str, Any] = Field(..., description="Pagination info")


class RepositoryResponse(BaseModel):
    """Single repository response."""
    repository: GitHubRepository = Field(..., description="Repository details")


class BranchesResponse(BaseModel):
    """Branches response."""
    branches: List[GitHubBranch] = Field(..., description="Branch list")
    total: int = Field(..., description="Total branches")


class IssuesResponse(BaseModel):
    """Issues response."""
    issues: List[GitHubIssue] = Field(..., description="Issue list")
    pagination: Dict[str, Any] = Field(..., description="Pagination info")


class PullRequestsResponse(BaseModel):
    """Pull requests response."""
    pull_requests: List[GitHubPullRequest] = Field(..., description="Pull request list", alias="pullRequests")
    pagination: Dict[str, Any] = Field(..., description="Pagination info")


class CommitsResponse(BaseModel):
    """Commits response."""
    commits: List[GitHubCommit] = Field(..., description="Commit list")
    pagination: Dict[str, Any] = Field(..., description="Pagination info")


class ContributorsResponse(BaseModel):
    """Contributors response."""
    contributors: List[GitHubUserProfile] = Field(..., description="Contributor list")
    total: int = Field(..., description="Total contributors")


class LanguagesResponse(BaseModel):
    """Languages response."""
    languages: Dict[str, int] = Field(..., description="Language statistics")


class ActivityResponse(BaseModel):
    """Activity response."""
    activity: List[GitHubActivity] = Field(..., description="Activity list")
    pagination: Dict[str, Any] = Field(..., description="Pagination info")


class TreeResponse(BaseModel):
    """Repository tree response."""
    tree: List[GitHubTreeItem] = Field(..., description="Tree items")


class TreesByBranchResponse(BaseModel):
    """Trees by branch response."""
    trees_by_branch: Dict[str, List[GitHubTreeItem]] = Field(..., description="Trees by branch", alias="treesByBranch")


class BranchesWithTreesResponse(BaseModel):
    """Branches with trees response."""
    branches: List[GitHubBranch] = Field(..., description="Branch list")
    trees_by_branch: Dict[str, List[GitHubTreeItem]] = Field(..., description="Trees by branch", alias="treesByBranch")
    summary: Dict[str, Any] = Field(..., description="Summary statistics")


class FileContentResponse(BaseModel):
    """File content response."""
    content: GitHubFileContent = Field(..., description="File content")


class RateLimitResponse(BaseModel):
    """Rate limit response."""
    rate_limit: RateLimitStatus = Field(..., description="Rate limit status", alias="rateLimit")
    statistics: Dict[str, Any] = Field(..., description="Usage statistics")
    cache: GitHubCacheStats = Field(..., description="Cache statistics")
    recommendations: Dict[str, Any] = Field(..., description="Recommendations")


class CacheResponse(BaseModel):
    """Cache response."""
    message: str = Field(..., description="Operation message")


class HealthResponse(BaseModel):
    """Health check response."""
    status: str = Field(..., description="Health status")
    message: str = Field(..., description="Health message")
    timestamp: str = Field(..., description="Check timestamp")
