import asyncio
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
import structlog

from utils.github_utils import github_service
from models.api.aggregated_models import (
    AggregatedPullRequest, AggregatedIssue, RepositoryReference,
    ActivitySummary
)

logger = structlog.get_logger(__name__)

class AggregatedDataService:
    """Service for aggregating data across multiple repositories"""
    
    def __init__(self, token: Optional[str] = None):
        self.max_concurrent_requests = 5  # Limit concurrent GitHub API requests
        self.github_service = github_service
        self.token = token
    
    async def get_aggregated_pull_requests(
        self, 
        limit: int = 10, 
        state: str = 'all'
    ) -> Tuple[List[AggregatedPullRequest], Dict[str, Any]]:
        """
        Get aggregated pull requests from user's repositories
        
        Args:
            limit: Number of repositories to check
            state: PR state filter (open, closed, all)
            
        Returns:
            Tuple of (aggregated PRs, summary info)
        """
        try:
            logger.info("Fetching aggregated pull requests", limit=limit, state=state)
            
            # Get user's repositories
            repositories = await self.github_service.get_user_repositories(token=self.token, page=1, per_page=limit)
            
            # Fetch pull requests from repositories concurrently
            semaphore = asyncio.Semaphore(self.max_concurrent_requests)
            tasks = []
            
            for repo in repositories:
                task = self._fetch_repository_prs_with_context(
                    semaphore, repo, state
                )
                tasks.append(task)
            
            # Wait for all tasks to complete
            pr_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Aggregate results
            all_pull_requests = []
            failed_repositories = []
            
            for i, result in enumerate(pr_results):
                if isinstance(result, Exception):
                    repo_name = repositories[i].get('full_name', 'unknown')
                    failed_repositories.append(repo_name)
                    logger.warning(
                        "Failed to fetch PRs for repository",
                        repository=repo_name,
                        error=str(result)
                    )
                else:
                    all_pull_requests.extend(result)
            
            # Sort by updated date (most recent first)
            all_pull_requests.sort(key=lambda pr: pr.updated_at, reverse=True)
            
            # Generate summary
            summary = {
                "repositories_checked": len(repositories),
                "repositories_failed": len(failed_repositories),
                "failed_repositories": failed_repositories,
                "state_counts": self._calculate_pr_state_counts(all_pull_requests),
                "repository_counts": self._calculate_pr_repository_counts(all_pull_requests)
            }
            
            return all_pull_requests, summary
            
        except Exception as error:
            logger.error("Error fetching aggregated pull requests", error=str(error))
            raise
    
    async def _fetch_repository_prs_with_context(
        self, 
        semaphore: asyncio.Semaphore,
        repository: Dict[str, Any], 
        state: str
    ) -> List[AggregatedPullRequest]:
        """Fetch PRs for a single repository with context"""
        async with semaphore:
            try:
                owner = repository['owner']['login']
                repo_name = repository['name']
                
                # Fetch pull requests
                prs = await self.github_service.get_repository_pull_requests(
                    owner, repo_name, state, page=1, per_page=20, token=self.token
                )
                
                # Create repository reference
                repo_ref = RepositoryReference(
                    name=repository['name'],
                    full_name=repository['full_name'],
                    owner=repository['owner']
                )
                
                # Convert to aggregated format
                aggregated_prs = []
                for pr in prs:
                    try:
                        aggregated_pr = AggregatedPullRequest(
                            id=pr['id'],
                            number=pr['number'],
                            title=pr['title'],
                            body=pr.get('body'),
                            state=pr['state'],
                            draft=pr.get('draft', False),
                            merged=pr.get('merged', False),
                            mergeable=pr.get('mergeable'),
                            mergeable_state=pr.get('mergeable_state'),
                            html_url=pr['html_url'],
                            created_at=datetime.fromisoformat(pr['created_at'].replace('Z', '+00:00')),
                            updated_at=datetime.fromisoformat(pr['updated_at'].replace('Z', '+00:00')),
                            closed_at=datetime.fromisoformat(pr['closed_at'].replace('Z', '+00:00')) if pr.get('closed_at') else None,
                            merged_at=datetime.fromisoformat(pr['merged_at'].replace('Z', '+00:00')) if pr.get('merged_at') else None,
                            user=pr['user'],
                            assignees=pr.get('assignees', []),
                            requested_reviewers=pr.get('requested_reviewers', []),
                            head=pr['head'],
                            base=pr['base'],
                            labels=pr.get('labels', []),
                            milestone=pr.get('milestone'),
                            repository=repo_ref,
                            repository_url=repository['html_url']
                        )
                        aggregated_prs.append(aggregated_pr)
                    except Exception as pr_error:
                        logger.warning(
                            "Error processing PR",
                            repository=repository['full_name'],
                            pr_number=pr.get('number'),
                            error=str(pr_error)
                        )
                
                return aggregated_prs
                
            except Exception as error:
                logger.error(
                    "Error fetching PRs for repository",
                    repository=repository.get('full_name'),
                    error=str(error)
                )
                raise
    
    def _calculate_pr_state_counts(self, prs: List[AggregatedPullRequest]) -> Dict[str, int]:
        """Calculate PR state distribution"""
        counts = {"open": 0, "closed": 0, "merged": 0}
        
        for pr in prs:
            if pr.merged:
                counts["merged"] += 1
            elif pr.state == "open":
                counts["open"] += 1
            else:
                counts["closed"] += 1
        
        return counts
    
    def _calculate_pr_repository_counts(self, prs: List[AggregatedPullRequest]) -> Dict[str, int]:
        """Calculate PR count per repository"""
        counts = {}
        
        for pr in prs:
            repo_name = pr.repository.full_name
            counts[repo_name] = counts.get(repo_name, 0) + 1
        
        return counts
    
    async def get_aggregated_issues(
        self, 
        limit: int = 10, 
        state: str = 'all'
    ) -> Tuple[List[AggregatedIssue], Dict[str, Any]]:
        """
        Get aggregated issues from user's repositories
        
        Args:
            limit: Number of repositories to check
            state: Issue state filter (open, closed, all)
            
        Returns:
            Tuple of (aggregated issues, summary info)
        """
        try:
            logger.info("Fetching aggregated issues", limit=limit, state=state)
            
            # Get user's repositories
            repositories = await self.github_service.get_user_repositories(token=self.token, page=1, per_page=limit)
            
            # Fetch issues from repositories concurrently
            semaphore = asyncio.Semaphore(self.max_concurrent_requests)
            tasks = []
            
            for repo in repositories:
                task = self._fetch_repository_issues_with_context(
                    semaphore, repo, state
                )
                tasks.append(task)
            
            # Wait for all tasks to complete
            issue_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Aggregate results
            all_issues = []
            failed_repositories = []
            
            for i, result in enumerate(issue_results):
                if isinstance(result, Exception):
                    repo_name = repositories[i].get('full_name', 'unknown')
                    failed_repositories.append(repo_name)
                    logger.warning(
                        "Failed to fetch issues for repository",
                        repository=repo_name,
                        error=str(result)
                    )
                else:
                    all_issues.extend(result)
            
            # Sort by updated date (most recent first)
            all_issues.sort(key=lambda issue: issue.updated_at, reverse=True)
            
            # Generate summary
            summary = {
                "repositories_checked": len(repositories),
                "repositories_failed": len(failed_repositories),
                "failed_repositories": failed_repositories,
                "state_counts": self._calculate_issue_state_counts(all_issues),
                "repository_counts": self._calculate_issue_repository_counts(all_issues)
            }
            
            return all_issues, summary
            
        except Exception as error:
            logger.error("Error fetching aggregated issues", error=str(error))
            raise
    
    async def _fetch_repository_issues_with_context(
        self, 
        semaphore: asyncio.Semaphore,
        repository: Dict[str, Any], 
        state: str
    ) -> List[AggregatedIssue]:
        """Fetch issues for a single repository with context"""
        async with semaphore:
            try:
                owner = repository['owner']['login']
                repo_name = repository['name']
                
                # Fetch issues
                issues = await self.github_service.get_repository_issues(
                    owner, repo_name, state, page=1, per_page=20, token=self.token
                )
                
                # Create repository reference
                repo_ref = RepositoryReference(
                    name=repository['name'],
                    full_name=repository['full_name'],
                    owner=repository['owner']
                )
                
                # Convert to aggregated format
                aggregated_issues = []
                for issue in issues:
                    try:
                        aggregated_issue = AggregatedIssue(
                            id=issue['id'],
                            number=issue['number'],
                            title=issue['title'],
                            body=issue.get('body'),
                            state=issue['state'],
                            locked=issue.get('locked', False),
                            html_url=issue['html_url'],
                            created_at=datetime.fromisoformat(issue['created_at'].replace('Z', '+00:00')),
                            updated_at=datetime.fromisoformat(issue['updated_at'].replace('Z', '+00:00')),
                            closed_at=datetime.fromisoformat(issue['closed_at'].replace('Z', '+00:00')) if issue.get('closed_at') else None,
                            user=issue['user'],
                            assignees=issue.get('assignees', []),
                            labels=issue.get('labels', []),
                            milestone=issue.get('milestone'),
                            repository=repo_ref,
                            repository_url=repository['html_url']
                        )
                        aggregated_issues.append(aggregated_issue)
                    except Exception as issue_error:
                        logger.warning(
                            "Error processing issue",
                            repository=repository['full_name'],
                            issue_number=issue.get('number'),
                            error=str(issue_error)
                        )
                
                return aggregated_issues
                
            except Exception as error:
                logger.error(
                    "Error fetching issues for repository",
                    repository=repository.get('full_name'),
                    error=str(error)
                )
                raise
    
    def _calculate_issue_state_counts(self, issues: List[AggregatedIssue]) -> Dict[str, int]:
        """Calculate issue state distribution"""
        counts = {"open": 0, "closed": 0}
        
        for issue in issues:
            counts[issue.state] = counts.get(issue.state, 0) + 1
        
        return counts
    
    def _calculate_issue_repository_counts(self, issues: List[AggregatedIssue]) -> Dict[str, int]:
        """Calculate issue count per repository"""
        counts = {}
        
        for issue in issues:
            repo_name = issue.repository.full_name
            counts[repo_name] = counts.get(repo_name, 0) + 1
        
        return counts
    
    async def get_activity_summary(
        self, 
        limit: int = 10
    ) -> ActivitySummary:
        """
        Get aggregated activity summary
        
        Args:
            limit: Number of repositories to analyze
            
        Returns:
            Activity summary across repositories
        """
        try:
            logger.info("Generating activity summary", limit=limit)
            
            # Get user's repositories
            result = await self.github_service.get_user_repositories(token=self.token, page=1, per_page=limit)
            repositories = result[0] if isinstance(result, tuple) else result
            
            # Initialize summary
            summary_data = {
                "repositories": len(repositories),
                "total_stars": 0,
                "total_forks": 0,
                "open_prs": 0,
                "open_issues": 0,
                "languages": {},
                "recent_activity": []
            }
            
            # Aggregate basic statistics
            for repo in repositories:
                summary_data["total_stars"] += repo.get('stargazers_count', 0)
                summary_data["total_forks"] += repo.get('forks_count', 0)
                
                # Track languages
                language = repo.get('language')
                if language:
                    summary_data["languages"][language] = summary_data["languages"].get(language, 0) + 1
            
            # Fetch open PRs and issues count (limited to avoid rate limits)
            semaphore = asyncio.Semaphore(self.max_concurrent_requests)
            count_tasks = []
            
            for repo in repositories[:min(5, len(repositories))]:  # Limit to first 5 repos
                task = self._fetch_repository_counts(semaphore, repo)
                count_tasks.append(task)
            
            count_results = await asyncio.gather(*count_tasks, return_exceptions=True)
            
            for result in count_results:
                if not isinstance(result, Exception):
                    open_prs, open_issues = result
                    summary_data["open_prs"] += open_prs
                    summary_data["open_issues"] += open_issues
            
            # Add recent repository activity
            recent_repos = sorted(
                repositories,
                key=lambda r: r.get('updated_at', ''),
                reverse=True
            )[:5]
            
            for repo in recent_repos:
                summary_data["recent_activity"].append({
                    "type": "repository_update",
                    "repository": repo['full_name'],
                    "updated_at": repo.get('updated_at'),
                    "language": repo.get('language'),
                    "stars": repo.get('stargazers_count', 0)
                })
            
            return ActivitySummary(**summary_data)
            
        except Exception as error:
            logger.error("Error generating activity summary", error=str(error))
            raise
    
    async def _fetch_repository_counts(
        self, 
        semaphore: asyncio.Semaphore,
        repository: Dict[str, Any]
    ) -> Tuple[int, int]:
        """Fetch open PR and issue counts for a repository"""
        async with semaphore:
            try:
                owner = repository['owner']['login']
                repo_name = repository['name']
                
                # Fetch minimal data to get counts
                tasks = [
                    self.github_service.get_repository_pull_requests(owner, repo_name, 'open', 1, 1, token=self.token),
                    self.github_service.get_repository_issues(owner, repo_name, 'open', 1, 1, token=self.token)
                ]
                
                prs, issues = await asyncio.gather(*tasks)
                
                return len(prs), len(issues)
                
            except Exception as error:
                logger.warning(
                    "Error fetching counts for repository",
                    repository=repository.get('full_name'),
                    error=str(error)
                )
                return 0, 0

# Global service instance
aggregated_service = AggregatedDataService()

# Convenience functions
async def get_aggregated_pull_requests(token: Optional[str] = None, limit: int = 10, state: str = 'all') -> Tuple[List[AggregatedPullRequest], Dict[str, Any]]:
    """Get aggregated pull requests"""
    service = AggregatedDataService(token)
    return await service.get_aggregated_pull_requests(limit, state)

async def get_aggregated_issues(token: Optional[str] = None, limit: int = 10, state: str = 'all') -> Tuple[List[AggregatedIssue], Dict[str, Any]]:
    """Get aggregated issues"""
    service = AggregatedDataService(token)
    return await service.get_aggregated_issues(limit, state)

async def get_activity_summary(token: Optional[str] = None, limit: int = 10) -> ActivitySummary:
    """Get activity summary"""
    service = AggregatedDataService(token)
    return await service.get_activity_summary(limit)
