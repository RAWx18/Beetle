"""
Service URL management and health check system.
Handles service discovery, health monitoring, and connection management.
"""

import asyncio
import httpx
from typing import Dict, Optional, List, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta
import structlog
from config.settings import get_settings

logger = structlog.get_logger(__name__)
settings = get_settings()


@dataclass
class ServiceHealth:
    """Service health status information."""
    service_name: str
    url: str
    is_healthy: bool
    response_time: Optional[float] = None
    last_check: Optional[datetime] = None
    error_message: Optional[str] = None


class ServiceURLManager:
    """Manages service URLs and health monitoring."""
    
    def __init__(self):
        self.services: Dict[str, str] = {
            "qdrant": settings.qdrant_url,
            "redis": settings.redis_url,
        }
        self.health_cache: Dict[str, ServiceHealth] = {}
        self.health_check_interval = 30  # seconds
        
    async def check_service_health(self, service_name: str, url: str) -> ServiceHealth:
        """Check the health of a specific service."""
        start_time = datetime.now()
        
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                if service_name == "qdrant":
                    # Qdrant health check
                    response = await client.get(f"{url}/collections")
                    is_healthy = response.status_code == 200
                elif service_name == "redis":
                    # Redis health check (simplified)
                    is_healthy = True  # Will be checked by Redis client
                else:
                    # Generic health check
                    response = await client.get(f"{url}/health")
                    is_healthy = response.status_code == 200
                
                response_time = (datetime.now() - start_time).total_seconds()
                
                health = ServiceHealth(
                    service_name=service_name,
                    url=url,
                    is_healthy=is_healthy,
                    response_time=response_time,
                    last_check=datetime.now()
                )
                
        except Exception as e:
            health = ServiceHealth(
                service_name=service_name,
                url=url,
                is_healthy=False,
                last_check=datetime.now(),
                error_message=str(e)
            )
            logger.warning(f"Service health check failed", service=service_name, error=str(e))
        
        self.health_cache[service_name] = health
        return health
    
    async def check_all_services(self) -> Dict[str, ServiceHealth]:
        """Check health of all registered services."""
        tasks = []
        for service_name, url in self.services.items():
            task = self.check_service_health(service_name, url)
            tasks.append(task)
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        health_status = {}
        for i, (service_name, url) in enumerate(self.services.items()):
            if isinstance(results[i], Exception):
                health_status[service_name] = ServiceHealth(
                    service_name=service_name,
                    url=url,
                    is_healthy=False,
                    last_check=datetime.now(),
                    error_message=str(results[i])
                )
            else:
                health_status[service_name] = results[i]
        
        return health_status
    
    def get_service_url(self, service_name: str) -> Optional[str]:
        """Get the URL for a specific service."""
        return self.services.get(service_name)
    
    def is_service_healthy(self, service_name: str) -> bool:
        """Check if a service is healthy based on cached health status."""
        health = self.health_cache.get(service_name)
        if not health:
            return False
        
        # Consider health stale if older than 5 minutes
        if health.last_check and datetime.now() - health.last_check > timedelta(minutes=5):
            return False
        
        return health.is_healthy
    
    def get_health_summary(self) -> Dict[str, bool]:
        """Get a summary of all service health statuses."""
        return {
            service_name: self.is_service_healthy(service_name)
            for service_name in self.services.keys()
        }


# Global service manager instance
service_manager = ServiceURLManager()


def get_service_manager() -> ServiceURLManager:
    """Get the global service manager instance."""
    return service_manager


async def health_check_task():
    """Background task for periodic health checks."""
    while True:
        try:
            await service_manager.check_all_services()
            logger.info("Health check completed", services=list(service_manager.services.keys()))
        except Exception as e:
            logger.error("Health check failed", error=str(e))
        
        await asyncio.sleep(service_manager.health_check_interval)
