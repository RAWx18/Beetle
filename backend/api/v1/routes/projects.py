from fastapi import APIRouter, HTTPException, Depends, Path
from typing import List, Dict, Any
import structlog

from .auth import get_current_user
from utils.project_utils import (
    list_user_projects, get_project_details, create_project, update_project,
    get_project_branches, get_project_analytics, import_repository,
    get_beetle_project_data, get_smart_suggestions
)
from models.api.project_models import (
    ProjectListResponse, ProjectDetailResponse, ProjectCreate, ProjectCreateResponse,
    ProjectUpdate, ProjectUpdateResponse, ProjectBranchesResponse, ProjectAnalyticsResponse,
    RepositoryImportRequest, RepositoryImportResponse, BeetleProjectResponse,
    SmartSuggestionsResponse, ProjectNotFoundError
)
from models.api.auth_models import User

logger = structlog.get_logger(__name__)
router = APIRouter()

@router.get("/", response_model=ProjectListResponse)
async def get_user_projects(
    current_user: User = Depends(get_current_user)
):
    """
    Get all projects for the current user
    
    Returns a list of projects including:
    - Saved Beetle projects
    - User's GitHub repositories as potential projects
    - Basic analytics for each project
    """
    try:
        projects = await list_user_projects(current_user.access_token, current_user.id)
        
        return ProjectListResponse(
            projects=projects,
            total=len(projects)
        )
        
    except Exception as error:
        logger.error(
            "Error listing user projects", 
            error=str(error), 
            user_id=current_user.id
        )
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to fetch projects",
                "message": str(error)
            }
        )

@router.get("/{project_id}", response_model=ProjectDetailResponse)
async def get_project_detail(
    project_id: str = Path(..., description="Project ID (can be UUID or owner/repo format)"),
    current_user: User = Depends(get_current_user)
):
    """
    Get detailed information for a specific project
    
    Path Parameters:
    - project_id: Project identifier (UUID for saved projects, owner/repo for GitHub repos)
    
    Returns:
    - Complete project information
    - Branch details and analytics
    - Recent activity
    """
    try:
        project = await get_project_details(
            current_user.access_token, 
            project_id, 
            current_user.id
        )
        
        if not project:
            raise HTTPException(
                status_code=404,
                detail={
                    "error": "Project not found",
                    "message": f"Project with ID '{project_id}' not found"
                }
            )
        
        return ProjectDetailResponse(project=project)
        
    except HTTPException:
        raise
    except Exception as error:
        logger.error(
            "Error getting project details", 
            error=str(error), 
            project_id=project_id,
            user_id=current_user.id
        )
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to fetch project details",
                "message": str(error)
            }
        )

@router.post("/", response_model=ProjectCreateResponse)
async def create_new_project(
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Create a new Beetle project
    
    Request Body:
    - name: Project name (required)
    - description: Project description (optional)
    - repository_url: Associated GitHub repository (optional)
    - branches: List of branch names (optional)
    - settings: Project settings (optional)
    
    Returns:
    - Created project information
    - Success message
    """
    try:
        project = await create_project(project_data, current_user.id)
        
        return ProjectCreateResponse(
            message="Project created successfully",
            project=project
        )
        
    except Exception as error:
        logger.error(
            "Error creating project", 
            error=str(error), 
            name=project_data.name,
            user_id=current_user.id
        )
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to create project",
                "message": str(error)
            }
        )

@router.put("/{project_id}", response_model=ProjectUpdateResponse)
async def update_project_details(
    project_id: str,
    project_updates: ProjectUpdate,
    current_user: User = Depends(get_current_user)
):
    """
    Update an existing project
    
    Path Parameters:
    - project_id: Project identifier
    
    Request Body:
    - Any project fields to update (all optional)
    
    Returns:
    - Updated project information
    - Success message
    """
    try:
        # Convert updates to dict, excluding None values
        updates = project_updates.dict(exclude_unset=True)
        
        project = await update_project(project_id, updates, current_user.id)
        
        if not project:
            raise HTTPException(
                status_code=404,
                detail={
                    "error": "Project not found",
                    "message": f"Project with ID '{project_id}' not found"
                }
            )
        
        return ProjectUpdateResponse(
            message="Project updated successfully",
            project=project
        )
        
    except HTTPException:
        raise
    except Exception as error:
        logger.error(
            "Error updating project", 
            error=str(error), 
            project_id=project_id,
            user_id=current_user.id
        )
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to update project",
                "message": str(error)
            }
        )

@router.get("/{project_id}/branches", response_model=ProjectBranchesResponse)
async def get_project_branches_route(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get branches for a project
    
    Path Parameters:
    - project_id: Project identifier
    
    Returns:
    - List of project branches with metadata
    - Branch protection status
    - Last commit information
    """
    try:
        branches = await get_project_branches(current_user.access_token, project_id)
        
        return ProjectBranchesResponse(branches=branches)
        
    except Exception as error:
        logger.error(
            "Error getting project branches", 
            error=str(error), 
            project_id=project_id,
            user_id=current_user.id
        )
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to fetch project branches",
                "message": str(error)
            }
        )

