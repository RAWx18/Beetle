import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import structlog

from config.settings import get_settings
from utils.github_utils import github_service
from models.api.analytics_models import (
    UserAnalytics, AnalyticsOverview, LanguageDistribution, ActivityTypes,
    TrendMetrics, RepositoryAnalytics, RepositoryInfo, RepositorySummary,
    BranchAnalytics, BranchInfo, IssueAnalytics, PullRequestAnalytics,
    CommitAnalytics, ContributorAnalytics, ActivityMetrics, StateAnalytics,
    BranchSpecificAnalytics, BranchActivityInfo, BranchSummary,
    BranchCommitAnalytics, BranchActivityMetrics, BranchCommitInfo,
    ContributionAnalytics, ContributionSummary, ContributionTimelineItem,
    AIInsights, InsightMetric
)

logger = structlog.get_logger(__name__)
settings = get_settings()

class AnalyticsCache:
    """Simple in-memory cache for analytics data"""
    
    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._cache_ttl = 3600  # 1 hour TTL
    
    def get(self, key: str) -> Optional[Dict[str, Any]]:
        """Get cached analytics data"""
        if key in self._cache:
            cached_data = self._cache[key]
            if cached_data.get('expires_at', 0) > datetime.now().timestamp():
                return cached_data.get('data')
            else:
                # Remove expired data
                del self._cache[key]
        return None
    
    def set(self, key: str, data: Dict[str, Any]) -> None:
        """Cache analytics data"""
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
analytics_cache = AnalyticsCache()

