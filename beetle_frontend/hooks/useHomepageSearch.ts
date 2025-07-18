import { useState, useEffect, useCallback } from 'react';
import { publicGitHubSearchService } from '@/lib/public-search-service';
import { GitHubRepository, GitHubUser, GitHubOrganization } from '@/lib/search-service';
import { trendingService, TrendingRepository } from '@/lib/trending-service';
import { useDebounce } from './useDebounce';

export interface SearchResults {
  repositories: GitHubRepository[];
  users: GitHubUser[];
  organizations: GitHubOrganization[];
}

export interface UseHomepageSearchReturn {
  // Search state
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: SearchResults | null;
  isSearching: boolean;
  searchError: string | null;
  
  // Trending state
  trendingRepos: TrendingRepository[];
  isTrendingLoading: boolean;
  trendingError: string | null;
  
  // Functions
  performSearch: (query: string) => Promise<void>;
  clearSearch: () => void;
  refreshTrending: () => Promise<void>;
}

export function useHomepageSearch(): UseHomepageSearchReturn {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  const [trendingRepos, setTrendingRepos] = useState<TrendingRepository[]>([]);
  const [isTrendingLoading, setIsTrendingLoading] = useState(true);
  const [trendingError, setTrendingError] = useState<string | null>(null);

  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Load trending repositories on mount
  const loadTrendingRepos = useCallback(async () => {
    try {
      setIsTrendingLoading(true);
      setTrendingError(null);
      
      const trending = await trendingService.getTrendingRepositories('', 'weekly', 30);
      setTrendingRepos(trending);
    } catch (error) {
      console.error('Error loading trending repositories:', error);
      setTrendingError('Failed to load trending repositories');
      
      // Use fallback data
      setTrendingRepos([]);
    } finally {
      setIsTrendingLoading(false);
    }
  }, []);

  // Perform search
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults(null);
      setSearchError(null);
      return;
    }

    try {
      setIsSearching(true);
      setSearchError(null);

      const results = await publicGitHubSearchService.searchAll(query, 1, 5); // Get 5 results per category for preview
      
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchError(error instanceof Error ? error.message : 'Search failed');
      setSearchResults(null);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Auto-search when debounced query changes
  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      performSearch(debouncedSearchQuery);
    } else {
      setSearchResults(null);
      setSearchError(null);
    }
  }, [debouncedSearchQuery, performSearch]);

  // Load trending repos on mount
  useEffect(() => {
    loadTrendingRepos();
  }, [loadTrendingRepos]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults(null);
    setSearchError(null);
  }, []);

  const refreshTrending = useCallback(async () => {
    // Clear cache and reload
    trendingService.clearCache();
    await loadTrendingRepos();
  }, [loadTrendingRepos]);

  return {
    // Search state
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    searchError,
    
    // Trending state
    trendingRepos,
    isTrendingLoading,
    trendingError,
    
    // Functions
    performSearch,
    clearSearch,
    refreshTrending,
  };
}