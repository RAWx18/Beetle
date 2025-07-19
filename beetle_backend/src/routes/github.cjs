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
  searchRepositories,
  searchUsers,
  searchOrganizations,
  getRepositoryTree,
  getFileContent,
  getRepositoryTreesForAllBranches,
  isValidOwner,
  rateLimitManager,
  cacheManager
} = require('../utils/github.cjs');
const { saveRepository, getRepository } = require('../utils/database.cjs');
const { asyncHandler } = require('../middleware/errorHandler.cjs');

const router = express.Router();

// Simple rate limiting for public endpoints
const rateLimitMap = new Map();
const publicRateLimit = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 60; // 60 requests per 15 minutes for public endpoints

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return next();
  }

  const userLimit = rateLimitMap.get(ip);
  
  if (now > userLimit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return next();
  }

  if (userLimit.count >= maxRequests) {
    return res.status(429).json({ 
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later or sign in for higher limits.'
    });
  }

  userLimit.count++;
  next();
};

// Utility function for exact word matching (case-insensitive)
const isExactMatch = (searchQuery, targetString) => {
  if (!searchQuery || !targetString) return false;
  
  const query = searchQuery.toLowerCase().trim();
  const target = targetString.toLowerCase().trim();
  
  // Check for exact match of the full string
  if (target === query) return true;
  
  // Check for exact word match within the string
  const words = target.split(/\s+|[-._]/); // Split on spaces, hyphens, dots, underscores
  return words.some(word => word === query);
};

// Filter search results for exact matches
const filterExactMatches = (items, query, matchFields) => {
  if (!query || !items || !Array.isArray(items)) return [];
  
  return items.filter(item => {
    return matchFields.some(field => {
      const value = field.split('.').reduce((obj, key) => obj?.[key], item);
      return value && isExactMatch(query, value);
    });
  });
};

// PUBLIC ENDPOINTS (no authentication required)

