from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field
from enum import Enum


class ModelProvider(str, Enum):
    """Supported model providers"""
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    HUGGINGFACE = "huggingface"
    LOCAL = "local"


class ModelType(str, Enum):
    """Model types"""
    CHAT = "chat"
    COMPLETION = "completion"
    EMBEDDING = "embedding"
    CODE = "code"


class ModelConfig(BaseModel):
    """Base model configuration"""
    name: str = Field(..., description="Model name")
    provider: ModelProvider = Field(..., description="Model provider")
    model_type: ModelType = Field(..., description="Model type")
    version: str = Field(default="latest", description="Model version")
    
    # Performance settings
    max_tokens: int = Field(default=4096, description="Maximum tokens")
    temperature: float = Field(default=0.7, description="Temperature")
    top_p: float = Field(default=1.0, description="Top-p sampling")
    frequency_penalty: float = Field(default=0.0, description="Frequency penalty")
    presence_penalty: float = Field(default=0.0, description="Presence penalty")
    
    # Resource settings
    requires_gpu: bool = Field(default=False, description="Requires GPU")
    memory_requirement: Optional[int] = Field(None, description="Memory requirement in MB")
    batch_size: int = Field(default=1, description="Batch size")
    
    # Cost settings
    cost_per_1k_tokens: Optional[float] = Field(None, description="Cost per 1k tokens")
    cost_per_1k_embeddings: Optional[float] = Field(None, description="Cost per 1k embeddings")
    
    # Metadata
    description: str = Field(default="", description="Model description")
    capabilities: List[str] = Field(default_factory=list, description="Model capabilities")
    limitations: List[str] = Field(default_factory=list, description="Model limitations")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")


class LLMConfig(ModelConfig):
    """LLM-specific configuration"""
    model_type: ModelType = Field(default=ModelType.CHAT, description="Model type")
    
    # LLM-specific settings
    context_window: int = Field(default=8192, description="Context window size")
    supports_function_calling: bool = Field(default=False, description="Supports function calling")
    supports_streaming: bool = Field(default=True, description="Supports streaming")
    supports_vision: bool = Field(default=False, description="Supports vision")
    
    # Prompt settings
    system_prompt: str = Field(default="", description="Default system prompt")
    max_prompt_length: int = Field(default=4096, description="Maximum prompt length")
    
    # Safety settings
    content_filter: bool = Field(default=True, description="Enable content filtering")
    safety_level: str = Field(default="medium", description="Safety level")


class EmbeddingConfig(ModelConfig):
    """Embedding model configuration"""
    model_type: ModelType = Field(default=ModelType.EMBEDDING, description="Model type")
    
    # Embedding-specific settings
    embedding_dimension: int = Field(..., description="Embedding dimension")
    max_sequence_length: int = Field(default=512, description="Maximum sequence length")
    normalize_embeddings: bool = Field(default=True, description="Normalize embeddings")
    
    # Performance settings
    batch_size: int = Field(default=32, description="Batch size for embeddings")
    use_gpu: bool = Field(default=False, description="Use GPU for embeddings")
    
    # Quality settings
    similarity_metric: str = Field(default="cosine", description="Similarity metric")
    supports_semantic_search: bool = Field(default=True, description="Supports semantic search")


class CodeModelConfig(ModelConfig):
    """Code-specific model configuration"""
    model_type: ModelType = Field(default=ModelType.CODE, description="Model type")
    
    # Code-specific settings
    supported_languages: List[str] = Field(default_factory=list, description="Supported programming languages")
    supports_code_completion: bool = Field(default=True, description="Supports code completion")
    supports_code_generation: bool = Field(default=True, description="Supports code generation")
    supports_code_analysis: bool = Field(default=True, description="Supports code analysis")
    
    # Context settings
    max_context_lines: int = Field(default=1000, description="Maximum context lines")
    supports_ast_analysis: bool = Field(default=False, description="Supports AST analysis")
    
    # Code quality
    code_quality_metrics: List[str] = Field(default_factory=list, description="Code quality metrics")


