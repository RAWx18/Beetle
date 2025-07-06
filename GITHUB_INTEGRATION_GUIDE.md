# 🚀 GitHub Integration Guide for Beetle

Your Beetle application is now fully configured and ready to work with real GitHub data! Here's how to get started:

## ✅ Current Status

- ✅ Backend server running on port 3001
- ✅ Frontend server running on port 3000  
- ✅ GitHub OAuth configured and working
- ✅ Demo mode working with realistic data
- ✅ All API endpoints functional

## 🎯 Quick Start Options

### Option 1: Try Demo Mode (Instant Access)
1. Open http://localhost:3000 in your browser
2. Click **"Try Demo Mode"** 
3. Instantly see the dashboard with realistic sample data
4. Explore all features: Overview, Projects, Activity, Insights

### Option 2: Connect Real GitHub Account
1. Open http://localhost:3000 in your browser
2. Click **"Connect with GitHub"**
3. You'll be redirected to GitHub to authorize access
4. Grant permissions for repositories, user data, and organizations
5. You'll be redirected back to Beetle with your real data

## 🔧 What You'll See

### Overview Tab
- **Time-based greeting** with your GitHub username
- **Real-time stats**: commits today, active PRs, stars earned, collaborators
- **Recent activity feed** from your GitHub events
- **Quick actions** that link to your actual GitHub repositories

### Projects Tab  
- **Your repositories** with real stats (stars, forks, issues)
- **Repository details** including languages, topics, and descriptions
- **Activity timeline** for each repository

### Activity Tab
- **Recent GitHub events**: pushes, PRs, issues, commits
- **Contributor activity** across your repositories
- **Time-based filtering** and search

### Insights Tab
- **Analytics overview** with calculated metrics
- **Language distribution** across your repositories
- **Trends and patterns** in your GitHub activity

## 🛠️ Troubleshooting

### If "Connect with GitHub" doesn't work:

1. **Check GitHub App Configuration**:
   - Your GitHub OAuth app is already configured
   - Client ID: `Ov23li6mqWFNkdWhcjZ7`
   - Callback URL: `http://localhost:3001/api/auth/github/callback`

2. **Verify Backend is Running**:
   ```bash
   cd beetle_backend
   npm start
   ```

3. **Check Frontend is Running**:
   ```bash
   cd beetle_frontend  
   npm run dev
   ```

4. **Test API Endpoints**:
   ```bash
   cd beetle_backend
   node test-auth.js
   ```

### If you see "Failed to fetch" errors:

1. **Use Demo Mode First**: Click "Try Demo Mode" to verify the app works
2. **Check Network Tab**: Open browser dev tools and check for failed requests
3. **Clear Browser Cache**: Hard refresh (Ctrl+F5) or clear localStorage
4. **Check Console**: Look for JavaScript errors in browser console

## 🔐 Authentication Flow

### Demo Mode
- Uses `demo-token` for authentication
- Provides realistic sample data
- No GitHub account required
- Perfect for testing and demonstration

### Real GitHub Mode
- Uses GitHub OAuth flow
- Requires GitHub account and authorization
- Accesses your actual repositories and activity
- Stores session securely with JWT tokens

## 📊 Data Sources

### Real GitHub Data (when connected)
- **Repositories**: Your owned, collaborated, and organization repos
- **Activity**: Recent GitHub events (pushes, PRs, issues, etc.)
- **Analytics**: Calculated metrics from your repositories
- **Contributors**: Team members and their contributions

### Demo Data (when using demo mode)
- **2 Sample Repositories**: beetle-app and react-components
- **5 Recent Activities**: Various GitHub event types
- **Realistic Stats**: Stars, forks, commits, PRs
- **Sample Contributors**: Demo team members

## 🎨 Features Available

### Dashboard Overview
- ✅ Time-based greeting with username
- ✅ Real-time GitHub statistics
- ✅ Recent activity feed
- ✅ Quick action buttons
- ✅ Monthly goals tracking

### Repository Management
- ✅ Repository listing with stats
- ✅ Detailed repository views
- ✅ Branch and commit information
- ✅ Pull request and issue tracking

### Analytics & Insights
- ✅ Language distribution analysis
- ✅ Activity trends and patterns
- ✅ Contributor statistics
- ✅ Repository performance metrics

### Search & Navigation
- ✅ Enhanced search functionality
- ✅ Repository filtering
- ✅ Activity timeline
- ✅ Quick navigation between views

## 🚀 Next Steps

1. **Start with Demo Mode**: Click "Try Demo Mode" to explore the app
2. **Connect GitHub**: Use "Connect with GitHub" for your real data
3. **Explore Features**: Navigate through Overview, Projects, Activity, and Insights
4. **Customize**: Set up your monthly goals and preferences
5. **Share**: Invite team members to collaborate

## 📞 Support

If you encounter any issues:

1. **Check the test script**: Run `node test-auth.js` in the backend directory
2. **Review browser console**: Look for JavaScript errors
3. **Check network requests**: Verify API calls are successful
4. **Try demo mode**: Ensure the app works with sample data first

Your Beetle application is now ready to help you manage and track your GitHub contributions with AI-powered insights! 🎉 