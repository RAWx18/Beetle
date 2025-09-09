"""
Authentication utilities for GitHub OAuth and JWT handling
"""

import os
import secrets
import hashlib
import hmac
import jwt
import asyncio
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from urllib.parse import urlencode
from cryptography.fernet import Fernet
import aiohttp
import logging

from config.settings import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class SecurityUtils:
    """Security utilities for authentication and encryption."""
    
    def __init__(self):
        # Initialize encryption key from environment or generate one
        self.encryption_key = self._get_or_create_encryption_key()
        self.cipher_suite = Fernet(self.encryption_key)
    
    def _get_or_create_encryption_key(self) -> bytes:
        """Get encryption key from environment or create a new one."""
        key_env = os.getenv('ENCRYPTION_KEY')
        if key_env:
            return key_env.encode()
        
        # Generate new key (in production, store this securely)
        key = Fernet.generate_key()
        logger.warning("Using fixed encryption key for development. In production, set the ENCRYPTION_KEY environment variable.")
        return b'Gj9xOLQZbVoKw7XBcaNyVG2-ydgyWqQkypBL52Ia5To='
    
    def encrypt_token(self, token: str) -> str:
        """Encrypt a token for secure storage."""
        try:
            encrypted = self.cipher_suite.encrypt(token.encode())
            return encrypted.decode()
        except Exception as e:
            logger.error(f"Token encryption failed: {e}")
            raise
    
    def decrypt_token(self, encrypted_token: str) -> str:
        """Decrypt a token from storage."""
        try:
            decrypted = self.cipher_suite.decrypt(encrypted_token.encode())
            return decrypted.decode()
        except Exception as e:
            logger.error(f"Token decryption failed: {e}")
            raise
    
    def generate_secure_token(self, length: int = 32) -> str:
        """Generate a cryptographically secure random token."""
        return secrets.token_urlsafe(length)
    
    def verify_github_signature(self, payload: str, signature: str, secret: str) -> bool:
        """Verify GitHub webhook signature."""
        if not signature.startswith('sha256='):
            return False
        
        expected_signature = 'sha256=' + hmac.new(
            secret.encode(),
            payload.encode(),
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(signature, expected_signature)
    
    def validate_redirect_uri(self, uri: str, allowed_origins: List[str]) -> bool:
        """Validate redirect URI against allowed origins."""
        if not uri:
            return False
        
        for origin in allowed_origins:
            if uri.startswith(origin):
                return True
        
        return False


class GitHubOAuth:
    """GitHub OAuth handler."""
    
    def __init__(self):
        self.client_id = os.getenv('GITHUB_CLIENT_ID')
        self.client_secret = os.getenv('GITHUB_CLIENT_SECRET')
        self.callback_url = os.getenv('GITHUB_CALLBACK_URL')
        # print('GITHUB_CLIENT_ID:', self.client_id)
        # print('GITHUB_CLIENT_SECRET:', self.client_secret)
        # print('GITHUB_CALLBACK_URL:', self.callback_url)
        self.security_utils = SecurityUtils()
        
        if not all([self.client_id, self.client_secret, self.callback_url]):
            logger.warning("GitHub OAuth credentials not fully configured")
    
    def get_allowed_origins(self) -> List[str]:
        """Get allowed origins for redirect URI validation."""
        origins = os.getenv('ALLOWED_ORIGINS', '').split(',')
        origins = [origin.strip() for origin in origins if origin.strip()]
        
        # Add default development origins if not in production
        if os.getenv('NODE_ENV') != 'production':
            origins.extend(['http://localhost:3000', 'http://127.0.0.1:3000'])
        
        return origins
    
    def generate_auth_url(self, state: str) -> str:
        """Generate GitHub OAuth authorization URL."""
        params = {
            'client_id': self.client_id,
            'redirect_uri': self.callback_url,
            'scope': 'repo,user,read:org,repo:status,repo_deployment',
            'prompt': 'select_account',
            'state': state
        }
        
        return f"https://github.com/login/oauth/authorize?{urlencode(params)}"
    
    async def exchange_code_for_token(self, code: str) -> Dict[str, Any]:
        """Exchange authorization code for access token."""
        token_url = 'https://github.com/login/oauth/access_token'
        
        data = {
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'code': code,
            'redirect_uri': self.callback_url
        }
        
        headers = {
            'Accept': 'application/json',
            'User-Agent': 'Beetle-AI'
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(token_url, data=data, headers=headers) as response:
                if response.status != 200:
                    raise Exception(f"Token exchange failed: {response.status}")
                
                result = await response.json()
                
                if 'error' in result:
                    raise Exception(f"OAuth error: {result.get('error_description', result['error'])}")
                
                if 'access_token' not in result:
                    raise Exception("No access token in response")
                
                return result
    
    async def get_user_profile(self, access_token: str) -> Dict[str, Any]:
        """Get user profile from GitHub API."""
        headers = {
            'Authorization': f'token {access_token}',
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Beetle-AI'
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.get('https://api.github.com/user', headers=headers) as response:
                if response.status != 200:
                    raise Exception(f"Failed to get user profile: {response.status}")
                
                return await response.json()


class JWTHandler:
    """JWT token handler."""
    
    def __init__(self):
        self.secret_key = os.getenv('JWT_SECRET') or 'a-super-secret-key-for-development'
        self.algorithm = 'HS256'
        self.expire_minutes = int(os.getenv('JWT_EXPIRES_IN_MINUTES', 10080))  # 7 days default
        
        if not os.getenv('JWT_SECRET'):
            logger.warning("Using fixed JWT secret for development. In production, set the JWT_SECRET environment variable.")
    
    def create_access_token(self, data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """Create JWT access token."""
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=self.expire_minutes)
        
        to_encode.update({'exp': expire})
        
        return jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
    
    def verify_token(self, token: str) -> Dict[str, Any]:
        """Verify and decode JWT token."""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except jwt.ExpiredSignatureError:
            raise Exception("Token has expired")
        except jwt.JWTError:
            raise Exception("Invalid token")
    
    def refresh_token(self, token: str) -> str:
        """Refresh JWT token."""
        try:
            # Verify token even if expired
            payload = jwt.decode(
                token, 
                self.secret_key, 
                algorithms=[self.algorithm],
                options={"verify_exp": False}
            )
            
            # Create new token with same payload
            new_payload = {
                'session_id': payload.get('session_id'),
                'github_id': payload.get('github_id'),
                'login': payload.get('login')
            }
            
            return self.create_access_token(new_payload)
        except jwt.JWTError:
            raise Exception("Cannot refresh invalid token")


class RateLimitManager:
    """Rate limiting manager for API endpoints."""
    
    def __init__(self):
        self.requests = {}
        self.cleanup_interval = 300  # 5 minutes
        self._cleanup_task = None
    
    def _start_cleanup_task(self):
        """Start background cleanup task."""
        if self._cleanup_task is not None:
            return  # Task already started
            
        async def cleanup():
            while True:
                await asyncio.sleep(self.cleanup_interval)
                self._cleanup_expired_requests()
        
        try:
            # Only create task if there's a running event loop
            loop = asyncio.get_running_loop()
            self._cleanup_task = loop.create_task(cleanup())
        except RuntimeError:
            # No event loop running, task will be started later when needed
            pass
    
    def _cleanup_expired_requests(self):
        """Remove expired request records."""
        now = datetime.now()
        expired_keys = []
        
        for key, timestamps in self.requests.items():
            # Remove timestamps older than 1 hour
            self.requests[key] = [
                ts for ts in timestamps 
                if (now - ts).total_seconds() < 3600
            ]
            
            if not self.requests[key]:
                expired_keys.append(key)
        
        for key in expired_keys:
            del self.requests[key]
    
    def is_rate_limited(self, identifier: str, max_requests: int = 100, window_minutes: int = 15) -> bool:
        """Check if identifier is rate limited."""
        # Ensure cleanup task is running
        self._start_cleanup_task()
        
        now = datetime.now()
        window_start = now - timedelta(minutes=window_minutes)
        
        if identifier not in self.requests:
            self.requests[identifier] = []
        
        # Filter out old requests
        self.requests[identifier] = [
            ts for ts in self.requests[identifier]
            if ts > window_start
        ]
        
        # Check if over limit
        if len(self.requests[identifier]) >= max_requests:
            return True
        
        # Add current request
        self.requests[identifier].append(now)
        return False
    
    def get_rate_limit_status(self, identifier: str, max_requests: int = 100, window_minutes: int = 15) -> Dict[str, Any]:
        """Get rate limit status for identifier."""
        now = datetime.now()
        window_start = now - timedelta(minutes=window_minutes)
        
        if identifier not in self.requests:
            self.requests[identifier] = []
        
        # Filter current window
        current_requests = [
            ts for ts in self.requests[identifier]
            if ts > window_start
        ]
        
        remaining = max(0, max_requests - len(current_requests))
        reset_time = int((now + timedelta(minutes=window_minutes)).timestamp())
        
        return {
            'limit': max_requests,
            'remaining': remaining,
            'used': len(current_requests),
            'reset': reset_time,
            'reset_date': (now + timedelta(minutes=window_minutes)).isoformat(),
            'is_near_limit': remaining < (max_requests * 0.2),  # Less than 20% remaining
            'is_rate_limited': remaining == 0,
            'window_minutes': window_minutes
        }


# Global instances
security_utils = SecurityUtils()
github_oauth = GitHubOAuth()
jwt_handler = JWTHandler()
rate_limit_manager = RateLimitManager()


def get_demo_user() -> Dict[str, Any]:
    """Get demo user data for development."""
    return {
        'id': 1,
        'github_id': 1,
        'login': 'demo-user',
        'name': 'Demo User',
        'email': 'demo@example.com',
        'avatar_url': 'https://github.com/github.png',
        'bio': 'Demo user for development',
        'location': 'Demo City',
        'company': 'Demo Corp',
        'blog': 'https://demo.com',
        'twitter_username': 'demo',
        'public_repos': 2,
        'followers': 50,
        'following': 25,
        'created_at': '2023-01-01T00:00:00Z',
        'updated_at': datetime.now().isoformat(),
        'last_login': datetime.now().isoformat()
    }


def get_demo_settings() -> Dict[str, Any]:
    """Get demo settings for development."""
    return {
        'profile': {
            'display_name': 'Demo User',
            'bio': 'This is a demo account showing Beetle functionality',
            'location': 'Demo City',
            'website': 'https://beetle-demo.com',
            'company': 'Demo Company',
            'twitter': 'demo_user'
        },
        'notifications': {
            'email_notifications': True,
            'push_notifications': True,
            'weekly_digest': True,
            'pull_request_reviews': True,
            'new_issues': True,
            'mentions': True,
            'security_alerts': True
        },
        'security': {
            'two_factor_enabled': False,
            'session_timeout': 7200000
        },
        'appearance': {
            'theme': 'system',
            'language': 'en',
            'compact_mode': False,
            'show_animations': True,
            'high_contrast': False
        },
        'integrations': {
            'connected_accounts': {
                'github': {'connected': True, 'username': 'demo-user'},
                'gitlab': {'connected': False, 'username': ''},
                'bitbucket': {'connected': False, 'username': ''}
            },
            'webhook_url': '',
            'webhook_secret': ''
        },
        'preferences': {
            'auto_save': True,
            'branch_notifications': True,
            'auto_sync': False,
            'default_branch': 'main'
        },
        'updated_at': datetime.now().isoformat()
    }
