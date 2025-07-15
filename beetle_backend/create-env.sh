#!/bin/bash

# Beetle AI Pipeline Environment Setup Script
# This script helps create a .env file from env.example

echo "🚀 Beetle AI Pipeline Environment Setup"
echo "====================================="
echo ""

# Check if .env already exists
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelled. Existing .env file preserved."
        exit 0
    fi
fi

# Copy from env.example
if [ -f "env.example" ]; then
    cp env.example .env
    echo "✅ .env file created from env.example"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Edit .env file with your actual values:"
    echo "   - GITHUB_CLIENT_ID: Your GitHub OAuth App Client ID"
    echo "   - GITHUB_CLIENT_SECRET: Your GitHub OAuth App Client Secret"
    echo "   - GEMINI_API_KEY: Your Google Gemini API Key"
    echo "   - Note: GITHUB_TOKEN is not needed - AI pipeline uses user's OAuth token"
    echo "   - Other settings as needed"
    echo ""
    echo "2. Install dependencies: npm install"
    echo "3. Install Playwright browsers: npx playwright install chromium"
    echo "4. Start Qdrant: docker run -p 6333:6333 qdrant/qdrant"
    echo "5. Start the server: npm start"
    echo "6. Test the AI pipeline: npm run test:ai"
    echo ""
    echo "🔗 Useful URLs:"
    echo "   - Health Check: http://localhost:3001/health"
    echo "   - AI Health: http://localhost:3001/api/ai/health"
    echo "   - AI Config: http://localhost:3001/api/ai/config"
    echo ""
    echo "💡 For interactive setup, run: npm run setup"
else
    echo "❌ env.example file not found!"
    echo "Please ensure you're running this script from the beetle_backend directory."
    exit 1
fi 