class ModelRegistry:
    """Model registry with predefined configurations"""
    
    # OpenAI Models
    GPT_4 = LLMConfig(
        name="gpt-4",
        provider=ModelProvider.OPENAI,
        model_type=ModelType.CHAT,
        context_window=8192,
        max_tokens=4096,
        temperature=0.7,
        supports_function_calling=True,
        supports_streaming=True,
        cost_per_1k_tokens=0.03,
        description="GPT-4 model for advanced reasoning and complex tasks"
    )
    
    GPT_4_TURBO = LLMConfig(
        name="gpt-4-turbo-preview",
        provider=ModelProvider.OPENAI,
        model_type=ModelType.CHAT,
        context_window=128000,
        max_tokens=4096,
        temperature=0.7,
        supports_function_calling=True,
        supports_streaming=True,
        cost_per_1k_tokens=0.01,
        description="GPT-4 Turbo for faster and more cost-effective processing"
    )
    
    GPT_3_5_TURBO = LLMConfig(
        name="gpt-3.5-turbo",
        provider=ModelProvider.OPENAI,
        model_type=ModelType.CHAT,
        context_window=4096,
        max_tokens=4096,
        temperature=0.7,
        supports_function_calling=True,
        supports_streaming=True,
        cost_per_1k_tokens=0.002,
        description="GPT-3.5 Turbo for efficient text processing"
    )
    
    # Anthropic Models
    CLAUDE_3_OPUS = LLMConfig(
        name="claude-3-opus-20240229",
        provider=ModelProvider.ANTHROPIC,
        model_type=ModelType.CHAT,
        context_window=200000,
        max_tokens=4096,
        temperature=0.7,
        supports_function_calling=True,
        supports_streaming=True,
        cost_per_1k_tokens=0.015,
        description="Claude 3 Opus for highly complex tasks"
    )
    
    CLAUDE_3_SONNET = LLMConfig(
        name="claude-3-sonnet-20240229",
        provider=ModelProvider.ANTHROPIC,
        model_type=ModelType.CHAT,
        context_window=200000,
        max_tokens=4096,
        temperature=0.7,
        supports_function_calling=True,
        supports_streaming=True,
        cost_per_1k_tokens=0.003,
        description="Claude 3 Sonnet for balanced performance and cost"
    )
    
    CLAUDE_3_HAIKU = LLMConfig(
        name="claude-3-haiku-20240307",
        provider=ModelProvider.ANTHROPIC,
        model_type=ModelType.CHAT,
        context_window=200000,
        max_tokens=4096,
        temperature=0.7,
        supports_function_calling=True,
        supports_streaming=True,
        cost_per_1k_tokens=0.00025,
        description="Claude 3 Haiku for fast and cost-effective processing"
    )
    
    # Embedding Models
    OPENAI_ADA_002 = EmbeddingConfig(
        name="text-embedding-ada-002",
        provider=ModelProvider.OPENAI,
        model_type=ModelType.EMBEDDING,
        embedding_dimension=1536,
        max_sequence_length=8191,
        normalize_embeddings=True,
        cost_per_1k_embeddings=0.0001,
        description="OpenAI Ada-002 embedding model"
    )
    
    OPENAI_ADA_003_SMALL = EmbeddingConfig(
        name="text-embedding-3-small",
        provider=ModelProvider.OPENAI,
        model_type=ModelType.EMBEDDING,
        embedding_dimension=1536,
        max_sequence_length=8191,
        normalize_embeddings=True,
        cost_per_1k_embeddings=0.00002,
        description="OpenAI Ada-003 small embedding model"
    )
    
    OPENAI_ADA_003_LARGE = EmbeddingConfig(
        name="text-embedding-3-large",
        provider=ModelProvider.OPENAI,
        model_type=ModelType.EMBEDDING,
        embedding_dimension=3072,
        max_sequence_length=8191,
        normalize_embeddings=True,
        cost_per_1k_embeddings=0.00013,
        description="OpenAI Ada-003 large embedding model"
    )
    
    SENTENCE_TRANSFORMERS = EmbeddingConfig(
        name="sentence-transformers/all-MiniLM-L6-v2",
        provider=ModelProvider.HUGGINGFACE,
        model_type=ModelType.EMBEDDING,
        embedding_dimension=384,
        max_sequence_length=256,
        normalize_embeddings=True,
        cost_per_1k_embeddings=0.0,  # Free local model
        description="Sentence Transformers for local embedding generation"
    )
    
    CODE_BERT = EmbeddingConfig(
        name="microsoft/codebert-base",
        provider=ModelProvider.HUGGINGFACE,
        model_type=ModelType.EMBEDDING,
        embedding_dimension=768,
        max_sequence_length=512,
        normalize_embeddings=True,
        cost_per_1k_embeddings=0.0,  # Free local model
        description="CodeBERT for code-specific embeddings"
    )
    
    # Code Models
    STARCODER = CodeModelConfig(
        name="bigcode/starcoder",
        provider=ModelProvider.HUGGINGFACE,
        model_type=ModelType.CODE,
        context_window=8192,
        max_tokens=2048,
        temperature=0.7,
        supported_languages=["python", "javascript", "typescript", "java", "cpp", "c", "go", "rust", "php", "ruby", "swift", "kotlin", "scala", "r", "matlab", "sql", "shell", "yaml", "json", "xml", "html", "css", "scss", "sass", "less"],
        supports_code_completion=True,
        supports_code_generation=True,
        supports_code_analysis=True,
        max_context_lines=1000,
        code_quality_metrics=["complexity", "maintainability", "readability", "security"],
        description="StarCoder for code generation and analysis"
    )
    
    CODE_LLAMA = CodeModelConfig(
        name="codellama/CodeLlama-7b-hf",
        provider=ModelProvider.HUGGINGFACE,
        model_type=ModelType.CODE,
        context_window=16384,
        max_tokens=2048,
        temperature=0.7,
        supported_languages=["python", "javascript", "typescript", "java", "cpp", "c", "go", "rust", "php", "ruby", "swift", "kotlin", "scala", "r", "matlab", "sql", "shell", "yaml", "json", "xml", "html", "css", "scss", "sass", "less"],
        supports_code_completion=True,
        supports_code_generation=True,
        supports_code_analysis=True,
        max_context_lines=2000,
        code_quality_metrics=["complexity", "maintainability", "readability", "security", "performance"],
        description="Code Llama for advanced code generation and analysis"
    )
    
    @classmethod
    def get_model_config(cls, model_name: str) -> Optional[ModelConfig]:
        """Get model configuration by name"""
        for attr_name in dir(cls):
            attr = getattr(cls, attr_name)
            if isinstance(attr, ModelConfig) and attr.name == model_name:
                return attr
        return None
    
    @classmethod
    def get_models_by_type(cls, model_type: ModelType) -> List[ModelConfig]:
        """Get all models of a specific type"""
        models = []
        for attr_name in dir(cls):
            attr = getattr(cls, attr_name)
            if isinstance(attr, ModelConfig) and attr.model_type == model_type:
                models.append(attr)
        return models
    
    @classmethod
    def get_models_by_provider(cls, provider: ModelProvider) -> List[ModelConfig]:
        """Get all models from a specific provider"""
        models = []
        for attr_name in dir(cls):
            attr = getattr(cls, attr_name)
            if isinstance(attr, ModelConfig) and attr.provider == provider:
                models.append(attr)
        return models


