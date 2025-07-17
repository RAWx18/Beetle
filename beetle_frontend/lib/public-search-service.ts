// Public GitHub Search Service - For unauthenticated users on homepage
import { GitHubRepository, GitHubUser, GitHubOrganization, SearchResponse } from './search-service';

class PublicGitHubSearchService {
  private searchCache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  
  // Use backend API for search to avoid CORS issues
  private readonly BACKEND_API_BASE = '/api/github/public';

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

  // Make request to backend API (which will handle GitHub API calls)
  private async makeRequest<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${this.BACKEND_API_BASE}${endpoint}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Backend API error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Search repositories publicly via backend
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
      // Return fallback data for repositories
      return this.getFallbackRepositoryResults(query);
    }
  }

  // Search users publicly via backend
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
      // Return fallback data for users
      return this.getFallbackUserResults(query);
    }
  }

  // Search organizations publicly via backend
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
        `/search/organizations?${params}`
      );
      
      // Cache the result
      this.setCachedResult(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('Error searching organizations:', error);
      // Return fallback data for organizations
      return this.getFallbackOrganizationResults(query);
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
      // Return fallback data for all types
      return {
        repositories: this.getFallbackRepositoryResults(query).items,
        users: this.getFallbackUserResults(query).items,
        organizations: this.getFallbackOrganizationResults(query).items,
      };
    }
  }

  // Fallback repository results for when API is unavailable
  private getFallbackRepositoryResults(query: string): SearchResponse<GitHubRepository> {
    const fallbackRepos: GitHubRepository[] = [
      {
        id: 41881900,
        name: `${query}-example`,
        full_name: `example/${query}-example`,
        owner: {
          login: 'example',
          id: 1,
          avatar_url: 'https://github.com/github.png',
          type: 'Organization',
          html_url: 'https://github.com/example'
        },
        private: false,
        html_url: `https://github.com/example/${query}-example`,
        description: `Example repository for ${query}. Sign in to GitHub to see real search results.`,
        fork: false,
        url: `https://api.github.com/repos/example/${query}-example`,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        pushed_at: '2024-01-01T00:00:00Z',
        clone_url: `https://github.com/example/${query}-example.git`,
        stargazers_count: 1000,
        watchers_count: 1000,
        language: 'JavaScript',
        forks_count: 200,
        archived: false,
        disabled: false,
        open_issues_count: 5,
        license: { key: 'mit', name: 'MIT License' },
        allow_forking: true,
        default_branch: 'main',
        score: 1.0
      }
    ].filter(repo => repo.name.toLowerCase().includes(query.toLowerCase()) || 
                     repo.description?.toLowerCase().includes(query.toLowerCase()));

    return {
      total_count: fallbackRepos.length,
      incomplete_results: false,
      items: fallbackRepos.slice(0, 5)
    };
  }

  // Fallback user results for when API is unavailable
  private getFallbackUserResults(query: string): SearchResponse<GitHubUser> {
    const fallbackUsers: GitHubUser[] = [
      {
        login: `${query.toLowerCase()}user`,
        id: 1,
        avatar_url: 'https://github.com/github.png',
        html_url: `https://github.com/${query.toLowerCase()}user`,
        type: 'User',
        name: `${query} User`,
        company: 'Example Company',
        blog: '',
        location: 'San Francisco',
        email: null,
        bio: `Example user for ${query}. Sign in to GitHub to see real search results.`,
        public_repos: 10,
        public_gists: 5,
        followers: 100,
        following: 50,
        created_at: '2020-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        score: 1.0
      }
    ].filter(user => user.login.toLowerCase().includes(query.toLowerCase()) || 
                     user.name?.toLowerCase().includes(query.toLowerCase()));

    return {
      total_count: fallbackUsers.length,
      incomplete_results: false,
      items: fallbackUsers.slice(0, 3)
    };
  }

  // Fallback organization results for when API is unavailable
  private getFallbackOrganizationResults(query: string): SearchResponse<GitHubOrganization> {
    const fallbackOrgs: GitHubOrganization[] = [
      {
        login: `${query.toLowerCase()}org`,
        id: 2,
        avatar_url: 'https://github.com/github.png',
        html_url: `https://github.com/${query.toLowerCase()}org`,
        type: 'Organization',
        name: `${query} Organization`,
        company: null,
        blog: '',
        location: 'Global',
        email: null,
        bio: `Example organization for ${query}. Sign in to GitHub to see real search results.`,
        public_repos: 25,
        public_gists: 0,
        followers: 500,
        following: 0,
        created_at: '2018-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        score: 1.0
      }
    ].filter(org => org.login.toLowerCase().includes(query.toLowerCase()) || 
                    org.name?.toLowerCase().includes(query.toLowerCase()));

    return {
      total_count: fallbackOrgs.length,
      incomplete_results: false,
      items: fallbackOrgs.slice(0, 2)
    };
  }

  // Clear cache
  clearCache(): void {
    this.searchCache.clear();
  }
}

// Export singleton instance
export const publicGitHubSearchService = new PublicGitHubSearchService();