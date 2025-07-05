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
  getRepositoryLanguages
} = require('../utils/github.cjs');
const { saveAnalytics, getAnalytics } = require('../utils/database.cjs');
const { asyncHandler } = require('../middleware/errorHandler.cjs');

const router = express.Router();

// Get user analytics overview
router.get('/overview', asyncHandler(async (req, res) => {
  try {
    // Check if we have cached analytics
    let analytics = await getAnalytics(req.user.id);
    
    if (!analytics || !analytics.lastUpdated || 
        (new Date() - new Date(analytics.lastUpdated)) > 3600000) { // 1 hour
      
      // Fetch fresh data
      const repositories = await getUserRepositories(req.user.accessToken, 1, 100);
      const activity = await getUserActivity(req.user.accessToken, req.user.login, 1, 100);
      
      // Calculate analytics
      const totalStars = repositories.reduce((sum, repo) => sum + repo.stargazers_count, 0);
      const totalForks = repositories.reduce((sum, repo) => sum + repo.forks_count, 0);
      const totalIssues = repositories.reduce((sum, repo) => sum + repo.open_issues_count, 0);
      
      // Language distribution
      const languages = repositories.reduce((acc, repo) => {
        if (repo.language) {
          acc[repo.language] = (acc[repo.language] || 0) + 1;
        }
        return acc;
      }, {});
      
      // Activity analysis
      const activityTypes = activity.reduce((acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
      }, {});
      
      // Repository types
      const repoTypes = repositories.reduce((acc, repo) => {
        if (repo.fork) acc.forks++;
        else acc.original++;
        if (repo.private) acc.private++;
        else acc.public++;
        return acc;
      }, { forks: 0, original: 0, private: 0, public: 0 });
      
      analytics = {
        overview: {
          totalRepositories: repositories.length,
          totalStars,
          totalForks,
          totalIssues,
          averageStarsPerRepo: totalStars / repositories.length || 0,
          averageForksPerRepo: totalForks / repositories.length || 0
        },
        languages: {
          distribution: languages,
          topLanguages: Object.entries(languages)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([lang, count]) => ({ language: lang, count }))
        },
        activity: {
          types: activityTypes,
          totalEvents: activity.length,
          recentActivity: activity.slice(0, 20)
        },
        repositories: {
          types: repoTypes,
          topRepositories: repositories
            .sort((a, b) => b.stargazers_count - a.stargazers_count)
            .slice(0, 10)
            .map(repo => ({
              name: repo.name,
              full_name: repo.full_name,
              stars: repo.stargazers_count,
              forks: repo.forks_count,
              language: repo.language,
              updated_at: repo.updated_at
            }))
        },
        trends: {
          // Calculate trends based on recent activity
          recentCommits: activity.filter(e => e.type === 'PushEvent').length,
          recentPRs: activity.filter(e => e.type === 'PullRequestEvent').length,
          recentIssues: activity.filter(e => e.type === 'IssuesEvent').length
        }
      };
      
      // Save analytics
      await saveAnalytics(req.user.id, analytics);
    }
    
    res.json(analytics);
  } catch (error) {
    console.error('Error generating analytics overview:', error);
    res.status(500).json({
      error: 'Failed to generate analytics overview',
      message: error.message
    });
  }
}));

