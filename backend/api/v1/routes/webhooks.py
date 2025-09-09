from fastapi import APIRouter, HTTPException, Request, Depends, Header
from fastapi.responses import JSONResponse
from typing import Dict, Any, Optional
import structlog

from utils.webhook_utils import (
    verify_webhook_signature, process_webhook_event, check_webhook_rate_limit,
    get_webhook_rate_limit_info, log_webhook_security_event,
    log_webhook_signature_verification
)
from models.api.webhook_models import (
    WebhookProcessingResponse, WebhookHealthResponse, WebhookEventsResponse,
    WebhookSignatureError, WebhookProcessingError
)
from config.settings import get_settings

logger = structlog.get_logger(__name__)
router = APIRouter()
settings = get_settings()

async def get_raw_body(request: Request) -> str:
    """Extract raw body from request for signature verification"""
    body = await request.body()
    return body.decode('utf-8')

def get_client_identifier(request: Request, user_agent: Optional[str] = None) -> str:
    """Generate client identifier for rate limiting"""
    client_ip = request.client.host if request.client else "unknown"
    user_agent = user_agent or "unknown"
    return f"{client_ip}:{user_agent}"

@router.post("/github")
async def handle_github_webhook(
    request: Request,
    x_github_event: str = Header(..., alias="X-GitHub-Event"),
    x_github_delivery: str = Header(..., alias="X-GitHub-Delivery"),
    x_hub_signature_256: Optional[str] = Header(None, alias="X-Hub-Signature-256"),
    user_agent: Optional[str] = Header(None, alias="User-Agent")
):
    """
    Handle GitHub webhook events
    
    Headers:
    - X-GitHub-Event: Type of GitHub event
    - X-GitHub-Delivery: Unique delivery identifier
    - X-Hub-Signature-256: Webhook signature for verification
    - User-Agent: Client user agent
    
    Returns:
    - Success/failure status
    - Processing details
    - Actions taken
    """
    client_ip = request.client.host if request.client else "unknown"
    client_identifier = get_client_identifier(request, user_agent)
    
    # Log webhook received
    log_webhook_security_event(x_github_event, x_github_delivery, client_ip, user_agent)
    
    try:
        # Rate limiting check
        if check_webhook_rate_limit(client_identifier):
            rate_limit_info = get_webhook_rate_limit_info(client_identifier)
            logger.warning(
                "Webhook rate limit exceeded",
                client_ip=client_ip,
                event=x_github_event,
                rate_limit_info=rate_limit_info
            )
            
            return JSONResponse(
                status_code=429,
                content={
                    "error": "Too many webhook requests",
                    "message": "Rate limit exceeded for this IP",
                    "rate_limit": rate_limit_info
                }
            )
        
        # Get raw body for signature verification
        raw_body = await get_raw_body(request)
        
        # Verify webhook signature
        signature_valid = True
        if settings.GITHUB_WEBHOOK_SECRET and x_hub_signature_256:
            signature_valid = verify_webhook_signature(raw_body, x_hub_signature_256)
            log_webhook_signature_verification(x_github_event, x_github_delivery, signature_valid)
            
            if not signature_valid:
                logger.error(
                    "Webhook signature verification failed",
                    event=x_github_event,
                    delivery=x_github_delivery,
                    client_ip=client_ip
                )
                
                return JSONResponse(
                    status_code=401,
                    content={
                        "error": "Invalid signature",
                        "message": "Webhook signature verification failed"
                    }
                )
        elif settings.GITHUB_WEBHOOK_SECRET and not x_hub_signature_256:
            logger.error(
                "Webhook signature missing",
                event=x_github_event,
                delivery=x_github_delivery,
                client_ip=client_ip
            )
            
            return JSONResponse(
                status_code=401,
                content={
                    "error": "Signature required",
                    "message": "X-Hub-Signature-256 header is required"
                }
            )
        else:
            logger.warning("Webhook signature verification skipped - no secret configured")
        
        # Parse JSON payload
        try:
            import json
            payload = json.loads(raw_body)
        except json.JSONDecodeError as e:
            logger.error(
                "Invalid JSON payload",
                event=x_github_event,
                delivery=x_github_delivery,
                error=str(e)
            )
            
            return JSONResponse(
                status_code=400,
                content={
                    "error": "Invalid payload",
                    "message": "Could not parse JSON payload"
                }
            )
        
        # Process webhook event
        processing_result = await process_webhook_event(
            x_github_event,
            x_github_delivery,
            payload,
            client_ip
        )
        
        if processing_result.success:
            logger.info(
                "Webhook processed successfully",
                event=x_github_event,
                delivery=x_github_delivery,
                actions=processing_result.actions_taken
            )
            
            return WebhookProcessingResponse(
                message="Webhook processed successfully",
                event=x_github_event,
                delivery=x_github_delivery,
                processing_result=processing_result
            )
        else:
            logger.error(
                "Webhook processing failed",
                event=x_github_event,
                delivery=x_github_delivery,
                error=processing_result.error_message
            )
            
            return JSONResponse(
                status_code=500,
                content={
                    "error": "Webhook processing failed",
                    "message": processing_result.error_message,
                    "event": x_github_event,
                    "delivery": x_github_delivery
                }
            )
    
    except Exception as error:
        logger.error(
            "Unexpected error processing webhook",
            event=x_github_event,
            delivery=x_github_delivery,
            error=str(error),
            client_ip=client_ip
        )
        
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal server error",
                "message": "An unexpected error occurred while processing the webhook",
                "event": x_github_event,
                "delivery": x_github_delivery
            }
        )

