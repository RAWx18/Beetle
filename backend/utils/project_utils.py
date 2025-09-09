import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import structlog

from config.settings import get_settings
from utils.github_utils import github_service
from models.api.project_models import (
    Project, ProjectCreate, ProjectListItem, ProjectBranch, ProjectAnalytics,
    RecentActivity, BeetleProjectData, BeetleBranchData, BeetleProjectSummary,
    BeetleInsights, SmartSuggestion, RepositoryImportRequest
)

logger = structlog.get_logger(__name__)
settings = get_settings()

class ProjectCache:
    """Simple in-memory cache for project data"""
    
    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._cache_ttl = 1800  # 30 minutes TTL
    
    def get(self, key: str) -> Optional[Dict[str, Any]]:
        """Get cached project data"""
        if key in self._cache:
            cached_data = self._cache[key]
            if cached_data.get('expires_at', 0) > datetime.now().timestamp():
                return cached_data.get('data')
            else:
                # Remove expired data
                del self._cache[key]
        return None
    
    def set(self, key: str, data: Dict[str, Any]) -> None:
        """Cache project data"""
        self._cache[key] = {
            'data': data,
            'expires_at': datetime.now().timestamp() + self._cache_ttl
        }
    
    def clear(self, pattern: Optional[str] = None) -> None:
        """Clear cache entries matching pattern"""
        if pattern is None:
            self._cache.clear()
        else:
            keys_to_remove = [key for key in self._cache.keys() if pattern in key]
            for key in keys_to_remove:
                del self._cache[key]

# Global cache instance
project_cache = ProjectCache()

class ProjectDatabase:
    """Simple in-memory project database (to be replaced with proper DB)"""
    
    def __init__(self):
        self._projects: Dict[str, Project] = {}
    
    async def save_project(self, project: Project) -> Project:
        """Save project to database"""
        project.updated_at = datetime.now()
        self._projects[project.id] = project
        logger.info("Project saved", project_id=project.id, name=project.name)
        return project
    
    async def get_project(self, project_id: str) -> Optional[Project]:
        """Get project by ID"""
        return self._projects.get(project_id)
    
    async def list_projects(self, created_by: str) -> List[Project]:
        """List projects created by user"""
        return [
            project for project in self._projects.values()
            if project.created_by == created_by
        ]
    
    async def delete_project(self, project_id: str) -> bool:
        """Delete project"""
        if project_id in self._projects:
            del self._projects[project_id]
            logger.info("Project deleted", project_id=project_id)
            return True
        return False

# Global database instance
project_db = ProjectDatabase()

