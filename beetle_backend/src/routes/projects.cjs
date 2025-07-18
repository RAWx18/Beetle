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

// Helper function to check if user is project owner
const isProjectOwner = async (user, projectId) => {
  const project = await getProject(projectId);
  if (!project) return false;
  
  // Check if user created the project
  if (project.created_by === user.id) return true;
  
  // Check if user owns the repository (for GitHub projects)
  if (project.repository_url) {
    const [owner] = project.repository_url.split('/').slice(-2);
    return owner === user.login;
  }
  
  return false;
};

// Helper function to get default page content
const getDefaultPageContent = (pageType) => {
  const defaultContent = {
    why: {
      title: 'Why This Project?',
      description: 'Understanding the purpose and vision behind this project.',
      sections: [
        {
          title: 'Vision',
          content: 'Our project aims to solve important problems and create value for users.',
          icon: 'Lightbulb'
        },
        {
          title: 'Impact',
          content: 'We strive to make a meaningful difference in our community.',
          icon: 'Heart'
        },
        {
          title: 'Innovation',
          content: 'We embrace new technologies and methodologies to deliver excellence.',
          icon: 'Zap'
        }
      ]
    },
    how: {
      title: 'How It Works',
      description: 'Learn about the technical implementation and architecture.',
      setup: [
        'Clone the repository',
        'Install dependencies',
        'Configure environment variables',
        'Run the development server'
      ],
      workflow: [
        'Create feature branches',
        'Implement changes',
        'Write tests',
        'Submit pull requests'
      ]
    },
    contribute: {
      title: 'How to Contribute',
      description: 'Join our community and help improve the project.',
      quickStart: [
        'Fork the repository',
        'Pick an issue to work on',
        'Follow our contribution guidelines',
        'Submit a pull request'
      ],
      areas: [
        {
          title: 'Development',
          description: 'Help build new features and fix bugs',
          skills: ['JavaScript', 'TypeScript', 'React']
        },
        {
          title: 'Documentation',
          description: 'Improve project documentation and guides',
          skills: ['Technical Writing', 'Markdown']
        },
        {
          title: 'Testing',
          description: 'Write tests and improve code quality',
          skills: ['Jest', 'Testing Library', 'Quality Assurance']
        }
      ]
    }
  };
  
  return defaultContent[pageType] || {};
};

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
  // Allow unauthenticated import in development mode
  if (process.env.NODE_ENV === 'development') {
    console.warn('[DEV MODE] Skipping authentication for /projects/import');
  } else {
    // Require authentication in production
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access token required',
        message: 'Please provide a valid Bearer token'
      });
    }
    // Optionally, verify the token here if needed
  }
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
      // Fetch all branches first
      const branches = await getRepositoryBranches(req.user.accessToken, owner, repo);
      // Fetch all issues and PRs once (for all branches)
      const issues = await getRepositoryIssues(req.user.accessToken, owner, repo, 'all', 1, 100);
      const pullRequests = await getRepositoryPullRequests(req.user.accessToken, owner, repo, 'all', 1, 100);
      // For each branch, fetch commits for that branch directly
      const branchData = await Promise.all(branches.map(async branch => {
        const commits = await getRepositoryCommits(req.user.accessToken, owner, repo, branch.name, 1, 100);
        return {
          name: branch.name,
          protected: branch.protected,
          lastCommit: branch.commit,
          // Issues: fallback to label/title matching
          issues: issues.filter(issue => 
            issue.labels.some(label => 
              label.name.toLowerCase().includes(branch.name.toLowerCase()) ||
              issue.title.toLowerCase().includes(branch.name.toLowerCase())
            )
          ),
          // PRs: robust branch matching
          pullRequests: pullRequests.filter(pr => 
            pr.head.ref === branch.name || 
            pr.base.ref === branch.name
          ),
          commits: commits
        };
      }));
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
        branches: branchData,
        summary: {
          totalBranches: branches.length,
          totalIssues: issues.length,
          totalPullRequests: pullRequests.length,
          totalCommits: branchData.reduce((acc, b) => acc + b.commits.length, 0),
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

router.get('/:projectId/branches/:branch/suggestions', asyncHandler(async (req, res) => {
  const { projectId, branch } = req.params;
  const project = await getProject(projectId);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  if (!project.repository_url) {
    return res.status(400).json({ error: 'Project has no repository_url' });
  }
  const [owner, repo] = project.repository_url.split('/').slice(-2);
  try {
    const [branches, issues, pullRequests, commits] = await Promise.all([
      getRepositoryBranches(req.user.accessToken, owner, repo),
      getRepositoryIssues(req.user.accessToken, owner, repo, 'all', 1, 100),
      getRepositoryPullRequests(req.user.accessToken, owner, repo, 'all', 1, 100),
      getRepositoryCommits(req.user.accessToken, owner, repo, branch, 1, 100)
    ]);
    // Filter PRs and issues for this branch
    const branchPRs = pullRequests.filter(pr => pr.head.ref === branch || pr.base.ref === branch);
    const branchIssues = issues.filter(issue =>
      issue.labels.some(label => label.name.toLowerCase().includes(branch.toLowerCase())) ||
      issue.title.toLowerCase().includes(branch.toLowerCase())
    );
    // Suggestion 1: Stale PRs (>7 days, open, approved)
    const now = new Date();
    const stalePRs = branchPRs.filter(pr => {
      const created = new Date(pr.created_at);
      const daysOpen = (now - created) / (1000 * 60 * 60 * 24);
      return pr.state === 'open' && daysOpen > 7 && pr.requested_reviewers?.length === 0;
    });
    // Suggestion 2: PRs with no reviewers
    const noReviewerPRs = branchPRs.filter(pr => pr.state === 'open' && (!pr.requested_reviewers || pr.requested_reviewers.length === 0));
    // Suggestion 3: Potential conflicts (simulate: if >1 PR is open)
    const potentialConflicts = branchPRs.filter(pr => pr.state === 'open').length > 1;
    // Suggestion 4: Many bug issues
    const bugIssues = branchIssues.filter(issue => issue.labels.some(l => l.name === 'bug'));
    // Build suggestions array
    let id = 1;
    const suggestions = [];
    if (stalePRs.length > 0) {
      suggestions.push({
        id: id++,
        type: 'optimization',
        title: 'Merge stale PRs',
        description: `You have ${stalePRs.length} PR(s) open for over a week with no reviewers. Consider merging or closing them.`,
        priority: 'medium',
        action: 'Review PRs'
      });
    }
    if (noReviewerPRs.length > 0) {
      suggestions.push({
        id: id++,
        type: 'collaboration',
        title: 'Assign reviewers',
        description: `${noReviewerPRs.length} PR(s) are missing reviewers. Auto-assign based on code ownership?`,
        priority: 'high',
        action: 'Auto-assign'
      });
    }
    if (potentialConflicts) {
      suggestions.push({
        id: id++,
        type: 'warning',
        title: 'Potential conflicts',
        description: 'Multiple PRs are open for this branch. Review for possible conflicts.',
        priority: 'high',
        action: 'Check Conflicts'
      });
    }
    if (bugIssues.length > 3) {
      suggestions.push({
        id: id++,
        type: 'insight',
        title: 'Create issue template',
        description: 'Many bug issues detected. Consider creating a bug report template.',
        priority: 'low',
        action: 'Create Template'
      });
    }
    res.json({ suggestions });
  } catch (error) {
    console.error('Error generating smart suggestions:', error);
    res.status(500).json({ error: 'Failed to generate suggestions', message: error.message });
  }
}));

// Get project page content (Why, How, Contribute)
router.get('/:projectId/content/:pageType', asyncHandler(async (req, res) => {
  const { projectId, pageType } = req.params;
  
  const project = await getProject(projectId);
  if (!project) {
    return res.status(404).json({
      error: 'Project not found',
      message: 'Project with the specified ID not found'
    });
  }

  const validPageTypes = ['why', 'how', 'contribute'];
  if (!validPageTypes.includes(pageType)) {
    return res.status(400).json({
      error: 'Invalid page type',
      message: 'Page type must be one of: why, how, contribute'
    });
  }

  // Get page content from project data
  const pageContent = project.pageContent?.[pageType] || getDefaultPageContent(pageType);
  
  res.json({
    content: pageContent,
    lastUpdated: project.pageContent?.[pageType]?.lastUpdated || null,
    updatedBy: project.pageContent?.[pageType]?.updatedBy || null
  });
}));

// Update project page content (Why, How, Contribute) - Only for project owners
router.put('/:projectId/content/:pageType', [
  body('content').isObject().notEmpty(),
  body('content.title').optional().isString().trim().isLength({ min: 1, max: 200 }),
  body('content.description').optional().isString().trim().isLength({ min: 1, max: 1000 }),
  body('content.sections').optional().isArray(),
  body('content.features').optional().isArray(),
  body('content.quickStart').optional().isArray(),
  body('content.areas').optional().isArray(),
  body('content.setup').optional().isArray(),
  body('content.workflow').optional().isArray(),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      details: errors.array()
    });
  }

  const { projectId, pageType } = req.params;
  const { content } = req.body;

  const project = await getProject(projectId);
  if (!project) {
    return res.status(404).json({
      error: 'Project not found',
      message: 'Project with the specified ID not found'
    });
  }

  const validPageTypes = ['why', 'how', 'contribute'];
  if (!validPageTypes.includes(pageType)) {
    return res.status(400).json({
      error: 'Invalid page type',
      message: 'Page type must be one of: why, how, contribute'
    });
  }

  // Check if user is project owner
  const isOwner = await isProjectOwner(req.user, projectId);
  if (!isOwner) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Only project owners can update page content'
    });
  }

  // Update page content
  if (!project.pageContent) {
    project.pageContent = {};
  }
  
  project.pageContent[pageType] = {
    ...content,
    lastUpdated: new Date().toISOString(),
    updatedBy: req.user.id
  };
  
  project.updated_at = new Date().toISOString();

  await saveProject(projectId, project);

  res.json({
    message: 'Page content updated successfully',
    content: project.pageContent[pageType]
  });
}));

module.exports = router; 