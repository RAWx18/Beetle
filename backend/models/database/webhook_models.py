"""
Webhook-related database models.
Maps your existing webhook_models.py Pydantic models to SQLAlchemy.
"""

from sqlalchemy import Column, String, Text, Boolean, DateTime
from datetime import datetime

from .base import Base, BaseModel, JSON

class WebhookEventModel(Base, BaseModel):
    """Webhook event database model for tracking processed events."""
    __tablename__ = "webhook_events"

    # Event identification
    delivery_id = Column(String(255), unique=True, nullable=False, index=True)
    event_type = Column(String(100), nullable=False, index=True)
    
    # Event data
    payload = Column(JSON, nullable=False)  # Dict[str, Any]
    headers = Column(JSON)  # Dict[str, str]
    
    # Processing info
    processed_at = Column(DateTime(timezone=True), default=datetime.now)
    success = Column(Boolean, nullable=False)
    error_message = Column(Text)
    actions_taken = Column(JSON, default=list)  # List[str]
    
    # Security info
    source_ip = Column(String(45))  # IPv4/IPv6
    signature_valid = Column(Boolean, default=False)

class WebhookSecurityLogModel(Base, BaseModel):
    """Webhook security log database model."""
    __tablename__ = "webhook_security_logs"

    # Event identification
    delivery_id = Column(String(255), nullable=False, index=True)
    event_type = Column(String(100), nullable=False)
    
    # Security data
    source_ip = Column(String(45), nullable=False)
    user_agent = Column(Text)
    signature_valid = Column(Boolean, nullable=False)
    timestamp = Column(DateTime(timezone=True), default=datetime.now)
    
    # Additional metadata
    security_level = Column(String(20), default="normal")  # normal, suspicious, blocked
    notes = Column(Text)

