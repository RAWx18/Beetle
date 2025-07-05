# Beetle Frontend-Backend Integration Guide

This guide explains how to integrate the Beetle frontend with the newly created backend API.

## Overview

The backend provides a complete API for:
- GitHub OAuth authentication
- GitHub data fetching (repositories, branches, issues, PRs)
- Analytics and insights
- Project management
- Local data storage

## Setup Instructions

### 1. Backend Setup

First, ensure the backend is running:

```bash
cd beetle_backend
npm install
cp env.example .env
# Edit .env with your GitHub OAuth credentials
npm run dev
```

### 2. Frontend Configuration

The frontend is already configured to connect to `http://localhost:3001/api`. If you need to change this, update the `API_BASE_URL` in:

- `contexts/AuthContext.tsx` (line 25)
- `lib/api.ts` (line 3)

### 3. GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set the callback URL to: `http://localhost:3001/auth/github/callback`
4. Copy the Client ID and Client Secret to your backend `.env` file

## Integration Points

### Authentication Flow

The authentication flow is already implemented in `contexts/AuthContext.tsx`:

1. **Login**: User clicks login → redirects to GitHub OAuth
2. **Callback**: GitHub redirects back with code → backend exchanges for token
3. **Token Storage**: Frontend stores JWT token in localStorage
4. **Validation**: Token is validated on app startup

### API Service

The `lib/api.ts` file provides a complete API service with:

- **Authentication methods**: `getGitHubAuthUrl()`, `validateToken()`, `logout()`
- **GitHub integration**: `getUserRepositories()`, `getRepositoryDetails()`, etc.
- **Analytics**: `getAnalyticsOverview()`, `getRepositoryAnalytics()`, etc.
- **Projects**: `getProjects()`, `createProject()`, `importRepository()`, etc.

## Usage Examples

### 1. Using the API Service

```typescript
import { apiService } from '@/lib/api';

// Get user repositories
const response = await apiService.getUserRepositories();
if (response.data) {
  console.log('Repositories:', response.data.repositories);
} else {
  console.error('Error:', response.error);
}

// Get repository details
const repoResponse = await apiService.getRepositoryDetails('owner', 'repo');
if (repoResponse.data) {
  console.log('Repository:', repoResponse.data.repository);
}

// Get analytics
const analyticsResponse = await apiService.getAnalyticsOverview();
if (analyticsResponse.data) {
  console.log('Analytics:', analyticsResponse.data);
}
```

### 2. Using Authentication Context

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { isAuthenticated, user, login, logout, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <button onClick={login}>Login with GitHub</button>;
  }

  return (
    <div>
      <h1>Welcome, {user?.name}!</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### 3. Fetching Project Data for Contribution Page

```typescript
import { apiService } from '@/lib/api';
import { useState, useEffect } from 'react';

function ContributionPage() {
  const [projectData, setProjectData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProjectData() {
      // Get project ID from URL or props
      const projectId = 'owner/repo';
      
      const response = await apiService.getBeetleProjectData(projectId);
      if (response.data) {
        setProjectData(response.data);
      }
      setLoading(false);
    }

    fetchProjectData();
  }, []);

  if (loading) return <div>Loading project data...</div>;

  return (
    <div>
      <h1>{projectData?.project?.name}</h1>
      <div>Branches: {projectData?.summary?.totalBranches}</div>
      <div>Issues: {projectData?.summary?.totalIssues}</div>
      <div>PRs: {projectData?.summary?.totalPullRequests}</div>
    </div>
  );
}
```

## Key Features Integration

### 1. GitHub Data Integration

The backend fetches real data from GitHub APIs:

- **Repositories**: User's repositories with details
- **Branches**: All branches with commit information
- **Issues**: Open/closed issues with labels and assignees
- **Pull Requests**: PRs with merge status and reviews
- **Commits**: Commit history with authors and messages
- **Activity**: User's recent GitHub activity

### 2. Analytics Integration

The backend provides comprehensive analytics:

- **User Overview**: Total repos, stars, forks, activity
- **Repository Analytics**: Detailed stats per repository
- **Branch Analytics**: Branch-specific metrics and insights
- **Contribution Analytics**: User contribution patterns
- **AI Insights**: Static insights (as requested)

### 3. Project Management

The backend supports Beetle project management:

- **Project Import**: Import GitHub repositories as Beetle projects
- **Project Analytics**: Analytics specific to imported projects
- **Branch Intelligence**: Branch-level data organization
- **Beetle Data**: Specialized data format for Beetle features

## Data Flow

### 1. Authentication Flow

```
Frontend → Backend → GitHub OAuth → Backend → Frontend
   ↓         ↓           ↓           ↓         ↓
Login → Get Auth URL → Redirect → Exchange → Store Token
```

### 2. Data Fetching Flow

```
Frontend → Backend → GitHub API → Backend → Frontend
   ↓         ↓           ↓         ↓         ↓
Request → Validate → Fetch Data → Cache → Response
```

### 3. Local Storage

The backend stores data locally in JSON format:

- **Users**: User profiles and sessions
- **Repositories**: Cached repository data
- **Analytics**: Computed analytics
- **Projects**: Beetle project configurations
- **Cache**: API response caching

## Error Handling

The API service includes comprehensive error handling:

```typescript
const response = await apiService.getUserRepositories();
if (response.error) {
  // Handle error
  console.error('API Error:', response.error.message);
  // Show user-friendly error message
} else {
  // Handle success
  console.log('Data:', response.data);
}
```

## Security Features

- **JWT Authentication**: Secure token-based auth
- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Validates all requests
- **CORS Protection**: Configured for frontend domains
- **Session Management**: Automatic cleanup

## Development Workflow

### 1. Start Both Services

```bash
# Terminal 1 - Backend
cd beetle_backend
npm run dev

# Terminal 2 - Frontend
cd beetle_frontend
npm run dev
```

### 2. Test Authentication

1. Open frontend at `http://localhost:3000`
2. Click "Login with GitHub"
3. Complete GitHub OAuth flow
4. Verify user data is loaded

### 3. Test API Endpoints

Use the browser console or tools like Postman to test:

```javascript
// Test API endpoints
fetch('http://localhost:3001/api/github/repositories', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
}).then(r => r.json()).then(console.log);
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure backend CORS is configured for frontend domain
2. **Authentication Errors**: Check GitHub OAuth credentials in `.env`
3. **API Errors**: Verify backend is running on correct port
4. **Token Issues**: Clear localStorage and re-authenticate

### Debug Mode

Enable debug logging in the backend by setting:

```env
NODE_ENV=development
```

### Network Issues

If you're having network issues:

1. Check if backend is running: `curl http://localhost:3001/health`
2. Verify CORS settings in backend
3. Check browser network tab for errors
4. Ensure ports are not blocked by firewall

## Production Deployment

### Environment Variables

For production, update the API URL:

```typescript
// In production, use environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://your-backend-domain.com/api';
```

### Security Considerations

1. Use HTTPS in production
2. Set secure JWT secrets
3. Configure proper CORS origins
4. Enable rate limiting
5. Use environment variables for secrets

## Next Steps

1. **Test Integration**: Verify all API endpoints work
2. **Update Components**: Replace mock data with real API calls
3. **Add Error Handling**: Implement proper error states
4. **Optimize Performance**: Add loading states and caching
5. **Deploy**: Deploy both frontend and backend

## Support

For issues or questions:

1. Check the backend README for setup instructions
2. Review API documentation in backend routes
3. Check browser console for frontend errors
4. Verify network requests in browser dev tools 