class ProjectService:
    """Service for managing projects"""
    
    def __init__(self):
        self.db = project_db
        self.cache = project_cache
    
    async def list_user_projects(self, user_id: str) -> List[ProjectListItem]:
        """List all projects for a user"""
        try:
            logger.info("Listing user projects", user_id=user_id)
            
            # Get projects from database
            saved_projects = await self.db.list_projects(user_id)
            
            # Get user repositories and convert to projects
            repositories = await github_service.get_user_repositories(page=1, per_page=100)
            
            project_list = []
            
            # Add saved projects
            for project in saved_projects:
                project_list.append(self._project_to_list_item(project))
            
            # Add repositories as potential projects
            saved_project_ids = {p.id for p in saved_projects}
            for repo in repositories:
                repo_id = str(repo.get('id'))
                if repo_id not in saved_project_ids:
                    project_item = self._repository_to_project_item(repo)
                    project_list.append(project_item)
            
            return project_list
            
        except Exception as error:
            logger.error("Error listing user projects", error=str(error), user_id=user_id)
            raise
    
    def _project_to_list_item(self, project: Project) -> ProjectListItem:
        """Convert Project to ProjectListItem"""
        return ProjectListItem(
            id=project.id,
            name=project.name,
            full_name=project.full_name,
            description=project.description,
            language=project.language,
            stars=project.stars,
            forks=project.forks,
            issues=project.issues,
            updated_at=project.updated_at,
            html_url=project.html_url,
            is_beetle_project=project.is_beetle_project,
            analytics=project.analytics
        )
    
    def _repository_to_project_item(self, repo: Dict[str, Any]) -> ProjectListItem:
        """Convert GitHub repository to ProjectListItem"""
        return ProjectListItem(
            id=str(repo.get('id')),
            name=repo.get('name'),
            full_name=repo.get('full_name'),
            description=repo.get('description'),
            language=repo.get('language'),
            stars=repo.get('stargazers_count', 0),
            forks=repo.get('forks_count', 0),
            issues=repo.get('open_issues_count', 0),
            updated_at=datetime.fromisoformat(repo.get('updated_at').replace('Z', '+00:00')),
            html_url=repo.get('html_url'),
            is_beetle_project=self._is_beetle_project(repo),
            analytics=ProjectAnalytics(
                total_commits=0,
                total_prs=0,
                total_issues=repo.get('open_issues_count', 0)
            )
        )
    
    def _is_beetle_project(self, repo: Dict[str, Any]) -> bool:
        """Check if repository is a Beetle project"""
        topics = repo.get('topics', [])
        name = repo.get('name', '').lower()
        return 'beetle' in topics or 'beetle' in name
    
    async def get_project_details(
        self, 
        project_id: str, 
        user_id: str
    ) -> Optional[Project]:
        """Get detailed project information"""
        cache_key = f"project_details:{project_id}"
        
        # Check cache first
        cached_data = self.cache.get(cache_key)
        if cached_data:
            return Project(**cached_data)
        
        try:
            logger.info("Getting project details", project_id=project_id)
            
            # Try to get from database first
            project = await self.db.get_project(project_id)
            
            if not project:
                # Try to fetch from GitHub
                project = await self._fetch_project_from_github(
                    project_id, user_id
                )
                
                if project:
                    # Save to database for future use
                    await self.db.save_project(project)
            
            if project:
                # Cache the result
                self.cache.set(cache_key, project.dict())
            
            return project
            
        except Exception as error:
            logger.error("Error getting project details", error=str(error), project_id=project_id)
            raise
    
    async def _fetch_project_from_github(
        self, 
        project_id: str, 
        user_id: str
    ) -> Optional[Project]:
        """Fetch project data from GitHub"""
        try:
            # Try to parse project_id as owner/repo
            if '/' in project_id:
                owner, repo = project_id.split('/', 1)
            else:
                # Assume it's a numeric ID and we need to find the repo
                # This is simplified - in real implementation you'd have proper ID mapping
                return None
            
            # Fetch repository data
            tasks = [
                github_service.get_repository_details(owner, repo),
                github_service.get_repository_branches(owner, repo),
                github_service.get_repository_issues(owner, repo, state='open', page=1, per_page=50),
                github_service.get_repository_pull_requests(owner, repo, state='open', page=1, per_page=50),
                github_service.get_repository_commits(owner, repo, branch='main', page=1, per_page=50)
            ]
            
            repo_data, branches, issues, pull_requests, commits = await asyncio.gather(*tasks)
            
            # Convert to Project model
            project_branches = [
                ProjectBranch(
                    name=branch.get('name'),
                    protected=branch.get('protected', False),
                    last_commit=branch.get('commit')
                )
                for branch in branches
            ]
            
            analytics = ProjectAnalytics(
                total_commits=len(commits),
                total_prs=len(pull_requests),
                total_issues=len(issues),
                open_issues=len(issues),
                open_pull_requests=len(pull_requests)
            )
            
            recent_activity = RecentActivity(
                commits=commits[:10],
                issues=issues[:10],
                pull_requests=pull_requests[:10]
            )
            
            project = Project(
                id=project_id,
                name=repo_data.get('name'),
                full_name=repo_data.get('full_name'),
                description=repo_data.get('description'),
                repository_url=repo_data.get('html_url'),
                language=repo_data.get('language'),
                stars=repo_data.get('stargazers_count', 0),
                forks=repo_data.get('forks_count', 0),
                issues=repo_data.get('open_issues_count', 0),
                html_url=repo_data.get('html_url'),
                branches=project_branches,
                created_by=user_id,
                is_beetle_project=self._is_beetle_project(repo_data),
                analytics=analytics,
                recent_activity=recent_activity
            )
            
            return project
            
        except Exception as error:
            logger.error("Error fetching project from GitHub", error=str(error), project_id=project_id)
            return None
    
    async def create_project(self, project_data: ProjectCreate, user_id: str) -> Project:
        """Create a new project"""
        try:
            logger.info("Creating new project", name=project_data.name, user_id=user_id)
            
            project = Project(
                name=project_data.name,
                description=project_data.description,
                repository_url=project_data.repository_url,
                branches=[
                    ProjectBranch(name=branch_name) 
                    for branch_name in project_data.branches
                ],
                settings=project_data.settings,
                created_by=user_id,
                is_beetle_project=True
            )
            
            # Save to database
            saved_project = await self.db.save_project(project)
            
            return saved_project
            
        except Exception as error:
            logger.error("Error creating project", error=str(error), name=project_data.name)
            raise
    
    async def update_project(
        self, 
        project_id: str, 
        updates: Dict[str, Any], 
        user_id: str
    ) -> Optional[Project]:
        """Update an existing project"""
        try:
            logger.info("Updating project", project_id=project_id, user_id=user_id)
            
            project = await self.db.get_project(project_id)
            
            if not project:
                return None
            
            # Apply updates
            for key, value in updates.items():
                if hasattr(project, key):
                    setattr(project, key, value)
            
            # Handle special fields
            if 'branches' in updates:
                project.branches = [
                    ProjectBranch(name=branch_name) 
                    for branch_name in updates['branches']
                ]
            
            project.updated_at = datetime.now()
            
            # Save updated project
            updated_project = await self.db.save_project(project)
            
            # Clear cache
            self.cache.clear(f"project_details:{project_id}")
            
            return updated_project
            
        except Exception as error:
            logger.error("Error updating project", error=str(error), project_id=project_id)
            raise
    
    async def get_project_branches(
        self, 
        project_id: str
    ) -> List[ProjectBranch]:
        """Get project branches"""
        try:
            logger.info("Getting project branches", project_id=project_id)
            
            project = await self.db.get_project(project_id)
            
            if project and project.repository_url:
                # Fetch fresh branches from GitHub
                try:
                    url_parts = str(project.repository_url).split('/')
                    owner = url_parts[-2]
                    repo = url_parts[-1]
                    
                    branches = await github_service.get_repository_branches(owner, repo)
                    
                    return [
                        ProjectBranch(
                            name=branch.get('name'),
                            protected=branch.get('protected', False),
                            last_commit=branch.get('commit')
                        )
                        for branch in branches
                    ]
                except Exception:
                    # Fall back to saved branches
                    pass
            
            return project.branches if project else []
            
        except Exception as error:
            logger.error("Error getting project branches", error=str(error), project_id=project_id)
            raise
    
    async def get_project_analytics(
        self, 
        project_id: str
    ) -> Dict[str, Any]:
        """Get project analytics"""
        try:
            logger.info("Getting project analytics", project_id=project_id)
            
            project = await self.db.get_project(project_id)
            
            if project and project.repository_url:
                # Fetch fresh analytics from GitHub
                try:
                    url_parts = str(project.repository_url).split('/')
                    owner = url_parts[-2]
                    repo = url_parts[-1]
                    
                    tasks = [
                        github_service.get_repository_issues(owner, repo, state='all', page=1, per_page=100),
                        github_service.get_repository_pull_requests(owner, repo, state='all', page=1, per_page=100),
                        github_service.get_repository_commits(owner, repo, branch='main', page=1, per_page=100)
                    ]
                    
                    issues, pull_requests, commits = await asyncio.gather(*tasks)
                    
                    analytics = ProjectAnalytics(
                        total_commits=len(commits),
                        total_prs=len(pull_requests),
                        total_issues=len(issues),
                        open_issues=len([i for i in issues if i.get('state') == 'open']),
                        open_pull_requests=len([pr for pr in pull_requests if pr.get('state') == 'open'])
                    )
                    
                    recent_activity = RecentActivity(
                        commits=commits[:10],
                        issues=issues[:10],
                        pull_requests=pull_requests[:10]
                    )
                    
                    return {
                        "analytics": analytics,
                        "recent_activity": recent_activity
                    }
                    
                except Exception:
                    # Fall back to saved analytics
                    pass
            
            return {
                "analytics": project.analytics if project else ProjectAnalytics(),
                "recent_activity": project.recent_activity if project else None
            }
            
        except Exception as error:
            logger.error("Error getting project analytics", error=str(error), project_id=project_id)
            raise
    
    async def import_repository(
        self, 
        import_request: RepositoryImportRequest, 
        user_id: str
    ) -> Project:
        """Import repository as Beetle project"""
        try:
            logger.info("Importing repository", repository_url=str(import_request.repository_url), user_id=user_id)
            
            # Extract owner and repo from URL
            url_parts = str(import_request.repository_url).split('/')
            owner = url_parts[-2]
            repo = url_parts[-1]
            
            # Fetch repository data
            tasks = [
                github_service.get_repository_details(owner, repo),
                github_service.get_repository_branches(owner, repo),
                github_service.get_repository_issues(owner, repo, state='open', page=1, per_page=50),
                github_service.get_repository_pull_requests(owner, repo, state='open', page=1, per_page=50),
                github_service.get_repository_commits(owner, repo, branch='main', page=1, per_page=50)
            ]
            
            repo_data, branches, issues, pull_requests, commits = await asyncio.gather(*tasks)
            
            project_id = f"{owner}/{repo}"
            
            # Create project from repository data
            project_branches = []
            target_branches = import_request.branches if import_request.branches else [b.get('name') for b in branches]
            
            for branch in branches:
                if branch.get('name') in target_branches:
                    project_branches.append(ProjectBranch(
                        name=branch.get('name'),
                        protected=branch.get('protected', False),
                        last_commit=branch.get('commit')
                    ))
            
            analytics = ProjectAnalytics(
                total_commits=len(commits),
                total_prs=len(pull_requests),
                total_issues=len(issues),
                open_issues=len(issues),
                open_pull_requests=len(pull_requests)
            )
            
            recent_activity = RecentActivity(
                commits=commits[:10],
                issues=issues[:10],
                pull_requests=pull_requests[:10]
            )
            
            project = Project(
                id=project_id,
                name=repo_data.get('name'),
                full_name=repo_data.get('full_name'),
                description=repo_data.get('description'),
                repository_url=import_request.repository_url,
                language=repo_data.get('language'),
                stars=repo_data.get('stargazers_count', 0),
                forks=repo_data.get('forks_count', 0),
                issues=repo_data.get('open_issues_count', 0),
                html_url=repo_data.get('html_url'),
                branches=project_branches,
                settings=import_request.settings,
                created_by=user_id,
                is_beetle_project=True,
                analytics=analytics,
                recent_activity=recent_activity
            )
            
            # Save imported project
            saved_project = await self.db.save_project(project)
            
            return saved_project
            
        except Exception as error:
            logger.error("Error importing repository", error=str(error), repository_url=str(import_request.repository_url))
            raise
    
    async def get_beetle_project_data(
        self, 
        project_id: str
    ) -> Optional[BeetleProjectData]:
        """Get Beetle-specific project data"""
        cache_key = f"beetle_project:{project_id}"
        
        # Check cache first
        cached_data = self.cache.get(cache_key)
        if cached_data:
            return BeetleProjectData(**cached_data)
        
        try:
            logger.info("Getting Beetle project data", project_id=project_id)
            
            project = await self.db.get_project(project_id)
            
            if not project or not project.repository_url:
                return None
            
            # Fetch comprehensive data for Beetle analysis
            url_parts = str(project.repository_url).split('/')
            owner = url_parts[-2]
            repo = url_parts[-1]
            
            # Fetch all branches and their data
            branches = await github_service.get_repository_branches(owner, repo)
            issues = await github_service.get_repository_issues(owner, repo, state='all', page=1, per_page=100)
            pull_requests = await github_service.get_repository_pull_requests(owner, repo, state='all', page=1, per_page=100)
            
            # Create branch data with commits for each branch
            branch_data = []
            total_commits = 0
            
            for branch in branches:
                branch_commits = await github_service.get_repository_commits(
                    owner, repo, branch=branch.get('name'), page=1, per_page=100
                )
                
                # Filter issues and PRs for this branch
                branch_issues = [
                    issue for issue in issues
                    if any(branch.get('name').lower() in label.get('name', '').lower() 
                          for label in issue.get('labels', [])) or
                       branch.get('name').lower() in issue.get('title', '').lower()
                ]
                
                branch_prs = [
                    pr for pr in pull_requests
                    if pr.get('head', {}).get('ref') == branch.get('name') or
                       pr.get('base', {}).get('ref') == branch.get('name')
                ]
                
                branch_data.append(BeetleBranchData(
                    name=branch.get('name'),
                    protected=branch.get('protected', False),
                    last_commit=branch.get('commit', {}),
                    issues=branch_issues,
                    pull_requests=branch_prs,
                    commits=branch_commits
                ))
                
                total_commits += len(branch_commits)
            
            # Calculate summary
            active_branches = 0
            for branch in branches:
                last_commit_date = branch.get('commit', {}).get('commit', {}).get('committer', {}).get('date')
                if last_commit_date:
                    commit_date = datetime.fromisoformat(last_commit_date.replace('Z', '+00:00'))
                    if (datetime.now(commit_date.tzinfo) - commit_date).days <= 30:
                        active_branches += 1
            
            summary = BeetleProjectSummary(
                total_branches=len(branches),
                total_issues=len(issues),
                total_pull_requests=len(pull_requests),
                total_commits=total_commits,
                active_branches=active_branches
            )
            
            # Generate AI insights
            insights = self._generate_beetle_insights()
            
            # Convert project to list item for response
            project_item = self._project_to_list_item(project)
            
            beetle_data = BeetleProjectData(
                project=project_item,
                branches=branch_data,
                summary=summary,
                insights=insights
            )
            
            # Cache the result
            self.cache.set(cache_key, beetle_data.dict())
            
            return beetle_data
            
        except Exception as error:
            logger.error("Error getting Beetle project data", error=str(error), project_id=project_id)
            raise
    
    def _generate_beetle_insights(self) -> BeetleInsights:
        """Generate static Beetle insights"""
        return BeetleInsights(
            productivity={
                "score": 85,
                "trend": "increasing",
                "recommendations": [
                    "Consider reviewing more pull requests to improve code quality",
                    "Your commit frequency is excellent, keep it up!",
                    "Try to respond to issues within 24 hours"
                ]
            },
            collaboration={
                "score": 78,
                "trend": "stable",
                "recommendations": [
                    "Engage more with community discussions",
                    "Consider mentoring new contributors",
                    "Participate in more code reviews"
                ]
            },
            code_quality={
                "score": 92,
                "trend": "increasing",
                "recommendations": [
                    "Your code review comments are very helpful",
                    "Consider adding more comprehensive tests",
                    "Great job maintaining consistent coding standards"
                ]
            },
            branch_health={
                "score": 88,
                "trend": "stable",
                "recommendations": [
                    "Keep branches up to date with main",
                    "Consider using feature flags for better branch management",
                    "Your branch naming conventions are excellent"
                ]
            }
        )
    
    async def get_smart_suggestions(
        self, 
        project_id: str, 
        branch: str
    ) -> List[SmartSuggestion]:
        """Generate smart suggestions for a project branch"""
        try:
            logger.info("Generating smart suggestions", project_id=project_id, branch=branch)
            
            project = await self.db.get_project(project_id)
            
            if not project or not project.repository_url:
                return []
            
            url_parts = str(project.repository_url).split('/')
            owner = url_parts[-2]
            repo = url_parts[-1]
            
            # Fetch data for analysis
            tasks = [
                github_service.get_repository_branches(owner, repo),
                github_service.get_repository_issues(owner, repo, state='all', page=1, per_page=100),
                github_service.get_repository_pull_requests(owner, repo, state='all', page=1, per_page=100),
                github_service.get_repository_commits(owner, repo, branch=branch, page=1, per_page=100)
            ]
            
            branches, issues, pull_requests, commits = await asyncio.gather(*tasks)
            
            # Generate suggestions based on analysis
            suggestions = []
            suggestion_id = 1
            
            # Filter PRs and issues for this branch
            branch_prs = [pr for pr in pull_requests if pr.get('head', {}).get('ref') == branch or pr.get('base', {}).get('ref') == branch]
            branch_issues = [
                issue for issue in issues
                if any(branch.lower() in label.get('name', '').lower() for label in issue.get('labels', [])) or
                   branch.lower() in issue.get('title', '').lower()
            ]
            
            # Suggestion 1: Stale PRs
            now = datetime.now()
            stale_prs = []
            for pr in branch_prs:
                if pr.get('state') == 'open':
                    created_at = datetime.fromisoformat(pr.get('created_at').replace('Z', '+00:00'))
                    days_open = (now.replace(tzinfo=created_at.tzinfo) - created_at).days
                    if days_open > 7 and not pr.get('requested_reviewers'):
                        stale_prs.append(pr)
            
            if stale_prs:
                suggestions.append(SmartSuggestion(
                    id=suggestion_id,
                    type="optimization",
                    title="Merge stale PRs",
                    description=f"You have {len(stale_prs)} PR(s) open for over a week with no reviewers. Consider merging or closing them.",
                    priority="medium",
                    action="Review PRs"
                ))
                suggestion_id += 1
            
            # Suggestion 2: PRs with no reviewers
            no_reviewer_prs = [pr for pr in branch_prs if pr.get('state') == 'open' and not pr.get('requested_reviewers')]
            
            if no_reviewer_prs:
                suggestions.append(SmartSuggestion(
                    id=suggestion_id,
                    type="collaboration",
                    title="Assign reviewers",
                    description=f"{len(no_reviewer_prs)} PR(s) are missing reviewers. Auto-assign based on code ownership?",
                    priority="high",
                    action="Auto-assign"
                ))
                suggestion_id += 1
            
            # Suggestion 3: Potential conflicts
            open_prs = [pr for pr in branch_prs if pr.get('state') == 'open']
            if len(open_prs) > 1:
                suggestions.append(SmartSuggestion(
                    id=suggestion_id,
                    type="warning",
                    title="Potential conflicts",
                    description="Multiple PRs are open for this branch. Review for possible conflicts.",
                    priority="high",
                    action="Check Conflicts"
                ))
                suggestion_id += 1
            
            # Suggestion 4: Many bug issues
            bug_issues = [
                issue for issue in branch_issues
                if any(label.get('name') == 'bug' for label in issue.get('labels', []))
            ]
            
            if len(bug_issues) > 3:
                suggestions.append(SmartSuggestion(
                    id=suggestion_id,
                    type="insight",
                    title="Create issue template",
                    description="Many bug issues detected. Consider creating a bug report template.",
                    priority="low",
                    action="Create Template"
                ))
                suggestion_id += 1
            
            return suggestions
            
        except Exception as error:
            logger.error("Error generating smart suggestions", error=str(error), project_id=project_id, branch=branch)
            return []