// Public search repositories
router.get('/public/search/repositories', [
  publicRateLimit,
  query('q').isString().notEmpty(),
  query('sort').optional().isIn(['stars', 'forks', 'help-wanted-issues', 'updated']),
  query('order').optional().isIn(['desc', 'asc']),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('per_page').optional().isInt({ min: 1, max: 30 }).toInt()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      details: errors.array()
    });
  }

  const { q, sort = 'stars', order = 'desc', page = 1, per_page = 10 } = req.query;
  
  try {
    // Use a demo token for public searches (replace with your GitHub token)
    const demoToken = process.env.GITHUB_PUBLIC_TOKEN || null;
    
    if (!demoToken) {
      // Return fallback results if no public token is available
      const fallbackRepos = [
        {
          id: 1,
          name: "next.js",
          full_name: "vercel/next.js",
          owner: {
            login: 'vercel',
            id: 1,
            avatar_url: 'https://github.com/vercel.png',
            type: 'Organization',
            html_url: 'https://github.com/vercel'
          },
          private: false,
          html_url: "https://github.com/vercel/next.js",
          description: "The React Framework for the Web. Used by some of the world's largest companies, Next.js enables you to create full-stack web applications.",
          fork: false,
          url: "https://api.github.com/repos/vercel/next.js",
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          pushed_at: '2024-01-01T00:00:00Z',
          clone_url: "https://github.com/vercel/next.js.git",
          stargazers_count: 120000,
          watchers_count: 120000,
          language: 'TypeScript',
          forks_count: 26000,
          archived: false,
          disabled: false,
          open_issues_count: 1200,
          license: { key: 'mit', name: 'MIT License' },
          allow_forking: true,
          default_branch: 'main',
          score: 1.0
        },
        {
          id: 2,
          name: "react",
          full_name: "facebook/react",
          owner: {
            login: 'facebook',
            id: 2,
            avatar_url: 'https://github.com/facebook.png',
            type: 'Organization',
            html_url: 'https://github.com/facebook'
          },
          private: false,
          html_url: "https://github.com/facebook/react",
          description: "The library for web and native user interfaces",
          fork: false,
          url: "https://api.github.com/repos/facebook/react",
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          pushed_at: '2024-01-01T00:00:00Z',
          clone_url: "https://github.com/facebook/react.git",
          stargazers_count: 220000,
          watchers_count: 220000,
          language: 'JavaScript',
          forks_count: 45000,
          archived: false,
          disabled: false,
          open_issues_count: 800,
          license: { key: 'mit', name: 'MIT License' },
          allow_forking: true,
          default_branch: 'main',
          score: 1.0
        },
        {
          id: 3,
          name: "beetle",
          full_name: "RAWx18/beetle",
          owner: {
            login: 'RAWx18',
            id: 3,
            avatar_url: 'https://github.com/RAWx18.png',
            type: 'User',
            html_url: 'https://github.com/RAWx18'
          },
          private: false,
          html_url: "https://github.com/RAWx18/beetle",
          description: "The Next-Generation Git Collaboration Platform with AI-Powered Branch Intelligence",
          fork: false,
          url: "https://api.github.com/repos/RAWx18/beetle",
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          pushed_at: '2024-01-01T00:00:00Z',
          clone_url: "https://github.com/RAWx18/beetle.git",
          stargazers_count: 4,
          watchers_count: 4,
          language: 'TypeScript',
          forks_count: 1,
          archived: false,
          disabled: false,
          open_issues_count: 2,
          license: { key: 'mit', name: 'MIT License' },
          allow_forking: true,
          default_branch: 'main',
          score: 1.0
        }
      ];

      // Filter for exact matches only
      const exactMatches = filterExactMatches(fallbackRepos, q, ['name', 'full_name', 'owner.login']);

      return res.json({
        total_count: exactMatches.length,
        incomplete_results: false,
        items: exactMatches,
        query: q,
        pagination: { sort, order, page, per_page }
      });
    }

    const searchResults = await searchRepositories(demoToken, q, sort, order, page, per_page);
    
    // Filter GitHub API results for exact matches
    const exactMatches = filterExactMatches(searchResults.items, q, ['name', 'full_name', 'owner.login']);
    
    res.json({
      total_count: exactMatches.length,
      incomplete_results: false,
      items: exactMatches,
      query: q,
      pagination: { sort, order, page, per_page }
    });
  } catch (error) {
    console.error('Public repository search error:', error);
    res.status(500).json({
      error: 'Search temporarily unavailable',
      message: 'Please try again later or sign in to GitHub for full search functionality.'
    });
  }
}));

