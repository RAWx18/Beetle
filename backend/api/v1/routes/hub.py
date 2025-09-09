
from fastapi import APIRouter, Depends
from typing import List

from models.api.auth_models import User
from models.api.hub_models import HubOverviewResponse, Project, Insight
from services.hub_service import HubService
from api.v1.routes.auth import require_auth

router = APIRouter()

@router.get("/overview", response_model=HubOverviewResponse)
def get_hub_overview(user: User = Depends(require_auth)) -> HubOverviewResponse:
    """Get hub overview data."""
    hub_service = HubService(user)
    return hub_service.get_overview()

@router.get("/projects", response_model=List[Project])
def get_hub_projects(user: User = Depends(require_auth)) -> List[Project]:
    """Get all projects for the user."""
    hub_service = HubService(user)
    return hub_service.get_projects()

@router.get("/insights", response_model=List[Insight])
def get_hub_insights(user: User = Depends(require_auth)) -> List[Insight]:
    """Get insights for the user."""
    hub_service = HubService(user)
    return hub_service.get_insights()
