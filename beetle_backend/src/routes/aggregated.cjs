const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler.cjs');
const { getUserRepositories, getRepositoryPullRequests, getRepositoryIssues } = require('../utils/github.cjs');

const router = express.Router();

// Get aggregated pull requests from user's repositories
router.get('/pull-requests', asyncHandler(async (req, res) => {
  const { limit = 10, state = 'all' } = req.query;
  
  try {
    // Get user's repositories (limited to avoid rate limits)
    const repositories = await getUserRepositories(req.user.accessToken, 1, parseInt(limit));
    
    const allPullRequests = [];
    
    // Fetch pull requests from each repository
    for (const repo of repositories) {
      try {
        const prs = await getRepositoryPullRequests(
          req.user.accessToken, 
          repo.owner.login, 
          repo.name, 
          state, 
          1, 
          20
        );
        
        // Add repository information to each PR
        const enrichedPRs = prs.map(pr => ({
          ...pr,
          repository: {
            name: repo.name,
            full_name: repo.full_name,
            owner: repo.owner
          }
        }));
        
        allPullRequests.push(...enrichedPRs);
      } catch (error) {
        console.warn(`Failed to fetch PRs for ${repo.full_name}:`, error.message);
        // Continue with other repositories
      }
    }
    
    // Sort by updated date (most recent first)
    allPullRequests.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    
    res.json({
      pullRequests: allPullRequests,
      total: allPullRequests.length,
      repositories: repositories.length
    });
  } catch (error) {
    console.error('Error fetching aggregated pull requests:', error);
    res.status(500).json({
      error: 'Failed to fetch pull requests',
      message: error.message
    });
  }
}));

// Get aggregated issues from user's repositories
router.get('/issues', asyncHandler(async (req, res) => {
  const { limit = 10, state = 'all' } = req.query;
  
  try {
    // Get user's repositories (limited to avoid rate limits)
    const repositories = await getUserRepositories(req.user.accessToken, 1, parseInt(limit));
    
    const allIssues = [];
    
    // Fetch issues from each repository
    for (const repo of repositories) {
      try {
        const issues = await getRepositoryIssues(
          req.user.accessToken, 
          repo.owner.login, 
          repo.name, 
          state, 
          1, 
          20
        );
        
        // Add repository information to each issue
        const enrichedIssues = issues.map(issue => ({
          ...issue,
          repository: {
            name: repo.name,
            full_name: repo.full_name,
            owner: repo.owner
          }
        }));
        
        allIssues.push(...enrichedIssues);
      } catch (error) {
        console.warn(`Failed to fetch issues for ${repo.full_name}:`, error.message);
        // Continue with other repositories
      }
    }
    
    // Sort by updated date (most recent first)
    allIssues.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    
    res.json({
      issues: allIssues,
      total: allIssues.length,
      repositories: repositories.length
    });
  } catch (error) {
    console.error('Error fetching aggregated issues:', error);
    res.status(500).json({
      error: 'Failed to fetch issues',
      message: error.message
    });
  }
}));

// Get aggregated activity summary
router.get('/summary', asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  
  try {
    // Get user's repositories (limited to avoid rate limits)
    const repositories = await getUserRepositories(req.user.accessToken, 1, parseInt(limit));
    
    const summary = {
      repositories: repositories.length,
      totalStars: 0,
      totalForks: 0,
      openPRs: 0,
      openIssues: 0,
      languages: {},
      recentActivity: []
    };
    
    // Aggregate statistics
    for (const repo of repositories) {
      summary.totalStars += repo.stargazers_count;
      summary.totalForks += repo.forks_count;
      
      if (repo.language) {
        summary.languages[repo.language] = (summary.languages[repo.language] || 0) + 1;
      }
      
      try {
        // Get open PRs and issues count
        const [openPRs, openIssues] = await Promise.all([
          getRepositoryPullRequests(req.user.accessToken, repo.owner.login, repo.name, 'open', 1, 1),
          getRepositoryIssues(req.user.accessToken, repo.owner.login, repo.name, 'open', 1, 1)
        ]);
        
        summary.openPRs += openPRs.length;
        summary.openIssues += openIssues.length;
      } catch (error) {
        console.warn(`Failed to fetch counts for ${repo.full_name}:`, error.message);
      }
    }
    
    res.json(summary);
  } catch (error) {
    console.error('Error fetching aggregated summary:', error);
    res.status(500).json({
      error: 'Failed to fetch summary',
      message: error.message
    });
  }
}));

module.exports = router;
