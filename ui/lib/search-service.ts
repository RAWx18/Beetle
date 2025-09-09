// GitHub Search Service - Replaces hardcoded data with real API calls
import { apiService } from './api';

// Types for search results
export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  private: boolean;
  fork: boolean;
  language: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  updated_at: string;
  created_at: string;
  pushed_at: string;
  owner: {
    login: string;
    avatar_url: string;
    type: string;
  };
  topics: string[];
  license: any;
  archived: boolean;
  disabled: boolean;
  homepage: string;
  html_url: string;
  clone_url: string;
  ssh_url: string;
}

export interface GitHubUser {
  id: number;
  login: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: boolean;
  name: string;
  company: string;
  blog: string;
  location: string;
  email: string;
  hireable: boolean;
  bio: string;
  twitter_username: string;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

export interface GitHubOrganization {
  id: number;
  login: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: boolean;
  name: string;
  company: string;
  blog: string;
  location: string;
  email: string;
  hireable: boolean;
  bio: string;
  twitter_username: string;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

export interface SearchResponse<T> {
  total_count: number;
  incomplete_results: boolean;
  items: T[];
  query: string;
  pagination: {
    sort: string;
    order: string;
    page: number;
    per_page: number;
  };
}

class GitHubSearchService {
  private searchCache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Helper method to check cache
  private getCachedResult(key: string): any | null {
    const cached = this.searchCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    if (cached) {
      this.searchCache.delete(key); // Remove expired cache
    }
    return null;
  }

  // Helper method to set cache
  private setCachedResult(key: string, data: any): void {
    this.searchCache.set(key, { data, timestamp: Date.now() });
  }

  // Search repositories
  async searchRepositories(
    query: string,
    sort: 'stars' | 'forks' | 'help-wanted-issues' | 'updated' = 'stars',
    order: 'desc' | 'asc' = 'desc',
    page: number = 1,
    per_page: number = 30
  ): Promise<SearchResponse<GitHubRepository>> {
    const cacheKey = `repos_${query}_${sort}_${order}_${page}_${per_page}`;
    
    // Check cache first
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await apiService.searchRepositories(query, sort, order, page);
      
      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data!;
      
      // Cache the result
      this.setCachedResult(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('Error searching repositories:', error);
      throw error;
    }
  }

  // Helper for fetch with timeout
  async fetchWithTimeout(resource: RequestInfo, options: RequestInit = {}, timeout = 7000): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(resource, { ...options, signal: controller.signal });
      clearTimeout(id);
      return response;
    } catch (err: any) {
      clearTimeout(id);
      if (err && err.name === 'AbortError') {
        throw new Error('Request timed out. The server may be slow or unresponsive.');
      }
      throw err;
    }
  }

  // Search users
  async searchUsers(
    query: string,
    sort: 'followers' | 'repositories' | 'joined' = 'followers',
    order: 'desc' | 'asc' = 'desc',
    page: number = 1,
    per_page: number = 30
  ): Promise<SearchResponse<GitHubUser>> {
    const cacheKey = `users_${query}_${sort}_${order}_${page}_${per_page}`;
    
    // Check cache first
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Make request to our new backend endpoint with timeout
      const response = await this.fetchWithTimeout(
        `http://localhost:8000/api/github/search/users?q=${encodeURIComponent(query)}&sort=${sort}&order=${order}&page=${page}&per_page=${per_page}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('beetle_token')}`,
            'Content-Type': 'application/json',
          },
        },
        7000
      );

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      // Cache the result
      this.setCachedResult(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }

  // Search organizations
  async searchOrganizations(
    query: string,
    sort: 'repositories' | 'joined' = 'repositories',
    order: 'desc' | 'asc' = 'desc',
    page: number = 1,
    per_page: number = 30
  ): Promise<SearchResponse<GitHubOrganization>> {
    const cacheKey = `orgs_${query}_${sort}_${order}_${page}_${per_page}`;
    
    // Check cache first
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Make request to our new backend endpoint with timeout
      const response = await this.fetchWithTimeout(
        `http://localhost:8000/api/github/search/organizations?q=${encodeURIComponent(query)}&sort=${sort}&order=${order}&page=${page}&per_page=${per_page}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('beetle_token')}`,
            'Content-Type': 'application/json',
          },
        },
        7000
      );

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      // Cache the result
      this.setCachedResult(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('Error searching organizations:', error);
      throw error;
    }
  }

  // Combined search for all types
  async searchAll(
    query: string,
    page: number = 1,
    per_page: number = 10
  ): Promise<{
    repositories: GitHubRepository[];
    users: GitHubUser[];
    organizations: GitHubOrganization[];
  }> {
    try {
      // Perform all searches in parallel with reduced per_page for combined results
      const [repoResults, userResults, orgResults] = await Promise.allSettled([
        this.searchRepositories(query, 'stars', 'desc', page, per_page),
        this.searchUsers(query, 'followers', 'desc', page, per_page),
        this.searchOrganizations(query, 'repositories', 'desc', page, per_page),
      ]);

      return {
        repositories: userResults.status === 'rejected' && userResults.reason?.message?.includes('timed out') ? [] : (repoResults.status === 'fulfilled' ? repoResults.value.items : []),
        users: userResults.status === 'fulfilled' ? userResults.value.items : [],
        organizations: orgResults.status === 'fulfilled' ? orgResults.value.items : [],
      };
    } catch (error) {
      console.error('Error in combined search:', error);
      return {
        repositories: [],
        users: [],
        organizations: [],
      };
    }
  }

  // Clear cache
  clearCache(): void {
    this.searchCache.clear();
  }
}

// Export singleton instance
export const githubSearchService = new GitHubSearchService();