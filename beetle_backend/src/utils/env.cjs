/**
 * Environment Variables Utility
 * Handles validation and loading of environment variables for the AI pipeline
 */

const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * Validate required environment variables
 * @param {string[]} requiredVars - Array of required environment variable names
 * @returns {Object} - Validation result with success status and missing variables
 */
function validateEnvVars(requiredVars = []) {
    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    return {
        success: missing.length === 0,
        missing,
        message: missing.length > 0 
            ? `Missing required environment variables: ${missing.join(', ')}`
            : 'All required environment variables are set'
    };
}

/**
 * Get AI pipeline environment variables with defaults
 * @returns {Object} - AI pipeline configuration object
 */
function getAIConfig() {
    return {
        // Required variables
        github_token: process.env.GITHUB_TOKEN,
        gemini_api_key: process.env.GEMINI_API_KEY,
        
        // Qdrant configuration
        qdrant_url: process.env.QDRANT_URL || 'localhost',
        qdrant_port: parseInt(process.env.QDRANT_PORT) || 6333,
        
        // General AI settings
        max_documents: parseInt(process.env.AI_MAX_DOCUMENTS) || 1000,
        batch_size: parseInt(process.env.AI_BATCH_SIZE) || 32,
        embedding_model: process.env.AI_EMBEDDING_MODEL || 'sentence-transformers/all-MiniLM-L6-v2',
        chat_model: process.env.AI_CHAT_MODEL || 'gemini-2.0-flash',
        
        // Web scraper settings
        max_pages: parseInt(process.env.AI_MAX_PAGES) || 10,
        max_depth: parseInt(process.env.AI_MAX_DEPTH) || 2,
        scraper_timeout: parseInt(process.env.AI_SCRAPER_TIMEOUT) || 30000,
        
        // Format agent settings
        min_content_length: parseInt(process.env.AI_MIN_CONTENT_LENGTH) || 50,
        max_content_length: parseInt(process.env.AI_MAX_CONTENT_LENGTH) || 100000,
        remove_html: process.env.AI_REMOVE_HTML !== 'false',
        detect_language: process.env.AI_DETECT_LANGUAGE !== 'false',
        generate_summary: process.env.AI_GENERATE_SUMMARY !== 'false',
        
        // Embedding settings
        collection_name: process.env.AI_COLLECTION_NAME || 'documents',
        
        // Retrieval settings
        use_hybrid_search: process.env.AI_USE_HYBRID_SEARCH !== 'false',
        keyword_weight: parseFloat(process.env.AI_KEYWORD_WEIGHT) || 0.3,
        vector_weight: parseFloat(process.env.AI_VECTOR_WEIGHT) || 0.7,
        
        // Prompt rewriter settings
        max_context_length: parseInt(process.env.AI_MAX_CONTEXT_LENGTH) || 4000,
        max_sources: parseInt(process.env.AI_MAX_SOURCES) || 5,
        include_citations: process.env.AI_INCLUDE_CITATIONS !== 'false',
        include_confidence: process.env.AI_INCLUDE_CONFIDENCE !== 'false',
        
        // Answering settings
        max_tokens: parseInt(process.env.AI_MAX_TOKENS) || 1000,
        temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.7,
        top_p: parseFloat(process.env.AI_TOP_P) || 0.9,
        top_k: parseInt(process.env.AI_TOP_K) || 40
    };
}

/**
 * Validate AI pipeline environment variables
 * @returns {Object} - Validation result
 */
function validateAIConfig() {
    const requiredVars = ['GEMINI_API_KEY'];
    return validateEnvVars(requiredVars);
}

/**
 * Print environment configuration status
 */
function printEnvStatus() {
    const aiConfig = getAIConfig();
    const validation = validateAIConfig();
    
    console.log('\n🔧 Environment Configuration Status:');
    console.log('=====================================');
    
    if (validation.success) {
        console.log('✅ Required variables: All set');
    } else {
        console.log('❌ Required variables: Missing');
        validation.missing.forEach(varName => {
            console.log(`   - ${varName}`);
        });
    }
    
    console.log('\n📋 AI Pipeline Configuration:');
            console.log(`   GitHub Token: ✅ Using user's GitHub access token from session`);
    console.log(`   Gemini API Key: ${aiConfig.gemini_api_key ? '✅ Set' : '❌ Missing'}`);
    console.log(`   Qdrant URL: ${aiConfig.qdrant_url}:${aiConfig.qdrant_port}`);
    console.log(`   Embedding Model: ${aiConfig.embedding_model}`);
    console.log(`   Chat Model: ${aiConfig.chat_model}`);
    console.log(`   Batch Size: ${aiConfig.batch_size}`);
    console.log(`   Max Documents: ${aiConfig.max_documents}`);
    
    console.log('\n⚙️  Advanced Settings:');
    console.log(`   Web Scraper: ${aiConfig.max_pages} pages, ${aiConfig.max_depth} depth`);
    console.log(`   Content Length: ${aiConfig.min_content_length}-${aiConfig.max_content_length}`);
    console.log(`   Hybrid Search: ${aiConfig.use_hybrid_search ? 'Enabled' : 'Disabled'}`);
    console.log(`   Context Length: ${aiConfig.max_context_length}`);
    console.log(`   Max Tokens: ${aiConfig.max_tokens}`);
    console.log(`   Temperature: ${aiConfig.temperature}`);
    
    return validation.success;
}

/**
 * Get environment variable with type conversion
 * @param {string} key - Environment variable name
 * @param {string} type - Type to convert to ('string', 'number', 'boolean')
 * @param {any} defaultValue - Default value if not set
 * @returns {any} - Converted value
 */
function getEnvVar(key, type = 'string', defaultValue = null) {
    const value = process.env[key];
    
    if (value === undefined || value === null) {
        return defaultValue;
    }
    
    switch (type) {
        case 'number':
            return parseInt(value) || defaultValue;
        case 'boolean':
            return value === 'true' || value === '1';
        case 'float':
            return parseFloat(value) || defaultValue;
        default:
            return value;
    }
}

/**
 * Check if AI pipeline is properly configured
 * @returns {boolean} - True if properly configured
 */
function isAIPipelineConfigured() {
    const validation = validateAIConfig();
    return validation.success;
}

module.exports = {
    validateEnvVars,
    getAIConfig,
    validateAIConfig,
    printEnvStatus,
    getEnvVar,
    isAIPipelineConfigured
}; 