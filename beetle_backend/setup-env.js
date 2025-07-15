#!/usr/bin/env node

/**
 * Environment Setup Script for Beetle AI Pipeline
 * This script helps users create their .env file with the required configuration
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

async function setupEnvironment() {
    console.log('🚀 Beetle AI Pipeline Environment Setup');
    console.log('=====================================\n');
    
    console.log('This script will help you create a .env file with the required configuration for the AI pipeline.\n');
    
    const envPath = path.join(__dirname, '.env');
    
    // Check if .env already exists
    if (fs.existsSync(envPath)) {
        const overwrite = await question('⚠️  .env file already exists. Do you want to overwrite it? (y/N): ');
        if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
            console.log('❌ Setup cancelled. Existing .env file preserved.');
            rl.close();
            return;
        }
    }
    
    console.log('\n📋 Required Configuration:\n');
    
    // Server Configuration
    const port = await question('Server Port (default: 3001): ') || '3001';
    const nodeEnv = await question('Node Environment (default: development): ') || 'development';
    
    // GitHub Configuration
    console.log('\n🔑 GitHub Configuration:');
    console.log('You need GitHub OAuth app credentials for user authentication.');
    console.log('Create one at: https://github.com/settings/developers\n');
    
    const githubClientId = await question('GitHub Client ID: ');
    const githubClientSecret = await question('GitHub Client Secret: ');
    
    console.log('ℹ️  Note: GitHub Personal Access Token is not needed for the AI pipeline.');
    console.log('   The AI pipeline uses the user\'s GitHub access token from their OAuth session.');
    
    // JWT Configuration
    console.log('\n🔐 JWT Configuration:');
    const jwtSecret = await question('JWT Secret (default: your_jwt_secret_key_here): ') || 'your_jwt_secret_key_here';
    const jwtExpiresIn = await question('JWT Expires In (default: 7d): ') || '7d';
    
    // AI Pipeline Configuration
    console.log('\n🤖 AI Pipeline Configuration:');
    console.log('You need a Google Gemini API key.');
    console.log('Get one at: https://makersuite.google.com/app/apikey\n');
    
    const geminiApiKey = await question('Google Gemini API Key: ');
    
    // Qdrant Configuration
    console.log('\n🗄️  Qdrant Vector Database Configuration:');
    const qdrantUrl = await question('Qdrant URL (default: localhost): ') || 'localhost';
    const qdrantPort = await question('Qdrant Port (default: 6333): ') || '6333';
    
    // AI Settings
    console.log('\n⚙️  AI Pipeline Settings:');
    const maxDocuments = await question('Max Documents (default: 1000): ') || '1000';
    const batchSize = await question('Batch Size (default: 32): ') || '32';
    const embeddingModel = await question('Embedding Model (default: sentence-transformers/all-MiniLM-L6-v2): ') || 'sentence-transformers/all-MiniLM-L6-v2';
    const chatModel = await question('Chat Model (default: gemini-2.0-flash): ') || 'gemini-2.0-flash';
    
    // Advanced Settings
    console.log('\n🔧 Advanced Settings (press Enter for defaults):');
    const maxPages = await question('Max Pages for Web Scraping (default: 10): ') || '10';
    const maxDepth = await question('Max Depth for Web Scraping (default: 2): ') || '2';
    const scraperTimeout = await question('Web Scraper Timeout (default: 30000): ') || '30000';
    const minContentLength = await question('Min Content Length (default: 50): ') || '50';
    const maxContentLength = await question('Max Content Length (default: 100000): ') || '100000';
    const removeHtml = await question('Remove HTML (default: true): ') || 'true';
    const detectLanguage = await question('Detect Language (default: true): ') || 'true';
    const generateSummary = await question('Generate Summary (default: true): ') || 'true';
    const collectionName = await question('Qdrant Collection Name (default: documents): ') || 'documents';
    const useHybridSearch = await question('Use Hybrid Search (default: true): ') || 'true';
    const keywordWeight = await question('Keyword Weight (default: 0.3): ') || '0.3';
    const vectorWeight = await question('Vector Weight (default: 0.7): ') || '0.7';
    const maxContextLength = await question('Max Context Length (default: 4000): ') || '4000';
    const maxSources = await question('Max Sources (default: 5): ') || '5';
    const includeCitations = await question('Include Citations (default: true): ') || 'true';
    const includeConfidence = await question('Include Confidence (default: true): ') || 'true';
    const maxTokens = await question('Max Tokens (default: 1000): ') || '1000';
    const temperature = await question('Temperature (default: 0.7): ') || '0.7';
    const topP = await question('Top P (default: 0.9): ') || '0.9';
    const topK = await question('Top K (default: 40): ') || '40';
    
    // Generate .env content
    const envContent = `# Server Configuration
PORT=${port}
NODE_ENV=${nodeEnv}

# GitHub OAuth Configuration
GITHUB_CLIENT_ID=${githubClientId}
GITHUB_CLIENT_SECRET=${githubClientSecret}
GITHUB_CALLBACK_URL=http://localhost:${port}/auth/github/callback

# JWT Configuration
JWT_SECRET=${jwtSecret}
JWT_EXPIRES_IN=${jwtExpiresIn}

# Database Configuration (Local JSON storage)
DB_PATH=./data/beetle_db.json

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Cache Configuration
CACHE_TTL=3600

# AI Pipeline Configuration
GEMINI_API_KEY=${geminiApiKey}
QDRANT_URL=${qdrantUrl}
QDRANT_PORT=${qdrantPort}

# AI Pipeline Settings
AI_MAX_DOCUMENTS=${maxDocuments}
AI_BATCH_SIZE=${batchSize}
AI_EMBEDDING_MODEL=${embeddingModel}
AI_CHAT_MODEL=${chatModel}

# AI Web Scraper Settings
AI_MAX_PAGES=${maxPages}
AI_MAX_DEPTH=${maxDepth}
AI_SCRAPER_TIMEOUT=${scraperTimeout}

# AI Format Agent Settings
AI_MIN_CONTENT_LENGTH=${minContentLength}
AI_MAX_CONTENT_LENGTH=${maxContentLength}
AI_REMOVE_HTML=${removeHtml}
AI_DETECT_LANGUAGE=${detectLanguage}
AI_GENERATE_SUMMARY=${generateSummary}

# AI Embedding Settings
AI_COLLECTION_NAME=${collectionName}

# AI Retrieval Settings
AI_USE_HYBRID_SEARCH=${useHybridSearch}
AI_KEYWORD_WEIGHT=${keywordWeight}
AI_VECTOR_WEIGHT=${vectorWeight}

# AI Prompt Rewriter Settings
AI_MAX_CONTEXT_LENGTH=${maxContextLength}
AI_MAX_SOURCES=${maxSources}
AI_INCLUDE_CITATIONS=${includeCitations}
AI_INCLUDE_CONFIDENCE=${includeConfidence}

# AI Answering Settings
AI_MAX_TOKENS=${maxTokens}
AI_TEMPERATURE=${temperature}
AI_TOP_P=${topP}
AI_TOP_K=${topK}
`;
    
    try {
        fs.writeFileSync(envPath, envContent);
        console.log('\n✅ .env file created successfully!');
        console.log('\n📋 Next Steps:');
        console.log('1. Install dependencies: npm install');
        console.log('2. Install Playwright browsers: npx playwright install chromium');
        console.log('3. Start Qdrant: docker run -p 6333:6333 qdrant/qdrant');
        console.log('4. Start the server: npm start');
        console.log('5. Test the AI pipeline: npm run test:ai');
        
        console.log('\n🔗 Useful URLs:');
        console.log(`   - Health Check: http://localhost:${port}/health`);
        console.log(`   - AI Health: http://localhost:${port}/api/ai/health`);
        console.log(`   - AI Config: http://localhost:${port}/api/ai/config`);
        
    } catch (error) {
        console.error('❌ Error creating .env file:', error.message);
    }
    
    rl.close();
}

// Run setup
setupEnvironment().catch(console.error); 