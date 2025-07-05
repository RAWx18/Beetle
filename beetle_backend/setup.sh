#!/bin/bash

# Beetle Backend Setup Script

echo "🚀 Setting up Beetle Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Create data directory
echo "📁 Creating data directory..."
mkdir -p data

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please edit .env file with your GitHub OAuth credentials"
    echo "   - GITHUB_CLIENT_ID"
    echo "   - GITHUB_CLIENT_SECRET"
    echo "   - JWT_SECRET"
else
    echo "✅ .env file already exists"
fi

# Check if required environment variables are set
echo "🔍 Checking environment variables..."

if [ -f .env ]; then
    source .env
    
    if [ -z "$GITHUB_CLIENT_ID" ] || [ "$GITHUB_CLIENT_ID" = "your_github_client_id" ]; then
        echo "⚠️  GITHUB_CLIENT_ID not set in .env"
    else
        echo "✅ GITHUB_CLIENT_ID is set"
    fi
    
    if [ -z "$GITHUB_CLIENT_SECRET" ] || [ "$GITHUB_CLIENT_SECRET" = "your_github_client_secret" ]; then
        echo "⚠️  GITHUB_CLIENT_SECRET not set in .env"
    else
        echo "✅ GITHUB_CLIENT_SECRET is set"
    fi
    
    if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "your_jwt_secret_key_here" ]; then
        echo "⚠️  JWT_SECRET not set in .env"
    else
        echo "✅ JWT_SECRET is set"
    fi
fi

echo ""
echo "🎉 Setup completed!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your GitHub OAuth credentials"
echo "2. Create a GitHub OAuth App at https://github.com/settings/developers"
echo "3. Set callback URL to: http://localhost:3001/auth/github/callback"
echo "4. Run: npm run dev"
echo ""
echo "Backend will be available at: http://localhost:3001"
echo "API endpoints at: http://localhost:3001/api"
echo "Health check at: http://localhost:3001/health" 