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

// Get user starred repositories
router.get('/starred', [
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
  
  // Check if this is demo mode
  if (req.user.accessToken === 'demo-github-token') {
    // Return mock starred repositories for demo mode
    const mockStarredRepos = [
      {
        id: 101,
        name: "next.js",
        full_name: "vercel/next.js",
        description: "The React Framework for the Web. Used by some of the world's largest companies, Next.js enables you to create full-stack web applications.",
        language: "TypeScript",
        stargazers_count: 120000,
        forks_count: 26000,
        updated_at: new Date().toISOString(),
        private: false,
        html_url: "https://github.com/vercel/next.js",
        owner: {
          login: "vercel",
          avatar_url: "https://github.com/vercel.png"
        }
      },
      {
        id: 102,
        name: "react",
        full_name: "facebook/react",
        description: "The library for web and native user interfaces. React lets you build user interfaces out of individual pieces called components.",
        language: "JavaScript",
        stargazers_count: 220000,
        forks_count: 45000,
        updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        private: false,
        html_url: "https://github.com/facebook/react",
        owner: {
          login: "facebook",
          avatar_url: "https://github.com/facebook.png"
        }
      },
      {
        id: 103,
        name: "vscode",
        full_name: "microsoft/vscode",
        description: "Visual Studio Code. Code editing. Redefined. Free. Built on open source. Runs everywhere.",
        language: "TypeScript",
        stargazers_count: 155000,
        forks_count: 27000,
        updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        private: false,
        html_url: "https://github.com/microsoft/vscode",
        owner: {
          login: "microsoft",
          avatar_url: "https://github.com/microsoft.png"
        }
      }
    ];

    // Apply pagination
    const startIndex = (page - 1) * per_page;
    const endIndex = startIndex + per_page;
    const paginatedRepos = mockStarredRepos.slice(startIndex, endIndex);

    return res.json({
      repositories: paginatedRepos,
      pagination: {
        page,
        per_page,
        total: mockStarredRepos.length
      }
    });
  }
  
  try {
    const response = await fetch(`https://api.github.com/user/starred?page=${page}&per_page=${per_page}`, {
      headers: {
        'Authorization': `token ${req.user.accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Beetle-App'
      }
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const starredRepos = await response.json();

    res.json({
      repositories: starredRepos,
      pagination: {
        page,
        per_page,
        total: starredRepos.length
      }
    });
  } catch (error) {
    console.error('Error fetching starred repositories:', error);
    res.status(500).json({
      error: 'Failed to fetch starred repositories',
      message: error.message
    });
  }
}));

// Get trending repositories
router.get('/trending', [
  query('since').optional().isIn(['daily', 'weekly', 'monthly']),
  query('language').optional().isString(),
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

  const { since = 'weekly', language, page = 1, per_page = 30 } = req.query;
  
  try {
    // Since GitHub doesn't have a direct API for trending, we'll use a curated list
    // of popular repositories as a fallback
    const popularRepos = [
      {
        id: 70107786,
        name: "next.js",
        full_name: "vercel/next.js",
        description: "The React Framework for the Web. Used by some of the world's largest companies, Next.js enables you to create full-stack web applications.",
        language: "TypeScript",
        stargazers_count: 120000,
        forks_count: 26000,
        updated_at: new Date().toISOString(),
        private: false,
        html_url: "https://github.com/vercel/next.js",
        owner: {
          login: "vercel",
          avatar_url: "https://github.com/vercel.png"
        }
      },
      {
        id: 70107787,
        name: "react",
        full_name: "facebook/react",
        description: "The library for web and native user interfaces. React lets you build user interfaces out of individual pieces called components.",
        language: "JavaScript",
        stargazers_count: 220000,
        forks_count: 45000,
        updated_at: new Date().toISOString(),
        private: false,
        html_url: "https://github.com/facebook/react",
        owner: {
          login: "facebook",
          avatar_url: "https://github.com/facebook.png"
        }
      },
      {
        id: 70107788,
        name: "vscode",
        full_name: "microsoft/vscode",
        description: "Visual Studio Code. Code editing. Redefined. Free. Built on open source. Runs everywhere.",
        language: "TypeScript",
        stargazers_count: 155000,
        forks_count: 27000,
        updated_at: new Date().toISOString(),
        private: false,
        html_url: "https://github.com/microsoft/vscode",
        owner: {
          login: "microsoft",
          avatar_url: "https://github.com/microsoft.png"
        }
      },
      {
        id: 70107789,
        name: "svelte",
        full_name: "sveltejs/svelte",
        description: "Cybernetically enhanced web apps. Svelte is a radical new approach to building user interfaces.",
        language: "TypeScript",
        stargazers_count: 85000,
        forks_count: 12000,
        updated_at: new Date().toISOString(),
        private: false,
        html_url: "https://github.com/sveltejs/svelte",
        owner: {
          login: "sveltejs",
          avatar_url: "https://github.com/sveltejs.png"
        }
      },
      {
        id: 70107790,
        name: "rust",
        full_name: "rust-lang/rust",
        description: "Empowering everyone to build reliable and efficient software.",
        language: "Rust",
        stargazers_count: 95000,
        forks_count: 15000,
        updated_at: new Date().toISOString(),
        private: false,
        html_url: "https://github.com/rust-lang/rust",
        owner: {
          login: "rust-lang",
          avatar_url: "https://github.com/rust-lang.png"
        }
      }
    ];

    // Filter by language if specified
    const filteredRepos = language 
      ? popularRepos.filter(repo => repo.language && repo.language.toLowerCase() === language.toLowerCase())
      : popularRepos;

    // Apply pagination
    const startIndex = (page - 1) * per_page;
    const endIndex = startIndex + per_page;
    const paginatedRepos = filteredRepos.slice(startIndex, endIndex);

    res.json({
      repositories: paginatedRepos,
      pagination: {
        since,
        language,
        page,
        per_page,
        total: filteredRepos.length
      }
    });
  } catch (error) {
    console.error('Error fetching trending repositories:', error);
    res.status(500).json({
      error: 'Failed to fetch trending repositories',
      message: error.message
    });
  }
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

// Get recent changes since timestamp
router.get('/recent-changes', asyncHandler(async (req, res) => {
  const { since } = req.query;
  const { accessToken } = req.user;

  try {
    // Fetch recent activity
    const activity = await octokit.request('GET /users/{username}/events', {
      username: req.user.login,
      per_page: 30,
      headers: {
        authorization: `token ${accessToken}`,
      },
    });

    // Filter activity since the given timestamp
    const recentActivity = activity.data.filter(event => 
      new Date(event.created_at) > new Date(since)
    );

    // Process different types of events
    const commits = recentActivity
      .filter(event => event.type === 'PushEvent')
      .flatMap(event => event.payload.commits || [])
      .map(commit => ({
        sha: commit.sha,
        commit: {
          message: commit.message,
          author: {
            name: commit.author.name,
            email: commit.author.email,
            date: new Date().toISOString()
          }
        },
        author: {
          login: req.user.login,
          avatar_url: req.user.avatar_url
        }
      }));

    const prs = recentActivity
      .filter(event => event.type === 'PullRequestEvent')
      .map(event => ({
        id: event.payload.pull_request.id,
        number: event.payload.pull_request.number,
        title: event.payload.pull_request.title,
        state: event.payload.pull_request.state,
        created_at: event.payload.pull_request.created_at,
        updated_at: event.payload.pull_request.updated_at,
        user: {
          login: event.payload.pull_request.user.login,
          avatar_url: event.payload.pull_request.user.avatar_url
        },
        head: { ref: event.payload.pull_request.head.ref },
        base: { ref: event.payload.pull_request.base.ref }
      }));

    const issues = recentActivity
      .filter(event => event.type === 'IssuesEvent')
      .map(event => ({
        id: event.payload.issue.id,
        number: event.payload.issue.number,
        title: event.payload.issue.title,
        state: event.payload.issue.state,
        created_at: event.payload.issue.created_at,
        updated_at: event.payload.issue.updated_at,
        user: {
          login: event.payload.issue.user.login,
          avatar_url: event.payload.issue.user.avatar_url
        },
        labels: event.payload.issue.labels
      }));

    // Get stats changes
    const stats = {
      newStars: recentActivity.filter(event => event.type === 'WatchEvent').length,
      newForks: recentActivity.filter(event => event.type === 'ForkEvent').length
    };

    res.json({
      commits,
      prs,
      issues,
      stats
    });
  } catch (error) {
    console.error('Error fetching recent changes:', error);
    res.status(500).json({
      error: 'Failed to fetch recent changes',
      message: error.message
    });
  }
}));

module.exports = router; 