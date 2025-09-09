import hmac
import hashlib
from typing import Dict, Any, Optional, List
from datetime import datetime
import structlog

from config.settings import get_settings
from models.api.webhook_models import (
    WebhookProcessingResult, WebhookSecurityLog, PushEventPayload,
    PullRequestEventPayload, IssuesEventPayload, RepositoryEventPayload,
    StarEventPayload, ForkEventPayload, PingEventPayload
)

logger = structlog.get_logger(__name__)
settings = get_settings()

class WebhookSecurityLogger:
    """Security logger for webhook events"""
    
    def __init__(self):
        self._security_logs: List[WebhookSecurityLog] = []
        self._rate_limit_cache: Dict[str, List[datetime]] = {}
    
    def log_webhook_received(self, event_type: str, delivery_id: str, source_ip: str, user_agent: Optional[str] = None):
        """Log webhook received event"""
        logger.info(
            "Webhook received",
            event_type=event_type,
            delivery_id=delivery_id,
            source_ip=source_ip,
            user_agent=user_agent
        )
    
    def log_signature_verification(self, event_type: str, delivery_id: str, valid: bool):
        """Log signature verification result"""
        log_entry = WebhookSecurityLog(
            event_type=event_type,
            delivery_id=delivery_id,
            source_ip="unknown",  # Will be filled by request context
            signature_valid=valid
        )
        
        self._security_logs.append(log_entry)
        
        if valid:
            logger.info("Webhook signature verified", event_type=event_type, delivery_id=delivery_id)
        else:
            logger.warning("Webhook signature verification failed", event_type=event_type, delivery_id=delivery_id)
    
    def log_processing_result(self, event_type: str, delivery_id: str, success: bool, error: Optional[str] = None):
        """Log webhook processing result"""
        if success:
            logger.info("Webhook processed successfully", event_type=event_type, delivery_id=delivery_id)
        else:
            logger.error("Webhook processing failed", event_type=event_type, delivery_id=delivery_id, error=error)
    
    def log_suspicious_activity(self, activity_type: str, source_ip: str, details: Dict[str, Any]):
        """Log suspicious webhook activity"""
        logger.warning(
            "Suspicious webhook activity",
            activity_type=activity_type,
            source_ip=source_ip,
            details=details
        )
    
    def get_security_logs(self, limit: int = 100) -> List[WebhookSecurityLog]:
        """Get recent security logs"""
        return self._security_logs[-limit:]
    
    def clear_old_logs(self, days: int = 7):
        """Clear old security logs"""
        cutoff = datetime.now().timestamp() - (days * 24 * 60 * 60)
        self._security_logs = [
            log for log in self._security_logs
            if log.timestamp.timestamp() > cutoff
        ]

class WebhookSignatureVerifier:
    """GitHub webhook signature verification"""
    
    def __init__(self, secret: Optional[str] = None):
        self.secret = secret or settings.GITHUB_WEBHOOK_SECRET
    
    def verify_signature(self, payload: str, signature: str) -> bool:
        """
        Verify GitHub webhook signature
        
        Args:
            payload: Raw webhook payload
            signature: GitHub signature from X-Hub-Signature-256 header
            
        Returns:
            True if signature is valid, False otherwise
        """
        if not self.secret:
            logger.warning("Webhook secret not configured - skipping signature verification")
            return True  # Allow webhooks in development/testing
        
        if not signature:
            logger.error("Webhook signature missing")
            return False
        
        try:
            # GitHub sends signature as "sha256=<hash>"
            expected_signature = signature.replace('sha256=', '') if signature.startswith('sha256=') else signature
            
            # Calculate expected hash
            mac = hmac.new(
                self.secret.encode('utf-8'),
                payload.encode('utf-8'),
                hashlib.sha256
            )
            calculated_hash = mac.hexdigest()
            
            # Use constant-time comparison to prevent timing attacks
            return hmac.compare_digest(expected_signature, calculated_hash)
            
        except Exception as error:
            logger.error("Signature verification error", error=str(error))
            return False

