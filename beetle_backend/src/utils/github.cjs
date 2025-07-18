const axios = require('axios');
const { getCache, setCache } = require('./database.cjs');
const { rateLimitManager } = require('./github-rate-limit.cjs');
const { cacheManager } = require('./github-cache.cjs');

// GitHub API configuration
const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';

// Create GitHub API client with authentication and rate limit handling
const createGitHubClient = (accessToken) => {
  const client = axios.create({
    baseURL: GITHUB_API_BASE,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Beetle-App/1.0.0'
    }
  });

  // Add request interceptor for rate limit handling
  client.interceptors.request.use(async (config) => {
    // Add conditional request headers if cached data exists
    const rateLimitStatus = rateLimitManager.getRateLimitStatus(accessToken);
    
    // Log rate limit status for debugging
    if (rateLimitStatus.remaining < 100) {
      console.log(`⚠️ Low rate limit: ${rateLimitStatus.remaining}/${rateLimitStatus.limit} remaining, reset at ${rateLimitStatus.resetDate}`);
    }

    return config;
  });

  // Add response interceptor for rate limit tracking
  client.interceptors.response.use(
    (response) => {
      // Update rate limit information from response headers
      rateLimitManager.updateRateLimit(accessToken, response.headers);
      return response;
    },
    (error) => {
      // Update rate limit information from error response headers
      if (error.response && error.response.headers) {
        rateLimitManager.updateRateLimit(accessToken, error.response.headers);
      }
      return Promise.reject(error);
    }
  );

  return client;
};

// Validate owner parameter
const isValidOwner = (owner) => {
  const ownerRegex = /^[a-zA-Z0-9_-]+$/; // Allow alphanumeric, underscores, and hyphens
  return ownerRegex.test(owner);
};

