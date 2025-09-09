from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
import structlog

from utils.auth_utils import security_utils

from .dependencies import require_auth
from utils.aggregated_utils import (
    get_aggregated_pull_requests, get_aggregated_issues, get_activity_summary
)
from models.api.aggregated_models import (
    AggregatedPullRequestsResponse, AggregatedIssuesResponse, 
    ActivitySummaryResponse
)

logger = structlog.get_logger(__name__)
router = APIRouter()

@router.get("/pull-requests", response_model=AggregatedPullRequestsResponse)
async def get_aggregated_pull_requests_route(
    limit: int = Query(
        default=10, 
        ge=1, 
        le=100, 
        description="Number of repositories to check (max 100)"
    ),
    state: str = Query(
        default="all", 
        pattern="^(open|closed|all)$",
        description="Pull request state filter"
    ),
    token: str = Depends(require_auth)
):
    """
    Get aggregated pull requests from user's repositories
    
    Query Parameters:
    - limit: Number of repositories to check (1-100)
    - state: PR state filter (open, closed, all)
    
    Returns:
    - Aggregated pull requests with repository context
    - Summary statistics across repositories
    - State distribution and repository breakdown
    """
    try:
        pull_requests, summary = await get_aggregated_pull_requests(
            token, 
            limit, 
            state
        )
        
        return AggregatedPullRequestsResponse(
            pull_requests=pull_requests,
            total=len(pull_requests),
            repositories=summary["repositories_checked"],
            summary=summary
        )
        
    except Exception as error:
        logger.error(
            "Error fetching aggregated pull requests",
            error=str(error),
            limit=limit,
            state=state,
        )
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to fetch pull requests",
                "message": str(error)
            }
        )

@router.get("/issues", response_model=AggregatedIssuesResponse)
async def get_aggregated_issues_route(
    limit: int = Query(
        default=10, 
        ge=1, 
        le=100, 
        description="Number of repositories to check (max 100)"
    ),
    state: str = Query(
        default="all", 
        pattern="^(open|closed|all)$",
        description="Issue state filter"
    ),
    token: str = Depends(require_auth)
):
    """
    Get aggregated issues from user's repositories
    
    Query Parameters:
    - limit: Number of repositories to check (1-100)
    - state: Issue state filter (open, closed, all)
    
    Returns:
    - Aggregated issues with repository context
    - Summary statistics across repositories
    - State distribution and repository breakdown
    """
    try:
        issues, summary = await get_aggregated_issues(
            token, 
            limit, 
            state
        )
        
        return AggregatedIssuesResponse(
            issues=issues,
            total=len(issues),
            repositories=summary["repositories_checked"],
            summary=summary
        )
        
    except Exception as error:
        logger.error(
            "Error fetching aggregated issues",
            error=str(error),
            limit=limit,
            state=state,
        )
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to fetch issues",
                "message": str(error)
            }
        )

@router.get("/summary", response_model=ActivitySummaryResponse)
async def get_activity_summary_route(
    limit: int = Query(
        default=10, 
        ge=1, 
        le=50, 
        description="Number of repositories to analyze (max 50)"
    ),
    token: str = Depends(require_auth)
):
    """
    Get aggregated activity summary across repositories
    
    Query Parameters:
    - limit: Number of repositories to analyze (1-50)
    
    Returns:
    - Comprehensive activity summary
    - Repository statistics (stars, forks, languages)
    - Open issues and pull requests counts
    - Recent activity across repositories
    """
    try:
        summary = await get_activity_summary(
            token, 
            limit
        )
        
        return ActivitySummaryResponse(summary=summary)
        
    except Exception as error:
        logger.error(
            "Error generating activity summary",
            error=str(error),
            limit=limit,
        )
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to generate summary",
                "message": str(error)
            }
        )