class WebhookEventProcessor:
    """Process different types of webhook events"""
    
    def __init__(self):
        self.security_logger = WebhookSecurityLogger()
        self.signature_verifier = WebhookSignatureVerifier()
    
    async def process_webhook(
        self, 
        event_type: str, 
        delivery_id: str, 
        payload: Dict[str, Any],
        source_ip: str = "unknown"
    ) -> WebhookProcessingResult:
        """
        Process a webhook event
        
        Args:
            event_type: Type of GitHub event
            delivery_id: Unique delivery identifier
            payload: Webhook payload
            source_ip: Source IP address
            
        Returns:
            Processing result with success status and actions taken
        """
        try:
            logger.info("Processing webhook", event_type=event_type, delivery_id=delivery_id)
            
            actions_taken = []
            
            # Process based on event type
            if event_type == 'push':
                actions_taken = await self._handle_push_event(payload)
            elif event_type == 'pull_request':
                actions_taken = await self._handle_pull_request_event(payload)
            elif event_type == 'issues':
                actions_taken = await self._handle_issues_event(payload)
            elif event_type == 'repository':
                actions_taken = await self._handle_repository_event(payload)
            elif event_type == 'star':
                actions_taken = await self._handle_star_event(payload)
            elif event_type == 'fork':
                actions_taken = await self._handle_fork_event(payload)
            elif event_type == 'ping':
                actions_taken = await self._handle_ping_event(payload)
            else:
                logger.info("Unhandled webhook event", event_type=event_type)
                actions_taken = [f"Logged unhandled event: {event_type}"]
            
            # Log successful processing
            self.security_logger.log_processing_result(event_type, delivery_id, True)
            
            return WebhookProcessingResult(
                success=True,
                event_type=event_type,
                delivery_id=delivery_id,
                actions_taken=actions_taken
            )
            
        except Exception as error:
            error_message = str(error)
            logger.error("Webhook processing failed", event_type=event_type, delivery_id=delivery_id, error=error_message)
            
            # Log failed processing
            self.security_logger.log_processing_result(event_type, delivery_id, False, error_message)
            
            return WebhookProcessingResult(
                success=False,
                event_type=event_type,
                delivery_id=delivery_id,
                error_message=error_message,
                actions_taken=[]
            )
    
    async def _handle_push_event(self, payload: Dict[str, Any]) -> List[str]:
        """Handle push events"""
        try:
            push_data = PushEventPayload(**payload)
            
            repository = push_data.repository
            ref = push_data.ref
            commits = push_data.commits
            
            repo_name = repository.get('full_name') if repository else 'unknown'
            
            logger.info(
                "Push event processed",
                repository=repo_name,
                ref=ref,
                commit_count=len(commits)
            )
            
            actions = [
                f"Processed push to {repo_name} on {ref}",
                f"Processed {len(commits)} commits"
            ]
            
            # Here you could:
            # - Update local cache
            # - Trigger AI analysis
            # - Send notifications
            # - Update project analytics
            
            return actions
            
        except Exception as error:
            logger.error("Error handling push event", error=str(error))
            return [f"Error processing push event: {str(error)}"]
    
    async def _handle_pull_request_event(self, payload: Dict[str, Any]) -> List[str]:
        """Handle pull request events"""
        try:
            pr_data = PullRequestEventPayload(**payload)
            
            action = pr_data.action
            repository = pr_data.repository
            pull_request = pr_data.pull_request
            
            repo_name = repository.get('full_name') if repository else 'unknown'
            pr_number = pull_request.get('number', 'unknown')
            
            logger.info(
                "Pull request event processed",
                action=action,
                repository=repo_name,
                pr_number=pr_number
            )
            
            actions = [
                f"Processed PR {action} in {repo_name}",
                f"PR #{pr_number} {action}"
            ]
            
            # Here you could:
            # - Update PR status
            # - Trigger automated reviews
            # - Send notifications
            # - Update project metrics
            
            return actions
            
        except Exception as error:
            logger.error("Error handling pull request event", error=str(error))
            return [f"Error processing pull request event: {str(error)}"]
    
    async def _handle_issues_event(self, payload: Dict[str, Any]) -> List[str]:
        """Handle issues events"""
        try:
            issue_data = IssuesEventPayload(**payload)
            
            action = issue_data.action
            repository = issue_data.repository
            issue = issue_data.issue
            
            repo_name = repository.get('full_name') if repository else 'unknown'
            issue_number = issue.get('number', 'unknown')
            
            logger.info(
                "Issue event processed",
                action=action,
                repository=repo_name,
                issue_number=issue_number
            )
            
            actions = [
                f"Processed issue {action} in {repo_name}",
                f"Issue #{issue_number} {action}"
            ]
            
            # Here you could:
            # - Update issue status
            # - Trigger notifications
            # - Auto-assign labels/reviewers
            # - Update project analytics
            
            return actions
            
        except Exception as error:
            logger.error("Error handling issues event", error=str(error))
            return [f"Error processing issues event: {str(error)}"]
    
    async def _handle_repository_event(self, payload: Dict[str, Any]) -> List[str]:
        """Handle repository events"""
        try:
            repo_data = RepositoryEventPayload(**payload)
            
            action = repo_data.action
            repository = repo_data.repository
            
            repo_name = repository.get('full_name') if repository else 'unknown'
            
            logger.info(
                "Repository event processed",
                action=action,
                repository=repo_name
            )
            
            actions = [
                f"Processed repository {action}",
                f"Repository {repo_name} {action}"
            ]
            
            # Here you could:
            # - Update repository cache
            # - Update permissions
            # - Sync project settings
            # - Update analytics
            
            return actions
            
        except Exception as error:
            logger.error("Error handling repository event", error=str(error))
            return [f"Error processing repository event: {str(error)}"]
    
    async def _handle_star_event(self, payload: Dict[str, Any]) -> List[str]:
        """Handle star events"""
        try:
            star_data = StarEventPayload(**payload)
            
            action = star_data.action
            repository = star_data.repository
            
            repo_name = repository.get('full_name') if repository else 'unknown'
            star_action = 'starred' if action == 'created' else 'unstarred'
            
            logger.info(
                "Star event processed",
                action=star_action,
                repository=repo_name
            )
            
            actions = [
                f"Repository {star_action}",
                f"{repo_name} was {star_action}"
            ]
            
            # Here you could:
            # - Update star counts
            # - Send notifications
            # - Update analytics
            # - Track popularity metrics
            
            return actions
            
        except Exception as error:
            logger.error("Error handling star event", error=str(error))
            return [f"Error processing star event: {str(error)}"]
    
    async def _handle_fork_event(self, payload: Dict[str, Any]) -> List[str]:
        """Handle fork events"""
        try:
            fork_data = ForkEventPayload(**payload)
            
            repository = fork_data.repository
            forkee = fork_data.forkee
            
            repo_name = repository.get('full_name') if repository else 'unknown'
            fork_name = forkee.get('full_name', 'unknown')
            
            logger.info(
                "Fork event processed",
                repository=repo_name,
                fork=fork_name
            )
            
            actions = [
                f"Repository forked",
                f"{repo_name} -> {fork_name}"
            ]
            
            # Here you could:
            # - Update fork counts
            # - Send notifications
            # - Update analytics
            # - Track community metrics
            
            return actions
            
        except Exception as error:
            logger.error("Error handling fork event", error=str(error))
            return [f"Error processing fork event: {str(error)}"]
    
    async def _handle_ping_event(self, payload: Dict[str, Any]) -> List[str]:
        """Handle ping events"""
        try:
            ping_data = PingEventPayload(**payload)
            
            zen = ping_data.zen
            hook_id = ping_data.hook_id
            
            logger.info("Webhook ping received", zen=zen, hook_id=hook_id)
            
            actions = [
                "Webhook ping received",
                f"Hook ID: {hook_id}",
                f"Zen: {zen}"
            ]
            
            return actions
            
        except Exception as error:
            logger.error("Error handling ping event", error=str(error))
            return [f"Error processing ping event: {str(error)}"]

