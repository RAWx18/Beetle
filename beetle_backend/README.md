# Beetle Backend

Backend API for Beetle - Git-based collaboration with Branch-Level Intelligence. This backend provides GitHub OAuth authentication, GitHub API integration, analytics, and project management for the Beetle frontend.

## Features

- 🔐 **GitHub OAuth Authentication** - Secure login with GitHub
- 📊 **GitHub API Integration** - Fetch repositories, branches, issues, PRs, and more
- 📈 **Analytics & Insights** - Generate comprehensive analytics from GitHub data
- 🤖 **AI Pipeline** - Multi-agent AI system for document processing, search, and chat
- 🗄️ **Local Data Storage** - Store data locally using JSON database
- 🔄 **Caching System** - Intelligent caching for better performance
- 🛡️ **Security** - JWT tokens, rate limiting, and input validation
- 📱 **RESTful API** - Clean, documented API endpoints

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: LowDB (JSON-based local storage)
- **Authentication**: JWT + GitHub OAuth
- **API**: GitHub REST API
- **Validation**: Express Validator
- **Security**: Helmet, CORS, Rate Limiting

## Prerequisites

- Node.js 18+ 
- npm or yarn
- GitHub OAuth App (for authentication)
- GitHub Personal Access Token (for AI pipeline)
- Google Gemini API Key (for AI pipeline)
- Docker (for Qdrant vector database)

## Setup

### 1. Install Dependencies

```bash
cd beetle_backend
npm install
```

### 2. Environment Configuration

Set up your environment variables:

```bash
# Interactive setup (recommended)
npm run setup

# Quick setup (copy from example)
npm run setup:quick

# Manual setup
cp env.example .env
```

Edit `.env` with your configuration. Required variables:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:3001/auth/github/callback

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Database Configuration
DB_PATH=./data/beetle_db.json

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Cache Configuration
CACHE_TTL=3600

# AI Pipeline Configuration (Required)
GEMINI_API_KEY=your_google_gemini_api_key
QDRANT_URL=localhost
QDRANT_PORT=6333
```

For complete AI pipeline configuration, see `env.example` or run `npm run setup`.

### 3. GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set the callback URL to: `http://localhost:3001/auth/github/callback`
4. Copy the Client ID and Client Secret to your `.env` file

### 4. AI Pipeline Setup

```bash
# Install Playwright browsers
npx playwright install chromium

# Start Qdrant vector database
docker run -p 6333:6333 qdrant/qdrant
```

### 5. Start the Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3001`

### 6. Test AI Pipeline

```bash
npm run test:ai
```

## API Endpoints

### Authentication

- `GET /api/auth/github/url` - Get GitHub OAuth URL
- `GET /api/auth/github/callback` - GitHub OAuth callback
- `GET /api/auth/validate` - Validate JWT token
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### GitHub Integration

- `GET /api/github/repositories` - Get user repositories
- `GET /api/github/repositories/:owner/:repo` - Get repository details
- `GET /api/github/repositories/:owner/:repo/branches` - Get repository branches
- `GET /api/github/repositories/:owner/:repo/issues` - Get repository issues
- `GET /api/github/repositories/:owner/:repo/pulls` - Get repository pull requests
- `GET /api/github/repositories/:owner/:repo/commits` - Get repository commits
- `GET /api/github/repositories/:owner/:repo/contributors` - Get repository contributors
- `GET /api/github/repositories/:owner/:repo/languages` - Get repository languages
- `GET /api/github/activity` - Get user activity
- `GET /api/github/search/repositories` - Search repositories
- `GET /api/github/repositories/:owner/:repo/stats` - Get repository statistics
- `GET /api/github/dashboard` - Get user dashboard data
- `GET /api/github/repositories/:owner/:repo/branches/:branch` - Get branch-specific data

### Analytics

