const express = require('express');
const { query, validationResult } = require('express-validator');
const {
  getUserRepositories,
  getRepositoryDetails,
  getRepositoryBranches,
  getRepositoryIssues,
  getRepositoryPullRequests,
  getRepositoryCommits,
  getUserActivity,
  getRepositoryContributors,
  getRepositoryLanguages,
  searchRepositories
} = require('../utils/github.cjs');
const { saveRepository, getRepository } = require('../utils/database.cjs');
const { asyncHandler } = require('../middleware/errorHandler.cjs');

const router = express.Router();

// Get user repositories
router.get('/repositories', [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('per_page').optional().isInt({ min: 1, max: 100 }).toInt()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      details: errors.array()
    });
  }

  const { page = 1, per_page = 100 } = req.query;
  const repositories = await getUserRepositories(req.user.accessToken, page, per_page);

  res.json({
    repositories,
    pagination: {
      page,
      per_page,
      total: repositories.length
    }
  });
}));

// Get repository details
router.get('/repositories/:owner/:repo', asyncHandler(async (req, res) => {
  const { owner, repo } = req.params;
  
  // Check if we have cached data first
  let repository = await getRepository(`${owner}/${repo}`);
  
  if (!repository) {
    // Fetch from GitHub API
    const repoData = await getRepositoryDetails(req.user.accessToken, owner, repo);
    
    // Save to database
    repository = await saveRepository(`${owner}/${repo}`, repoData);
  }

  res.json({
    repository
  });
}));

// Get repository branches
router.get('/repositories/:owner/:repo/branches', asyncHandler(async (req, res) => {
  const { owner, repo } = req.params;
  const branches = await getRepositoryBranches(req.user.accessToken, owner, repo);

  res.json({
    branches,
    total: branches.length
  });
}));

// Get repository issues
router.get('/repositories/:owner/:repo/issues', [
  query('state').optional().isIn(['open', 'closed', 'all']),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('per_page').optional().isInt({ min: 1, max: 100 }).toInt()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      details: errors.array()
    });
  }

  const { owner, repo } = req.params;
  const { state = 'open', page = 1, per_page = 100 } = req.query;
  
  const issues = await getRepositoryIssues(req.user.accessToken, owner, repo, state, page, per_page);

  res.json({
    issues,
    pagination: {
      state,
      page,
      per_page,
      total: issues.length
    }
  });
}));

// Get repository pull requests
router.get('/repositories/:owner/:repo/pulls', [
  query('state').optional().isIn(['open', 'closed', 'all']),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('per_page').optional().isInt({ min: 1, max: 100 }).toInt()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      details: errors.array()
    });
  }

  const { owner, repo } = req.params;
  const { state = 'open', page = 1, per_page = 100 } = req.query;
  
  const pullRequests = await getRepositoryPullRequests(req.user.accessToken, owner, repo, state, page, per_page);

  res.json({
    pullRequests,
    pagination: {
      state,
      page,
      per_page,
      total: pullRequests.length
    }
  });
}));

// Get repository commits
router.get('/repositories/:owner/:repo/commits', [
  query('branch').optional().isString(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('per_page').optional().isInt({ min: 1, max: 100 }).toInt()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      details: errors.array()
    });
  }

  const { owner, repo } = req.params;
  const { branch = 'main', page = 1, per_page = 100 } = req.query;
  
  const commits = await getRepositoryCommits(req.user.accessToken, owner, repo, branch, page, per_page);

  res.json({
    commits,
    pagination: {
      branch,
      page,
      per_page,
      total: commits.length
    }
  });
}));

// Get repository contributors
router.get('/repositories/:owner/:repo/contributors', asyncHandler(async (req, res) => {
  const { owner, repo } = req.params;
  const contributors = await getRepositoryContributors(req.user.accessToken, owner, repo);

  res.json({
    contributors,
    total: contributors.length
  });
}));

// Get repository languages
router.get('/repositories/:owner/:repo/languages', asyncHandler(async (req, res) => {
  const { owner, repo } = req.params;
  const languages = await getRepositoryLanguages(req.user.accessToken, owner, repo);

  res.json({
    languages
  });
}));

// Get user activity
router.get('/activity', [
  query('username').optional().isString(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('per_page').optional().isInt({ min: 1, max: 100 }).toInt()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      details: errors.array()
    });
  }

  const { username, page = 1, per_page = 100 } = req.query;
  const targetUsername = username || req.user.login;
  
  const activity = await getUserActivity(req.user.accessToken, targetUsername, page, per_page);

  res.json({
    activity,
    pagination: {
      username: targetUsername,
      page,
      per_page,
      total: activity.length
    }
  });
}));

// Search repositories
router.get('/search/repositories', [
  query('q').isString().notEmpty(),
  query('sort').optional().isIn(['stars', 'forks', 'help-wanted-issues', 'updated']),
  query('order').optional().isIn(['desc', 'asc']),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('per_page').optional().isInt({ min: 1, max: 100 }).toInt()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      details: errors.array()
    });
  }

  const { q, sort = 'stars', order = 'desc', page = 1, per_page = 30 } = req.query;
  
  const searchResults = await searchRepositories(req.user.accessToken, q, sort, order, page, per_page);

  res.json({
    ...searchResults,
    query: q,
    pagination: {
      sort,
      order,
      page,
      per_page
    }
  });
}));