class WebhookRateLimiter:
    """Rate limiter for webhook endpoints"""
    
    def __init__(self):
        self._request_counts: Dict[str, List[datetime]] = {}
        self._window_size = 60  # 60 seconds
        self._max_requests = 100  # Max requests per window
    
    def is_rate_limited(self, identifier: str) -> bool:
        """
        Check if identifier is rate limited
        
        Args:
            identifier: Unique identifier (IP + User-Agent combination)
            
        Returns:
            True if rate limited, False otherwise
        """
        now = datetime.now()
        window_start = now.timestamp() - self._window_size
        
        # Initialize if not exists
        if identifier not in self._request_counts:
            self._request_counts[identifier] = []
        
        # Clean old requests
        self._request_counts[identifier] = [
            req_time for req_time in self._request_counts[identifier]
            if req_time.timestamp() > window_start
        ]
        
        # Check limit
        if len(self._request_counts[identifier]) >= self._max_requests:
            return True
        
        # Add current request
        self._request_counts[identifier].append(now)
        return False
    
    def get_rate_limit_info(self, identifier: str) -> Dict[str, Any]:
        """Get rate limit information for identifier"""
        now = datetime.now()
        window_start = now.timestamp() - self._window_size
        
        if identifier not in self._request_counts:
            current_count = 0
        else:
            # Count requests in current window
            current_count = len([
                req_time for req_time in self._request_counts[identifier]
                if req_time.timestamp() > window_start
            ])
        
        return {
            "limit": self._max_requests,
            "remaining": max(0, self._max_requests - current_count),
            "reset_at": window_start + self._window_size,
            "window_size": self._window_size
        }

# Global instances
webhook_security_logger = WebhookSecurityLogger()
webhook_event_processor = WebhookEventProcessor()
webhook_rate_limiter = WebhookRateLimiter()
webhook_signature_verifier = WebhookSignatureVerifier()

# Convenience functions
def verify_webhook_signature(payload: str, signature: str) -> bool:
    """Verify webhook signature"""
    return webhook_signature_verifier.verify_signature(payload, signature)

async def process_webhook_event(event_type: str, delivery_id: str, payload: Dict[str, Any], source_ip: str = "unknown") -> WebhookProcessingResult:
    """Process webhook event"""
    return await webhook_event_processor.process_webhook(event_type, delivery_id, payload, source_ip)

def check_webhook_rate_limit(identifier: str) -> bool:
    """Check if webhook request is rate limited"""
    return webhook_rate_limiter.is_rate_limited(identifier)

def get_webhook_rate_limit_info(identifier: str) -> Dict[str, Any]:
    """Get webhook rate limit information"""
    return webhook_rate_limiter.get_rate_limit_info(identifier)

def log_webhook_security_event(event_type: str, delivery_id: str, source_ip: str, user_agent: Optional[str] = None):
    """Log webhook security event"""
    webhook_security_logger.log_webhook_received(event_type, delivery_id, source_ip, user_agent)

def log_webhook_signature_verification(event_type: str, delivery_id: str, valid: bool):
    """Log webhook signature verification"""
    webhook_security_logger.log_signature_verification(event_type, delivery_id, valid)