@router.get("/{project_id}/analytics", response_model=ProjectAnalyticsResponse)
async def get_project_analytics_route(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get analytics for a project
    
    Path Parameters:
    - project_id: Project identifier
    
    Returns:
    - Project analytics and metrics
    - Recent activity summary
    - Statistics about commits, issues, PRs
    """
    try:
        analytics_data = await get_project_analytics(current_user.access_token, project_id)
        
        return ProjectAnalyticsResponse(
            analytics=analytics_data["analytics"],
            recent_activity=analytics_data.get("recent_activity")
        )
        
    except Exception as error:
        logger.error(
            "Error getting project analytics", 
            error=str(error), 
            project_id=project_id,
            user_id=current_user.id
        )
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to fetch project analytics",
                "message": str(error)
            }
        )

@router.post("/import", response_model=RepositoryImportResponse)
async def import_repository_as_project(
    import_request: RepositoryImportRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Import a GitHub repository as a Beetle project
    
    Request Body:
    - repository_url: GitHub repository URL (required)
    - branches: Specific branches to import (optional, imports all if not specified)
    - settings: Project settings (optional)
    
    Returns:
    - Imported project information
    - Success message
    """
    try:
        project = await import_repository(
            current_user.access_token, 
            import_request, 
            current_user.id
        )
        
        return RepositoryImportResponse(
            message="Repository imported successfully as Beetle project",
            project=project
        )
        
    except Exception as error:
        logger.error(
            "Error importing repository", 
            error=str(error), 
            repository_url=str(import_request.repository_url),
            user_id=current_user.id
        )
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to import repository",
                "message": str(error)
            }
        )

@router.get("/{project_id}/gitmesh", response_model=BeetleProjectResponse)
async def get_beetle_project_data_route(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get Beetle-specific project data for contribution page
    
    Path Parameters:
    - project_id: Project identifier
    
    Returns:
    - Comprehensive Beetle project analysis
    - Branch-level intelligence and insights
    - AI-powered recommendations
    - Project health metrics
    """
    try:
        beetle_data = await get_beetle_project_data(current_user.access_token, project_id)
        
        if not beetle_data:
            raise HTTPException(
                status_code=404,
                detail={
                    "error": "Project not found",
                    "message": f"Beetle project with ID '{project_id}' not found"
                }
            )
        
        return BeetleProjectResponse(beetle_data=beetle_data)
        
    except HTTPException:
        raise
    except Exception as error:
        logger.error(
            "Error getting Beetle project data", 
            error=str(error), 
            project_id=project_id,
            user_id=current_user.id
        )
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to fetch Beetle project data",
                "message": str(error)
            }
        )

@router.get("/{project_id}/branches/{branch}/suggestions", response_model=SmartSuggestionsResponse)
async def get_branch_smart_suggestions(
    project_id: str,
    branch: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get AI-powered smart suggestions for a project branch
    
    Path Parameters:
    - project_id: Project identifier
    - branch: Branch name
    
    Returns:
    - List of smart suggestions
    - Actionable recommendations
    - Priority-based insights
    - Automated improvement suggestions
    """
    try:
        suggestions = await get_smart_suggestions(
            current_user.access_token, 
            project_id, 
            branch
        )
        
        return SmartSuggestionsResponse(suggestions=suggestions)
        
    except Exception as error:
        logger.error(
            "Error generating smart suggestions", 
            error=str(error), 
            project_id=project_id,
            branch=branch,
            user_id=current_user.id
        )
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to generate suggestions",
                "message": str(error)
            }
        )
