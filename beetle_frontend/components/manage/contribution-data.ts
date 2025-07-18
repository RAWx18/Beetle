export type PullRequest = {
  id: string;
  title: string;
  status: 'open' | 'under_review' | 'merged' | 'closed' | 'draft';
  author: string;
  reviewers: string[];
  sourceBranch: string;
  targetBranch: string;
  linkedIssue?: string;
  createdAt: string;
  lastUpdated: string;
  labels: string[];
  description: string;
  comments: number;
  additions: number;
  deletions: number;
  draft?: boolean;
};

export type Issue = {
  id: string;
  title: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assignee?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  labels: string[];
  branch: string;
  createdAt: string;
  discussions: number;
  linkedPRs: string[];
  description: string;
  type: 'bug' | 'feature' | 'documentation' | 'enhancement';
  reporter: string;
};

export type ActivityItem = {
  id: string;
  type: 'commit' | 'pr_opened' | 'pr_merged' | 'comment' | 'review' | 'issue_opened' | 'issue_closed' | 'automated';
  user: string;
  description: string;
  timestamp: string;
  branch: string;
  details?: string;
};

export type BotLog = {
  id: string;
  botName: string;
  action: string;
  description: string;
  timestamp: string;
  branch: string;
  status: 'success' | 'error' | 'warning';
  details?: string;
};

// Function to transform GitHub API data to our format
export const transformGitHubData = (
  userActivity: any[],
  pullRequests: any[],
  issues: any[],
  commits: any[],
  user: any
) => {
  // Transform pull requests
  const transformedPRs: PullRequest[] = pullRequests.map((pr, index) => ({
    id: `pr-${pr.id || index}`,
    title: pr.title,
    status: pr.draft ? 'draft' : (pr.state === 'open' ? 'open' : pr.merged ? 'merged' : 'closed'),
    author: pr.user?.login || user?.login || 'Unknown',
    reviewers: pr.requested_reviewers?.map((r: any) => r.login) || [],
    sourceBranch: pr.head?.ref || 'main',
    targetBranch: pr.base?.ref || 'main',
    createdAt: pr.created_at,
    lastUpdated: pr.updated_at,
    labels: pr.labels?.map((l: any) => l.name) || [],
    description: pr.body || '',
    comments: pr.comments || 0,
    additions: pr.additions || 0,
    deletions: pr.deletions || 0,
    draft: pr.draft || false,
  }));

  // Transform issues
  const transformedIssues: Issue[] = issues.map((issue, index) => ({
    id: `issue-${issue.id || index}`,
    title: issue.title,
    status: issue.state === 'open' ? 'open' : 'closed',
    assignee: issue.assignee?.login,
    priority: 'medium', // GitHub doesn't have priority, default to medium
    labels: issue.labels?.map((l: any) => l.name) || [],
    branch: 'main', // Default branch
    createdAt: issue.created_at,
    discussions: issue.comments || 0,
    linkedPRs: [], // Would need additional API call to get linked PRs
    description: issue.body || '',
    type: issue.labels?.some((l: any) => l.name === 'bug') ? 'bug' : 
          issue.labels?.some((l: any) => l.name === 'documentation') ? 'documentation' : 
          issue.labels?.some((l: any) => l.name === 'enhancement') ? 'enhancement' : 'feature',
    reporter: issue.user?.login || user?.login || 'Unknown'
  }));

  // Transform activity from GitHub events
  const transformedActivity: ActivityItem[] = userActivity.map((activity, index) => {
    const getActivityType = (type: string) => {
      switch (type) {
        case 'PushEvent': return 'commit';
        case 'PullRequestEvent': 
          return activity.payload?.action === 'opened' ? 'pr_opened' : 
                 activity.payload?.action === 'closed' ? 'pr_merged' : 'pr_opened';
        case 'IssuesEvent':
          return activity.payload?.action === 'opened' ? 'issue_opened' : 'issue_closed';
        case 'IssueCommentEvent': return 'comment';
        case 'PullRequestReviewEvent': return 'review';
        default: return 'commit';
      }
    };

    const getDescription = (activity: any) => {
      switch (activity.type) {
        case 'PushEvent':
          return `Pushed ${activity.payload?.commits?.length || 0} commits`;
        case 'PullRequestEvent':
          return `${activity.payload?.action === 'opened' ? 'Opened' : 'Updated'} PR #${activity.payload?.pull_request?.number}`;
        case 'IssuesEvent':
          return `${activity.payload?.action === 'opened' ? 'Opened' : 'Updated'} issue #${activity.payload?.issue?.number}`;
        case 'IssueCommentEvent':
          return 'Added comment';
        case 'PullRequestReviewEvent':
          return 'Submitted review';
        default:
          return 'Activity';
      }
    };

    return {
      id: `act-${activity.id || index}`,
      type: getActivityType(activity.type),
      user: activity.actor?.login || user?.login || 'Unknown',
      description: getDescription(activity),
      timestamp: activity.created_at,
      branch: activity.payload?.ref?.replace('refs/heads/', '') || 'main',
      details: activity.payload?.commits?.[0]?.message || activity.payload?.pull_request?.title || activity.payload?.issue?.title
    };
  });

  // Generate bot logs (simulated for now)
  const botLogs: BotLog[] = [
    {
      id: 'bot-1',
      botName: 'Auto-Labeler',
      action: 'label_added',
      description: 'Automatically labeled recent activities',
      timestamp: new Date().toISOString(),
      branch: 'main',
      status: 'success'
    }
  ];

  return {
    pullRequests: transformedPRs,
    issues: transformedIssues,
    activity: transformedActivity,
    botLogs
  };
};