@router.get("/health", response_model=WebhookHealthResponse)
async def webhook_health_check():
    """
    Webhook endpoint health check
    
    Returns:
    - Health status
    - Configuration information
    - Timestamp
    """
    return WebhookHealthResponse(
        status="OK",
        message="Webhook endpoint is healthy",
        signature_verification=bool(settings.GITHUB_WEBHOOK_SECRET)
    )

@router.get("/events", response_model=WebhookEventsResponse)
async def list_supported_webhook_events():
    """
    List supported webhook events
    
    Returns:
    - List of supported GitHub webhook events
    - Configuration information
    """
    supported_events = [
        "push",
        "pull_request", 
        "issues",
        "repository",
        "star",
        "fork",
        "ping"
    ]
    
    return WebhookEventsResponse(
        supported_events=supported_events,
        signature_verification=bool(settings.GITHUB_WEBHOOK_SECRET),
        rate_limiting=True
    )

@router.get("/rate-limit/{client_id}")
async def get_webhook_rate_limit_status(client_id: str):
    """
    Get rate limit status for a client
    
    Path Parameters:
    - client_id: Client identifier
    
    Returns:
    - Current rate limit information
    - Remaining requests
    - Reset time
    """
    try:
        rate_limit_info = get_webhook_rate_limit_info(client_id)
        
        return {
            "client_id": client_id,
            "rate_limit": rate_limit_info,
            "status": "under_limit" if rate_limit_info["remaining"] > 0 else "rate_limited"
        }
        
    except Exception as error:
        logger.error("Error getting rate limit status", client_id=client_id, error=str(error))
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to get rate limit status",
                "message": str(error)
            }
        )

@router.post("/test")
async def test_webhook_endpoint(
    request: Request,
    test_payload: Dict[str, Any]
):
    """
    Test webhook endpoint (development/testing only)
    
    Request Body:
    - test_payload: Test webhook payload
    
    Returns:
    - Processing result
    """
    # Only allow in development/testing
    if settings.ENVIRONMENT == "production":
        raise HTTPException(
            status_code=403,
            detail={
                "error": "Test endpoint disabled",
                "message": "Webhook test endpoint is not available in production"
            }
        )
    
    try:
        client_ip = request.client.host if request.client else "test"
        
        # Process test webhook
        processing_result = await process_webhook_event(
            "test",
            "test-delivery-id",
            test_payload,
            client_ip
        )
        
        return {
            "message": "Test webhook processed",
            "processing_result": processing_result
        }
        
    except Exception as error:
        logger.error("Error processing test webhook", error=str(error))
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Test webhook processing failed",
                "message": str(error)
            }
        )