// Public search users
router.get('/public/search/users', [
  publicRateLimit,
  query('q').isString().notEmpty(),
  query('sort').optional().isIn(['followers', 'repositories', 'joined']),
  query('order').optional().isIn(['desc', 'asc']),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('per_page').optional().isInt({ min: 1, max: 30 }).toInt()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      details: errors.array()
    });
  }

  const { q, sort = 'followers', order = 'desc', page = 1, per_page = 10 } = req.query;
  
  try {
    const demoToken = process.env.GITHUB_PUBLIC_TOKEN || null;
    
    if (!demoToken) {
      // Return fallback user results
      const fallbackUsers = [
        {
          login: "vercel",
          id: 1,
          avatar_url: 'https://github.com/vercel.png',
          html_url: "https://github.com/vercel",
          type: 'Organization',
          name: "Vercel",
          company: 'Vercel Inc.',
          blog: 'https://vercel.com',
          location: 'San Francisco',
          email: null,
          bio: "Develop. Preview. Ship. For the best frontend teams – https://vercel.com",
          public_repos: 150,
          public_gists: 0,
          followers: 5000,
          following: 50,
          created_at: '2020-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          score: 1.0
        },
        {
          login: "facebook",
          id: 2,
          avatar_url: 'https://github.com/facebook.png',
          html_url: "https://github.com/facebook",
          type: 'Organization',
          name: "Facebook",
          company: 'Meta',
          blog: 'https://engineering.fb.com',
          location: 'Menlo Park, CA',
          email: null,
          bio: "We are working to build community through open source technology.",
          public_repos: 200,
          public_gists: 0,
          followers: 15000,
          following: 0,
          created_at: '2009-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          score: 1.0
        },
        {
          login: "RAWx18",
          id: 3,
          avatar_url: 'https://github.com/RAWx18.png',
          html_url: "https://github.com/RAWx18",
          type: 'User',
          name: "RAWx18",
          company: null,
          blog: '',
          location: null,
          email: null,
          bio: "Developer focused on open source collaboration tools",
          public_repos: 10,
          public_gists: 2,
          followers: 50,
          following: 100,
          created_at: '2022-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          score: 1.0
        }
      ];

      // Filter for exact matches only
      const exactMatches = filterExactMatches(fallbackUsers, q, ['login', 'name']);

      return res.json({
        total_count: exactMatches.length,
        incomplete_results: false,
        items: exactMatches,
        query: q,
        pagination: { sort, order, page, per_page }
      });
    }

    const searchResults = await searchUsers(demoToken, q, sort, order, page, per_page);
    
    // Filter GitHub API results for exact matches
    const exactMatches = filterExactMatches(searchResults.items, q, ['login', 'name']);
    
    res.json({
      total_count: exactMatches.length,
      incomplete_results: false,
      items: exactMatches,
      query: q,
      pagination: { sort, order, page, per_page }
    });
  } catch (error) {
    console.error('Public user search error:', error);
    res.status(500).json({
      error: 'Search temporarily unavailable',
      message: 'Please try again later or sign in to GitHub for full search functionality.'
    });
  }
}));

// Public search organizations
router.get('/public/search/organizations', [
  publicRateLimit,
  query('q').isString().notEmpty(),
  query('sort').optional().isIn(['repositories', 'joined']),
  query('order').optional().isIn(['desc', 'asc']),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('per_page').optional().isInt({ min: 1, max: 30 }).toInt()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      details: errors.array()
    });
  }

  const { q, sort = 'repositories', order = 'desc', page = 1, per_page = 10 } = req.query;
  
  try {
    const demoToken = process.env.GITHUB_PUBLIC_TOKEN || null;
    
    if (!demoToken) {
      // Return fallback organization results
      const fallbackOrgs = [
        {
          login: "vercel",
          id: 1,
          avatar_url: 'https://github.com/vercel.png',
          html_url: "https://github.com/vercel",
          type: 'Organization',
          name: "Vercel",
          company: null,
          blog: 'https://vercel.com',
          location: 'Global',
          email: null,
          bio: "Develop. Preview. Ship. For the best frontend teams",
          public_repos: 150,
          public_gists: 0,
          followers: 5000,
          following: 0,
          created_at: '2018-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          score: 1.0
        },
        {
          login: "microsoft",
          id: 2,
          avatar_url: 'https://github.com/microsoft.png',
          html_url: "https://github.com/microsoft",
          type: 'Organization',
          name: "Microsoft",
          company: null,
          blog: 'https://opensource.microsoft.com',
          location: 'Redmond, WA',
          email: null,
          bio: "Open source projects and samples from Microsoft",
          public_repos: 4500,
          public_gists: 0,
          followers: 25000,
          following: 0,
          created_at: '2014-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          score: 1.0
        },
        {
          login: "facebook",
          id: 3,
          avatar_url: 'https://github.com/facebook.png',
          html_url: "https://github.com/facebook",
          type: 'Organization',
          name: "Facebook",
          company: null,
          blog: 'https://engineering.fb.com',
          location: 'Menlo Park, CA',
          email: null,
          bio: "We are working to build community through open source technology.",
          public_repos: 200,
          public_gists: 0,
          followers: 15000,
          following: 0,
          created_at: '2009-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          score: 1.0
        }
      ];

      // Filter for exact matches only
      const exactMatches = filterExactMatches(fallbackOrgs, q, ['login', 'name']);

      return res.json({
        total_count: exactMatches.length,
        incomplete_results: false,
        items: exactMatches,
        query: q,
        pagination: { sort, order, page, per_page }
      });
    }

    const searchResults = await searchOrganizations(demoToken, q, sort, order, page, per_page);
    
    // Filter GitHub API results for exact matches
    const exactMatches = filterExactMatches(searchResults.items, q, ['login', 'name']);
    
    res.json({
      total_count: exactMatches.length,
      incomplete_results: false,
      items: exactMatches,
      query: q,
      pagination: { sort, order, page, per_page }
    });
  } catch (error) {
    console.error('Public organization search error:', error);
    res.status(500).json({
      error: 'Search temporarily unavailable',
      message: 'Please try again later or sign in to GitHub for full search functionality.'
    });
  }
}));