// Get repository statistics
router.get('/repositories/:owner/:repo/stats', asyncHandler(async (req, res) => {
  const { owner, repo } = req.params;
  
  try {
    // Fetch various repository data
    const [details, branches, issues, pullRequests, commits, contributors, languages] = await Promise.all([
      getRepositoryDetails(req.user.accessToken, owner, repo),
      getRepositoryBranches(req.user.accessToken, owner, repo),
      getRepositoryIssues(req.user.accessToken, owner, repo, 'open'),
      getRepositoryPullRequests(req.user.accessToken, owner, repo, 'open'),
      getRepositoryCommits(req.user.accessToken, owner, repo, 'main', 1, 100),
      getRepositoryContributors(req.user.accessToken, owner, repo),
      getRepositoryLanguages(req.user.accessToken, owner, repo)
    ]);

    // Calculate statistics
    const stats = {
      repository: details,
      summary: {
        totalBranches: branches.length,
        openIssues: issues.length,
        openPullRequests: pullRequests.length,
        totalCommits: commits.length,
        totalContributors: contributors.length,
        languages: Object.keys(languages),
        primaryLanguage: details.language,
        stars: details.stargazers_count,
        forks: details.forks_count,
        watchers: details.watchers_count,
        size: details.size,
        lastUpdated: details.updated_at,
        createdAt: details.created_at
      },
      branches: branches.slice(0, 10), // Top 10 branches
      recentIssues: issues.slice(0, 10), // Recent 10 issues
      recentPullRequests: pullRequests.slice(0, 10), // Recent 10 PRs
      recentCommits: commits.slice(0, 10), // Recent 10 commits
      topContributors: contributors.slice(0, 10), // Top 10 contributors
      languages: languages
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching repository statistics:', error);
    res.status(500).json({
      error: 'Failed to fetch repository statistics',
      message: error.message
    });
  }
}));

// Get user dashboard data
router.get('/dashboard', asyncHandler(async (req, res) => {
  try {
    // Fetch user repositories
    const repositories = await getUserRepositories(req.user.accessToken, 1, 50);
    
    // Get activity for the user
    const activity = await getUserActivity(req.user.accessToken, req.user.login, 1, 50);
    
    // Calculate dashboard statistics
    const dashboardStats = {
      totalRepositories: repositories.length,
      totalStars: repositories.reduce((sum, repo) => sum + repo.stargazers_count, 0),
      totalForks: repositories.reduce((sum, repo) => sum + repo.forks_count, 0),
      totalIssues: repositories.reduce((sum, repo) => sum + repo.open_issues_count, 0),
      recentActivity: activity.slice(0, 20),
      topRepositories: repositories
        .sort((a, b) => b.stargazers_count - a.stargazers_count)
        .slice(0, 10),
      recentRepositories: repositories
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
        .slice(0, 10),
      languages: repositories.reduce((acc, repo) => {
        if (repo.language) {
          acc[repo.language] = (acc[repo.language] || 0) + 1;
        }
        return acc;
      }, {})
    };

    res.json(dashboardStats);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard data',
      message: error.message
    });
  }
}));

// Get branch-specific data for Beetle
router.get('/repositories/:owner/:repo/branches/:branch', asyncHandler(async (req, res) => {
  const { owner, repo, branch } = req.params;
  
  try {
    // Fetch branch-specific data
    const [branches, commits, issues, pullRequests] = await Promise.all([
      getRepositoryBranches(req.user.accessToken, owner, repo),
      getRepositoryCommits(req.user.accessToken, owner, repo, branch, 1, 50),
      getRepositoryIssues(req.user.accessToken, owner, repo, 'open', 1, 50),
      getRepositoryPullRequests(req.user.accessToken, owner, repo, 'open', 1, 50)
    ]);

    // Find the specific branch
    const branchData = branches.find(b => b.name === branch);
    
    if (!branchData) {
      return res.status(404).json({
        error: 'Branch not found',
        message: `Branch '${branch}' not found in repository ${owner}/${repo}`
      });
    }

    // Filter issues and PRs related to this branch
    const branchIssues = issues.filter(issue => 
      issue.labels.some(label => 
        label.name.toLowerCase().includes(branch.toLowerCase()) ||
        issue.title.toLowerCase().includes(branch.toLowerCase())
      )
    );

    const branchPullRequests = pullRequests.filter(pr => 
      pr.head.ref === branch || 
      pr.base.ref === branch ||
      pr.title.toLowerCase().includes(branch.toLowerCase())
    );

    const branchStats = {
      branch: branchData,
      commits: commits,
      issues: branchIssues,
      pullRequests: branchPullRequests,
      summary: {
        totalCommits: commits.length,
        totalIssues: branchIssues.length,
        totalPullRequests: branchPullRequests.length,
        lastCommit: commits[0] || null,
        lastActivity: branchData.commit.committer.date
      }
    };

    res.json(branchStats);
  } catch (error) {
    console.error('Error fetching branch data:', error);
    res.status(500).json({
      error: 'Failed to fetch branch data',
      message: error.message
    });
  }
}));

module.exports = router; 