// Create GraphQL client
const createGraphQLClient = (accessToken) => {
  return axios.create({
    baseURL: GITHUB_GRAPHQL_URL,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
};

// Get user profile with enhanced rate limit handling
const getUserProfile = async (accessToken) => {
  try {
    // Check cache first
    const cached = cacheManager.get('user_profile', accessToken.substring(0, 10));
    if (cached) return cached;

    const client = createGitHubClient(accessToken);
    
    // Execute with rate limit handling
    const response = await rateLimitManager.executeWithRateLimit(
      accessToken,
      async () => {
        const conditionalHeaders = cacheManager.getConditionalHeaders('user_profile', accessToken.substring(0, 10));
        return await client.get('/user', { headers: conditionalHeaders });
      },
      { priority: 'high', operation: 'getUserProfile' }
    );

    // Handle 304 Not Modified
    if (response.status === 304) {
      return cacheManager.handleNotModified('user_profile', accessToken.substring(0, 10));
    }
    
    const userData = {
      id: response.data.id,
      login: response.data.login,
      name: response.data.name,
      email: response.data.email,
      avatar_url: response.data.avatar_url,
      bio: response.data.bio,
      location: response.data.location,
      company: response.data.company,
      blog: response.data.blog,
      twitter_username: response.data.twitter_username,
      public_repos: response.data.public_repos,
      followers: response.data.followers,
      following: response.data.following,
      created_at: response.data.created_at,
      updated_at: response.data.updated_at
    };

    // Cache with ETag
    const etag = response.headers.etag;
    cacheManager.set('user_profile', userData, etag, accessToken.substring(0, 10));
    
    // Also use legacy cache for backward compatibility
    await setCache(`user_profile_${accessToken.substring(0, 10)}`, userData, 1800);
    
    return userData;
  } catch (error) {
    console.error('Error fetching user profile:', error.message);
    if (error.response) {
      console.error('GitHub API Error Details:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
    }
    
    // Enhanced error handling for rate limits
    if (rateLimitManager.isRateLimitError(error)) {
      throw rateLimitManager.enhanceError(error, 0);
    }
    
    throw new Error(`Failed to fetch user profile: ${error.message}`);
  }
};

// Get user repositories with enhanced rate limit handling
const getUserRepositories = async (accessToken, page = 1, perPage = 100) => {
  try {
    // Demo mode support
    if (accessToken === 'demo-github-token') {
      return [
        {
          id: 1,
          name: "beetle-app",
          full_name: "demo-user/beetle-app",
          description: "AI-powered GitHub contribution manager with structured planning and branch-aware workflows",
          private: false,
          fork: false,
          language: "TypeScript",
          stargazers_count: 15,
          forks_count: 3,
          open_issues_count: 2,
          default_branch: "main",
          updated_at: new Date().toISOString(),
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          pushed_at: new Date().toISOString(),
          owner: {
            login: "demo-user",
            avatar_url: "https://github.com/github.png",
            type: "User"
          },
          topics: ["ai", "github", "productivity"],
          license: { name: "MIT" },
          archived: false,
          disabled: false,
          homepage: "https://beetle.app",
          html_url: "https://github.com/demo-user/beetle-app",
          clone_url: "https://github.com/demo-user/beetle-app.git",
          ssh_url: "git@github.com:demo-user/beetle-app.git"
        },
        {
          id: 2,
          name: "react-components",
          full_name: "demo-user/react-components",
          description: "Reusable React components library with TypeScript",
          private: false,
          fork: false,
          language: "TypeScript",
          stargazers_count: 8,
          forks_count: 1,
          open_issues_count: 1,
          default_branch: "main",
          updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          pushed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          owner: {
            login: "demo-user",
            avatar_url: "https://github.com/github.png",
            type: "User"
          },
          topics: ["react", "typescript", "components"],
          license: { name: "MIT" },
          archived: false,
          disabled: false,
          homepage: null,
          html_url: "https://github.com/demo-user/react-components",
          clone_url: "https://github.com/demo-user/react-components.git",
          ssh_url: "git@github.com:demo-user/react-components.git"
        }
      ];
    }

    // Check cache first
    const cached = cacheManager.get('user_repos', accessToken.substring(0, 10), page);
    if (cached) return cached;

    const client = createGitHubClient(accessToken);
    
    // Execute with rate limit handling
    const response = await rateLimitManager.executeWithRateLimit(
      accessToken,
      async () => {
        const conditionalHeaders = cacheManager.getConditionalHeaders('user_repos', accessToken.substring(0, 10), page);
        return await client.get('/user/repos', {
          params: {
            sort: 'updated',
            direction: 'desc',
            per_page: perPage,
            page: page,
            affiliation: 'owner,collaborator,organization_member'
          },
          headers: conditionalHeaders
        });
      },
      { priority: 'high', operation: 'getUserRepositories' }
    );

    // Handle 304 Not Modified
    if (response.status === 304) {
      return cacheManager.handleNotModified('user_repos', accessToken.substring(0, 10), page);
    }

    const repositories = response.data.map(repo => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      private: repo.private,
      fork: repo.fork,
      language: repo.language,
      stargazers_count: repo.stargazers_count,
      forks_count: repo.forks_count,
      open_issues_count: repo.open_issues_count,
      default_branch: repo.default_branch,
      updated_at: repo.updated_at,
      created_at: repo.created_at,
      pushed_at: repo.pushed_at,
      owner: {
        login: repo.owner.login,
        avatar_url: repo.owner.avatar_url,
        type: repo.owner.type
      },
      topics: repo.topics || [],
      license: repo.license,
      archived: repo.archived,
      disabled: repo.disabled,
      homepage: repo.homepage,
      html_url: repo.html_url,
      clone_url: repo.clone_url,
      ssh_url: repo.ssh_url
    }));

    // Cache with ETag
    const etag = response.headers.etag;
    cacheManager.set('user_repos', repositories, etag, accessToken.substring(0, 10), page);
    
    // Also use legacy cache for backward compatibility
    await setCache(`user_repos_${accessToken.substring(0, 10)}_${page}`, repositories, 900);
    
    return repositories;
  } catch (error) {
    console.error('Error fetching user repositories:', error.message);
    if (error.response) {
      console.error('GitHub API Error Details:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
    }
    
    // Enhanced error handling for rate limits
    if (rateLimitManager.isRateLimitError(error)) {
      throw rateLimitManager.enhanceError(error, 0);
    }
    
    throw new Error(`Failed to fetch user repositories: ${error.message}`);
  }
};

// Get repository details
const getRepositoryDetails = async (accessToken, owner, repo) => {
  try {
    const cacheKey = `repo_details_${owner}_${repo}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const client = createGitHubClient(accessToken);
    const response = await client.get(`/repos/${owner}/${repo}`);

    const repoData = {
      id: response.data.id,
      name: response.data.name,
      full_name: response.data.full_name,
      description: response.data.description,
      private: response.data.private,
      fork: response.data.fork,
      language: response.data.language,
      stargazers_count: response.data.stargazers_count,
      forks_count: response.data.forks_count,
      open_issues_count: response.data.open_issues_count,
      default_branch: response.data.default_branch,
      updated_at: response.data.updated_at,
      created_at: response.data.created_at,
      pushed_at: response.data.pushed_at,
      owner: {
        login: response.data.owner.login,
        avatar_url: response.data.owner.avatar_url,
        type: response.data.owner.type
      },
      topics: response.data.topics || [],
      license: response.data.license,
      archived: response.data.archived,
      disabled: response.data.disabled,
      homepage: response.data.homepage,
      html_url: response.data.html_url,
      clone_url: response.data.clone_url,
      ssh_url: response.data.ssh_url,
      size: response.data.size,
      watchers_count: response.data.watchers_count,
      network_count: response.data.network_count,
      subscribers_count: response.data.subscribers_count
    };

    await setCache(cacheKey, repoData, 1800); // Cache for 30 minutes
    return repoData;
  } catch (error) {
    console.error('Error fetching repository details:', error.message);
    throw new Error('Failed to fetch repository details');
  }
};

// Get repository branches
const getRepositoryBranches = async (accessToken, owner, repo) => {
  try {
    // Demo mode support
    if (accessToken === 'demo-github-token') {
      return [
        {
          name: 'main',
          commit: {
            sha: 'abc123def456',
            url: 'https://api.github.com/repos/demo-user/beetle-app/commits/abc123def456',
            html_url: 'https://github.com/demo-user/beetle-app/commit/abc123def456',
            author: {
              login: 'demo-user',
              avatar_url: 'https://github.com/github.png'
            },
            committer: {
              login: 'demo-user',
              avatar_url: 'https://github.com/github.png'
            },
            message: 'Initial commit',
            tree: {
              sha: 'tree123',
              url: 'https://api.github.com/repos/demo-user/beetle-app/git/trees/tree123'
            },
            parents: []
          },
          protected: false,
          protection: null
        },
        {
          name: 'dev',
          commit: {
            sha: 'def456ghi789',
            url: 'https://api.github.com/repos/demo-user/beetle-app/commits/def456ghi789',
            html_url: 'https://github.com/demo-user/beetle-app/commit/def456ghi789',
            author: {
              login: 'demo-user',
              avatar_url: 'https://github.com/github.png'
            },
            committer: {
              login: 'demo-user',
              avatar_url: 'https://github.com/github.png'
            },
            message: 'Add development features',
            tree: {
              sha: 'tree456',
              url: 'https://api.github.com/repos/demo-user/beetle-app/git/trees/tree456'
            },
            parents: [{ sha: 'abc123def456' }]
          },
          protected: false,
          protection: null
        },
        {
          name: 'feature/new-ui',
          commit: {
            sha: 'ghi789jkl012',
            url: 'https://api.github.com/repos/demo-user/beetle-app/commits/ghi789jkl012',
            html_url: 'https://github.com/demo-user/beetle-app/commit/ghi789jkl012',
            author: {
              login: 'demo-user',
              avatar_url: 'https://github.com/github.png'
            },
            committer: {
              login: 'demo-user',
              avatar_url: 'https://github.com/github.png'
            },
            message: 'Implement new UI components',
            tree: {
              sha: 'tree789',
              url: 'https://api.github.com/repos/demo-user/beetle-app/git/trees/tree789'
            },
            parents: [{ sha: 'def456ghi789' }]
          },
          protected: false,
          protection: null
        },
        {
          name: 'hotfix/auth-bug',
          commit: {
            sha: 'jkl012mno345',
            url: 'https://api.github.com/repos/demo-user/beetle-app/commits/jkl012mno345',
            html_url: 'https://github.com/demo-user/beetle-app/commit/jkl012mno345',
            author: {
              login: 'demo-user',
              avatar_url: 'https://github.com/github.png'
            },
            committer: {
              login: 'demo-user',
              avatar_url: 'https://github.com/github.png'
            },
            message: 'Fix authentication bug',
            tree: {
              sha: 'tree012',
              url: 'https://api.github.com/repos/demo-user/beetle-app/git/trees/tree012'
            },
            parents: [{ sha: 'abc123def456' }]
          },
          protected: false,
          protection: null
        }
      ];
    }

    const cacheKey = `repo_branches_${owner}_${repo}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const client = createGitHubClient(accessToken);
    const response = await client.get(`/repos/${owner}/${repo}/branches`);
    const branches = await Promise.all(response.data.map(async branch => {
      let fullCommit = branch.commit;
      // Try to get the full commit from cache first
      const commitCacheKey = `repo_commit_${owner}_${repo}_${branch.commit.sha}`;
      let cachedCommit = await getCache(commitCacheKey);
      if (cachedCommit) {
        fullCommit = cachedCommit;
      } else if (!fullCommit.commit || !fullCommit.commit.tree) {
        try {
          const commitResp = await client.get(`/repos/${owner}/${repo}/commits/${branch.commit.sha}`);
          fullCommit = commitResp.data;
          await setCache(commitCacheKey, fullCommit, 900); // Cache for 15 minutes
        } catch (e) {
          // If fetching full commit fails, keep the original minimal commit
        }
      }
      return {
        name: branch.name,
        commit: fullCommit,
        protected: branch.protected,
        protection: branch.protection
      };
    }));
    await setCache(cacheKey, branches, 900); // Cache for 15 minutes
    return branches;
  } catch (error) {
    console.error('Error fetching repository branches:', error.message);
    throw new Error('Failed to fetch repository branches');
  }
};

// Add a delay utility to avoid rate limiting
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Get repository issues (cache per repo, state, page)
const getRepositoryIssues = async (accessToken, owner, repo, state = 'open', page = 1, perPage = 100) => {
  try {
    const cacheKey = `repo_issues_${owner}_${repo}_${state}_${page}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const client = createGitHubClient(accessToken);
    const response = await client.get(`/repos/${owner}/${repo}/issues`, {
      params: {
        state: state,
        sort: 'updated',
        direction: 'desc',
        per_page: perPage,
        page: page
      }
    });

    const issues = response.data.map(issue => ({
      id: issue.id,
      number: issue.number,
      title: issue.title,
      body: issue.body,
      state: issue.state,
      locked: issue.locked,
      assignees: issue.assignees,
      labels: issue.labels,
      user: {
        login: issue.user.login,
        avatar_url: issue.user.avatar_url
      },
      created_at: issue.created_at,
      updated_at: issue.updated_at,
      closed_at: issue.closed_at,
      html_url: issue.html_url,
      comments: issue.comments,
      reactions: issue.reactions,
      milestone: issue.milestone,
      pull_request: issue.pull_request
    }));

    await setCache(cacheKey, issues, 600); // Cache for 10 minutes
    return issues;
  } catch (error) {
    console.error('Error fetching repository issues:', error.message);
    throw new Error('Failed to fetch repository issues');
  }
};

// Get repository pull requests (cache per repo, state, page)
const getRepositoryPullRequests = async (accessToken, owner, repo, state = 'open', page = 1, perPage = 100) => {
  try {
    const cacheKey = `repo_prs_${owner}_${repo}_${state}_${page}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const client = createGitHubClient(accessToken);
    const response = await client.get(`/repos/${owner}/${repo}/pulls`, {
      params: {
        state: state,
        sort: 'updated',
        direction: 'desc',
        per_page: perPage,
        page: page
      }
    });

    const pullRequests = response.data.map(pr => ({
      id: pr.id,
      number: pr.number,
      title: pr.title,
      body: pr.body,
      state: pr.state,
      locked: pr.locked,
      draft: pr.draft,
      merged: pr.merged,
      mergeable: pr.mergeable,
      mergeable_state: pr.mergeable_state,
      merged_at: pr.merged_at,
      closed_at: pr.closed_at,
      user: {
        login: pr.user.login,
        avatar_url: pr.user.avatar_url
      },
      assignees: pr.assignees,
      requested_reviewers: pr.requested_reviewers,
      labels: pr.labels,
      head: pr.head,
      base: pr.base,
      created_at: pr.created_at,
      updated_at: pr.updated_at,
      html_url: pr.html_url,
      comments: pr.comments,
      review_comments: pr.review_comments,
      commits: pr.commits,
      additions: pr.additions,
      deletions: pr.deletions,
      changed_files: pr.changed_files
    }));

    await setCache(cacheKey, pullRequests, 600); // Cache for 10 minutes
    return pullRequests;
  } catch (error) {
    console.error('Error fetching repository pull requests:', error.message);
    throw new Error('Failed to fetch repository pull requests');
  }
};

// Get repository commits (cache per repo, branch, page)
const getRepositoryCommits = async (accessToken, owner, repo, branch = 'main', page = 1, perPage = 100, since = null) => {
  try {
    const cacheKey = `repo_commits_${owner}_${repo}_${branch}_${page}_${since || 'all'}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const client = createGitHubClient(accessToken);
    const params = {
      sha: branch,
      per_page: perPage,
      page: page
    };
    
    if (since) {
      params.since = since;
    }
    
    const response = await client.get(`/repos/${owner}/${repo}/commits`, { params });

    const commits = response.data.map(commit => ({
      sha: commit.sha,
      node_id: commit.node_id,
      commit: commit.commit,
      url: commit.url,
      html_url: commit.html_url,
      comments_url: commit.comments_url,
      author: commit.author,
      committer: commit.committer,
      parents: commit.parents
    }));

    await setCache(cacheKey, commits, 900); // Cache for 15 minutes
    return commits;
  } catch (error) {
    console.error('Error fetching repository commits:', error.message);
    throw new Error('Failed to fetch repository commits');
  }
};

// Get user activity with enhanced rate limit handling
const getUserActivity = async (accessToken, username, page = 1, perPage = 100) => {
  try {
    // Demo mode support
    if (accessToken === 'demo-github-token') {
      return [
        {
          id: "1",
          type: "PushEvent",
          actor: {
            id: 1,
            login: "demo-user",
            avatar_url: "https://github.com/github.png"
          },
          repo: {
            name: "demo-user/beetle-app"
          },
          payload: {
            commits: [
              { message: "Add new dashboard features" },
              { message: "Fix authentication flow" }
            ]
          },
          public: true,
          created_at: new Date().toISOString(),
          org: null
        },
        {
          id: "2",
          type: "PullRequestEvent",
          actor: {
            id: 1,
            login: "demo-user",
            avatar_url: "https://github.com/github.png"
          },
          repo: {
            name: "demo-user/beetle-app"
          },
          payload: {
            action: "opened",
            pull_request: {
              number: 15,
              title: "Implement real-time updates"
            }
          },
          public: true,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          org: null
        },
        {
          id: "3",
          type: "IssuesEvent",
          actor: {
            id: 1,
            login: "demo-user",
            avatar_url: "https://github.com/github.png"
          },
          repo: {
            name: "demo-user/react-components"
          },
          payload: {
            action: "opened",
            issue: {
              number: 8,
              title: "Add TypeScript support"
            }
          },
          public: true,
          created_at: new Date(Date.now() - 7200000).toISOString(),
          org: null
        },
        {
          id: "4",
          type: "CreateEvent",
          actor: {
            id: 1,
            login: "demo-user",
            avatar_url: "https://github.com/github.png"
          },
          repo: {
            name: "demo-user/react-components"
          },
          payload: {
            ref_type: "repository"
          },
          public: true,
          created_at: new Date(Date.now() - 86400000).toISOString(),
          org: null
        },
        {
          id: "5",
          type: "WatchEvent",
          actor: {
            id: 1,
            login: "demo-user",
            avatar_url: "https://github.com/github.png"
          },
          repo: {
            name: "facebook/react"
          },
          payload: {},
          public: true,
          created_at: new Date(Date.now() - 172800000).toISOString(),
          org: null
        }
      ];
    }

    // Check cache first
    const cached = cacheManager.get('user_activity', username, page);
    if (cached) return cached;

    const client = createGitHubClient(accessToken);
    
    // Execute with rate limit handling - lower priority for activity as it's frequently requested
    const response = await rateLimitManager.executeWithRateLimit(
      accessToken,
      async () => {
        const conditionalHeaders = cacheManager.getConditionalHeaders('user_activity', username, page);
        return await client.get(`/users/${username}/events`, {
          params: {
            per_page: perPage,
            page: page
          },
          headers: conditionalHeaders
        });
      },
      { priority: 'medium', operation: 'getUserActivity' }
    );

    // Handle 304 Not Modified
    if (response.status === 304) {
      return cacheManager.handleNotModified('user_activity', username, page);
    }

    const events = response.data.map(event => ({
      id: event.id,
      type: event.type,
      actor: {
        id: event.actor.id,
        login: event.actor.login,
        avatar_url: event.actor.avatar_url
      },
      repo: event.repo,
      payload: event.payload,
      public: event.public,
      created_at: event.created_at,
      org: event.org
    }));

    // Cache with ETag - shorter TTL for activity data
    const etag = response.headers.etag;
    cacheManager.set('user_activity', events, etag, username, page);
    
    // Also use legacy cache for backward compatibility
    await setCache(`user_activity_${username}_${page}`, events, 300);
    
    return events;
  } catch (error) {
    console.error('Error fetching user activity:', error.message);
    
    // Enhanced error handling for rate limits
    if (rateLimitManager.isRateLimitError(error)) {
      throw rateLimitManager.enhanceError(error, 0);
    }
    
    throw new Error(`Failed to fetch user activity: ${error.message}`);
  }
};

// Get repository contributors (cache per repo)
const getRepositoryContributors = async (accessToken, owner, repo) => {
  try {
    const cacheKey = `repo_contributors_${owner}_${repo}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const client = createGitHubClient(accessToken);
    const response = await client.get(`/repos/${owner}/${repo}/contributors`);

    const contributors = response.data.map(contributor => ({
      login: contributor.login,
      id: contributor.id,
      avatar_url: contributor.avatar_url,
      contributions: contributor.contributions,
      type: contributor.type,
      site_admin: contributor.site_admin
    }));

    await setCache(cacheKey, contributors, 3600); // Cache for 1 hour
    return contributors;
  } catch (error) {
    console.error('Error fetching repository contributors:', error.message);
    throw new Error('Failed to fetch repository contributors');
  }
};

// Get repository languages (cache per repo)
const getRepositoryLanguages = async (accessToken, owner, repo) => {
  try {
    const cacheKey = `repo_languages_${owner}_${repo}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const client = createGitHubClient(accessToken);
    const response = await client.get(`/repos/${owner}/${repo}/languages`);

    await setCache(cacheKey, response.data, 3600); // Cache for 1 hour
    return response.data;
  } catch (error) {
    console.error('Error fetching repository languages:', error.message);
    throw new Error('Failed to fetch repository languages');
  }
};

// Search repositories
const searchRepositories = async (accessToken, query, sort = 'stars', order = 'desc', page = 1, perPage = 30) => {
  try {
    const cacheKey = `search_repos_${query}_${sort}_${order}_${page}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const client = createGitHubClient(accessToken);
    const response = await client.get('/search/repositories', {
      params: {
        q: query,
        sort: sort,
        order: order,
        per_page: perPage,
        page: page
      }
    });

    const searchResults = {
      total_count: response.data.total_count,
      incomplete_results: response.data.incomplete_results,
      items: response.data.items.map(repo => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        private: repo.private,
        fork: repo.fork,
        language: repo.language,
        stargazers_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        open_issues_count: repo.open_issues_count,
        default_branch: repo.default_branch,
        updated_at: repo.updated_at,
        created_at: repo.created_at,
        pushed_at: repo.pushed_at,
        owner: {
          login: repo.owner.login,
          avatar_url: repo.owner.avatar_url,
          type: repo.owner.type
        },
        topics: repo.topics || [],
        license: repo.license,
        archived: repo.archived,
        disabled: repo.disabled,
        homepage: repo.homepage,
        html_url: repo.html_url,
        clone_url: repo.clone_url,
        ssh_url: repo.ssh_url
      }))
    };

    await setCache(cacheKey, searchResults, 900); // Cache for 15 minutes
    return searchResults;
  } catch (error) {
    console.error('Error searching repositories:', error.message);
    throw new Error('Failed to search repositories');
  }
};