- `GET /api/analytics/overview` - Get user analytics overview
- `GET /api/analytics/repositories/:owner/:repo` - Get repository analytics
- `GET /api/analytics/repositories/:owner/:repo/branches/:branch` - Get branch analytics
- `GET /api/analytics/contributions` - Get contribution analytics
- `GET /api/analytics/insights` - Get AI insights (static)

### Projects

- `GET /api/projects` - Get all projects
- `GET /api/projects/:projectId` - Get specific project
- `POST /api/projects` - Create new project
- `PUT /api/projects/:projectId` - Update project
- `GET /api/projects/:projectId/branches` - Get project branches
- `GET /api/projects/:projectId/analytics` - Get project analytics
- `POST /api/projects/import` - Import repository as project
- `GET /api/projects/:projectId/beetle` - Get Beetle-specific project data

### AI Pipeline

- `GET /api/ai/health` - AI pipeline health check
- `GET /api/ai/config` - Get AI pipeline configuration
- `GET /api/ai/env` - Get detailed environment configuration
- `GET /api/ai/status` - Get pipeline status
- `POST /api/ai/ingest` - Ingest content from GitHub/websites
- `POST /api/ai/pipeline/full` - Run full AI pipeline
- `POST /api/ai/search` - Search documents with AI
- `POST /api/ai/chat` - Chat with AI about documents
- `POST /api/ai/test/:agent` - Test individual agents

## Frontend Integration

### Authentication Flow

1. Frontend calls `GET /api/auth/github/url` to get OAuth URL
2. User redirects to GitHub for authorization
3. GitHub redirects back to `GET /api/auth/github/callback`
4. Backend creates session and JWT token
5. User is redirected to frontend with token
6. Frontend stores token and uses it for authenticated requests

### Example Frontend Usage

```javascript
// Get GitHub OAuth URL
const response = await fetch('/api/auth/github/url');
const { authUrl } = await response.json();
window.location.href = authUrl;

// Make authenticated requests
const token = localStorage.getItem('beetle_token');
const response = await fetch('/api/github/repositories', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## Data Storage

The backend uses a local JSON database (LowDB) for storing:

- User profiles and sessions
- Repository data and analytics
- Project configurations
- Cached API responses

Data is stored in `./data/beetle_db.json` and automatically managed by the application.

## Security Features

- **JWT Authentication** - Secure token-based authentication
- **Rate Limiting** - Prevent API abuse
- **Input Validation** - Validate all incoming requests
- **CORS Protection** - Configured for frontend domains
- **Helmet Security** - Security headers and protection
- **Session Management** - Automatic session cleanup

## Development

### Project Structure

```
src/
├── index.js              # Main server file
├── routes/               # API routes
│   ├── auth.js          # Authentication routes
│   ├── github.js        # GitHub API routes
│   ├── analytics.js     # Analytics routes
│   └── projects.js      # Project management routes
├── middleware/           # Express middleware
│   ├── auth.js          # Authentication middleware
│   └── errorHandler.js  # Error handling middleware
└── utils/               # Utility functions
    ├── database.js      # Database operations
    └── github.js        # GitHub API utilities
```

### Adding New Features

1. Create new route files in `src/routes/`
2. Add middleware in `src/middleware/` if needed
3. Create utility functions in `src/utils/`
4. Update `src/index.js` to include new routes
5. Add validation using express-validator
6. Implement proper error handling

### Testing

```bash
# Run tests
npm test

# Run in development mode with auto-restart
npm run dev
```

## Deployment

### Environment Variables for Production

```env
NODE_ENV=production
PORT=3001
GITHUB_CLIENT_ID=your_production_client_id
GITHUB_CLIENT_SECRET=your_production_client_secret
GITHUB_CALLBACK_URL=https://your-domain.com/auth/github/callback
JWT_SECRET=your_secure_jwt_secret
```

### Process Management

Use PM2 or similar process manager:

```bash
npm install -g pm2
pm2 start src/index.js --name beetle-backend
pm2 save
pm2 startup
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details