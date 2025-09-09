"""
Base database model and utilities.
Provides common functionality for all database models.
"""

import uuid
from datetime import datetime
from typing import Any, Dict

from sqlalchemy import Column, String, DateTime, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.types import TypeDecorator, TEXT

# Create the declarative base
Base = declarative_base()

class GUID(TypeDecorator):
    """Platform-independent GUID type.
    Uses PostgreSQL's UUID type when available, otherwise uses String.
    """
    impl = String
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(UUID())
        else:
            return dialect.type_descriptor(String(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return str(value)
        else:
            return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        else:
            if not isinstance(value, uuid.UUID):
                return uuid.UUID(value)
            return value

class JSON(TypeDecorator):
    """JSON type that works across different database backends."""
    impl = TEXT
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is not None:
            import json
            return json.dumps(value)
        return value

    def process_result_value(self, value, dialect):
        if value is not None:
            import json
            return json.loads(value)
        return value

class BaseModel:
    """Base model with common fields and utilities."""
    
    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def to_dict(self) -> Dict[str, Any]:
        """Convert model to dictionary."""
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, datetime):
                result[column.name] = value.isoformat()
            elif isinstance(value, uuid.UUID):
                result[column.name] = str(value)
            else:
                result[column.name] = value
        return result

    def update_from_dict(self, data: Dict[str, Any]):
        """Update model from dictionary."""
        for key, value in data.items():
            if hasattr(self, key):
                setattr(self, key, value)

    @classmethod
    def from_pydantic(cls, pydantic_model):
        """Create database model from Pydantic model."""
        data = pydantic_model.dict()
        # Remove fields that don't exist in the database model
        filtered_data = {k: v for k, v in data.items() if hasattr(cls, k)}
        return cls(**filtered_data)

    def to_pydantic(self, pydantic_class):
        """Convert to Pydantic model."""
        data = self.to_dict()
        return pydantic_class(**data)
