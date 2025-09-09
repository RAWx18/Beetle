from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
from datetime import datetime

# --- Webhook Event Models ---

class WebhookHeaders(BaseModel):
    """GitHub webhook headers"""
    github_event: str = Field(..., alias="X-GitHub-Event", description="GitHub event type")
    github_delivery: str = Field(..., alias="X-GitHub-Delivery", description="Unique delivery ID")
    github_signature: Optional[str] = Field(None, alias="X-Hub-Signature-256", description="Webhook signature")
    user_agent: Optional[str] = Field(None, alias="User-Agent", description="User agent header")

class WebhookPayload(BaseModel):
    """Base webhook payload"""
    action: Optional[str] = Field(None, description="Action that triggered the webhook")
    repository: Optional[Dict[str, Any]] = Field(None, description="Repository information")
    sender: Optional[Dict[str, Any]] = Field(None, description="User who triggered the event")

class PushEventPayload(WebhookPayload):
    """Push event payload"""
    ref: str = Field(..., description="Git reference (branch/tag)")
    before: str = Field(..., description="SHA before push")
    after: str = Field(..., description="SHA after push")
    commits: List[Dict[str, Any]] = Field(..., description="List of commits")
    head_commit: Optional[Dict[str, Any]] = Field(None, description="Head commit information")
    pusher: Dict[str, Any] = Field(..., description="User who pushed")
    forced: bool = Field(default=False, description="Whether push was forced")
    created: bool = Field(default=False, description="Whether branch/tag was created")
    deleted: bool = Field(default=False, description="Whether branch/tag was deleted")

class PullRequestEventPayload(WebhookPayload):
    """Pull request event payload"""
    number: int = Field(..., description="Pull request number")
    pull_request: Dict[str, Any] = Field(..., description="Pull request data")

class IssuesEventPayload(WebhookPayload):
    """Issues event payload"""
    issue: Dict[str, Any] = Field(..., description="Issue data")

class RepositoryEventPayload(WebhookPayload):
    """Repository event payload"""
    # Repository data is in the base class

class StarEventPayload(WebhookPayload):
    """Star event payload"""
    starred_at: Optional[datetime] = Field(None, description="When repository was starred")

class ForkEventPayload(WebhookPayload):
    """Fork event payload"""
    forkee: Dict[str, Any] = Field(..., description="Forked repository data")

class PingEventPayload(WebhookPayload):
    """Ping event payload"""
    zen: str = Field(..., description="GitHub Zen message")
    hook_id: int = Field(..., description="Webhook ID")
    hook: Dict[str, Any] = Field(..., description="Webhook configuration")

# --- Webhook Processing Models ---

class WebhookProcessingResult(BaseModel):
    """Result of webhook processing"""
    success: bool = Field(..., description="Whether processing was successful")
    event_type: str = Field(..., description="Type of webhook event")
    delivery_id: str = Field(..., description="Webhook delivery ID")
    processed_at: datetime = Field(default_factory=datetime.now, description="Processing timestamp")
    error_message: Optional[str] = Field(None, description="Error message if processing failed")
    actions_taken: List[str] = Field(default_factory=list, description="Actions performed during processing")

class WebhookSecurityLog(BaseModel):
    """Security log entry for webhooks"""
    event_type: str = Field(..., description="Webhook event type")
    delivery_id: str = Field(..., description="Delivery ID")
    source_ip: str = Field(..., description="Source IP address")
    signature_valid: bool = Field(..., description="Whether signature verification passed")
    timestamp: datetime = Field(default_factory=datetime.now, description="Log timestamp")
    user_agent: Optional[str] = Field(None, description="User agent")

# --- Webhook Configuration Models ---

class WebhookConfig(BaseModel):
    """Webhook configuration"""
    url: str = Field(..., description="Webhook URL")
    content_type: str = Field(default="application/json", description="Content type")
    secret: Optional[str] = Field(None, description="Webhook secret")
    insecure_ssl: bool = Field(default=False, description="Allow insecure SSL")

class WebhookEventConfig(BaseModel):
    """Webhook event configuration"""
    events: List[str] = Field(..., description="List of events to listen for")
    active: bool = Field(default=True, description="Whether webhook is active")

# --- Response Models ---

class WebhookProcessingResponse(BaseModel):
    """Webhook processing response"""
    message: str = Field(..., description="Processing status message")
    event: str = Field(..., description="Event type")
    delivery: str = Field(..., description="Delivery ID")
    processing_result: Optional[WebhookProcessingResult] = Field(None, description="Processing details")

class WebhookHealthResponse(BaseModel):
    """Webhook health check response"""
    status: str = Field(default="OK", description="Health status")
    message: str = Field(..., description="Health message")
    timestamp: datetime = Field(default_factory=datetime.now, description="Health check timestamp")
    signature_verification: bool = Field(..., description="Whether signature verification is enabled")

class WebhookEventsResponse(BaseModel):
    """Supported webhook events response"""
    supported_events: List[str] = Field(..., description="List of supported webhook events")
    signature_verification: bool = Field(..., description="Whether signature verification is enabled")
    rate_limiting: bool = Field(default=True, description="Whether rate limiting is enabled")

# --- Error Models ---

class WebhookSignatureError(BaseModel):
    """Webhook signature verification error"""
    error: str = Field(default="Invalid signature", description="Error type")
    message: str = Field(..., description="Error message")

class WebhookProcessingError(BaseModel):
    """Webhook processing error"""
    error: str = Field(default="Webhook processing failed", description="Error type")
    message: str = Field(..., description="Error message")
    event: str = Field(..., description="Event type")
    delivery: str = Field(..., description="Delivery ID")
