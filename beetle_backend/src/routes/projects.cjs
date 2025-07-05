const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const {
  getUserRepositories,
  getRepositoryDetails,
  getRepositoryBranches,
  getRepositoryIssues,
  getRepositoryPullRequests,
  getRepositoryCommits
} = require('../utils/github.cjs');
const { saveProject, getProject, getUser } = require('../utils/database.cjs');
const { asyncHandler } = require('../middleware/errorHandler.cjs');

const router = express.Router();

// Get all projects for user
router.get('/', asyncHandler(async (req, res) => {
  const user = await getUser(req.user.id);
  
  if (!user) {
    return res.status(404).json({
      error: 'User not found',
      message: 'User profile not found'
    });
  }

  // For now, return user's repositories as projects
  // In a real implementation, you'd have a separate projects collection
  const repositories = await getUserRepositories(req.user.accessToken, 1, 100);
  
  const projects = repositories.map(repo => ({
    id: repo.id,
    name: repo.name,
    full_name: repo.full_name,
    description: repo.description,
    language: repo.language,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    issues: repo.open_issues_count,
    updated_at: repo.updated_at,
    html_url: repo.html_url,
    isBeetleProject: repo.topics?.includes('beetle') || repo.name.toLowerCase().includes('beetle'),
    branches: [], // Will be populated when project is opened
    analytics: {
      totalCommits: 0,
      totalPRs: 0,
      totalIssues: 0
    }
  }));

  res.json({
    projects,
    total: projects.length
  });
}));

// Get specific project details
router.get('/:projectId', asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  
  // Try to get from database first
  let project = await getProject(projectId);
  
  if (!project) {
    // If not in database, try to fetch from GitHub
    try {
      const [owner, repo] = projectId.split('/');
      if (!owner || !repo) {
        return res.status(400).json({
          error: 'Invalid project ID',
          message: 'Project ID should be in format owner/repo'
        });
      }

      const repoData = await getRepositoryDetails(req.user.accessToken, owner, repo);
      const branches = await getRepositoryBranches(req.user.accessToken, owner, repo);
      const issues = await getRepositoryIssues(req.user.accessToken, owner, repo, 'open', 1, 50);
      const pullRequests = await getRepositoryPullRequests(req.user.accessToken, owner, repo, 'open', 1, 50);
      const commits = await getRepositoryCommits(req.user.accessToken, owner, repo, 'main', 1, 50);

      project = {
        id: projectId,
        name: repoData.name,
        full_name: repoData.full_name,
        description: repoData.description,
        language: repoData.language,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        issues: repoData.open_issues_count,
        updated_at: repoData.updated_at,
        html_url: repoData.html_url,
        isBeetleProject: repoData.topics?.includes('beetle') || repoData.name.toLowerCase().includes('beetle'),
        branches: branches.map(branch => ({
          name: branch.name,
          protected: branch.protected,
          lastCommit: branch.commit
        })),
        analytics: {
          totalCommits: commits.length,
          totalPRs: pullRequests.length,
          totalIssues: issues.length,
          openIssues: issues.length,
          openPullRequests: pullRequests.length
        },
        recentActivity: {
          commits: commits.slice(0, 10),
          issues: issues.slice(0, 10),
          pullRequests: pullRequests.slice(0, 10)
        }
      };

      // Save to database for future use
      await saveProject(projectId, project);
    } catch (error) {
      return res.status(404).json({
        error: 'Project not found',
        message: 'Could not find project with the specified ID'
      });
    }
  }

  res.json({
    project
  });
}));

// Create a new Beetle project
router.post('/', [
  body('name').isString().trim().isLength({ min: 1, max: 100 }),
  body('description').optional().isString().trim().isLength({ max: 500 }),
  body('repository_url').optional().isURL(),
  body('branches').optional().isArray(),
  body('settings').optional().isObject()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      details: errors.array()
    });
  }

  const { name, description, repository_url, branches = [], settings = {} } = req.body;
  
  const projectId = uuidv4();
  const project = {
    id: projectId,
    name,
    description,
    repository_url,
    branches,
    settings,
    created_by: req.user.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    analytics: {
      totalCommits: 0,
      totalPRs: 0,
      totalIssues: 0
    }
  };

  await saveProject(projectId, project);

  res.status(201).json({
    message: 'Project created successfully',
    project
  });
}));

