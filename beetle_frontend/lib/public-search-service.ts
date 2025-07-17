// Public GitHub Search Service - For unauthenticated users on homepage
import { GitHubRepository, GitHubUser, GitHubOrganization, SearchResponse } from './search-service';

class PublicGitHubSearchService {
  private searchCache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  
  // GitHub's public API base URL
  private readonly GITHUB_API_BASE = 'https://api.github.com';

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

  // Make request to GitHub API
  private async makeRequest<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.GITHUB_API_BASE}${endpoint}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Beetle-App',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `GitHub API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Search repositories publicly
  async searchRepositories(
    query: string,
    sort: 'stars' | 'forks' | 'help-wanted-issues' | 'updated' = 'stars',
    order: 'desc' | 'asc' = 'desc',
    page: number = 1,
    per_page: number = 30
  ): Promise<SearchResponse<GitHubRepository>> {
    const cacheKey = `public_repos_${query}_${sort}_${order}_${page}_${per_page}`;
    
    // Check cache first
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const params = new URLSearchParams({
        q: query,
        sort,
        order,
        page: page.toString(),
        per_page: per_page.toString(),
      });

      const result = await this.makeRequest<SearchResponse<GitHubRepository>>(
        `/search/repositories?${params}`
      );
      
      // Cache the result
      this.setCachedResult(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('Error searching repositories:', error);
      throw error;
    }
  }

  // Search users publicly
  async searchUsers(
    query: string,
    sort: 'followers' | 'repositories' | 'joined' = 'followers',
    order: 'desc' | 'asc' = 'desc',
    page: number = 1,
    per_page: number = 30
  ): Promise<SearchResponse<GitHubUser>> {
    const cacheKey = `public_users_${query}_${sort}_${order}_${page}_${per_page}`;
    
    // Check cache first
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const params = new URLSearchParams({
        q: query,
        sort,
        order,
        page: page.toString(),
        per_page: per_page.toString(),
      });

      const result = await this.makeRequest<SearchResponse<GitHubUser>>(
        `/search/users?${params}`
      );
      
      // Cache the result
      this.setCachedResult(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }

  // Search organizations publicly
  async searchOrganizations(
    query: string,
    sort: 'repositories' | 'joined' = 'repositories',
    order: 'desc' | 'asc' = 'desc',
    page: number = 1,
    per_page: number = 30
  ): Promise<SearchResponse<GitHubOrganization>> {
    const cacheKey = `public_orgs_${query}_${sort}_${order}_${page}_${per_page}`;
    
    // Check cache first
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const params = new URLSearchParams({
        q: query,
        sort,
        order,
        page: page.toString(),
        per_page: per_page.toString(),
      });

      const result = await this.makeRequest<SearchResponse<GitHubOrganization>>(
        `/search/users?${params}+type:org`
      );
      
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
        repositories: repoResults.status === 'fulfilled' ? repoResults.value.items : [],
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
export const publicGitHubSearchService = new PublicGitHubSearchService();