class AnalyticsService:
    """Service for generating analytics data"""
    
    def __init__(self):
        self.cache = analytics_cache
    
    async def get_user_analytics_overview(self, user_id: str) -> UserAnalytics:
        """Generate comprehensive user analytics overview"""
        cache_key = f"user_analytics:{user_id}"
        
        # Check cache first
        cached_data = self.cache.get(cache_key)
        if cached_data:
            return UserAnalytics(**cached_data)
        
        try:
            logger.info("Generating user analytics overview", user_id=user_id)
            
            # Fetch fresh data
            repositories = await github_service.get_user_repositories(page=1, per_page=100)
            activity = await github_service.get_user_activity('user', page=1, per_page=100)
            
            # Calculate analytics
            analytics_data = await self._calculate_user_analytics(repositories, activity)
            
            # Cache the results
            self.cache.set(cache_key, analytics_data.dict())
            
            return analytics_data
            
        except Exception as error:
            logger.error("Error generating user analytics overview", error=str(error), user_id=user_id)
            raise
    
    async def _calculate_user_analytics(
        self, 
        repositories: List[Dict[str, Any]], 
        activity: List[Dict[str, Any]]
    ) -> UserAnalytics:
        """Calculate user analytics from repositories and activity data"""
        
        # Calculate overview metrics
        total_stars = sum(repo.get('stargazers_count', 0) for repo in repositories)
        total_forks = sum(repo.get('forks_count', 0) for repo in repositories)
        total_issues = sum(repo.get('open_issues_count', 0) for repo in repositories)
        
        overview = AnalyticsOverview(
            total_repositories=len(repositories),
            total_stars=total_stars,
            total_forks=total_forks,
            total_issues=total_issues,
            average_stars_per_repo=total_stars / len(repositories) if repositories else 0,
            average_forks_per_repo=total_forks / len(repositories) if repositories else 0
        )
        
        # Language distribution
        language_counts = {}
        for repo in repositories:
            language = repo.get('language')
            if language:
                language_counts[language] = language_counts.get(language, 0) + 1
        
        top_languages = sorted(
            [{'language': lang, 'count': count} for lang, count in language_counts.items()],
            key=lambda x: x['count'],
            reverse=True
        )[:10]
        
        languages = LanguageDistribution(
            distribution=language_counts,
            top_languages=top_languages
        )
        
        # Activity analysis
        activity_types = {}
        for event in activity:
            event_type = event.get('type', 'Unknown')
            activity_types[event_type] = activity_types.get(event_type, 0) + 1
        
        activity_analytics = ActivityTypes(
            total_events=len(activity),
            recent_activity=activity[:20]  # Most recent 20 events
        )
        
        # Repository types
        repo_types = {'forks': 0, 'original': 0, 'private': 0, 'public': 0}
        for repo in repositories:
            if repo.get('fork'):
                repo_types['forks'] += 1
            else:
                repo_types['original'] += 1
            if repo.get('private'):
                repo_types['private'] += 1
            else:
                repo_types['public'] += 1
        
        # Top repositories
        top_repositories = sorted(
            repositories,
            key=lambda x: x.get('stargazers_count', 0),
            reverse=True
        )[:10]
        
        top_repos_data = []
        for repo in top_repositories:
            top_repos_data.append({
                'name': repo.get('name'),
                'full_name': repo.get('full_name'),
                'stars': repo.get('stargazers_count', 0),
                'forks': repo.get('forks_count', 0),
                'language': repo.get('language'),
                'updated_at': repo.get('updated_at')
            })
        
        repositories_data = {
            'types': repo_types,
            'top_repositories': top_repos_data
        }
        
        # Trends
        trends = TrendMetrics(
            recent_commits=len([e for e in activity if e.get('type') == 'PushEvent']),
            recent_prs=len([e for e in activity if e.get('type') == 'PullRequestEvent']),
            recent_issues=len([e for e in activity if e.get('type') == 'IssuesEvent'])
        )
        
        return UserAnalytics(
            overview=overview,
            languages=languages,
            activity=activity_analytics,
            repositories=repositories_data,
            trends=trends,
            last_updated=datetime.now()
        )
    
    async def get_repository_analytics(
        self, 
        owner: str, 
        repo: str
    ) -> RepositoryAnalytics:
        """Generate comprehensive repository analytics"""
        cache_key = f"repo_analytics:{owner}/{repo}"
        
        # Check cache first
        cached_data = self.cache.get(cache_key)
        if cached_data:
            return RepositoryAnalytics(**cached_data)
        
        try:
            logger.info("Generating repository analytics", owner=owner, repo=repo)
            
            # Fetch comprehensive repository data
            tasks = [
                github_service.get_repository_details(owner, repo),
                github_service.get_repository_branches(owner, repo),
                github_service.get_repository_issues(owner, repo, state='all', page=1, per_page=100),
                github_service.get_repository_pull_requests(owner, repo, state='all', page=1, per_page=100),
                github_service.github_service.get_repository_commits(owner, repo, branch='main', page=1, per_page=100),
                github_service.get_repository_contributors(owner, repo),
                github_service.get_repository_languages(owner, repo)
            ]
            
            (details, branches, issues, pull_requests, 
             commits, contributors, languages) = await asyncio.gather(*tasks)
            
            # Calculate repository analytics
            analytics_data = await self._calculate_repository_analytics(
                details, branches, issues, pull_requests, 
                commits, contributors, languages
            )
            
            # Cache the results
            self.cache.set(cache_key, analytics_data.dict())
            
            return analytics_data
            
        except Exception as error:
            logger.error("Error generating repository analytics", error=str(error), owner=owner, repo=repo)
            raise
    
    async def _calculate_repository_analytics(
        self,
        details: Dict[str, Any],
        branches: List[Dict[str, Any]],
        issues: List[Dict[str, Any]],
        pull_requests: List[Dict[str, Any]],
        commits: List[Dict[str, Any]],
        contributors: List[Dict[str, Any]],
        languages: Dict[str, int]
    ) -> RepositoryAnalytics:
        """Calculate repository analytics from fetched data"""
        
        # Repository information
        repository_info = RepositoryInfo(
            name=details.get('name'),
            full_name=details.get('full_name'),
            description=details.get('description'),
            language=details.get('language'),
            stars=details.get('stargazers_count', 0),
            forks=details.get('forks_count', 0),
            watchers=details.get('watchers_count', 0),
            size=details.get('size', 0),
            created_at=datetime.fromisoformat(details.get('created_at').replace('Z', '+00:00')),
            updated_at=datetime.fromisoformat(details.get('updated_at').replace('Z', '+00:00')),
            pushed_at=datetime.fromisoformat(details.get('pushed_at').replace('Z', '+00:00'))
        )
        
        # Summary
        open_issues = [i for i in issues if i.get('state') == 'open']
        closed_issues = [i for i in issues if i.get('state') == 'closed']
        open_prs = [pr for pr in pull_requests if pr.get('state') == 'open']
        merged_prs = [pr for pr in pull_requests if pr.get('merged', False)]
        
        summary = RepositorySummary(
            total_branches=len(branches),
            total_issues=len(issues),
            open_issues=len(open_issues),
            closed_issues=len(closed_issues),
            total_pull_requests=len(pull_requests),
            open_pull_requests=len(open_prs),
            merged_pull_requests=len(merged_prs),
            total_commits=len(commits),
            total_contributors=len(contributors),
            languages=list(languages.keys())
        )
        
        # Branch analytics
        branch_list = []
        protected_count = 0
        for branch in branches:
            if branch.get('protected', False):
                protected_count += 1
            
            branch_list.append(BranchInfo(
                name=branch.get('name'),
                protected=branch.get('protected', False),
                last_commit=branch.get('commit', {})
            ))
        
        branch_analytics = BranchAnalytics(
            total=len(branches),
            protected=protected_count,
            list=branch_list
        )
        
        # Issue analytics
        issue_labels = {}
        for issue in issues:
            for label in issue.get('labels', []):
                label_name = label.get('name')
                if label_name:
                    issue_labels[label_name] = issue_labels.get(label_name, 0) + 1
        
        recent_issues = sorted(
            issues,
            key=lambda x: x.get('updated_at', ''),
            reverse=True
        )[:10]
        
        issue_analytics = IssueAnalytics(
            by_state=StateAnalytics(
                open=len(open_issues),
                closed=len(closed_issues)
            ),
            by_label=issue_labels,
            recent=recent_issues
        )
        
        # Pull request analytics
        pr_labels = {}
        for pr in pull_requests:
            for label in pr.get('labels', []):
                label_name = label.get('name')
                if label_name:
                    pr_labels[label_name] = pr_labels.get(label_name, 0) + 1
        
        recent_prs = sorted(
            pull_requests,
            key=lambda x: x.get('updated_at', ''),
            reverse=True
        )[:10]
        
        closed_prs = [pr for pr in pull_requests if pr.get('state') == 'closed' and not pr.get('merged', False)]
        
        pr_analytics = PullRequestAnalytics(
            by_state=StateAnalytics(
                open=len(open_prs),
                closed=len(closed_prs),
                merged=len(merged_prs)
            ),
            by_label=pr_labels,
            recent=recent_prs
        )
        
        # Commit analytics
        commit_authors = {}
        for commit in commits:
            author = commit.get('author', {}).get('login') or commit.get('commit', {}).get('author', {}).get('name', 'Unknown')
            commit_authors[author] = commit_authors.get(author, 0) + 1
        
        commit_analytics = CommitAnalytics(
            total=len(commits),
            recent=commits[:20],
            by_author=commit_authors
        )
        
        # Contributor analytics
        contributor_contributions = {}
        for contributor in contributors:
            login = contributor.get('login')
            contributions = contributor.get('contributions', 0)
            if login:
                contributor_contributions[login] = contributions
        
        contributor_analytics = ContributorAnalytics(
            total=len(contributors),
            top=contributors[:10],
            contributions=contributor_contributions
        )
        
        # Activity metrics
        created_date = datetime.fromisoformat(details.get('created_at').replace('Z', '+00:00'))
        days_since_creation = max(1, (datetime.now(created_date.tzinfo) - created_date).days)
        
        activity_metrics = ActivityMetrics(
            commits_per_day=len(commits) / days_since_creation,
            issues_per_day=len(issues) / days_since_creation,
            pull_requests_per_day=len(pull_requests) / days_since_creation
        )
        
        return RepositoryAnalytics(
            repository=repository_info,
            summary=summary,
            branches=branch_analytics,
            issues=issue_analytics,
            pull_requests=pr_analytics,
            commits=commit_analytics,
            contributors=contributor_analytics,
            languages=languages,
            activity=activity_metrics
        )
    
    async def get_branch_analytics(
        self, 
        owner: str, 
        repo: str, 
        branch: str
    ) -> BranchSpecificAnalytics:
        """Generate branch-specific analytics"""
        cache_key = f"branch_analytics:{owner}/{repo}/{branch}"
        
        # Check cache first
        cached_data = self.cache.get(cache_key)
        if cached_data:
            return BranchSpecificAnalytics(**cached_data)
        
        try:
            logger.info("Generating branch analytics", owner=owner, repo=repo, branch=branch)
            
            # Fetch branch-specific data
            tasks = [
                github_service.get_repository_branches(owner, repo),
                github_service.get_repository_commits(owner, repo, branch=branch, page=1, per_page=100),
                github_service.get_repository_issues(owner, repo, state='all', page=1, per_page=100),
                get_repository_pull_requests(owner, repo, state='all', page=1, per_page=100)
            ]
            
            branches, commits, issues, pull_requests = await asyncio.gather(*tasks)
            
            # Find the specific branch
            branch_data = next((b for b in branches if b.get('name') == branch), None)
            
            if not branch_data:
                raise ValueError(f"Branch '{branch}' not found in repository {owner}/{repo}")
            
            # Calculate branch analytics
            analytics_data = await self._calculate_branch_analytics(
                branch_data, commits, issues, pull_requests, branch
            )
            
            # Cache the results
            self.cache.set(cache_key, analytics_data.dict())
            
            return analytics_data
            
        except Exception as error:
            logger.error("Error generating branch analytics", error=str(error), owner=owner, repo=repo, branch=branch)
            raise
    
    async def _calculate_branch_analytics(
        self,
        branch_data: Dict[str, Any],
        commits: List[Dict[str, Any]],
        issues: List[Dict[str, Any]],
        pull_requests: List[Dict[str, Any]],
        branch_name: str
    ) -> BranchSpecificAnalytics:
        """Calculate branch-specific analytics"""
        
        # Branch information
        last_commit = branch_data.get('commit', {})
        committer_date = last_commit.get('commit', {}).get('committer', {}).get('date')
        last_activity = datetime.fromisoformat(committer_date.replace('Z', '+00:00')) if committer_date else datetime.now()
        
        branch_info = BranchActivityInfo(
            name=branch_data.get('name'),
            protected=branch_data.get('protected', False),
            last_commit=last_commit,
            last_activity=last_activity
        )
        
        # Filter data related to this branch
        branch_issues = []
        for issue in issues:
            # Check if issue is related to this branch via labels or title
            is_related = any(
                branch_name.lower() in label.get('name', '').lower()
                for label in issue.get('labels', [])
            ) or branch_name.lower() in issue.get('title', '').lower()
            
            if is_related:
                branch_issues.append(issue)
        
        branch_prs = []
        for pr in pull_requests:
            # Check if PR is related to this branch
            head_ref = pr.get('head', {}).get('ref')
            base_ref = pr.get('base', {}).get('ref')
            is_related = (head_ref == branch_name or 
                         base_ref == branch_name or 
                         branch_name.lower() in pr.get('title', '').lower())
            
            if is_related:
                branch_prs.append(pr)
        
        # Summary
        open_issues = [i for i in branch_issues if i.get('state') == 'open']
        open_prs = [pr for pr in branch_prs if pr.get('state') == 'open']
        
        summary = BranchSummary(
            total_commits=len(commits),
            total_issues=len(branch_issues),
            total_pull_requests=len(branch_prs),
            open_issues=len(open_issues),
            open_pull_requests=len(open_prs)
        )
        
        # Commit analytics
        commit_authors = {}
        commit_timeline = []
        
        for commit in commits:
            # Author tracking
            author = commit.get('author', {}).get('login') or commit.get('commit', {}).get('author', {}).get('name', 'Unknown')
            commit_authors[author] = commit_authors.get(author, 0) + 1
            
            # Timeline
            commit_info = BranchCommitInfo(
                sha=commit.get('sha'),
                message=commit.get('commit', {}).get('message', ''),
                author=author,
                date=datetime.fromisoformat(commit.get('commit', {}).get('author', {}).get('date').replace('Z', '+00:00'))
            )
            commit_timeline.append(commit_info)
        
        commit_analytics = BranchCommitAnalytics(
            total=len(commits),
            recent=commits[:20],
            by_author=commit_authors,
            timeline=commit_timeline
        )
        
        # Issue analytics for branch
        issue_labels = {}
        for issue in branch_issues:
            for label in issue.get('labels', []):
                label_name = label.get('name')
                if label_name:
                    issue_labels[label_name] = issue_labels.get(label_name, 0) + 1
        
        recent_issues = sorted(
            branch_issues,
            key=lambda x: x.get('updated_at', ''),
            reverse=True
        )[:10]
        
        closed_issues = [i for i in branch_issues if i.get('state') == 'closed']
        
        issue_analytics = IssueAnalytics(
            by_state=StateAnalytics(
                open=len(open_issues),
                closed=len(closed_issues)
            ),
            by_label=issue_labels,
            recent=recent_issues
        )
        
        # PR analytics for branch
        pr_labels = {}
        for pr in branch_prs:
            for label in pr.get('labels', []):
                label_name = label.get('name')
                if label_name:
                    pr_labels[label_name] = pr_labels.get(label_name, 0) + 1
        
        recent_prs = sorted(
            branch_prs,
            key=lambda x: x.get('updated_at', ''),
            reverse=True
        )[:10]
        
        merged_prs = [pr for pr in branch_prs if pr.get('merged', False)]
        closed_prs = [pr for pr in branch_prs if pr.get('state') == 'closed' and not pr.get('merged', False)]
        
        pr_analytics = PullRequestAnalytics(
            by_state=StateAnalytics(
                open=len(open_prs),
                closed=len(closed_prs),
                merged=len(merged_prs)
            ),
            by_label=pr_labels,
            recent=recent_prs
        )
        
        # Activity metrics
        days_since_last_commit = max(1, (datetime.now(last_activity.tzinfo) - last_activity).days)
        is_active = days_since_last_commit <= 7
        
        activity_metrics = BranchActivityMetrics(
            commits_per_day=len(commits) / days_since_last_commit,
            last_activity=last_activity,
            is_active=is_active
        )
        
        return BranchSpecificAnalytics(
            branch=branch_info,
            summary=summary,
            commits=commit_analytics,
            issues=issue_analytics,
            pull_requests=pr_analytics,
            activity=activity_metrics
        )
    
    async def get_contribution_analytics(
        self, 
        username: str, 
        period: str = 'month'
    ) -> ContributionAnalytics:
        """Generate contribution analytics for a user"""
        cache_key = f"contributions:{username}:{period}"
        
        # Check cache first
        cached_data = self.cache.get(cache_key)
        if cached_data:
            return ContributionAnalytics(**cached_data)
        
        try:
            logger.info("Generating contribution analytics", username=username, period=period)
            
            # Fetch user activity
            activity = await github_service.get_user_activity(username, page=1, per_page=100)
            
            # Filter by period
            filtered_activity = self._filter_activity_by_period(activity, period)
            
            # Calculate contribution analytics
            analytics_data = await self._calculate_contribution_analytics(
                filtered_activity, username, period
            )
            
            # Cache the results
            self.cache.set(cache_key, analytics_data.dict())
            
            return analytics_data
            
        except Exception as error:
            logger.error("Error generating contribution analytics", error=str(error), username=username, period=period)
            raise
    
    def _filter_activity_by_period(self, activity: List[Dict[str, Any]], period: str) -> List[Dict[str, Any]]:
        """Filter activity by time period"""
        if period == 'all':
            return activity
        
        now = datetime.now()
        period_map = {
            'week': 7,
            'month': 30,
            'year': 365
        }
        
        days = period_map.get(period, 30)
        cutoff = now - timedelta(days=days)
        
        filtered = []
        for event in activity:
            created_at = event.get('created_at')
            if created_at:
                event_date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                if event_date.replace(tzinfo=None) >= cutoff:
                    filtered.append(event)
        
        return filtered
    
    async def _calculate_contribution_analytics(
        self,
        activity: List[Dict[str, Any]],
        username: str,
        period: str
    ) -> ContributionAnalytics:
        """Calculate contribution analytics from activity data"""
        
        # Summary
        unique_repos = set()
        for event in activity:
            repo_name = event.get('repo', {}).get('name')
            if repo_name:
                unique_repos.add(repo_name)
        
        summary = ContributionSummary(
            total_events=len(activity),
            unique_repositories=len(unique_repos)
        )
        
        # By type
        by_type = {}
        for event in activity:
            event_type = event.get('type', 'Unknown')
            by_type[event_type] = by_type.get(event_type, 0) + 1
        
        # By repository
        by_repository = {}
        for event in activity:
            repo_name = event.get('repo', {}).get('name')
            if repo_name:
                by_repository[repo_name] = by_repository.get(repo_name, 0) + 1
        
        # Timeline
        timeline = []
        for event in activity:
            timeline_item = ContributionTimelineItem(
                type=event.get('type', 'Unknown'),
                repository=event.get('repo', {}).get('name'),
                date=datetime.fromisoformat(event.get('created_at').replace('Z', '+00:00')),
                actor=event.get('actor', {}).get('login')
            )
            timeline.append(timeline_item)
        
        # Sort timeline by date
        timeline.sort(key=lambda x: x.date)
        
        # Recent activity
        recent_activity = sorted(
            activity,
            key=lambda x: x.get('created_at', ''),
            reverse=True
        )[:20]
        
        return ContributionAnalytics(
            period=period,
            username=username,
            summary=summary,
            by_type=by_type,
            by_repository=by_repository,
            timeline=timeline,
            recent_activity=recent_activity
        )
    
    def get_ai_insights(self) -> AIInsights:
        """Generate static AI insights (as requested)"""
        return AIInsights(
            productivity=InsightMetric(
                score=85,
                trend="increasing",
                recommendations=[
                    "Consider reviewing more pull requests to improve code quality",
                    "Your commit frequency is excellent, keep it up!",
                    "Try to respond to issues within 24 hours"
                ]
            ),
            collaboration=InsightMetric(
                score=78,
                trend="stable",
                recommendations=[
                    "Engage more with community discussions",
                    "Consider mentoring new contributors",
                    "Participate in more code reviews"
                ]
            ),
            code_quality=InsightMetric(
                score=92,
                trend="increasing",
                recommendations=[
                    "Your code review comments are very helpful",
                    "Consider adding more comprehensive tests",
                    "Great job maintaining consistent coding standards"
                ]
            ),
            branch_health=InsightMetric(
                score=88,
                trend="stable",
                recommendations=[
                    "Keep branches up to date with main",
                    "Consider using feature flags for better branch management",
                    "Your branch naming conventions are excellent"
                ]
            )
        )
    
    def clear_cache(self, cache_type: Optional[str] = None):
        """Clear analytics cache"""
        if cache_type:
            self.cache.clear(cache_type)
        else:
            self.cache.clear()

# Global analytics service instance
analytics_service = AnalyticsService()

# Convenience functions
async def get_user_analytics_overview(user_id: str) -> UserAnalytics:
    """Get user analytics overview"""
    return await analytics_service.get_user_analytics_overview(user_id)

async def get_repository_analytics(owner: str, repo: str) -> RepositoryAnalytics:
    """Get repository analytics"""
    return await analytics_service.get_repository_analytics(owner, repo)

async def get_branch_analytics(owner: str, repo: str, branch: str) -> BranchSpecificAnalytics:
    """Get branch analytics"""
    return await analytics_service.get_branch_analytics(owner, repo, branch)

async def get_contribution_analytics(username: str, period: str = 'month') -> ContributionAnalytics:
    """Get contribution analytics"""
    return await analytics_service.get_contribution_analytics(username, period)

def get_ai_insights() -> AIInsights:
    """Get AI insights"""
    return analytics_service.get_ai_insights()

def clear_analytics_cache(cache_type: Optional[str] = None):
    """Clear analytics cache"""
    analytics_service.clear_cache(cache_type)