// Update project
router.put('/:projectId', [
  body('name').optional().isString().trim().isLength({ min: 1, max: 100 }),
  body('description').optional().isString().trim().isLength({ max: 500 }),
  body('repository_url').optional().isURL(),
  body('branches').optional().isArray(),
  body('settings').optional().isObject()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      details: errors.array()
    });
  }

  const { projectId } = req.params;
  
  let project = await getProject(projectId);
  
  if (!project) {
    return res.status(404).json({
      error: 'Project not found',
      message: 'Project with the specified ID not found'
    });
  }

  // Update project
  project = {
    ...project,
    ...req.body,
    updated_at: new Date().toISOString()
  };

  await saveProject(projectId, project);

  res.json({
    message: 'Project updated successfully',
    project
  });
}));

// Get project branches
router.get('/:projectId/branches', asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  
  const project = await getProject(projectId);
  
  if (!project) {
    return res.status(404).json({
      error: 'Project not found',
      message: 'Project with the specified ID not found'
    });
  }

  // If project has a repository URL, fetch branches from GitHub
  if (project.repository_url) {
    try {
      const [owner, repo] = project.repository_url.split('/').slice(-2);
      const branches = await getRepositoryBranches(req.user.accessToken, owner, repo);
      
      res.json({
        branches: branches.map(branch => ({
          name: branch.name,
          protected: branch.protected,
          lastCommit: branch.commit
        }))
      });
    } catch (error) {
      res.json({
        branches: project.branches || []
      });
    }
  } else {
    res.json({
      branches: project.branches || []
    });
  }
}));

// Get project analytics
router.get('/:projectId/analytics', asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  
  const project = await getProject(projectId);
  
  if (!project) {
    return res.status(404).json({
      error: 'Project not found',
      message: 'Project with the specified ID not found'
    });
  }

  // If project has a repository URL, fetch analytics from GitHub
  if (project.repository_url) {
    try {
      const [owner, repo] = project.repository_url.split('/').slice(-2);
      
      const [issues, pullRequests, commits] = await Promise.all([
        getRepositoryIssues(req.user.accessToken, owner, repo, 'all', 1, 100),
        getRepositoryPullRequests(req.user.accessToken, owner, repo, 'all', 1, 100),
        getRepositoryCommits(req.user.accessToken, owner, repo, 'main', 1, 100)
      ]);

      const analytics = {
        totalCommits: commits.length,
        totalPRs: pullRequests.length,
        totalIssues: issues.length,
        openIssues: issues.filter(i => i.state === 'open').length,
        closedIssues: issues.filter(i => i.state === 'closed').length,
        openPullRequests: pullRequests.filter(pr => pr.state === 'open').length,
        mergedPullRequests: pullRequests.filter(pr => pr.merged).length,
        recentActivity: {
          commits: commits.slice(0, 10),
          issues: issues.slice(0, 10),
          pullRequests: pullRequests.slice(0, 10)
        }
      };

      res.json(analytics);
    } catch (error) {
      res.json(project.analytics || {
        totalCommits: 0,
        totalPRs: 0,
        totalIssues: 0
      });
    }
  } else {
    res.json(project.analytics || {
      totalCommits: 0,
      totalPRs: 0,
      totalIssues: 0
    });
  }
}));

// Import repository as Beetle project
router.post('/import', [
  body('repository_url').isURL(),
  body('branches').optional().isArray(),
  body('settings').optional().isObject()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      details: errors.array()
    });
  }

  const { repository_url, branches = [], settings = {} } = req.body;
  
  try {
    // Extract owner and repo from URL
    const urlParts = repository_url.split('/');
    const owner = urlParts[urlParts.length - 2];
    const repo = urlParts[urlParts.length - 1];
    
    // Fetch repository details
    const repoData = await getRepositoryDetails(req.user.accessToken, owner, repo);
    const repoBranches = await getRepositoryBranches(req.user.accessToken, owner, repo);
    const issues = await getRepositoryIssues(req.user.accessToken, owner, repo, 'open', 1, 50);
    const pullRequests = await getRepositoryPullRequests(req.user.accessToken, owner, repo, 'open', 1, 50);
    const commits = await getRepositoryCommits(req.user.accessToken, owner, repo, 'main', 1, 50);

    const projectId = `${owner}/${repo}`;
    
    const project = {
      id: projectId,
      name: repoData.name,
      full_name: repoData.full_name,
      description: repoData.description,
      language: repoData.language,
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      issues: repoData.open_issues_count,
      updated_at: repoData.updated_at,
      html_url: repoData.html_url,
      repository_url,
      branches: branches.length > 0 ? branches : repoBranches.map(b => b.name),
      settings,
      created_by: req.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      isBeetleProject: true,
      analytics: {
        totalCommits: commits.length,
        totalPRs: pullRequests.length,
        totalIssues: issues.length,
        openIssues: issues.length,
        openPullRequests: pullRequests.length
      },
      recentActivity: {
        commits: commits.slice(0, 10),
        issues: issues.slice(0, 10),
        pullRequests: pullRequests.slice(0, 10)
      }
    };

    await saveProject(projectId, project);

    res.status(201).json({
      message: 'Repository imported successfully as Beetle project',
      project
    });
  } catch (error) {
    console.error('Error importing repository:', error);
    res.status(500).json({
      error: 'Failed to import repository',
      message: error.message
    });
  }
}));