// Get repository-specific analytics
router.get('/repositories/:owner/:repo', asyncHandler(async (req, res) => {
  const { owner, repo } = req.params;
  
  try {
    // Fetch comprehensive repository data
    const [details, branches, issues, pullRequests, commits, contributors, languages] = await Promise.all([
      getRepositoryDetails(req.user.accessToken, owner, repo),
      getRepositoryBranches(req.user.accessToken, owner, repo),
      getRepositoryIssues(req.user.accessToken, owner, repo, 'all', 1, 100),
      getRepositoryPullRequests(req.user.accessToken, owner, repo, 'all', 1, 100),
      getRepositoryCommits(req.user.accessToken, owner, repo, 'main', 1, 100),
      getRepositoryContributors(req.user.accessToken, owner, repo),
      getRepositoryLanguages(req.user.accessToken, owner, repo)
    ]);
    
    // Calculate repository analytics
    const analytics = {
      repository: {
        name: details.name,
        full_name: details.full_name,
        description: details.description,
        language: details.language,
        stars: details.stargazers_count,
        forks: details.forks_count,
        watchers: details.watchers_count,
        size: details.size,
        created_at: details.created_at,
        updated_at: details.updated_at,
        pushed_at: details.pushed_at
      },
      summary: {
        totalBranches: branches.length,
        totalIssues: issues.length,
        openIssues: issues.filter(i => i.state === 'open').length,
        closedIssues: issues.filter(i => i.state === 'closed').length,
        totalPullRequests: pullRequests.length,
        openPullRequests: pullRequests.filter(pr => pr.state === 'open').length,
        mergedPullRequests: pullRequests.filter(pr => pr.merged).length,
        totalCommits: commits.length,
        totalContributors: contributors.length,
        languages: Object.keys(languages)
      },
      branches: {
        total: branches.length,
        protected: branches.filter(b => b.protected).length,
        list: branches.map(branch => ({
          name: branch.name,
          protected: branch.protected,
          lastCommit: branch.commit
        }))
      },
      issues: {
        byState: {
          open: issues.filter(i => i.state === 'open').length,
          closed: issues.filter(i => i.state === 'closed').length
        },
        byLabel: issues.reduce((acc, issue) => {
          issue.labels.forEach(label => {
            acc[label.name] = (acc[label.name] || 0) + 1;
          });
          return acc;
        }, {}),
        recent: issues
          .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
          .slice(0, 10)
      },
      pullRequests: {
        byState: {
          open: pullRequests.filter(pr => pr.state === 'open').length,
          closed: pullRequests.filter(pr => pr.state === 'closed' && !pr.merged).length,
          merged: pullRequests.filter(pr => pr.merged).length
        },
        byLabel: pullRequests.reduce((acc, pr) => {
          pr.labels.forEach(label => {
            acc[label.name] = (acc[label.name] || 0) + 1;
          });
          return acc;
        }, {}),
        recent: pullRequests
          .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
          .slice(0, 10)
      },
      commits: {
        total: commits.length,
        recent: commits.slice(0, 20),
        byAuthor: commits.reduce((acc, commit) => {
          const author = commit.author?.login || commit.commit.author.name;
          acc[author] = (acc[author] || 0) + 1;
          return acc;
        }, {})
      },
      contributors: {
        total: contributors.length,
        top: contributors.slice(0, 10),
        contributions: contributors.reduce((acc, contributor) => {
          acc[contributor.login] = contributor.contributions;
          return acc;
        }, {})
      },
      languages: languages,
      activity: {
        // Calculate activity trends
        commitsPerDay: commits.length / Math.max(1, (new Date() - new Date(details.created_at)) / (1000 * 60 * 60 * 24)),
        issuesPerDay: issues.length / Math.max(1, (new Date() - new Date(details.created_at)) / (1000 * 60 * 60 * 24)),
        pullRequestsPerDay: pullRequests.length / Math.max(1, (new Date() - new Date(details.created_at)) / (1000 * 60 * 60 * 24))
      }
    };
    
    res.json(analytics);
  } catch (error) {
    console.error('Error generating repository analytics:', error);
    res.status(500).json({
      error: 'Failed to generate repository analytics',
      message: error.message
    });
  }
}));