// Fetch repository tree (file/folder structure)
const getRepositoryTree = async (accessToken, owner, repo, branch = 'main') => {
  try {
    const cacheKey = `repo_tree_${owner}_${repo}_${branch}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const client = createGitHubClient(accessToken);
    // Get the SHA of the branch
    const branchResp = await client.get(`/repos/${owner}/${repo}/branches/${branch}`);
    const treeSha = branchResp.data.commit.commit.tree.sha;
    // Get the tree recursively
    const treeResp = await client.get(`/repos/${owner}/${repo}/git/trees/${treeSha}`, {
      params: { recursive: 1 }
    });
    await setCache(cacheKey, treeResp.data.tree, 900); // Cache for 15 minutes
    return treeResp.data.tree;
  } catch (error) {
    console.error('Error fetching repository tree:', error.message);
    throw new Error('Failed to fetch repository tree');
  }
};

// Fetch file content from a repo
const getFileContent = async (accessToken, owner, repo, path, branch = 'main') => {
  try {
    const cacheKey = `repo_file_content_${owner}_${repo}_${branch}_${path}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const client = createGitHubClient(accessToken);
    const resp = await client.get(`/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, {
      params: { ref: branch }
    });
    // If file is encoded in base64, decode it
    let content = resp.data.content;
    if (resp.data.encoding === 'base64') {
      content = Buffer.from(content, 'base64').toString('utf-8');
    }
    await setCache(cacheKey, content, 600); // Cache for 10 minutes
    return content;
  } catch (error) {
    console.error('Error fetching file content:', error.message);
    throw new Error('Failed to fetch file content');
  }
};

// Fetch file trees from all branches for a repository
const getRepositoryTreesForAllBranches = async (accessToken, owner, repo) => {
  try {
    // Validate owner parameter
    if (!isValidOwner(owner)) {
      throw new Error('Invalid owner parameter');
    }

    const cacheKey = `repo_trees_all_branches_${owner}_${repo}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const client = createGitHubClient(accessToken);
    // First, get all branches
    let branchesResp;
    try {
      branchesResp = await client.get(`/repos/${owner}/${repo}/branches`);
    } catch (error) {
      console.error('Error fetching branches:', error.message, error.response?.data);
      throw new Error(`Failed to fetch branches: ${error.response?.data?.message || error.message}`);
    }
    const branches = branchesResp.data;
    if (!Array.isArray(branches) || branches.length === 0) {
      throw new Error('No branches found in repository');
    }
    // Fetch tree for each branch
    const treesByBranch = {};
    let allFailed = true;
    for (const [i, branch] of branches.entries()) {
      try {
        // Try to get the full commit from cache first
        const commitCacheKey = `repo_commit_${owner}_${repo}_${branch.commit.sha}`;
        let fullCommit = await getCache(commitCacheKey);
        if (!fullCommit) {
          // Fetch full commit if not cached
          const commitResp = await client.get(`/repos/${owner}/${repo}/commits/${branch.commit.sha}`);
          fullCommit = commitResp.data;
          await setCache(commitCacheKey, fullCommit, 900); // Cache for 15 minutes
          // Add a small delay to avoid rate limiting if many branches
          if (branches.length > 5) await delay(200);
        }
        if (!fullCommit.commit || !fullCommit.commit.tree || !fullCommit.commit.tree.sha) {
          throw new Error('Branch commit or tree SHA missing');
        }
        const branchName = branch.name;
        const treeSha = fullCommit.commit.tree.sha;
        // Get the tree recursively for this branch
        let treeResp;
        try {
          treeResp = await client.get(`/repos/${owner}/${repo}/git/trees/${treeSha}`, {
            params: { recursive: 1 }
          });
        } catch (treeError) {
          throw new Error(`Failed to fetch tree: ${treeError.response?.data?.message || treeError.message}`);
        }
        treesByBranch[branchName] = {
          branch: branchName,
          tree: treeResp.data.tree,
          lastCommit: {
            sha: fullCommit.sha,
            message: fullCommit.commit.message,
            author: fullCommit.commit.author,
            committer: fullCommit.commit.committer
          }
        };
        allFailed = false;
      } catch (branchError) {
        console.error(`Error fetching tree for branch ${branch.name}:`, branchError.message);
        treesByBranch[branch.name] = {
          branch: branch.name,
          tree: [],
          error: branchError.message,
          lastCommit: null
        };
      }
    }
    if (allFailed) {
      throw new Error('Failed to fetch repository trees for all branches (all branches failed)');
    }
    await setCache(cacheKey, treesByBranch, 900); // Cache for 15 minutes
    return treesByBranch;
  } catch (error) {
    console.error('Error fetching repository trees for all branches:', error.message, error.stack);
    throw new Error(error.message || 'Failed to fetch repository trees for all branches');
  }
};

// Export all functions
module.exports = {
  getUserProfile,
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
  getRepositoryTree,
  getFileContent,
  getRepositoryTreesForAllBranches,
  isValidOwner,
  // Export rate limit and cache utilities
  rateLimitManager,
  cacheManager
}; 