# 🔍 Real GitHub Integration Test Guide

Follow these steps to test and debug the real GitHub integration:

## 🚀 Step 1: Verify Backend is Running

```bash
cd beetle_backend
./start-stable.sh
```

You should see:
```
🚀 Beetle Backend server running on port 3001
📊 Health check: http://localhost:3001/health
🔗 API Base URL: http://localhost:3001/api
```

## 🎯 Step 2: Test Backend Endpoints

Run the debug script:
```bash
cd beetle_backend
node debug-github.js
```

This will test:
- ✅ Backend health
- ✅ GitHub OAuth URL generation
- ✅ Demo mode authentication
- ✅ Frontend connectivity

## 🔐 Step 3: Test GitHub OAuth Flow

1. **Open your browser** and go to: http://localhost:3000

2. **Click "Connect with GitHub"**

3. **You'll be redirected to GitHub** with this URL:
   ```
   https://github.com/login/oauth/authorize?client_id=Ov23li6mqWFNkdWhcjZ7&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fapi%2Fauth%2Fgithub%2Fcallback&scope=repo,user,read:org,repo:status,repo_deployment&prompt=select_account&state=...
   ```

4. **Authorize the application** - You should see:
   - ✅ Access to your repositories (including private ones)
   - ✅ Access to your user data
   - ✅ Access to your organizations

5. **You'll be redirected back** to: http://localhost:3000/?auth_token=...&auth_user=...

## 🔍 Step 4: Debug Authentication Issues

### Check Browser Console
1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for any JavaScript errors
4. Look for authentication messages

### Check Network Tab
1. Go to Network tab in Developer Tools
2. Look for failed requests to `/api/github/repositories`
3. Check the response status and error messages

### Check Backend Logs
Look at your backend terminal for:
- ✅ OAuth callback logs
- ✅ Token exchange logs
- ✅ GitHub API test results
- ❌ Any error messages

## 🛠️ Step 5: Manual API Testing

If the frontend isn't working, test the API manually:

### Test with Demo Token
```bash
curl -H "Authorization: Bearer demo-token" http://localhost:3001/api/auth/status
```

### Test GitHub OAuth URL
```bash
curl http://localhost:3001/api/auth/github/url
```

### Test with Real Token (after OAuth)
1. Complete the OAuth flow
2. Get the token from browser localStorage or URL params
3. Test the API:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/auth/status
```

## 🐛 Common Issues and Solutions

### Issue 1: "Failed to fetch repositories"
**Symptoms**: Frontend shows error, network requests fail
**Solutions**:
1. Check if you completed the OAuth flow
2. Verify the token is valid
3. Check backend logs for GitHub API errors
4. Try demo mode first to verify app works

### Issue 2: "Authentication required"
**Symptoms**: Dashboard shows login prompt even after OAuth
**Solutions**:
1. Clear browser localStorage: `localStorage.clear()`
2. Hard refresh the page (Ctrl+F5)
3. Check if token is being stored properly
4. Verify OAuth callback is working

### Issue 3: "GitHub API Error"
**Symptoms**: Backend logs show GitHub API failures
**Solutions**:
1. Check if GitHub OAuth app is configured correctly
2. Verify the access token has the right scopes
3. Check if your GitHub account has the repositories
4. Try with a different GitHub account

### Issue 4: "No repositories found"
**Symptoms**: Authentication works but no data shows
**Solutions**:
1. Check if you have any repositories (public or private)
2. Verify the GitHub account has repositories
3. Check if repositories are accessible with the token
4. Try creating a test repository

## 📋 GitHub OAuth App Configuration

Your GitHub OAuth app should have:
- **Client ID**: `Ov23li6mqWFNkdWhcjZ7`
- **Client Secret**: (configured in .env)
- **Authorization callback URL**: `http://localhost:3001/api/auth/github/callback`
- **Homepage URL**: `http://localhost:3000`
- **Scopes**: `repo`, `user`, `read:org`, `repo:status`, `repo_deployment`

## 🔧 Advanced Debugging

### Check Token Validity
```bash
# Test with your actual token
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/auth/status
```

### Test GitHub API Directly
```bash
# Test with your GitHub token
curl -H "Authorization: Bearer YOUR_GITHUB_TOKEN" https://api.github.com/user
```

### Check Database Sessions
The backend stores sessions in `./data/beetle_db.json`. Check if sessions are being created.

## 🎯 Expected Results

### Successful OAuth Flow:
1. ✅ Redirect to GitHub authorization page
2. ✅ Grant permissions to repositories and user data
3. ✅ Redirect back to Beetle with token
4. ✅ Dashboard loads with your real GitHub data
5. ✅ Overview shows your repositories, commits, PRs, etc.

### Successful Data Fetching:
- ✅ Repositories list (including private ones)
- ✅ Recent activity feed
- ✅ Pull requests and issues
- ✅ Analytics and insights
- ✅ Real-time stats

## 📞 If Still Not Working

1. **Try Demo Mode First**: Ensure the app works with sample data
2. **Check All Logs**: Backend console, browser console, network tab
3. **Verify GitHub Account**: Ensure you have repositories and activity
4. **Test with Different Account**: Try with a different GitHub account
5. **Check GitHub Status**: Ensure GitHub API is working

## 🎉 Success Indicators

When everything is working, you should see:
- ✅ Dashboard loads without errors
- ✅ Your GitHub username in the greeting
- ✅ Real repository data (not zeros)
- ✅ Recent activity from your GitHub account
- ✅ Working quick actions that link to your repos

Your Beetle app should now show your real GitHub data including both public and private repositories! 🚀 