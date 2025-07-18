# Beetle Backend

Backend API for Beetle - Git-based collaboration platform with AI-powered processing.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp env.example .env
```

Required variables:
```bash
NODE_ENV=development
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
JWT_SECRET=your_jwt_secret_key_here
GEMINI_API_KEY=your_google_gemini_api_key

# not mandatory
GITHUB_WEBHOOK_SECRET=your_github_webhook_secret 
```

3. Start server:
```bash
./setup.sh
```

## AI Setup
1. Set up dependencies:
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

2. Install Playwright browsers:
```bash
playwright install
```

3. Set up Qdrant (Docker):
```bash
docker run -p 6333:6333 qdrant/qdrant
```


## GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create OAuth App with callback URL: `http://localhost:3001/auth/github/callback`
3. Add Client ID and Secret to `.env`

## Production

```bash
NODE_ENV=production
GITHUB_CALLBACK_URL=https://your-domain.com/auth/github/callback
setup.sh
```

## Logs
```bash
cd data/ # auth logs
```

```bash
cd logs/ # security logs
```

## AI Architecture
The AI pipeline consists of seven specialized agents that work together to provide intelligent document processing, search, and conversational AI capabilities:

1. **Ingestion Agents** - Fetch raw content from various sources
2. **Format Agent** - Normalize and clean documents
3. **Embedding Agent** - Compute vector embeddings and store in Qdrant
4. **Retrieval Agent** - Search for relevant documents using hybrid search
5. **Prompt Rewriter** - Restructure prompts with context for chat models
6. **Answering Agent** - Generate responses using Google Gemini API