# Global project service instance
project_service = ProjectService()

# Convenience functions
async def list_user_projects(user_id: str) -> List[ProjectListItem]:
    """List user projects"""
    return await project_service.list_user_projects(user_id)

async def get_project_details(project_id: str, user_id: str) -> Optional[Project]:
    """Get project details"""
    return await project_service.get_project_details(project_id, user_id)

async def create_project(project_data: ProjectCreate, user_id: str) -> Project:
    """Create project"""
    return await project_service.create_project(project_data, user_id)

async def update_project(project_id: str, updates: Dict[str, Any], user_id: str) -> Optional[Project]:
    """Update project"""
    return await project_service.update_project(project_id, updates, user_id)

async def get_project_branches(project_id: str) -> List[ProjectBranch]:
    """Get project branches"""
    return await project_service.get_project_branches(project_id)

async def get_project_analytics(project_id: str) -> Dict[str, Any]:
    """Get project analytics"""
    return await project_service.get_project_analytics(project_id)

async def import_repository(import_request: RepositoryImportRequest, user_id: str) -> Project:
    """Import repository"""
    return await project_service.import_repository(import_request, user_id)

async def get_beetle_project_data(project_id: str) -> Optional[BeetleProjectData]:
    """Get Beetle project data"""
    return await project_service.get_beetle_project_data(project_id)

async def get_smart_suggestions(project_id: str, branch: str) -> List[SmartSuggestion]:
    """Get smart suggestions"""
    return await project_service.get_smart_suggestions(project_id, branch)
