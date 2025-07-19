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

  // Utility function for exact word matching (case-insensitive)
  private isExactMatch(searchQuery: string, targetString: string): boolean {
    if (!searchQuery || !targetString) return false;
    
    const query = searchQuery.toLowerCase().trim();
    const target = targetString.toLowerCase().trim();
    
    // Check for exact match of the full string
    if (target === query) return true;
    
    // Check for exact word match within the string
    const words = target.split(/\s+|[-._]/); // Split on spaces, hyphens, dots, underscores
    return words.some(word => word === query);
  }

  // Fallback repository results for when API is unavailable
  private getFallbackRepositoryResults(query: string): SearchResponse<GitHubRepository> {
    const fallbackRepos: GitHubRepository[] = [
      {
        id: 1,
        name: "next.js",
        full_name: "vercel/next.js",
        owner: {
          login: 'vercel',
          id: 1,
          avatar_url: 'https://github.com/vercel.png',
          type: 'Organization',
          html_url: 'https://github.com/vercel'
        },
        private: false,
        html_url: "https://github.com/vercel/next.js",
        description: "The React Framework for the Web. Used by some of the world's largest companies, Next.js enables you to create full-stack web applications.",
        fork: false,
        url: "https://api.github.com/repos/vercel/next.js",
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        pushed_at: '2024-01-01T00:00:00Z',
        clone_url: "https://github.com/vercel/next.js.git",
        stargazers_count: 120000,
        watchers_count: 120000,
        language: 'TypeScript',
        forks_count: 26000,
        archived: false,
        disabled: false,
        open_issues_count: 1200,
        license: { key: 'mit', name: 'MIT License' },
        allow_forking: true,
        default_branch: 'main',
        score: 1.0
      },
      {
        id: 2,
        name: "react",
        full_name: "facebook/react",
        owner: {
          login: 'facebook',
          id: 2,
          avatar_url: 'https://github.com/facebook.png',
          type: 'Organization',
          html_url: 'https://github.com/facebook'
        },
        private: false,
        html_url: "https://github.com/facebook/react",
        description: "The library for web and native user interfaces",
        fork: false,
        url: "https://api.github.com/repos/facebook/react",
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        pushed_at: '2024-01-01T00:00:00Z',
        clone_url: "https://github.com/facebook/react.git",
        stargazers_count: 220000,
        watchers_count: 220000,
        language: 'JavaScript',
        forks_count: 45000,
        archived: false,
        disabled: false,
        open_issues_count: 800,
        license: { key: 'mit', name: 'MIT License' },
        allow_forking: true,
        default_branch: 'main',
        score: 1.0
      },
      {
        id: 3,
        name: "beetle",
        full_name: "RAWx18/beetle",
        owner: {
          login: 'RAWx18',
          id: 3,
          avatar_url: 'https://github.com/RAWx18.png',
          type: 'User',
          html_url: 'https://github.com/RAWx18'
        },
        private: false,
        html_url: "https://github.com/RAWx18/beetle",
        description: "The Next-Generation Git Collaboration Platform with AI-Powered Branch Intelligence",
        fork: false,
        url: "https://api.github.com/repos/RAWx18/beetle",
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        pushed_at: '2024-01-01T00:00:00Z',
        clone_url: "https://github.com/RAWx18/beetle.git",
        stargazers_count: 4,
        watchers_count: 4,
        language: 'TypeScript',
        forks_count: 1,
        archived: false,
        disabled: false,
        open_issues_count: 2,
        license: { key: 'mit', name: 'MIT License' },
        allow_forking: true,
        default_branch: 'main',
        score: 1.0
      }
    ];

    // Filter for exact matches only
    const exactMatches = fallbackRepos.filter(repo =>
      this.isExactMatch(query, repo.name) ||
      this.isExactMatch(query, repo.full_name) ||
      this.isExactMatch(query, repo.owner.login)
    );

    return {
      total_count: exactMatches.length,
      incomplete_results: false,
      items: exactMatches.slice(0, 5)
    };
  }

  // Fallback user results for when API is unavailable
  private getFallbackUserResults(query: string): SearchResponse<GitHubUser> {
    const fallbackUsers: GitHubUser[] = [
      {
        login: "vercel",
        id: 1,
        avatar_url: 'https://github.com/vercel.png',
        gravatar_id: '',
        url: 'https://api.github.com/users/vercel',
        html_url: "https://github.com/vercel",
        followers_url: 'https://api.github.com/users/vercel/followers',
        following_url: 'https://api.github.com/users/vercel/following{/other_user}',
        gists_url: 'https://api.github.com/users/vercel/gists{/gist_id}',
        starred_url: 'https://api.github.com/users/vercel/starred{/owner}{/repo}',
        subscriptions_url: 'https://api.github.com/users/vercel/subscriptions',
        organizations_url: 'https://api.github.com/users/vercel/orgs',
        repos_url: 'https://api.github.com/users/vercel/repos',
        events_url: 'https://api.github.com/users/vercel/events{/privacy}',
        received_events_url: 'https://api.github.com/users/vercel/received_events',
        type: 'Organization',
        site_admin: false,
        name: "Vercel",
        company: 'Vercel Inc.',
        blog: 'https://vercel.com',
        location: 'San Francisco',
        email: null,
        hireable: null,
        bio: "Develop. Preview. Ship. For the best frontend teams – https://vercel.com",
        twitter_username: 'vercel',
        public_repos: 150,
        public_gists: 0,
        followers: 5000,
        following: 50,
        created_at: '2020-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        login: "facebook",
        id: 2,
        avatar_url: 'https://github.com/facebook.png',
        gravatar_id: '',
        url: 'https://api.github.com/users/facebook',
        html_url: "https://github.com/facebook",
        followers_url: 'https://api.github.com/users/facebook/followers',
        following_url: 'https://api.github.com/users/facebook/following{/other_user}',
        gists_url: 'https://api.github.com/users/facebook/gists{/gist_id}',
        starred_url: 'https://api.github.com/users/facebook/starred{/owner}{/repo}',
        subscriptions_url: 'https://api.github.com/users/facebook/subscriptions',
        organizations_url: 'https://api.github.com/users/facebook/orgs',
        repos_url: 'https://api.github.com/users/facebook/repos',
        events_url: 'https://api.github.com/users/facebook/events{/privacy}',
        received_events_url: 'https://api.github.com/users/facebook/received_events',
        type: 'Organization',
        site_admin: false,
        name: "Facebook",
        company: 'Meta',
        blog: 'https://engineering.fb.com',
        location: 'Menlo Park, CA',
        email: null,
        hireable: null,
        bio: "We are working to build community through open source technology.",
        twitter_username: 'facebook',
        public_repos: 200,
        public_gists: 0,
        followers: 15000,
        following: 0,
        created_at: '2009-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        login: "RAWx18",
        id: 3,
        avatar_url: 'https://github.com/RAWx18.png',
        gravatar_id: '',
        url: 'https://api.github.com/users/RAWx18',
        html_url: "https://github.com/RAWx18",
        followers_url: 'https://api.github.com/users/RAWx18/followers',
        following_url: 'https://api.github.com/users/RAWx18/following{/other_user}',
        gists_url: 'https://api.github.com/users/RAWx18/gists{/gist_id}',
        starred_url: 'https://api.github.com/users/RAWx18/starred{/owner}{/repo}',
        subscriptions_url: 'https://api.github.com/users/RAWx18/subscriptions',
        organizations_url: 'https://api.github.com/users/RAWx18/orgs',
        repos_url: 'https://api.github.com/users/RAWx18/repos',
        events_url: 'https://api.github.com/users/RAWx18/events{/privacy}',
        received_events_url: 'https://api.github.com/users/RAWx18/received_events',
        type: 'User',
        site_admin: false,
        name: "RAWx18",
        company: null,
        blog: '',
        location: null,
        email: null,
        hireable: null,
        bio: "Developer focused on open source collaboration tools",
        twitter_username: 'RAWx18_dev',
        public_repos: 10,
        public_gists: 2,
        followers: 50,
        following: 100,
        created_at: '2022-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ];

    // Filter for exact matches only
    const exactMatches = fallbackUsers.filter(user =>
      this.isExactMatch(query, user.login) ||
      this.isExactMatch(query, user.name || '')
    );

    return {
      total_count: exactMatches.length,
      incomplete_results: false,
      items: exactMatches.slice(0, 3)
    };
  }

  // Fallback organization results for when API is unavailable
  private getFallbackOrganizationResults(query: string): SearchResponse<GitHubOrganization> {
    const fallbackOrgs: GitHubOrganization[] = [
      {
        login: "vercel",
        id: 1,
        avatar_url: 'https://github.com/vercel.png',
        gravatar_id: '',
        url: 'https://api.github.com/orgs/vercel',
        html_url: "https://github.com/vercel",
        followers_url: 'https://api.github.com/orgs/vercel/followers',
        following_url: 'https://api.github.com/orgs/vercel/following{/other_user}',
        gists_url: 'https://api.github.com/orgs/vercel/gists{/gist_id}',
        starred_url: 'https://api.github.com/orgs/vercel/starred{/owner}{/repo}',
        subscriptions_url: 'https://api.github.com/orgs/vercel/subscriptions',
        organizations_url: 'https://api.github.com/orgs/vercel/orgs',
        repos_url: 'https://api.github.com/orgs/vercel/repos',
        events_url: 'https://api.github.com/orgs/vercel/events{/privacy}',
        received_events_url: 'https://api.github.com/orgs/vercel/received_events',
        type: 'Organization',
        site_admin: false,
        name: "Vercel",
        company: null,
        blog: 'https://vercel.com',
        location: 'Global',
        email: null,
        hireable: null,
        bio: "Develop. Preview. Ship. For the best frontend teams",
        twitter_username: 'vercel',
        public_repos: 150,
        public_gists: 0,
        followers: 5000,
        following: 0,
        created_at: '2018-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        login: "microsoft",
        id: 2,
        avatar_url: 'https://github.com/microsoft.png',
        gravatar_id: '',
        url: 'https://api.github.com/orgs/microsoft',
        html_url: "https://github.com/microsoft",
        followers_url: 'https://api.github.com/orgs/microsoft/followers',
        following_url: 'https://api.github.com/orgs/microsoft/following{/other_user}',
        gists_url: 'https://api.github.com/orgs/microsoft/gists{/gist_id}',
        starred_url: 'https://api.github.com/orgs/microsoft/starred{/owner}{/repo}',
        subscriptions_url: 'https://api.github.com/orgs/microsoft/subscriptions',
        organizations_url: 'https://api.github.com/orgs/microsoft/orgs',
        repos_url: 'https://api.github.com/orgs/microsoft/repos',
        events_url: 'https://api.github.com/orgs/microsoft/events{/privacy}',
        received_events_url: 'https://api.github.com/orgs/microsoft/received_events',
        type: 'Organization',
        site_admin: false,
        name: "Microsoft",
        company: null,
        blog: 'https://opensource.microsoft.com',
        location: 'Redmond, WA',
        email: null,
        hireable: null,
        bio: "Open source projects and samples from Microsoft",
        twitter_username: 'microsoft',
        public_repos: 4500,
        public_gists: 0,
        followers: 25000,
        following: 0,
        created_at: '2014-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        login: "facebook",
        id: 3,
        avatar_url: 'https://github.com/facebook.png',
        gravatar_id: '',
        url: 'https://api.github.com/orgs/facebook',
        html_url: "https://github.com/facebook",
        followers_url: 'https://api.github.com/orgs/facebook/followers',
        following_url: 'https://api.github.com/orgs/facebook/following{/other_user}',
        gists_url: 'https://api.github.com/orgs/facebook/gists{/gist_id}',
        starred_url: 'https://api.github.com/orgs/facebook/starred{/owner}{/repo}',
        subscriptions_url: 'https://api.github.com/orgs/facebook/subscriptions',
        organizations_url: 'https://api.github.com/orgs/facebook/orgs',
        repos_url: 'https://api.github.com/orgs/facebook/repos',
        events_url: 'https://api.github.com/orgs/facebook/events{/privacy}',
        received_events_url: 'https://api.github.com/orgs/facebook/received_events',
        type: 'Organization',
        site_admin: false,
        name: "Facebook",
        company: null,
        blog: 'https://engineering.fb.com',
        location: 'Menlo Park, CA',
        email: null,
        hireable: null,
        bio: "We are working to build community through open source technology.",
        twitter_username: 'facebook',
        public_repos: 200,
        public_gists: 0,
        followers: 15000,
        following: 0,
        created_at: '2009-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ];

    // Filter for exact matches only
    const exactMatches = fallbackOrgs.filter(org =>
      this.isExactMatch(query, org.login) ||
      this.isExactMatch(query, org.name || '')
    );

    return {
      total_count: exactMatches.length,
      incomplete_results: false,
      items: exactMatches.slice(0, 2)
    };
  }

  // Clear cache
  clearCache(): void {
    this.searchCache.clear();
  }
}

// Export singleton instance
export const publicGitHubSearchService = new PublicGitHubSearchService();