// Get Beetle-specific project data for contribution page
router.get('/:projectId/beetle', asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  
  const project = await getProject(projectId);
  
  if (!project) {
    return res.status(404).json({
      error: 'Project not found',
      message: 'Project with the specified ID not found'
    });
  }

  // If project has a repository URL, fetch Beetle-specific data
  if (project.repository_url) {
    try {
      const [owner, repo] = project.repository_url.split('/').slice(-2);
      
      const [branches, issues, pullRequests, commits] = await Promise.all([
        getRepositoryBranches(req.user.accessToken, owner, repo),
        getRepositoryIssues(req.user.accessToken, owner, repo, 'all', 1, 100),
        getRepositoryPullRequests(req.user.accessToken, owner, repo, 'all', 1, 100),
        getRepositoryCommits(req.user.accessToken, owner, repo, 'main', 1, 100)
      ]);

      // Organize data for Beetle's branch-level intelligence
      const beetleData = {
        project: {
          id: project.id,
          name: project.name,
          full_name: project.full_name,
          description: project.description,
          language: project.language,
          html_url: project.html_url
        },
        branches: branches.map(branch => ({
          name: branch.name,
          protected: branch.protected,
          lastCommit: branch.commit,
          // Filter issues and PRs related to this branch
          issues: issues.filter(issue => 
            issue.labels.some(label => 
              label.name.toLowerCase().includes(branch.name.toLowerCase()) ||
              issue.title.toLowerCase().includes(branch.name.toLowerCase())
            )
          ),
          pullRequests: pullRequests.filter(pr => 
            pr.head.ref === branch.name || 
            pr.base.ref === branch.name ||
            pr.title.toLowerCase().includes(branch.name.toLowerCase())
          ),
          commits: commits.filter(commit => 
            commit.commit.message.toLowerCase().includes(branch.name.toLowerCase())
          )
        })),
        summary: {
          totalBranches: branches.length,
          totalIssues: issues.length,
          totalPullRequests: pullRequests.length,
          totalCommits: commits.length,
          activeBranches: branches.filter(b => 
            (new Date() - new Date(b.commit.committer.date)) < (30 * 24 * 60 * 60 * 1000)
          ).length
        },
        insights: {
          // Static insights for now as requested
          productivity: {
            score: 85,
            trend: 'increasing',
            recommendations: [
              'Consider reviewing more pull requests to improve code quality',
              'Your commit frequency is excellent, keep it up!',
              'Try to respond to issues within 24 hours'
            ]
          },
          collaboration: {
            score: 78,
            trend: 'stable',
            recommendations: [
              'Engage more with community discussions',
              'Consider mentoring new contributors',
              'Participate in more code reviews'
            ]
          },
          codeQuality: {
            score: 92,
            trend: 'increasing',
            recommendations: [
              'Your code review comments are very helpful',
              'Consider adding more comprehensive tests',
              'Great job maintaining consistent coding standards'
            ]
          },
          branchHealth: {
            score: 88,
            trend: 'stable',
            recommendations: [
              'Keep branches up to date with main',
              'Consider using feature flags for better branch management',
              'Your branch naming conventions are excellent'
            ]
          }
        }
      };

      res.json(beetleData);
    } catch (error) {
      console.error('Error fetching Beetle project data:', error);
      res.status(500).json({
        error: 'Failed to fetch Beetle project data',
        message: error.message
      });
    }
  } else {
    res.json({
      project,
      branches: [],
      summary: {
        totalBranches: 0,
        totalIssues: 0,
        totalPullRequests: 0,
        totalCommits: 0,
        activeBranches: 0
      },
      insights: {
        productivity: { score: 0, trend: 'stable', recommendations: [] },
        collaboration: { score: 0, trend: 'stable', recommendations: [] },
        codeQuality: { score: 0, trend: 'stable', recommendations: [] },
        branchHealth: { score: 0, trend: 'stable', recommendations: [] }
      }
    });
  }
}));

module.exports = router; 