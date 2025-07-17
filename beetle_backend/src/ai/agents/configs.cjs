// Export all agent configurations for easy importing

const { AgentConfig } = require('./base_agent.cjs');

class WebScraperConfig extends AgentConfig {
    constructor(config = {}) {
        super({
            name: config.name || "web_scraper",
            max_retries: config.max_retries || 3,
            retry_delay: config.retry_delay || 1.0,
            timeout: config.timeout || 30.0,
            batch_size: config.batch_size || 100,
            enable_logging: config.enable_logging !== false,
            ...config
        });
        
        this.max_pages = config.max_pages || 10;
        this.max_depth = config.max_depth || 2;
        this.timeout = config.timeout || 30000;
        this.user_agent = config.user_agent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
        this.wait_for_selector = config.wait_for_selector;
        this.extract_links = config.extract_links !== false;
        this.follow_same_domain = config.follow_same_domain !== false;
        this.content_selectors = config.content_selectors || [
            'article', 'main', '.content', '.post', '.entry',
            'div[role="main"]', '.article', '.blog-post'
        ];
        this.exclude_selectors = config.exclude_selectors || [
            'nav', 'header', 'footer', '.sidebar', '.menu',
            '.advertisement', '.ads', '.social', '.comments'
        ];
    }
}

class FormatAgentConfig extends AgentConfig {
    constructor(config = {}) {
        super({
            name: config.name || "format_agent",
            max_retries: config.max_retries || 3,
            retry_delay: config.retry_delay || 1.0,
            timeout: config.timeout || 30.0,
            batch_size: config.batch_size || 100,
            enable_logging: config.enable_logging !== false,
            ...config
        });
        
        this.min_content_length = config.min_content_length || 50;
        this.max_content_length = config.max_content_length || 100000;
        this.remove_html = config.remove_html !== false;
        this.remove_urls = config.remove_urls || false;
        this.remove_emails = config.remove_emails || false;
        this.remove_phone_numbers = config.remove_phone_numbers || false;
        this.normalize_whitespace = config.normalize_whitespace !== false;
        this.detect_language = config.detect_language !== false;
        this.generate_summary = config.generate_summary !== false;
        this.summary_max_length = config.summary_max_length || 200;
        this.extract_tags = config.extract_tags !== false;
        this.common_tags = config.common_tags || [
            'code', 'documentation', 'readme', 'api', 'config', 'test',
            'frontend', 'backend', 'database', 'deployment', 'security',
            'performance', 'bug', 'feature', 'refactor', 'docs'
        ];
    }
}

class EmbeddingAgentConfig extends AgentConfig {
    constructor(config = {}) {
        super({
            name: config.name || "embedding_agent",
            max_retries: config.max_retries || 3,
            retry_delay: config.retry_delay || 1.0,
            timeout: config.timeout || 30.0,
            batch_size: config.batch_size || 100,
            enable_logging: config.enable_logging !== false,
            ...config
        });
        
        this.model_name = config.model_name || "sentence-transformers/all-MiniLM-L6-v2";
        this.batch_size = config.batch_size || 32;
        this.max_length = config.max_length || 512;
        this.normalize_embeddings = config.normalize_embeddings !== false;
        this.qdrant_url = config.qdrant_url || "localhost";
        this.qdrant_port = config.qdrant_port || 6333;
        this.collection_name = config.collection_name || "documents";
        this.vector_size = config.vector_size || 384;
        this.distance_metric = config.distance_metric || "COSINE";
    }
}

class RetrievalAgentConfig extends AgentConfig {
    constructor(config = {}) {
        super({
            name: config.name || "retrieval_agent",
            max_retries: config.max_retries || 3,
            retry_delay: config.retry_delay || 1.0,
            timeout: config.timeout || 30.0,
            batch_size: config.batch_size || 100,
            enable_logging: config.enable_logging !== false,
            ...config
        });
        
        this.model_name = config.model_name || "sentence-transformers/all-MiniLM-L6-v2";
        this.qdrant_url = config.qdrant_url || "localhost";
        this.qdrant_port = config.qdrant_port || 6333;
        this.collection_name = config.collection_name || "documents";
        this.default_limit = config.default_limit || 10;
        this.max_limit = config.max_limit || 50;
        this.min_score = config.min_score || 0.3;
        this.use_hybrid_search = config.use_hybrid_search !== false;
        this.keyword_weight = config.keyword_weight || 0.3;
        this.vector_weight = config.vector_weight || 0.7;
    }
}

class PromptRewriterConfig extends AgentConfig {
    constructor(config = {}) {
        super({
            name: config.name || "prompt_rewriter",
            max_retries: config.max_retries || 3,
            retry_delay: config.retry_delay || 1.0,
            timeout: config.timeout || 30.0,
            batch_size: config.batch_size || 100,
            enable_logging: config.enable_logging !== false,
            ...config
        });
        
        this.max_context_length = config.max_context_length || 4000;
        this.max_sources = config.max_sources || 5;
        this.include_citations = config.include_citations !== false;
        this.include_confidence = config.include_confidence !== false;
        this.style_guide = config.style_guide || "concise and professional";
        this.system_prompt_template = config.system_prompt_template || `You are a helpful AI assistant that answers questions based on the provided context. 
Your responses should be:
- Accurate and based on the provided sources
- Concise and well-structured
- Professional in tone
- Include citations when referencing specific information
- Say "I don't have enough information to answer this question" if the context doesn't contain relevant information

Context sources: {sources}

Question: {question}

Answer:`;
        this.context_format = config.context_format || "Source {index}: {content} (from {source_type})";
        this.citation_format = config.citation_format || "[Source {index}]";
    }
}

class AnsweringAgentConfig extends AgentConfig {
    constructor(config = {}) {
        super({
            name: config.name || "answering_agent",
            max_retries: config.max_retries || 3,
            retry_delay: config.retry_delay || 1.0,
            timeout: config.timeout || 30.0,
            batch_size: config.batch_size || 100,
            enable_logging: config.enable_logging !== false,
            ...config
        });
        
        this.api_key = config.api_key;
        this.model_name = config.model_name || "gemini-2.0-flash";
        this.max_tokens = config.max_tokens || 1000;
        this.temperature = config.temperature || 0.7;
        this.top_p = config.top_p || 0.9;
        this.top_k = config.top_k || 40;
        this.safety_settings = config.safety_settings || [
            {
                "category": "HARM_CATEGORY_HARASSMENT",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                "category": "HARM_CATEGORY_HATE_SPEECH",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE"
            }
        ];
        this.retry_on_error = config.retry_on_error !== false;
        this.max_retries = config.max_retries || 3;
        this.confidence_threshold = config.confidence_threshold || 0.3;
    }
}

module.exports = {
    WebScraperConfig,
    FormatAgentConfig,
    EmbeddingAgentConfig,
    RetrievalAgentConfig,
    PromptRewriterConfig,
    AnsweringAgentConfig
}; 