# Model selection strategies
class ModelSelectionStrategy:
    """Strategies for model selection"""
    
    @staticmethod
    def select_by_cost(available_models: List[ModelConfig], max_cost: float) -> List[ModelConfig]:
        """Select models within cost budget"""
        return [model for model in available_models if model.cost_per_1k_tokens and model.cost_per_1k_tokens <= max_cost]
    
    @staticmethod
    def select_by_performance(available_models: List[ModelConfig], min_context_window: int) -> List[ModelConfig]:
        """Select models meeting performance requirements"""
        return [model for model in available_models if hasattr(model, 'context_window') and model.context_window >= min_context_window]
    
    @staticmethod
    def select_by_capability(available_models: List[ModelConfig], required_capabilities: List[str]) -> List[ModelConfig]:
        """Select models with required capabilities"""
        return [model for model in available_models if all(cap in model.capabilities for cap in required_capabilities)]
    
    @staticmethod
    def select_optimal(available_models: List[ModelConfig], task_type: str) -> Optional[ModelConfig]:
        """Select optimal model for task type"""
        if task_type == "chat":
            # Prefer models with function calling and streaming
            candidates = [m for m in available_models if m.supports_function_calling and m.supports_streaming]
            if candidates:
                return min(candidates, key=lambda x: x.cost_per_1k_tokens or float('inf'))
        
        elif task_type == "embedding":
            # Prefer models with higher dimensions for better quality
            candidates = [m for m in available_models if isinstance(m, EmbeddingConfig)]
            if candidates:
                return max(candidates, key=lambda x: x.embedding_dimension)
        
        elif task_type == "code":
            # Prefer models with code-specific capabilities
            candidates = [m for m in available_models if isinstance(m, CodeModelConfig)]
            if candidates:
                return max(candidates, key=lambda x: len(x.supported_languages))
        
        # Fallback to first available model
        return available_models[0] if available_models else None 