// PROTECTED ENDPOINTS (authentication required)

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
    // Check if this is demo mode - use fallback data
    if (req.user.accessToken === 'demo-github-token') {
      console.log('Demo mode: returning fallback trending repositories');
      return res.json({
        repositories: getFallbackTrendingRepos(language, page, per_page),
        pagination: {
          since,
          language,
          page,
          per_page,
          total: getFallbackTrendingRepos(language).length
        }
      });
    }

    // Fetch real trending repositories from GitHub
    const trendingRepos = await fetchTrendingRepositories(req.user.accessToken, since, language, page, per_page);
    
    res.json({
      repositories: trendingRepos.repositories,
      pagination: {
        since,
        language,
        page,
        per_page,
        total: trendingRepos.total
      }
    });
  } catch (error) {
    console.error('Error fetching trending repositories:', error);
    
    // Fallback to curated list on API error
    console.log('Falling back to curated trending repositories due to API error');
    const fallbackRepos = getFallbackTrendingRepos(language, page, per_page);
    
    res.json({
      repositories: fallbackRepos,
      pagination: {
        since,
        language,
        page,
        per_page,
        total: getFallbackTrendingRepos(language).length
      },
      fallback: true,
      error_message: 'Using fallback data due to API error'
    });
  }
}));

// Helper function to fetch trending repositories from GitHub API
async function fetchTrendingRepositories(accessToken, since, language, page, per_page) {
  // Calculate date range based on 'since' parameter
  const now = new Date();
  const pastDate = new Date();
  
  switch (since) {
    case 'daily':
      pastDate.setDate(now.getDate() - 1);
      break;
    case 'weekly':
      pastDate.setDate(now.getDate() - 7);
      break;
    case 'monthly':
      pastDate.setDate(now.getDate() - 30);
      break;
    default:
      pastDate.setDate(now.getDate() - 7);
  }

  // Build search query
  let searchQuery = `created:>${pastDate.toISOString().split('T')[0]}`;
  
  if (language) {
    searchQuery += ` language:${language}`;
  }

  // Add additional criteria for trending repositories
  searchQuery += ' stars:>100'; // Minimum star threshold
  
  const searchUrl = `https://api.github.com/search/repositories?q=${encodeURIComponent(searchQuery)}&sort=stars&order=desc&page=${page}&per_page=${per_page}`;
  
  console.log('Fetching trending repositories from GitHub:', searchUrl);
  
  const response = await fetch(searchUrl, {
    headers: {
      'Authorization': `token ${accessToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Beetle-App'
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  // Transform GitHub API response to our format
  const repositories = data.items.map(repo => ({
    id: repo.id,
    name: repo.name,
    full_name: repo.full_name,
    description: repo.description || 'No description available',
    language: repo.language,
    stargazers_count: repo.stargazers_count,
    forks_count: repo.forks_count,
    updated_at: repo.updated_at,
    private: repo.private,
    html_url: repo.html_url,
    owner: {
      login: repo.owner.login,
      avatar_url: repo.owner.avatar_url
    }
  }));

  return {
    repositories,
    total: data.total_count
  };
}

// Helper function to get fallback trending repositories
function getFallbackTrendingRepos(language, page = 1, per_page = 30) {
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
    },
    {
      id: 70107791,
      name: "vue",
      full_name: "vuejs/vue",
      description: "Vue.js is a progressive, incrementally-adoptable JavaScript framework for building UI on the web.",
      language: "JavaScript",
      stargazers_count: 210000,
      forks_count: 33000,
      updated_at: new Date().toISOString(),
      private: false,
      html_url: "https://github.com/vuejs/vue",
      owner: {
        login: "vuejs",
        avatar_url: "https://github.com/vuejs.png"
      }
    },
    {
      id: 70107792,
      name: "tailwindcss",
      full_name: "tailwindlabs/tailwindcss",
      description: "A utility-first CSS framework for rapid UI development.",
      language: "CSS",
      stargazers_count: 80000,
      forks_count: 4000,
      updated_at: new Date().toISOString(),
      private: false,
      html_url: "https://github.com/tailwindlabs/tailwindcss",
      owner: {
        login: "tailwindlabs",
        avatar_url: "https://github.com/tailwindlabs.png"
      }
    },
    {
      id: 70107793,
      name: "nodejs",
      full_name: "nodejs/node",
      description: "Node.js JavaScript runtime built on Chrome's V8 JavaScript engine.",
      language: "C++",
      stargazers_count: 105000,
      forks_count: 28500,
      updated_at: new Date().toISOString(),
      private: false,
      html_url: "https://github.com/nodejs/node",
      owner: {
        login: "nodejs",
        avatar_url: "https://github.com/nodejs.png"
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
  return filteredRepos.slice(startIndex, endIndex);
}

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

// Search users
router.get('/search/users', [
  query('q').isString().notEmpty(),
  query('sort').optional().isIn(['followers', 'repositories', 'joined']),
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

  const { q, sort = 'followers', order = 'desc', page = 1, per_page = 30 } = req.query;
  
  const searchResults = await searchUsers(req.user.accessToken, q, sort, order, page, per_page);

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

// Search organizations
router.get('/search/organizations', [
  query('q').isString().notEmpty(),
  query('sort').optional().isIn(['repositories', 'joined']),
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

  const { q, sort = 'repositories', order = 'desc', page = 1, per_page = 30 } = req.query;
  
  const searchResults = await searchOrganizations(req.user.accessToken, q, sort, order, page, per_page);

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
  const { since } = req.query;
  
  try {
    // Fetch branch-specific data
    const [branches, commits, issues, pullRequests] = await Promise.all([
      getRepositoryBranches(req.user.accessToken, owner, repo),
      getRepositoryCommits(req.user.accessToken, owner, repo, branch, 1, 100, since), // Pass since parameter
      getRepositoryIssues(req.user.accessToken, owner, repo, 'all', 1, 100), // Fetch all issues, not just open ones
      getRepositoryPullRequests(req.user.accessToken, owner, repo, 'all', 1, 100) // Fetch all PRs, not just open ones
    ]);

    // Find the specific branch
    const branchData = branches.find(b => b.name === branch);
    
    if (!branchData) {
      return res.status(404).json({
        error: 'Branch not found',
        message: `Branch '${branch}' not found in repository ${owner}/${repo}`
      });
    }



    // For now, return all issues and PRs since branch-specific filtering is too restrictive
    // The frontend can handle filtering based on user preferences
    const branchIssues = issues;
    const branchPullRequests = pullRequests;

    // Debug logging
    console.log(`[Branch Data] ${owner}/${repo}/${branch}:`, {
      commitsCount: commits.length,
      issuesCount: branchIssues.length,
      pullRequestsCount: branchPullRequests.length,
      since: since || 'none'
    });

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
    
    // Handle specific GitHub API errors
    if (error.response?.status === 404) {
      return res.status(404).json({
        error: 'Repository not found',
        message: `Repository ${owner}/${repo} not found or access denied`
      });
    }
    
    if (error.response?.status === 403) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Insufficient permissions to access this repository'
      });
    }
    
    res.status(500).json({
      error: 'Failed to fetch branch data',
      message: error.message
    });
  }
}));

// Get repository tree (file/folder structure)
router.get('/repositories/:owner/:repo/tree', asyncHandler(async (req, res) => {
  const { owner, repo } = req.params;
  const branch = req.query.branch || 'main';
  try {
    const tree = await getRepositoryTree(req.user.accessToken, owner, repo, branch);
    res.json({ tree });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch repository tree', message: error.message });
  }
}));

// Get file trees from all branches for a repository
router.get('/repositories/:owner/:repo/trees', asyncHandler(async (req, res) => {
  const { owner, repo } = req.params;
  try {
    // Validate owner parameter
    if (!isValidOwner(owner)) {
      return res.status(400).json({ error: 'Invalid owner parameter' });
    }

    const treesByBranch = await getRepositoryTreesForAllBranches(req.user.accessToken, owner, repo);
    res.json({ treesByBranch });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch repository trees for all branches', message: error.message });
  }
}));

// Get file content from a repo
router.get('/repositories/:owner/:repo/contents/:path', asyncHandler(async (req, res) => {
  const { owner, repo, path } = req.params;
  const branch = req.query.ref || 'main';
  try {
    const content = await getFileContent(req.user.accessToken, owner, repo, path, branch);
    res.json({ content });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch file content', message: error.message });
  }
}));

// Get all branches with their file trees (comprehensive endpoint)
router.get('/repositories/:owner/:repo/branches-with-trees', asyncHandler(async (req, res) => {
  const { owner, repo } = req.params;
  try {
    // Get all branches
    const branches = await getRepositoryBranches(req.user.accessToken, owner, repo);
    
    // Get trees for all branches
    const treesByBranch = await getRepositoryTreesForAllBranches(req.user.accessToken, owner, repo);
    
    // Combine the data
    const result = {
      branches: branches,
      treesByBranch: treesByBranch,
      summary: {
        totalBranches: branches.length,
        branchesWithTrees: Object.keys(treesByBranch).length,
        branchesWithErrors: Object.values(treesByBranch).filter(b => b.error).length
      }
    };
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch branches with trees', message: error.message });
  }
}));

// Get GitHub API rate limit status
router.get('/rate-limit', asyncHandler(async (req, res) => {
  try {
    const status = rateLimitManager.getRateLimitStatus(req.user.accessToken);
    const stats = rateLimitManager.getStatistics();
    const cacheStats = cacheManager.getStatistics();
    
    res.json({
      rateLimit: {
        limit: status.limit,
        remaining: status.remaining,
        used: status.used,
        reset: status.reset,
        resetDate: status.resetDate,
        isNearLimit: status.isNearLimit,
        isRateLimited: status.isRateLimited,
        resource: status.resource
      },
      statistics: stats,
      cache: cacheStats,
      recommendations: {
        shouldThrottle: status.isNearLimit,
        nextResetIn: Math.max(0, status.reset - Math.floor(Date.now() / 1000)),
        percentageUsed: ((status.limit - status.remaining) / status.limit * 100).toFixed(1)
      }
    });
  } catch (error) {
    console.error('Error fetching rate limit status:', error);
    res.status(500).json({
      error: 'Failed to fetch rate limit status',
      message: error.message
    });
  }
}));

// Clear GitHub API cache (for debugging/admin)
router.delete('/cache', asyncHandler(async (req, res) => {
  try {
    const { type } = req.query;
    
    if (type) {
      // Clear specific cache type - not implemented in this simple version
      res.json({ message: `Cache type '${type}' clearing not implemented` });
    } else {
      // Clear all cache
      cacheManager.clear();
      res.json({ message: 'All GitHub API cache cleared successfully' });
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      error: 'Failed to clear cache',
      message: error.message
    });
  }
}));

module.exports = router; 