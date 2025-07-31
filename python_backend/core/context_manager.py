from typing import List, Dict
import structlog

logger = structlog.get_logger(__name__)

class ContextWindow:
    def __init__(self, max_tokens: int = 4096, model: str = "gpt-4o-mini"):
        self.max_tokens = max_tokens
        self.model = model
        try:
            import litellm
            self.token_counter = lambda text: litellm.token_counter(model=self.model, text=text)
        except ImportError:
            self.token_counter = lambda text: len(text.split()) * 1.3

    def count_tokens(self, messages: List[Dict]) -> int:
        text = " ".join([m.get("content", "") for m in messages])
        return int(self.token_counter(text))

    def truncate(self, messages: List[Dict]) -> List[Dict]:
        # Truncate messages to fit within max_tokens
        total_tokens = 0
        truncated = []
        for m in reversed(messages):
            tokens = int(self.token_counter(m.get("content", "")))
            if total_tokens + tokens > self.max_tokens:
                break
            truncated.insert(0, m)
            total_tokens += tokens
        if total_tokens > self.max_tokens:
            logger.warning("ContextWindow: Truncated messages to fit token limit.")
        return truncated 