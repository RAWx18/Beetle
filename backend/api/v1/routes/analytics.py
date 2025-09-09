from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
import structlog

from services.analytics_service import AnalyticsService
from .auth import get_current_user, require_auth
from utils.analytics_utils import (
    get_user_analytics_overview, get_repository_analytics, 
    get_branch_analytics, get_contribution_analytics, get_ai_insights,
    clear_analytics_cache
)
from models.api.analytics_models import (
    UserAnalyticsResponse, RepositoryAnalyticsResponse, 
    BranchAnalyticsResponse, ContributionAnalyticsResponse, 
    AIInsightsResponse
)
from models.api.auth_models import User

logger = structlog.get_logger(__name__)
router = APIRouter()

@router.get("/overview", response_model=UserAnalyticsResponse)
async def get_user_analytics_overview_route(
    current_user: User = Depends(get_current_user)
):
    """
    Get comprehensive user analytics overview
    
    Returns:
    - Repository statistics (stars, forks, issues)
    - Language distribution
    - Activity analysis
    - Repository types breakdown
    - Recent trends and activity
    """
    try:
        analytics = await get_user_analytics_overview(
            current_user.access_token, 
            current_user.id
        )
        
        return UserAnalyticsResponse(analytics=analytics)
        
    except Exception as error:
        logger.error(
            "Error generating analytics overview", 
            error=str(error), 
            user_id=current_user.id
        )
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to generate analytics overview",
                "message": str(error)
            }
        )

@router.get("/repositories/{owner}/{repo}", response_model=RepositoryAnalyticsResponse)
async def get_repository_analytics_route(
    owner: str,
    repo: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get comprehensive repository analytics
    
    Returns:
    - Repository information and statistics
    - Branch analysis
    - Issue and pull request analytics
    - Commit and contributor analysis
    - Language distribution
    - Activity metrics
    """
    try:
        analytics = await get_repository_analytics(
            current_user.access_token, 
            owner, 
            repo
        )
        
        return RepositoryAnalyticsResponse(analytics=analytics)
        
    except Exception as error:
        logger.error(
            "Error generating repository analytics", 
            error=str(error), 
            owner=owner, 
            repo=repo,
            user_id=current_user.id
        )
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to generate repository analytics",
                "message": str(error)
            }
        )

@router.get("/repositories/{owner}/{repo}/branches/{branch}", response_model=BranchAnalyticsResponse)
async def get_branch_analytics_route(
    owner: str,
    repo: str,
    branch: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get branch-specific analytics for Beetle
    
    Returns:
    - Branch information and protection status
    - Commit history and author analysis
    - Related issues and pull requests
    - Activity metrics and health status
    """
    try:
        analytics = await get_branch_analytics(
            current_user.access_token, 
            owner, 
            repo, 
            branch
        )
        
        return BranchAnalyticsResponse(analytics=analytics)
        
    except ValueError as error:
        # Branch not found
        raise HTTPException(
            status_code=404,
            detail={
                "error": "Branch not found",
                "message": str(error)
            }
        )
    except Exception as error:
        logger.error(
            "Error generating branch analytics", 
            error=str(error), 
            owner=owner, 
            repo=repo,
            branch=branch,
            user_id=current_user.id
        )
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to generate branch analytics",
                "message": str(error)
            }
        )

@router.get("/contributions", response_model=ContributionAnalyticsResponse)
async def get_contribution_analytics_route(
    period: Optional[str] = Query(
        "month", 
        pattern="^(week|month|year|all)$",
        description="Analysis period: week, month, year, or all"
    ),
    username: Optional[str] = Query(
        None, 
        description="Username to analyze (defaults to current user)"
    ),
    current_user: User = Depends(get_current_user)
):
    """
    Get user contribution analytics
    
    Query Parameters:
    - period: Analysis timeframe (week, month, year, all)
    - username: Target username (optional, defaults to current user)
    
    Returns:
    - Contribution summary and statistics
    - Activity breakdown by type and repository
    - Timeline of contributions
    - Recent activity analysis
    """
    try:
        target_username = username or current_user.login
        
        analytics = await get_contribution_analytics(
            current_user.access_token, 
            target_username, 
            period
        )
        
        return ContributionAnalyticsResponse(contributions=analytics)
        
    except Exception as error:
        logger.error(
            "Error generating contribution analytics", 
            error=str(error), 
            period=period,
            username=target_username,
            user_id=current_user.id
        )
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to generate contribution analytics",
                "message": str(error)
            }
        )

@router.get("/ai-insights", response_model=AIInsightsResponse)
async def get_ai_insights_route(
    current_user: User = Depends(require_auth)
):
    """
    Get AI-powered insights and recommendations
    
    Returns:
    - Productivity analysis and recommendations
    - Collaboration insights
    - Code quality metrics
    - Branch health assessment
    - Actionable improvement suggestions
    """
    try:
        analytics_service = AnalyticsService(current_user)
        insights = analytics_service.get_ai_analytics()
        
        return AIInsightsResponse(insights=insights)
        
    except Exception as error:
        logger.error(
            "Error generating AI insights", 
            error=str(error), 
            user_id=current_user.id
        )
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to generate AI insights",
                "message": str(error)
            }
        )

@router.delete("/cache")
async def clear_analytics_cache_route(
    cache_type: Optional[str] = Query(
        None, 
        description="Specific cache type to clear (user_analytics, repo_analytics, branch_analytics, contributions)"
    ),
    current_user: User = Depends(get_current_user)
):
    """
    Clear analytics cache
    
    Query Parameters:
    - cache_type: Specific cache type to clear (optional, clears all if not specified)
    
    Returns:
    - Success message
    """
    try:
        clear_analytics_cache(cache_type)
        
        return {
            "message": "Analytics cache cleared successfully",
            "cache_type": cache_type or "all",
            "cleared_by": current_user.login
        }
        
    except Exception as error:
        logger.error(
            "Error clearing analytics cache", 
            error=str(error), 
            cache_type=cache_type,
            user_id=current_user.id
        )
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to clear analytics cache",
                "message": str(error)
            }
        )
