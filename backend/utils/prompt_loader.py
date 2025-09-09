"""
Enhanced prompt management system with template caching and context-aware rendering.
"""

from jinja2 import Environment, FileSystemLoader, Template
import os
import structlog
from typing import Dict, Any, Optional
from functools import lru_cache

logger = structlog.get_logger(__name__)

PROMPT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "prompts")
env = Environment(loader=FileSystemLoader(PROMPT_DIR))

# Template cache for performance
_template_cache: Dict[str, Template] = {}


def render_prompt(template_name: str, context: dict) -> str:
    """Render a prompt template with the given context."""
    try:
        template = _get_template(template_name)
        return template.render(**context)
    except Exception as e:
        logger.error(f"Failed to render prompt template {template_name}", error=str(e))
        return f"Error rendering template {template_name}: {str(e)}"


@lru_cache(maxsize=50)
def _get_template(template_name: str) -> Template:
    """Get a template from cache or load it."""
    if template_name not in _template_cache:
        try:
            _template_cache[template_name] = env.get_template(template_name)
            logger.debug(f"Loaded template: {template_name}")
        except Exception as e:
            logger.error(f"Failed to load template {template_name}", error=str(e))
            raise
    return _template_cache[template_name]


def get_available_templates() -> list:
    """Get list of available prompt templates."""
    try:
        return [f for f in os.listdir(PROMPT_DIR) if f.endswith('.j2')]
    except Exception as e:
        logger.error(f"Failed to list templates", error=str(e))
        return []


def validate_template(template_name: str, context: dict) -> bool:
    """Validate that a template can be rendered with the given context."""
    try:
        template = _get_template(template_name)
        template.render(**context)
        return True
    except Exception as e:
        logger.error(f"Template validation failed for {template_name}", error=str(e))
        return False


def render_prompt_with_fallback(template_name: str, context: dict, fallback_template: str = None) -> str:
    """Render a prompt with fallback to a simpler template if needed."""
    try:
        return render_prompt(template_name, context)
    except Exception as e:
        logger.warning(f"Primary template {template_name} failed, using fallback", error=str(e))
        if fallback_template:
            try:
                return render_prompt(fallback_template, context)
            except Exception as e2:
                logger.error(f"Fallback template also failed", error=str(e2))
        
        # Ultimate fallback
        return f"System prompt for: {context.get('query', 'unknown query')}"


def clear_template_cache():
    """Clear the template cache."""
    global _template_cache
    _template_cache.clear()
    logger.info("Template cache cleared") 