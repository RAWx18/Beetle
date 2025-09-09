import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import GitHubAPI, { Repository, Commit, PullRequest, Issue, UserActivity } from '@/lib/github-api';

interface Contributor {
  login: string;
  contributions: number;
  avatar_url: string;
}

export interface DashboardStats {
  totalRepos: number;
  totalCommits: number;
  totalPRs: number;
  totalIssues: number;
  totalStars: number;
  totalForks: number;
}

export interface QuickStats {
  commitsToday: number;
  activePRs: number;
  starsEarned: number;
  collaborators: number;
}

export const useGitHubData = () => {
  const { token, user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);  // New state for background updates
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Data states
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [starredRepositories, setStarredRepositories] = useState<Repository[]>([]);
  const [trendingRepositories, setTrendingRepositories] = useState<Repository[]>([]);
  const [recentCommits, setRecentCommits] = useState<Commit[]>([]);
  const [openPRs, setOpenPRs] = useState<PullRequest[]>([]);
  const [openIssues, setOpenIssues] = useState<Issue[]>([]);
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalRepos: 0,
    totalCommits: 0,
    totalPRs: 0,
    totalIssues: 0,
    totalStars: 0,
    totalForks: 0,
  });
  const [quickStats, setQuickStats] = useState<QuickStats>({
    commitsToday: 0,
    activePRs: 0,
    starsEarned: 0,
    collaborators: 0,
  });

  // Refs to prevent infinite loops
  const isInitialized = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const apiRef = useRef<GitHubAPI | null>(null);

  // Refs for auto-refresh
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);
  const isVisible = useRef(true);
  const isInitialLoad = useRef(true);

  console.log('useGitHubData - Token:', token ? 'Available' : 'Not available');
  console.log('useGitHubData - User:', user);

  // Initialize API instance
  useEffect(() => {
    if (token && token !== 'demo-token') {
      apiRef.current = new GitHubAPI(token);
    } else {
      apiRef.current = null;
    }
  }, [token]);

  // Set mock data for demo mode
  const setMockData = useCallback(() => {
    console.log('Setting mock data for demo mode');
    
    const mockRepos: Repository[] = [
      {
        id: 1,
        name: "beetle-app",
        full_name: "demo-user/beetle-app",
        description: "AI-powered GitHub contribution manager with structured planning and branch-aware workflows",
        language: "TypeScript",
        stargazers_count: 15,
        forks_count: 3,
        updated_at: new Date().toISOString(),
        private: false,
        html_url: "https://github.com/demo-user/beetle-app",
        owner: {
          login: "demo-user",
          avatar_url: "https://github.com/github.png"
        }
      },
      {
        id: 2,
        name: "react-components",
        full_name: "demo-user/react-components",
        description: "Reusable React components library with TypeScript",
        language: "TypeScript",
        stargazers_count: 8,
        forks_count: 1,
        updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        private: false,
        html_url: "https://github.com/demo-user/react-components",
        owner: {
          login: "demo-user",
          avatar_url: "https://github.com/github.png"
        }
      }
    ];

    setRepositories(mockRepos);
    setDashboardStats({
      totalRepos: 2,
      totalCommits: 45,
      totalPRs: 2,
      totalIssues: 3,
      totalStars: 23,
      totalForks: 4,
    });
    setQuickStats({
      commitsToday: 3,
      activePRs: 2,
      starsEarned: 23,
      collaborators: 3,
    });
    setUserActivity([
      {
        id: "1",
        type: "PushEvent",
        actor: {
          login: "demo-user",
          avatar_url: "https://github.com/github.png"
        },
        repo: {
          name: "demo-user/beetle-app"
        },
        created_at: new Date().toISOString(),
        payload: {
          commits: [{ message: "Add new dashboard features" }]
        }
      },
      {
        id: "2",
        type: "PullRequestEvent",
        actor: {
          login: "demo-user",
          avatar_url: "https://github.com/github.png"
        },
        repo: {
          name: "demo-user/beetle-app"
        },
        created_at: new Date(Date.now() - 3600000).toISOString(),
        payload: {
          action: "opened"
        }
      }
    ]);
    
    setOpenPRs([
      {
        id: 1,
        number: 15,
        title: "Implement real-time updates",
        state: "open",
        created_at: new Date(Date.now() - 3600000).toISOString(),
        updated_at: new Date().toISOString(),
        user: {
          login: "demo-user",
          avatar_url: "https://github.com/github.png"
        },
        head: { ref: "feature/realtime-updates" },
        base: { ref: "main" }
      },
      {
        id: 2,
        number: 14,
        title: "Fix authentication flow",
        state: "open",
        created_at: new Date(Date.now() - 7200000).toISOString(),
        updated_at: new Date(Date.now() - 1800000).toISOString(),
        user: {
          login: "demo-user",
          avatar_url: "https://github.com/github.png"
        },
        head: { ref: "fix/auth-flow" },
        base: { ref: "main" }
      }
    ]);
    
    setOpenIssues([
      {
        id: 1,
        number: 8,
        title: "Add TypeScript support",
        state: "open",
        created_at: new Date(Date.now() - 7200000).toISOString(),
        updated_at: new Date(Date.now() - 3600000).toISOString(),
        user: {
          login: "demo-user",
          avatar_url: "https://github.com/github.png"
        },
        labels: [{ name: "enhancement", color: "a2eeef" }]
      }
    ]);

    setRecentCommits([
      {
        sha: "abc123",
        commit: {
          message: "Add new dashboard features",
          author: {
            name: "Demo User",
            email: "demo@example.com",
            date: new Date().toISOString()
          }
        },
        author: {
          login: "demo-user",
          avatar_url: "https://github.com/github.png"
        }
      }
    ]);

    // Mock starred repositories
    const mockStarredRepos: Repository[] = [
      {
        id: 101,
        name: "next.js",
        full_name: "vercel/next.js",
        description: "The React Framework for the Web. Used by some of the world's largest companies, Next.js enables you to create full-stack web applications.",
        language: "TypeScript",
        stargazers_count: 120000,
        forks_count: 26000,
        updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
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

    // Mock trending repositories
    const mockTrendingRepos: Repository[] = [
      {
        id: 201,
        name: "svelte",
        full_name: "sveltejs/svelte",
        description: "Cybernetically enhanced web apps. Svelte is a radical new approach to building user interfaces.",
        language: "TypeScript",
        stargazers_count: 85000,
        forks_count: 12000,
        updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        private: false,
        html_url: "https://github.com/sveltejs/svelte",
        owner: {
          login: "sveltejs",
          avatar_url: "https://github.com/sveltejs.png"
        }
      },
      {
        id: 202,
        name: "rust",
        full_name: "rust-lang/rust",
        description: "Empowering everyone to build reliable and efficient software.",
        language: "Rust",
        stargazers_count: 95000,
        forks_count: 15000,
        updated_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        private: false,
        html_url: "https://github.com/rust-lang/rust",
        owner: {
          login: "rust-lang",
          avatar_url: "https://github.com/rust-lang.png"
        }
      },
      {
        id: 203,
        name: "go",
        full_name: "golang/go",
        description: "The Go programming language. Go is an open source programming language that makes it easy to build simple, reliable, and efficient software.",
        language: "Go",
        stargazers_count: 120000,
        forks_count: 18000,
        updated_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        private: false,
        html_url: "https://github.com/golang/go",
        owner: {
          login: "golang",
          avatar_url: "https://github.com/golang.png"
        }
      }
    ];

    setStarredRepositories(mockStarredRepos);
    setTrendingRepositories(mockTrendingRepos);
  }, []);

  // Helper functions to transform UserActivity to proper types
  const transformActivityToCommits = (activities: UserActivity[]): Commit[] => {
    return activities
      .filter(event => event.type === 'PushEvent' && event.payload?.commits)
      .flatMap(event => 
        event.payload.commits.map((commit: any, index: number) => ({
          sha: commit.sha || `temp-${event.id}-${index}`,
          commit: {
            message: commit.message,
            author: {
              name: event.actor.login,
              email: `${event.actor.login}@users.noreply.github.com`,
              date: event.created_at
            }
          },
          author: {
            login: event.actor.login,
            avatar_url: event.actor.avatar_url
          }
        }))
      );
  };

  const transformActivityToPRs = (activities: UserActivity[]): PullRequest[] => {
    return activities
      .filter(event => event.type === 'PullRequestEvent' && event.payload?.pull_request)
      .map(event => ({
        id: event.payload.pull_request.id || parseInt(event.id),
        number: event.payload.pull_request.number,
        title: event.payload.pull_request.title,
        state: event.payload.pull_request.state,
        created_at: event.payload.pull_request.created_at || event.created_at,
        updated_at: event.payload.pull_request.updated_at || event.created_at,
        user: {
          login: event.actor.login,
          avatar_url: event.actor.avatar_url
        },
        head: {
          ref: event.payload.pull_request.head?.ref || 'unknown'
        },
        base: {
          ref: event.payload.pull_request.base?.ref || 'main'
        }
      }));
  };

  const transformActivityToIssues = (activities: UserActivity[]): Issue[] => {
    return activities
      .filter(event => event.type === 'IssuesEvent' && event.payload?.issue)
      .map(event => ({
        id: event.payload.issue.id || parseInt(event.id),
        number: event.payload.issue.number,
        title: event.payload.issue.title,
        state: event.payload.issue.state,
        created_at: event.payload.issue.created_at || event.created_at,
        updated_at: event.payload.issue.updated_at || event.created_at,
        user: {
          login: event.actor.login,
          avatar_url: event.actor.avatar_url
        },
        labels: event.payload.issue.labels || []
      }));
  };

  // Modified fetch function with silent update option and better rate limit handling
  const fetchRealData = useCallback(async (silent = false) => {
    if (!apiRef.current) {
      console.log('No API instance available');
      setError('No API instance available');
      return;
    }

    console.log('Fetching GitHub data...', silent ? '(silent refresh - replacing all data)' : '(initial load)');
    if (!silent) {
      setLoading(true);
    } else {
      setUpdating(true);
    }
    setError(null);

    try {
      // Check if backend is accessible
      const isBackendHealthy = await apiRef.current.checkBackendHealth();
      if (!isBackendHealthy) {
        setError('Backend server is not accessible. Please check if the server is running and try again. You can use demo mode to explore the application.');
        return;
      }

      // Check rate limit status first
      try {
        const rateLimitStatus = await apiRef.current.getRateLimitStatus();
        console.log('Rate limit status:', rateLimitStatus);
        
        if (rateLimitStatus.rateLimit.isRateLimited) {
          const resetIn = rateLimitStatus.recommendations.nextResetIn;
          const resetMinutes = Math.ceil(resetIn / 60);
          setError(
            `GitHub API rate limit exceeded. The limit will reset in approximately ${resetMinutes} minutes. ` +
            `You can continue using demo mode or try again later.`
          );
          return;
        } else if (rateLimitStatus.rateLimit.isNearLimit) {
          console.warn(`⚠️ Approaching rate limit: ${rateLimitStatus.rateLimit.remaining}/${rateLimitStatus.rateLimit.limit} requests remaining`);
        }
      } catch (rateLimitError) {
        console.warn('Could not fetch rate limit status:', rateLimitError.message);
        // Continue with requests anyway
      }

      // Fetch basic data in parallel to improve performance
      const [
        repos,
        starred,
        trending,
        activity,
        aggregatedPRs,
        aggregatedIssues
      ] = await Promise.all([
        apiRef.current.getUserRepositories(),
        apiRef.current.getUserStarredRepositories().catch(() => []),
        apiRef.current.getTrendingRepositories('weekly').catch((error) => {
          console.warn('Failed to fetch trending repositories, using fallback:', error);
          return [];
        }),
        apiRef.current.getUserActivity().catch(() => []),
        apiRef.current.getAggregatedPullRequests('all', 15).catch(() => []),
        apiRef.current.getAggregatedIssues('all', 15).catch(() => [])
      ]);

      // Update states only if the component is still mounted
      if (isInitialized.current) {
        setRepositories(repos);
        setStarredRepositories(starred);
        setTrendingRepositories(trending);
        setUserActivity(activity);

        // Use aggregated data for pull requests and issues
        const allPullRequests = aggregatedPRs;
        const allIssues = aggregatedIssues;
        
        // Transform activity data for additional commits
        const activityCommits = transformActivityToCommits(activity);
        
        // Get commits from a few repositories to supplement activity data
        const allCommits = [...activityCommits];
        
        // Fetch commits from top 3 repositories for more recent data
        const topRepos = repos.slice(0, 3);
        for (const repo of topRepos) {
          try {
            const repoCommits = await apiRef.current.getRepositoryCommits(repo.owner.login, repo.name, 'main', 1, 5);
            allCommits.push(...repoCommits);
          } catch (error) {
            console.warn(`Failed to fetch commits for ${repo.full_name}:`, error);
          }
        }

        // Combine and deduplicate commits
        const uniqueCommits = allCommits.filter((commit, index, self) => 
          index === self.findIndex(c => c.sha === commit.sha)
        );

        // Sort by date (most recent first)
        allPullRequests.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        allIssues.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        uniqueCommits.sort((a, b) => new Date(b.commit.author.date).getTime() - new Date(a.commit.author.date).getTime());

        setRecentCommits(uniqueCommits.slice(0, 20));
        setOpenPRs(allPullRequests.slice(0, 20));
        setOpenIssues(allIssues.slice(0, 20));

        // Calculate stats
        const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
        const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);
        const totalIssues = repos.reduce((sum, repo) => sum + (repo as any).open_issues_count || 0, 0);

        setDashboardStats(prev => ({
          totalRepos: repos.length,
          totalCommits: uniqueCommits.length,
          totalPRs: allPullRequests.length,
          totalIssues: allIssues.length,
          totalStars,
          totalForks,
        }));

        setQuickStats(prev => ({
          ...prev,
          commitsToday: uniqueCommits.filter(c => {
            const date = new Date(c.commit.author.date);
            const today = new Date();
            return date.toDateString() === today.toDateString();
          }).length,
          activePRs: allPullRequests.filter(pr => pr.state === 'open').length,
          starsEarned: totalStars,
          collaborators: new Set(uniqueCommits.map(c => c.author?.login).filter(Boolean)).size
        }));
      }
    } catch (err) {
      console.error('Error fetching GitHub data:', err);
      // Enhanced error handling for rate limits
      let errorMessage = 'Failed to fetch GitHub data';
      if (err instanceof Error) {
        if (err.message.includes('rate limit')) {
          errorMessage = err.message;
        } else if (err.message.includes('Failed to fetch')) {
          errorMessage = 'Network error: Unable to connect to the server. Please check your connection and try again. You can use demo mode to explore the application.';
        } else if (err.message.includes('401')) {
          errorMessage = 'Authentication failed: Please log in again.';
        } else if (err.message.includes('403')) {
          errorMessage = 'Access denied: You may have hit the GitHub API rate limit. Please try again later or use demo mode.';
        } else if (err.message.includes('404')) {
          errorMessage = 'Data not found: The requested information is not available.';
        } else if (err.message.includes('500')) {
          errorMessage = 'Server error: Please try again later.';
        } else {
          errorMessage = `Failed to fetch GitHub data: ${err.message}`;
        }
      } else {
        errorMessage = `Failed to fetch GitHub data: ${String(err)}`;
      }
      setError(errorMessage);
    } finally {
      if (!silent) {
        setLoading(false);
      }
      setUpdating(false);
    }
  }, []);

  // Initialize data on mount
  useEffect(() => {
    if (isInitialized.current) return;
    
    if (!isAuthenticated) {
      setError('Authentication required. Please log in with GitHub or try demo mode.');
      setLoading(false);
      return;
    }

    if (!user || !token) {
      setError('User data not available. Please log in again.');
      setLoading(false);
      return;
    }

    console.log('Initializing data...');
    isInitialized.current = true;

    if (token === 'demo-token') {
      setMockData();
      setLoading(false);
      setError(null);
    } else {
      fetchRealData(false);  // Use loading state for initial fetch
    }
  }, [token, user, isAuthenticated, setMockData, fetchRealData]);

  // Smart refresh function
  const refreshData = useCallback(() => {
    console.log('Manual refresh triggered - performing full data refresh');
    if (token === 'demo-token') {
      // For demo mode, just update timestamps
      setUserActivity(prev => prev.map(activity => ({
        ...activity,
        created_at: new Date().toISOString()
      })));
    } else {
      fetchRealData(true);  // Use silent update for manual refresh - this will replace all data
    }
  }, [token, fetchRealData]);

  // Auto-refresh with smart interval
  useEffect(() => {
    if (!token || !user) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      console.log('Auto-refreshing data...');
      if (token === 'demo-token') {
        setUserActivity(prev => prev.map(activity => ({
          ...activity,
          created_at: new Date().toISOString()
        })));
      } else {
        fetchRealData(true).catch(err => {  // Use silent update for auto-refresh
          console.error('Auto-refresh failed:', err);
        });
      }
    }, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [token, user, fetchRealData]);

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisible.current = document.visibilityState === 'visible';
      if (isVisible.current && !isInitialLoad.current) {
        fetchRecentChanges();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Fetch only recent changes (used for auto-refresh)
  const fetchRecentChanges = async () => {
    if (!apiRef.current || token === 'demo-token') return;

    try {
      setUpdating(true);
      
      // Fetch recent activity and transform to get recent commits, PRs, and issues
      const activity = await apiRef.current.getUserActivity(user?.login, 1, 10);
      
      if (activity.length > 0) {
        // Transform activity to get recent data
        const recentCommits = transformActivityToCommits(activity);
        const recentPRs = transformActivityToPRs(activity);
        const recentIssues = transformActivityToIssues(activity);

        // Update states only if there are changes - append to existing data for auto-refresh
        if (recentCommits.length > 0) {
          setRecentCommits(prev => {
            const combined = [...recentCommits, ...prev];
            const unique = combined.filter((commit, index, self) => 
              index === self.findIndex(c => c.sha === commit.sha)
            );
            return unique.slice(0, 50);
          });
          setQuickStats(prev => ({ ...prev, commitsToday: prev.commitsToday + recentCommits.length }));
        }

        if (recentPRs.length > 0) {
          setOpenPRs(prev => {
            const combined = [...recentPRs, ...prev];
            const unique = combined.filter((pr, index, self) => 
              index === self.findIndex(p => p.id === pr.id)
            );
            return unique.slice(0, 50);
          });
          setQuickStats(prev => ({ ...prev, activePRs: recentPRs.filter(pr => pr.state === 'open').length }));
        }

        if (recentIssues.length > 0) {
          setOpenIssues(prev => {
            const combined = [...recentIssues, ...prev];
            const unique = combined.filter((issue, index, self) => 
              index === self.findIndex(i => i.id === issue.id)
            );
            return unique.slice(0, 50);
          });
        }

        setUserActivity(prev => {
          const combined = [...activity, ...prev];
          const unique = combined.filter((act, index, self) => 
            index === self.findIndex(a => a.id === act.id)
          );
          return unique.slice(0, 100);
        });
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch recent changes:', error);
    } finally {
      setUpdating(false);
    }
  };

  // Setup auto-refresh
  useEffect(() => {
    if (!token || token === 'demo-token') return;

    // Initial load
    if (isInitialLoad.current) {
      fetchRealData();
      isInitialLoad.current = false;
    }

    // Setup auto-refresh interval (every 2 minutes)
    autoRefreshInterval.current = setInterval(() => {
      if (isVisible.current) {
        fetchRecentChanges();
      }
    }, 2 * 60 * 1000);

    return () => {
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
      }
    };
  }, [token, fetchRealData]);

  return {
    loading,
    updating,  // Add updating state to the return object
    error,
    repositories,
    starredRepositories,
    trendingRepositories,
    recentCommits,
    openPRs,
    openIssues,
    userActivity,
    dashboardStats,
    quickStats,
    lastUpdated,
    refreshData,
  };
}; 