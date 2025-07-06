import { useState, useEffect, useCallback } from 'react';
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

  console.log('useGitHubData - Token:', token ? 'Available' : 'Not available');
  console.log('useGitHubData - User:', user);
  
  const api = token ? new GitHubAPI(token) : null;

  // Check if we have valid authentication
  useEffect(() => {
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
    
    // Clear any previous errors when we have valid auth
    setError(null);
  }, [token, user]);

  // Fetch user repositories
  const fetchRepositories = useCallback(async () => {
    if (!api) {
      console.error('No API instance available');
      setError('No API instance available');
      return null;
    }
    
    try {
      console.log('Fetching repositories...');
      const repos = await api.getUserRepositories();
      console.log('Repositories fetched:', repos.length, repos);
      setRepositories(repos);
      
      // Calculate dashboard stats
      const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
      const stats: DashboardStats = {
        totalRepos: repos.length,
        totalCommits: 0, // Will be calculated from commits
        totalPRs: 0, // Will be calculated from PRs
        totalIssues: 0, // Will be calculated from issues
        totalStars,
        totalForks: repos.reduce((sum, repo) => sum + repo.forks_count, 0),
      };
      console.log('Dashboard stats calculated:', stats);
      setDashboardStats(stats);
      
      // Calculate quick stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const quickStats: QuickStats = {
        commitsToday: 0, // Will be calculated from commits
        activePRs: 0, // Will be calculated from PRs
        starsEarned: totalStars,
        collaborators: 0, // Will be calculated from contributors
      };
      console.log('Quick stats calculated:', quickStats);
      setQuickStats(quickStats);
      
      return repos;
    } catch (err) {
      console.error('Error fetching repositories:', err);
      setError('Failed to fetch repositories: ' + (err instanceof Error ? err.message : String(err)));
      return null;
    }
  }, [api]);

  // Fetch recent commits from all repositories
  const fetchRecentCommits = useCallback(async (repos: Repository[]) => {
    if (!api || repos.length === 0) return;
    
    try {
      const allCommits: Commit[] = [];
      let totalCommits = 0;
      
      // Fetch commits from first 5 repositories (to avoid rate limits)
      const reposToFetch = repos.slice(0, 5);
      
      for (const repo of reposToFetch) {
        try {
          const [owner, repoName] = repo.full_name.split('/');
          const commits = await api.getRepositoryCommits(owner, repoName, 'main', 1, 10);
          allCommits.push(...commits);
          totalCommits += commits.length;
        } catch (err) {
          console.error(`Error fetching commits for ${repo.full_name}:`, err);
        }
      }
      
      // Sort by date and take recent ones
      const sortedCommits = allCommits.sort((a, b) => 
        new Date(b.commit.author.date).getTime() - new Date(a.commit.author.date).getTime()
      );
      
      setRecentCommits(sortedCommits.slice(0, 20));
      
      // Update stats
      setDashboardStats(prev => ({ ...prev, totalCommits }));
      
      // Calculate commits today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const commitsToday = sortedCommits.filter(commit => 
        new Date(commit.commit.author.date) >= today
      ).length;
      
      setQuickStats(prev => ({ ...prev, commitsToday }));
      
    } catch (err) {
      console.error('Error fetching commits:', err);
      setError('Failed to fetch commits: ' + (err instanceof Error ? err.message : String(err)));
    }
  }, [api]);

  // Fetch open pull requests from all repositories
  const fetchOpenPRs = useCallback(async (repos: Repository[]) => {
    if (!api || repos.length === 0) return;
    try {
      const allPRs: PullRequest[] = [];
      let totalPRs = 0;
      // Fetch PRs from up to 20 repositories
      const reposToFetch = repos.slice(0, 20);
      for (const repo of reposToFetch) {
        try {
          const [owner, repoName] = repo.full_name.split('/');
          const prs = await api.getRepositoryPullRequests(owner, repoName, 'open', 1, 50);
          allPRs.push(...prs);
          totalPRs += prs.length;
        } catch (err) {
          console.error(`Error fetching PRs for ${repo.full_name}:`, err);
        }
      }
      // Sort by updated date
      const sortedPRs = allPRs.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      setOpenPRs(sortedPRs.slice(0, 20));
      setDashboardStats(prev => ({ ...prev, totalPRs }));
      setQuickStats(prev => ({ ...prev, activePRs: totalPRs }));
    } catch (err) {
      console.error('Error fetching pull requests:', err);
      setError('Failed to fetch pull requests: ' + (err instanceof Error ? err.message : String(err)));
    }
  }, [api]);

  // Fetch open issues
  const fetchOpenIssues = useCallback(async (repos: Repository[]) => {
    if (!api || repos.length === 0) return;
    
    try {
      const allIssues: Issue[] = [];
      
      // Fetch issues from first 5 repositories
      const reposToFetch = repos.slice(0, 5);
      
      for (const repo of reposToFetch) {
        try {
          const [owner, repoName] = repo.full_name.split('/');
          const issues = await api.getRepositoryIssues(owner, repoName, 'open', 1, 10);
          allIssues.push(...issues);
        } catch (err) {
          console.error(`Error fetching issues for ${repo.full_name}:`, err);
        }
      }
      
      // Sort by updated date
      const sortedIssues = allIssues.sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
      
      setOpenIssues(sortedIssues.slice(0, 10));
      setDashboardStats(prev => ({ ...prev, totalIssues: allIssues.length }));
      
    } catch (err) {
      console.error('Error fetching issues:', err);
      setError('Failed to fetch issues: ' + (err instanceof Error ? err.message : String(err)));
    }
  }, [api]);

  // Fetch user activity (more events)
  const fetchUserActivity = useCallback(async () => {
    if (!api || !user?.login) return;
    try {
      const activity = await api.getUserActivity(user.login, 1, 50);
      setUserActivity(activity);
    } catch (err) {
      console.error('Error fetching user activity:', err);
      setError('Failed to fetch user activity: ' + (err instanceof Error ? err.message : String(err)));
    }
  }, [api, user?.login]);

  // Fetch collaborators count from all repositories
  const fetchCollaborators = useCallback(async (repos: Repository[]) => {
    if (!api || repos.length === 0) return;
    try {
      const allCollaborators = new Set<string>();
      // Fetch collaborators from up to 20 repositories
      const reposToFetch = repos.slice(0, 20);
      for (const repo of reposToFetch) {
        try {
          const [owner, repoName] = repo.full_name.split('/');
          const contributors = await api.getRepositoryContributors(owner, repoName);
          contributors.forEach((contributor: Contributor) => {
            allCollaborators.add(contributor.login);
          });
        } catch (err) {
          console.error(`Error fetching contributors for ${repo.full_name}:`, err);
        }
      }
      setQuickStats(prev => ({ ...prev, collaborators: allCollaborators.size }));
    } catch (err) {
      console.error('Error fetching collaborators:', err);
      setError('Failed to fetch collaborators: ' + (err instanceof Error ? err.message : String(err)));
    }
  }, [api]);

  // Main data fetching function
  const fetchAllData = useCallback(async () => {
    if (!api) {
      console.log('No API instance available for fetchAllData');
      return;
    }
    
    console.log('Starting to fetch all data...');
    setLoading(true);
    setError(null);
    
    try {
      const repos = await fetchRepositories();
      console.log('Repositories result:', repos);
      if (repos && repos.length > 0) {
        console.log('Fetching additional data for', repos.length, 'repositories');
        await Promise.all([
          fetchRecentCommits(repos),
          fetchOpenPRs(repos),
          fetchOpenIssues(repos),
          fetchUserActivity(),
          fetchCollaborators(repos),
        ]);
      } else {
        console.log('No repositories found or error occurred');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
      console.log('Data fetching completed');
    }
  }, [api, fetchRepositories, fetchRecentCommits, fetchOpenPRs, fetchOpenIssues, fetchUserActivity, fetchCollaborators]);

  // Fetch data on mount and when token changes
  useEffect(() => {
    if (token) {
      console.log('Token available, fetching data...');
      if (token === 'demo-token') {
        console.log('Using demo token, setting mock data');
        setLoading(false);
        setRepositories([
          {
            id: 1,
            name: "demo-repo",
            full_name: "demo-user/demo-repo",
            description: "Demo repository for testing",
            language: "TypeScript",
            stargazers_count: 5,
            forks_count: 2,
            updated_at: new Date().toISOString(),
            private: false,
            owner: {
              login: "demo-user",
              avatar_url: "https://github.com/github.png"
            }
          }
        ]);
        setDashboardStats({
          totalRepos: 1,
          totalCommits: 15,
          totalPRs: 3,
          totalIssues: 8,
          totalStars: 5,
          totalForks: 2,
        });
        setQuickStats({
          commitsToday: 3,
          activePRs: 2,
          starsEarned: 5,
          collaborators: 4,
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
              name: "demo-user/demo-repo"
            },
            created_at: new Date().toISOString(),
            payload: {
              commits: [{ message: "Update README" }]
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
              name: "demo-user/demo-repo"
            },
            created_at: new Date(Date.now() - 3600000).toISOString(),
            payload: {
              action: "opened"
            }
          }
        ]);
        
        // Set mock PRs and issues
        setOpenPRs([
          {
            id: 1,
            number: 1,
            title: "Add new feature",
            state: "open",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user: {
              login: "demo-user",
              avatar_url: "https://github.com/github.png"
            },
            head: { ref: "feature-branch" },
            base: { ref: "main" }
          }
        ]);
        
        setOpenIssues([
          {
            id: 1,
            number: 1,
            title: "Bug fix needed",
            state: "open",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user: {
              login: "demo-user",
              avatar_url: "https://github.com/github.png"
            },
            labels: [{ name: "bug", color: "d73a4a" }]
          }
        ]);
      } else {
        fetchAllData();
      }
    } else {
      console.log('No token available, not fetching data');
      setLoading(false);
    }
  }, [token, fetchAllData]);

  // Refresh data function
  const refreshData = useCallback(() => {
    fetchAllData();
  }, [fetchAllData]);

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