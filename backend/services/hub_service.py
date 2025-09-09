
from typing import Dict, Any, List
from models.api.hub_models import HubOverviewResponse, Project, Insight, Analytics
from utils.caching import cache
from utils.github_utils import github_service

class HubService:
    def __init__(self, user: Dict[str, Any]):
        self.user = user

    async def get_overview(self) -> HubOverviewResponse:
        """Get hub overview data."""
        user_id = self.user['id']
        cached_repos = cache.get(f"repos_{user_id}")

        if cached_repos:
            repos = cached_repos
        else:
            repos = await github_service.get_user_repositories()
            cache[f"repos_{user_id}"] = repos

        projects = []
        for repo in repos:
            projects.append(
                Project(
                    id=repo.id,
                    name=repo.name,
                    description=repo.description or "",
                    lastActivity=repo.updated_at.isoformat(),
                    language=repo.language or "",
                )
            )

        # Mock data for insights and analytics
        mock_insights = [
            Insight(id=1, text='Your commit frequency has increased by 15% this week.'),
            Insight(id=2, text='You have 3 open pull requests that need your attention.'),
        ]

        mock_analytics = Analytics(
            totalCommits=128,
            linesOfCode='25.6k',
            activeProjects=len(projects),
        )

        return HubOverviewResponse(
            projects=projects,
            insights=mock_insights,
            analytics=mock_analytics,
        )

    async def get_projects(self) -> List[Project]:
        """Get all projects for the user."""
        user_id = self.user['id']
        cached_repos = cache.get(f"repos_{user_id}")

        if cached_repos:
            repos = cached_repos
        else:
            repos = await github_service.get_user_repositories()
            cache[f"repos_{user_id}"] = repos

        projects = []
        for repo in repos:
            projects.append(
                Project(
                    id=repo.id,
                    name=repo.name,
                    description=repo.description or "",
                    lastActivity=repo.updated_at.isoformat(),
                    language=repo.language or "",
                )
            )
        return projects

    def get_insights(self) -> List[Insight]:
        """Get insights for the user."""
        # Mock data for insights
        mock_insights = [
            Insight(id=1, text='Your commit frequency has increased by 15% this week.'),
            Insight(id=2, text='You have 3 open pull requests that need your attention.'),
        ]
        return mock_insights

    async def get_analytics(self) -> Analytics:
        """Get analytics for the user."""
        # Mock data for analytics
        projects = await self.get_projects()
        mock_analytics = Analytics(
            totalCommits=128,
            linesOfCode='25.6k',
            activeProjects=len(projects),
        )
        return mock_analytics