// Fallback static data for when no real data is available
export const fallbackContributionData = {
  pullRequests: [
    {
      id: 'pr-draft',
      title: 'WIP: Add new authentication flow',
      status: 'draft',
      author: 'DraftUser',
      reviewers: [],
      sourceBranch: 'auth-refactor',
      targetBranch: 'main',
      createdAt: '2024-01-22',
      lastUpdated: '1 hour ago',
      labels: ['wip', 'auth'],
      description: 'This is a draft PR for the new authentication flow.',
      comments: 0,
      additions: 100,
      deletions: 10,
      draft: true
    },
    {
      id: 'pr-1',
      title: 'Implement multi-agent FAQ discovery system',
      status: 'under_review' as const,
      author: 'Ryan Mitchell',
      reviewers: ['Lochan Paudel', 'Gianluca'],
      sourceBranch: 'agents',
      targetBranch: 'dev',
      linkedIssue: 'issue-1',
      createdAt: '2024-01-15',
      lastUpdated: '2 hours ago',
      labels: ['enhancement', 'AI', 'agents'],
      description: 'Advanced LLM integration for intelligent FAQ discovery',
      comments: 8,
      additions: 245,
      deletions: 12
    },
    {
      id: 'pr-2',
      title: 'Snowflake data pipeline integration',
      status: 'open' as const,
      author: 'Jayaram Patel',
      reviewers: ['Sumana'],
      sourceBranch: 'snowflake',
      targetBranch: 'dev',
      createdAt: '2024-01-18',
      lastUpdated: '1 day ago',
      labels: ['integration', 'data', 'snowflake'],
      description: 'Enterprise-grade data integration using Snowflake',
      comments: 3,
      additions: 189,
      deletions: 0
    },
    {
      id: 'pr-3',
      title: 'UI enhancement for contribution management',
      status: 'merged' as const,
      author: 'Gianluca',
      reviewers: ['Ryan Mitchell'],
      sourceBranch: 'dev',
      targetBranch: 'dev',
      linkedIssue: 'issue-3',
      createdAt: '2024-01-10',
      lastUpdated: '3 days ago',
      labels: ['UI', 'enhancement', 'dev'],
      description: 'Improved user interface for managing contributions',
      comments: 12,
      additions: 156,
      deletions: 89
    },
    {
      id: 'pr-4',
      title: 'RAG pipeline optimization',
      status: 'open' as const,
      author: 'Lochan Paudel',
      reviewers: [],
      sourceBranch: 'agents',
      targetBranch: 'agents',
      createdAt: '2024-01-20',
      lastUpdated: '5 hours ago',
      labels: ['optimization', 'RAG', 'agents'],
      description: 'Performance improvements for retrieval-augmented generation',
      comments: 2,
      additions: 67,
      deletions: 23
    },
    {
      id: 'pr-5',
      title: 'Documentation update for API endpoints',
      status: 'closed' as const,
      author: 'Sumana',
      reviewers: ['Jayaram Patel'],
      sourceBranch: 'snowflake',
      targetBranch: 'snowflake',
      createdAt: '2024-01-12',
      lastUpdated: '1 week ago',
      labels: ['documentation', 'API', 'snowflake'],
      description: 'Updated API documentation with new Snowflake endpoints',
      comments: 5,
      additions: 45,
      deletions: 8
    }
  ],
  
  issues: [
    {
      id: 'issue-1',
      title: 'Implement intelligent FAQ discovery using LLMs',
      status: 'in_progress' as const,
      assignee: 'Ryan Mitchell',
      priority: 'high' as const,
      labels: ['AI', 'enhancement', 'agents'],
      branch: 'agents',
      createdAt: '2024-01-12',
      discussions: 8,
      linkedPRs: ['pr-1'],
      description: 'Create an intelligent system for FAQ discovery using advanced LLMs',
      type: 'feature' as const,
      reporter: 'Lochan Paudel'
    },
    {
      id: 'issue-2',
      title: 'Snowflake enterprise integration setup',
      status: 'open' as const,
      assignee: 'Jayaram Patel',
      priority: 'high' as const,
      labels: ['integration', 'enterprise', 'snowflake'],
      branch: 'snowflake',
      createdAt: '2024-01-15',
      discussions: 5,
      linkedPRs: ['pr-2'],
      description: 'Set up enterprise-grade data integrations using Snowflake',
      type: 'feature' as const,
      reporter: 'Sumana'
    },
    {
      id: 'issue-3',
      title: 'Improve contribution management UI',
      status: 'resolved' as const,
      assignee: 'Gianluca',
      priority: 'medium' as const,
      labels: ['UI', 'enhancement', 'dev'],
      branch: 'dev',
      createdAt: '2024-01-08',
      discussions: 12,
      linkedPRs: ['pr-3'],
      description: 'Enhance the user interface for better contribution management',
      type: 'enhancement' as const,
      reporter: 'Ryan Mitchell'
    },
    {
      id: 'issue-4',
      title: 'Optimize RAG pipeline performance',
      status: 'in_progress' as const,
      assignee: 'Lochan Paudel',
      priority: 'medium' as const,
      labels: ['performance', 'optimization', 'agents'],
      branch: 'agents',
      createdAt: '2024-01-18',
      discussions: 3,
      linkedPRs: ['pr-4'],
      description: 'Improve performance of the retrieval-augmented generation pipeline',
      type: 'enhancement' as const,
      reporter: 'Ryan Mitchell'
    },
    {
      id: 'issue-5',
      title: 'Documentation update for Snowflake integration',
      status: 'open' as const,
      priority: 'low' as const,
      labels: ['documentation', 'snowflake'],
      branch: 'snowflake',
      createdAt: '2024-01-22',
      discussions: 1,
      linkedPRs: [],
      description: 'Update documentation for the new Snowflake integration features',
      type: 'documentation' as const,
      reporter: 'Jayaram Patel'
    },
    {
      id: 'issue-6',
      title: 'Memory leak in agent processing',
      status: 'open' as const,
      assignee: 'Ryan Mitchell',
      priority: 'critical' as const,
      labels: ['bug', 'memory', 'agents'],
      branch: 'agents',
      createdAt: '2024-01-23',
      discussions: 2,
      linkedPRs: [],
      description: 'Memory usage spikes during long-running agent processes',
      type: 'bug' as const,
      reporter: 'Lochan Paudel'
    }
  ],
  
  activity: [
    {
      id: 'act-1',
      type: 'commit' as const,
      user: 'Ryan Mitchell',
      description: 'Added new LLM integration for FAQ discovery',
      timestamp: '2 hours ago',
      branch: 'agents',
      details: 'feat: implement advanced LLM FAQ discovery system\n\n- Added OpenAI GPT-4 integration\n- Implemented semantic search\n- Added FAQ ranking algorithm'
    },
    {
      id: 'act-2',
      type: 'pr_opened' as const,
      user: 'Jayaram Patel',
      description: 'Opened PR for Snowflake data pipeline integration',
      timestamp: '1 day ago',
      branch: 'snowflake'
    },
    {
      id: 'act-3',
      type: 'review' as const,
      user: 'Lochan Paudel',
      description: 'Reviewed PR #1 and requested changes',
      timestamp: '3 hours ago',
      branch: 'agents'
    },
    {
      id: 'act-4',
      type: 'pr_merged' as const,
      user: 'Gianluca',
      description: 'Merged PR #3 for UI enhancements',
      timestamp: '3 days ago',
      branch: 'dev'
    },
    {
      id: 'act-5',
      type: 'comment' as const,
      user: 'Sumana',
      description: 'Added feedback on Snowflake integration approach',
      timestamp: '6 hours ago',
      branch: 'snowflake'
    },
    {
      id: 'act-6',
      type: 'issue_opened' as const,
      user: 'Lochan Paudel',
      description: 'Reported memory leak in agent processing',
      timestamp: '1 hour ago',
      branch: 'agents'
    },
    {
      id: 'act-7',
      type: 'automated' as const,
      user: 'github-bot',
      description: 'Automatically labeled PR #2 as "needs-review"',
      timestamp: '4 hours ago',
      branch: 'snowflake'
    }
  ],

  botLogs: [
    {
      id: 'bot-1',
      botName: 'Auto-Labeler',
      action: 'label_added',
      description: 'Added "needs-review" label to PR #2',
      timestamp: '4 hours ago',
      branch: 'snowflake',
      status: 'success' as const,
      details: 'Detected keywords: "integration", "data pipeline"'
    },
    {
      id: 'bot-2',
      botName: 'Code-Review-Bot',
      action: 'review_requested',
      description: 'Requested review from @Sumana for PR #2',
      timestamp: '1 day ago',
      branch: 'snowflake',
      status: 'success' as const
    },
    {
      id: 'bot-3',
      botName: 'CI-Bot',
      action: 'build_failed',
      description: 'Build failed for PR #4 - missing dependencies',
      timestamp: '2 hours ago',
      branch: 'agents',
      status: 'error' as const,
      details: 'Missing package: tensorflow==2.14.0'
    }
  ]
};

// Export the fallback data as the default for backward compatibility
export const contributionData = fallbackContributionData;
