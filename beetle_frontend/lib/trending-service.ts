// Trending repositories service - Fetches popular GitHub repositories
import { publicGitHubSearchService } from './public-search-service';
import { GitHubRepository } from './search-service';

export interface TrendingRepository {
  name: string;
  description: string | null;
  languages: string[];
  stars: string;
  forks: string;
  updated: string;
  html_url: string;
  owner: {
    login: string;
    avatar_url: string;
  };
}

class TrendingService {
  private trendingCache = new Map<string, { data: TrendingRepository[]; timestamp: number }>();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes cache for trending

  // Helper method to format numbers (e.g., 1234 -> "1.2k")
  private formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return num.toString();
  }

  // Helper method to format relative time
  private formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  // Convert GitHub repository to our trending format
  private convertToTrendingRepo(repo: GitHubRepository): TrendingRepository {
    return {
      name: repo.full_name,
      description: repo.description,
      languages: repo.language ? [repo.language] : [],
      stars: this.formatNumber(repo.stargazers_count),
      forks: this.formatNumber(repo.forks_count),
      updated: this.formatRelativeTime(repo.updated_at),
      html_url: repo.html_url,
      owner: {
        login: repo.owner.login,
        avatar_url: repo.owner.avatar_url,
      },
    };
  }

  // Check cache
  private getCachedTrending(cacheKey: string): TrendingRepository[] | null {
    const cached = this.trendingCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    if (cached) {
      this.trendingCache.delete(cacheKey);
    }
    return null;
  }

  // Set cache
  private setCachedTrending(cacheKey: string, data: TrendingRepository[]): void {
    this.trendingCache.set(cacheKey, { data, timestamp: Date.now() });
  }

  // Get trending repositories (defaults to last week's popular repos)
  async getTrendingRepositories(
    language?: string, 
    timeframe: 'daily' | 'weekly' | 'monthly' = 'weekly',
    count: number = 30
  ): Promise<TrendingRepository[]> {
    const cacheKey = `trending_${language || 'all'}_${timeframe}_${count}`;
    
    // Check cache first
    const cached = this.getCachedTrending(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Calculate date range based on timeframe
      const now = new Date();
      let daysBack = 7; // default weekly
      if (timeframe === 'daily') daysBack = 1;
      if (timeframe === 'monthly') daysBack = 30;
      
      const fromDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
      const dateStr = fromDate.toISOString().split('T')[0]; // YYYY-MM-DD format

      // Build search query for trending repositories
      let query = `created:>${dateStr} stars:>100`;
      if (language) {
        query += ` language:${language}`;
      }

      // Search for repositories created recently with high star count
      const response = await publicGitHubSearchService.searchRepositories(
        query,
        'stars',
        'desc',
        1,
        Math.min(count, 100) // GitHub API limits to 100 per page
      );

      const trendingRepos = response.items.map(repo => this.convertToTrendingRepo(repo));
      
      // Cache the results
      this.setCachedTrending(cacheKey, trendingRepos);
      
      return trendingRepos;
    } catch (error) {
      console.error('Error fetching trending repositories:', error);
      
      // Return fallback data if API fails
      return this.getFallbackTrendingRepos();
    }
  }

  // Get popular repositories by language
  async getPopularByLanguage(language: string, count: number = 10): Promise<TrendingRepository[]> {
    try {
      const query = `language:${language} stars:>1000`;
      
      const response = await publicGitHubSearchService.searchRepositories(
        query,
        'stars',
        'desc',
        1,
        Math.min(count, 100)
      );

      return response.items.map(repo => this.convertToTrendingRepo(repo));
    } catch (error) {
      console.error(`Error fetching popular ${language} repositories:`, error);
      return [];
    }
  }

  // Fallback trending repositories if API fails
  private getFallbackTrendingRepos(): TrendingRepository[] {
    return [
      {
        name: "microsoft/vscode",
        description: "Visual Studio Code - Open source code editor",
        languages: ["TypeScript", "JavaScript", "CSS"],
        stars: "155k",
        forks: "27k",
        updated: "2 hours ago",
        html_url: "https://github.com/microsoft/vscode",
        owner: {
          login: "microsoft",
          avatar_url: "https://github.com/microsoft.png",
        },
      },
      {
        name: "vercel/next.js",
        description: "The React Framework for the Web",
        languages: ["TypeScript", "JavaScript", "MDX"],
        stars: "120k",
        forks: "26k",
        updated: "1 hour ago",
        html_url: "https://github.com/vercel/next.js",
        owner: {
          login: "vercel",
          avatar_url: "https://github.com/vercel.png",
        },
      },
      {
        name: "facebook/react",
        description: "The library for web and native user interfaces",
        languages: ["JavaScript", "TypeScript"],
        stars: "220k",
        forks: "45k",
        updated: "3 hours ago",
        html_url: "https://github.com/facebook/react",
        owner: {
          login: "facebook",
          avatar_url: "https://github.com/facebook.png",
        },
      },
    ];
  }

  // Clear cache
  clearCache(): void {
    this.trendingCache.clear();
  }
}

// Export singleton instance
export const trendingService = new TrendingService();