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
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [repositories, setRepositories] = useState<Repository[]>([]);
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
  }, []);

  // Fetch real GitHub data
  const fetchRealData = useCallback(async () => {
    if (!apiRef.current) {
      console.log('No API instance available');
      setError('No API instance available');
      return;
    }

    console.log('Fetching real GitHub data...');
    setLoading(true);
    setError(null);

    try {
      // Fetch repositories first
      const repos = await apiRef.current.getUserRepositories();
      console.log('Repositories fetched:', repos.length);
      setRepositories(repos);

      // Calculate basic stats
      const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
      const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);
      
      setDashboardStats(prev => ({
        ...prev,
        totalRepos: repos.length,
        totalStars,
        totalForks,
      }));

      // Fetch additional data only if we have repositories
      if (repos.length > 0) {
        const [commits, prs, issues, activity] = await Promise.allSettled([
          apiRef.current.getRepositoryCommits(repos[0].full_name.split('/')[0], repos[0].full_name.split('/')[1], 'main', 1, 10),
          apiRef.current.getRepositoryPullRequests(repos[0].full_name.split('/')[0], repos[0].full_name.split('/')[1], 'open', 1, 10),
          apiRef.current.getRepositoryIssues(repos[0].full_name.split('/')[0], repos[0].full_name.split('/')[1], 'open', 1, 10),
          apiRef.current.getUserActivity(),
        ]);

        if (commits.status === 'fulfilled') {
          setRecentCommits(commits.value);
          setDashboardStats(prev => ({ ...prev, totalCommits: commits.value.length }));
        }

        if (prs.status === 'fulfilled') {
          setOpenPRs(prs.value);
          setDashboardStats(prev => ({ ...prev, totalPRs: prs.value.length }));
          setQuickStats(prev => ({ ...prev, activePRs: prs.value.length }));
        }

        if (issues.status === 'fulfilled') {
          setOpenIssues(issues.value);
          setDashboardStats(prev => ({ ...prev, totalIssues: issues.value.length }));
        }

        if (activity.status === 'fulfilled') {
          setUserActivity(activity.value);
        }
      }

      setQuickStats(prev => ({ ...prev, starsEarned: totalStars }));
      
    } catch (err) {
      console.error('Error fetching GitHub data:', err);
      setError('Failed to fetch GitHub data: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize data on mount
  useEffect(() => {
    if (isInitialized.current) return;
    
    if (!token) {
      setError('Authentication required. Please log in with GitHub or try demo mode.');
      setLoading(false);
      return;
    }

    if (!user) {
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
      fetchRealData();
    }
  }, [token, user, setMockData, fetchRealData]);

  // Smart refresh function
  const refreshData = useCallback(() => {
    console.log('Manual refresh triggered');
    if (token === 'demo-token') {
      // For demo mode, just update timestamps
      setUserActivity(prev => prev.map(activity => ({
        ...activity,
        created_at: new Date().toISOString()
      })));
    } else {
      fetchRealData();
    }
  }, [token, fetchRealData]);

  // Smart auto-refresh with longer intervals
  useEffect(() => {
    if (!token || !user) return;

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up new interval with longer duration (30 seconds instead of 5)
    intervalRef.current = setInterval(() => {
      console.log('Auto-refreshing data...');
      if (token === 'demo-token') {
        // For demo mode, just update timestamps
        setUserActivity(prev => prev.map(activity => ({
          ...activity,
          created_at: new Date().toISOString()
        })));
      } else {
        // For real data, fetch with error handling
        fetchRealData().catch(err => {
          console.error('Auto-refresh failed:', err);
        });
      }
    }, 30000); // 30 seconds interval

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [token, user, fetchRealData]);

  return {
    loading,
    error,
    repositories,
    recentCommits,
    openPRs,
    openIssues,
    userActivity,
    dashboardStats,
    quickStats,
    refreshData,
  };
}; 