// Get branch-specific analytics for Beetle
router.get('/repositories/:owner/:repo/branches/:branch', asyncHandler(async (req, res) => {
  const { owner, repo, branch } = req.params;
  
  try {
    // Fetch branch-specific data
    const [branches, commits, issues, pullRequests] = await Promise.all([
      getRepositoryBranches(req.user.accessToken, owner, repo),
      getRepositoryCommits(req.user.accessToken, owner, repo, branch, 1, 100),
      getRepositoryIssues(req.user.accessToken, owner, repo, 'all', 1, 100),
      getRepositoryPullRequests(req.user.accessToken, owner, repo, 'all', 1, 100)
    ]);
    
    // Find the specific branch
    const branchData = branches.find(b => b.name === branch);
    
    if (!branchData) {
      return res.status(404).json({
        error: 'Branch not found',
        message: `Branch '${branch}' not found in repository ${owner}/${repo}`
      });
    }
    
    // Filter data related to this branch
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
    
    // Calculate branch analytics
    const analytics = {
      branch: {
        name: branchData.name,
        protected: branchData.protected,
        lastCommit: branchData.commit,
        lastActivity: branchData.commit.committer.date
      },
      summary: {
        totalCommits: commits.length,
        totalIssues: branchIssues.length,
        totalPullRequests: branchPullRequests.length,
        openIssues: branchIssues.filter(i => i.state === 'open').length,
        openPullRequests: branchPullRequests.filter(pr => pr.state === 'open').length
      },
      commits: {
        total: commits.length,
        recent: commits.slice(0, 20),
        byAuthor: commits.reduce((acc, commit) => {
          const author = commit.author?.login || commit.commit.author.name;
          acc[author] = (acc[author] || 0) + 1;
          return acc;
        }, {}),
        timeline: commits.map(commit => ({
          sha: commit.sha,
          message: commit.commit.message,
          author: commit.author?.login || commit.commit.author.name,
          date: commit.commit.author.date
        }))
      },
      issues: {
        total: branchIssues.length,
        open: branchIssues.filter(i => i.state === 'open').length,
        closed: branchIssues.filter(i => i.state === 'closed').length,
        byLabel: branchIssues.reduce((acc, issue) => {
          issue.labels.forEach(label => {
            acc[label.name] = (acc[label.name] || 0) + 1;
          });
          return acc;
        }, {}),
        recent: branchIssues
          .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
          .slice(0, 10)
      },
      pullRequests: {
        total: branchPullRequests.length,
        open: branchPullRequests.filter(pr => pr.state === 'open').length,
        merged: branchPullRequests.filter(pr => pr.merged).length,
        closed: branchPullRequests.filter(pr => pr.state === 'closed' && !pr.merged).length,
        byLabel: branchPullRequests.reduce((acc, pr) => {
          pr.labels.forEach(label => {
            acc[label.name] = (acc[label.name] || 0) + 1;
          });
          return acc;
        }, {}),
        recent: branchPullRequests
          .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
          .slice(0, 10)
      },
      activity: {
        // Calculate activity metrics for this branch
        commitsPerDay: commits.length / Math.max(1, (new Date() - new Date(branchData.commit.committer.date)) / (1000 * 60 * 60 * 24)),
        lastActivity: branchData.commit.committer.date,
        isActive: (new Date() - new Date(branchData.commit.committer.date)) < (7 * 24 * 60 * 60 * 1000) // Active if last commit within 7 days
      }
    };
    
    res.json(analytics);
  } catch (error) {
    console.error('Error generating branch analytics:', error);
    res.status(500).json({
      error: 'Failed to generate branch analytics',
      message: error.message
    });
  }
}));

// Get user contribution analytics
router.get('/contributions', [
  query('period').optional().isIn(['week', 'month', 'year', 'all']),
  query('username').optional().isString()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      details: errors.array()
    });
  }

  const { period = 'month', username } = req.query;
  const targetUsername = username || req.user.login;
  
  try {
    // Fetch user activity
    const activity = await getUserActivity(req.user.accessToken, targetUsername, 1, 100);
    
    // Filter by period
    const now = new Date();
    let filteredActivity = activity;
    
    if (period !== 'all') {
      const periodMap = {
        week: 7 * 24 * 60 * 60 * 1000,
        month: 30 * 24 * 60 * 60 * 1000,
        year: 365 * 24 * 60 * 60 * 1000
      };
      
      const cutoff = new Date(now.getTime() - periodMap[period]);
      filteredActivity = activity.filter(event => new Date(event.created_at) >= cutoff);
    }
    
    // Calculate contribution analytics
    const contributions = {
      period,
      username: targetUsername,
      summary: {
        totalEvents: filteredActivity.length,
        uniqueRepositories: [...new Set(filteredActivity.map(e => e.repo?.name).filter(Boolean))].length
      },
      byType: filteredActivity.reduce((acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
      }, {}),
      byRepository: filteredActivity.reduce((acc, event) => {
        if (event.repo?.name) {
          acc[event.repo.name] = (acc[event.repo.name] || 0) + 1;
        }
        return acc;
      }, {}),
      timeline: filteredActivity
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        .map(event => ({
          type: event.type,
          repository: event.repo?.name,
          date: event.created_at,
          actor: event.actor?.login
        })),
      recentActivity: filteredActivity
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 20)
    };
    
    res.json(contributions);
  } catch (error) {
    console.error('Error generating contribution analytics:', error);
    res.status(500).json({
      error: 'Failed to generate contribution analytics',
      message: error.message
    });
  }
}));

// Get AI insights (static for now as requested)
router.get('/insights', asyncHandler(async (req, res) => {
  // Static AI insights as requested
  const insights = {
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
  };
  
  res.json(insights);
}));

module.exports = router; 