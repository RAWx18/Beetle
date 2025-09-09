
from pydantic import BaseModel
from typing import List, Dict, Any

class Project(BaseModel):
    id: int
    name: str
    description: str
    lastActivity: str
    language: str

class Insight(BaseModel):
    id: int
    text: str

class Analytics(BaseModel):
    totalCommits: int
    linesOfCode: str
    activeProjects: int

class HubOverviewResponse(BaseModel):
    projects: List[Project]
    insights: List[Insight]
    analytics: Analytics
