const axios = require('axios');
const { getCache, setCache } = require('./database.cjs');

// GitHub API configuration
const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';

// Create GitHub API client with authentication
const createGitHubClient = (accessToken) => {
  return axios.create({
    baseURL: GITHUB_API_BASE,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Beetle-App/1.0.0'
    }
  });
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

// Get user profile
const getUserProfile = async (accessToken) => {
  try {
    const cacheKey = `user_profile_${accessToken.substring(0, 10)}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const client = createGitHubClient(accessToken);
    const response = await client.get('/user');
    
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

    await setCache(cacheKey, userData, 1800); // Cache for 30 minutes
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
    throw new Error(`Failed to fetch user profile: ${error.message}`);
  }
};

// Get user repositories
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

    const cacheKey = `user_repos_${accessToken.substring(0, 10)}_${page}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const client = createGitHubClient(accessToken);
    const response = await client.get('/user/repos', {
      params: {
        sort: 'updated',
        direction: 'desc',
        per_page: perPage,
        page: page,
        affiliation: 'owner,collaborator,organization_member'
      }
    });

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

    await setCache(cacheKey, repositories, 900); // Cache for 15 minutes
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

    const branches = response.data.map(branch => ({
      name: branch.name,
      commit: {
        sha: branch.commit.sha,
        url: branch.commit.url,
        html_url: branch.commit.html_url,
        author: branch.commit.author,
        committer: branch.commit.committer,
        message: branch.commit.message,
        tree: branch.commit.tree,
        parents: branch.commit.parents
      },
      protected: branch.protected,
      protection: branch.protection
    }));

    await setCache(cacheKey, branches, 900); // Cache for 15 minutes
    return branches;
  } catch (error) {
    console.error('Error fetching repository branches:', error.message);
    throw new Error('Failed to fetch repository branches');
  }
};

// Get repository issues
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

// Get repository pull requests
const getRepositoryPullRequests = async (accessToken, owner, repo, state = 'open', page = 1, perPage = 100) => {
  try {
    // Demo mode support
    if (accessToken === 'demo-github-token') {
      return [
        {
          id: 1,
          number: 15,
          title: "Implement real-time updates",
          body: "Add real-time updates to the dashboard for better user experience",
          state: "open",
          locked: false,
          draft: false,
          merged: false,
          mergeable: true,
          mergeable_state: "clean",
          merged_at: null,
          closed_at: null,
          user: {
            login: "demo-user",
            avatar_url: "https://github.com/github.png"
          },
          assignees: [],
          requested_reviewers: [],
          labels: [
            { name: "enhancement", color: "a2eeef" },
            { name: "frontend", color: "0e8a16" }
          ],
          head: {
            label: "demo-user:feature/realtime-updates",
            ref: "feature/realtime-updates",
            sha: "abc123",
            user: { login: "demo-user" },
            repo: { name: "beetle-app" }
          },
          base: {
            label: "demo-user:main",
            ref: "main",
            sha: "def456",
            user: { login: "demo-user" },
            repo: { name: "beetle-app" }
          },
          created_at: new Date(Date.now() - 3600000).toISOString(),
          updated_at: new Date().toISOString(),
          html_url: "https://github.com/demo-user/beetle-app/pull/15",
          comments: 2,
          review_comments: 1,
          commits: 3,
          additions: 45,
          deletions: 12,
          changed_files: 5
        },
        {
          id: 2,
          number: 14,
          title: "Fix authentication flow",
          body: "Resolve issues with GitHub OAuth authentication",
          state: "open",
          locked: false,
          draft: false,
          merged: false,
          mergeable: true,
          mergeable_state: "clean",
          merged_at: null,
          closed_at: null,
          user: {
            login: "demo-user",
            avatar_url: "https://github.com/github.png"
          },
          assignees: [],
          requested_reviewers: [],
          labels: [
            { name: "bug", color: "d73a4a" },
            { name: "auth", color: "fef2c0" }
          ],
          head: {
            label: "demo-user:fix/auth-flow",
            ref: "fix/auth-flow",
            sha: "ghi789",
            user: { login: "demo-user" },
            repo: { name: "beetle-app" }
          },
          base: {
            label: "demo-user:main",
            ref: "main",
            sha: "def456",
            user: { login: "demo-user" },
            repo: { name: "beetle-app" }
          },
          created_at: new Date(Date.now() - 7200000).toISOString(),
          updated_at: new Date(Date.now() - 1800000).toISOString(),
          html_url: "https://github.com/demo-user/beetle-app/pull/14",
          comments: 1,
          review_comments: 0,
          commits: 2,
          additions: 23,
          deletions: 8,
          changed_files: 3
        }
      ];
    }

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
      head: {
        label: pr.head.label,
        ref: pr.head.ref,
        sha: pr.head.sha,
        user: pr.head.user,
        repo: pr.head.repo
      },
      base: {
        label: pr.base.label,
        ref: pr.base.ref,
        sha: pr.base.sha,
        user: pr.base.user,
        repo: pr.base.repo
      },
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

// Get repository commits
const getRepositoryCommits = async (accessToken, owner, repo, branch = 'main', page = 1, perPage = 100) => {
  try {
    const cacheKey = `repo_commits_${owner}_${repo}_${branch}_${page}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const client = createGitHubClient(accessToken);
    const response = await client.get(`/repos/${owner}/${repo}/commits`, {
      params: {
        sha: branch,
        per_page: perPage,
        page: page
      }
    });

    const commits = response.data.map(commit => ({
      sha: commit.sha,
      node_id: commit.node_id,
      commit: {
        author: commit.commit.author,
        committer: commit.commit.committer,
        message: commit.commit.message,
        tree: commit.commit.tree,
        url: commit.commit.url,
        comment_count: commit.commit.comment_count,
        verification: commit.commit.verification
      },
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

// Get user activity (recent events)
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

    const cacheKey = `user_activity_${username}_${page}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const client = createGitHubClient(accessToken);
    const response = await client.get(`/users/${username}/events`, {
      params: {
        per_page: perPage,
        page: page
      }
    });

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

    await setCache(cacheKey, events, 300); // Cache for 5 minutes
    return events;
  } catch (error) {
    console.error('Error fetching user activity:', error.message);
    throw new Error('Failed to fetch user activity');
  }
};

// Get repository contributors
const getRepositoryContributors = async (accessToken, owner, repo) => {
  try {
    // Demo mode support
    if (accessToken === 'demo-github-token') {
      return [
        {
          login: "demo-user",
          id: 1,
          avatar_url: "https://github.com/github.png",
          contributions: 45,
          type: "User",
          site_admin: false
        },
        {
          login: "john-doe",
          id: 2,
          avatar_url: "https://github.com/github.png",
          contributions: 23,
          type: "User",
          site_admin: false
        },
        {
          login: "jane-smith",
          id: 3,
          avatar_url: "https://github.com/github.png",
          contributions: 12,
          type: "User",
          site_admin: false
        }
      ];
    }

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

// Get repository languages
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
  searchRepositories
}; 