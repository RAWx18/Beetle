'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api, apiUtils } from '@/lib/api';
import { Repository, User, Activity, Metrics } from '@/types/hub';

/**
 * Hub data state interface
 */
interface HubDataState {
  // Repository data
  repository: Repository | null;
  repositories: Repository[];
  
  // User data
  user: User | null;
  dashboard: {
    repositories: Repository[];
    recentActivity: Activity[];
    quickStats: Metrics;
  } | null;
  
  // Quick actions
  quickActions: {
    canCreateBranch: boolean;
    canCreatePR: boolean;
    canManageIssues: boolean;
  } | null;
  
  // Loading states
  loading: {
    repository: boolean;
    repositories: boolean;
    dashboard: boolean;
    quickActions: boolean;
  };
  
  // Error states
  errors: {
    repository: string | null;
    repositories: string | null;
    dashboard: string | null;
    quickActions: string | null;
  };
  
  // Cache metadata
  lastUpdated: {
    repository: Date | null;
    repositories: Date | null;
    dashboard: Date | null;
    quickActions: Date | null;
  };
}

/**
 * Hub data hook options
 */
interface UseHubDataOptions {
  // Auto-fetch options
  autoFetchDashboard?: boolean;
  autoFetchRepository?: boolean;
  
  // Cache options
  cacheTimeout?: number; // in milliseconds
  enableCache?: boolean;
  
  // Retry options
  maxRetries?: number;
  retryDelay?: number;
  
  // Polling options
  enablePolling?: boolean;
  pollingInterval?: number;
  
  // Error handling
  onError?: (error: any, context: string) => void;
  onSuccess?: (data: any, context: string) => void;
}

/**
 * Hub data hook return type
 */
interface UseHubDataReturn {
  // State
  state: HubDataState;
  
  // Actions
  fetchRepository: (repositoryId: string, force?: boolean) => Promise<Repository | null>;
  fetchRepositories: (force?: boolean) => Promise<Repository[] | null>;
  fetchDashboard: (force?: boolean) => Promise<HubDataState['dashboard'] | null>;
  fetchQuickActions: (repositoryId: string, force?: boolean) => Promise<HubDataState['quickActions'] | null>;
  
  // Cache management
  clearCache: (type?: keyof HubDataState['lastUpdated']) => void;
  refreshAll: () => Promise<void>;
  
  // Utilities
  isStale: (type: keyof HubDataState['lastUpdated']) => boolean;
  hasError: (type?: keyof HubDataState['errors']) => boolean;
  isLoading: (type?: keyof HubDataState['loading']) => boolean;
}

/**
 * Default options
 */
const defaultOptions: Required<UseHubDataOptions> = {
  autoFetchDashboard: true,
  autoFetchRepository: false,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
  enableCache: true,
  maxRetries: 3,
  retryDelay: 1000,
  enablePolling: false,
  pollingInterval: 30000, // 30 seconds
  onError: () => {},
  onSuccess: () => {},
};

/**
 * Hub data management hook
 */
export const useHubData = (options: UseHubDataOptions = {}): UseHubDataReturn => {
  const opts = { ...defaultOptions, ...options };
  
  // State
  const [state, setState] = useState<HubDataState>({
    repository: null,
    repositories: [],
    user: null,
    dashboard: null,
    quickActions: null,
    loading: {
      repository: false,
      repositories: false,
      dashboard: false,
      quickActions: false,
    },
    errors: {
      repository: null,
      repositories: null,
      dashboard: null,
      quickActions: null,
    },
    lastUpdated: {
      repository: null,
      repositories: null,
      dashboard: null,
      quickActions: null,
    },
  });

  // Refs for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      abortControllerRef.current?.abort();
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  /**
   * Update loading state
   */
  const setLoading = useCallback((type: keyof HubDataState['loading'], loading: boolean) => {
    if (!mountedRef.current) return;
    
    setState(prev => ({
      ...prev,
      loading: {
        ...prev.loading,
        [type]: loading,
      },
    }));
  }, []);

  /**
   * Update error state
   */
  const setError = useCallback((type: keyof HubDataState['errors'], error: string | null) => {
    if (!mountedRef.current) return;
    
    setState(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [type]: error,
      },
    }));
  }, []);

  /**
   * Update data and metadata
   */
  const updateData = useCallback(<T>(
    type: keyof HubDataState,
    data: T,
    metadataKey: keyof HubDataState['lastUpdated']
  ) => {
    if (!mountedRef.current) return;
    
    setState(prev => ({
      ...prev,
      [type]: data,
      lastUpdated: {
        ...prev.lastUpdated,
        [metadataKey]: new Date(),
      },
    }));
  }, []);

  /**
   * Check if data is stale
   */
  const isStale = useCallback((type: keyof HubDataState['lastUpdated']): boolean => {
    if (!opts.enableCache) return true;
    
    const lastUpdated = state.lastUpdated[type];
    if (!lastUpdated) return true;
    
    return Date.now() - lastUpdated.getTime() > opts.cacheTimeout;
  }, [state.lastUpdated, opts.enableCache, opts.cacheTimeout]);

  /**
   * Check if there's an error
   */
  const hasError = useCallback((type?: keyof HubDataState['errors']): boolean => {
    if (type) {
      return state.errors[type] !== null;
    }
    return Object.values(state.errors).some(error => error !== null);
  }, [state.errors]);

  /**
   * Check if loading
   */
  const isLoading = useCallback((type?: keyof HubDataState['loading']): boolean => {
    if (type) {
      return state.loading[type];
    }
    return Object.values(state.loading).some(loading => loading);
  }, [state.loading]);

  /**
   * Generic API call wrapper with retry logic
   */
  const apiCall = useCallback(async <T>(
    apiFunction: () => Promise<T>,
    context: string,
    loadingKey: keyof HubDataState['loading'],
    errorKey: keyof HubDataState['errors']
  ): Promise<T | null> => {
    setLoading(loadingKey, true);
    setError(errorKey, null);

    let lastError: any;
    
    for (let attempt = 0; attempt < opts.maxRetries; attempt++) {
      try {
        const result = await apiFunction();
        opts.onSuccess(result, context);
        return result;
      } catch (error) {
        lastError = error;
        
        // Don't retry on client errors
        if (!apiUtils.isRetryableError(error)) {
          break;
        }
        
        // Wait before retrying
        if (attempt < opts.maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, opts.retryDelay * Math.pow(2, attempt)));
        }
      }
    }

    const errorMessage = apiUtils.formatErrorForUser(lastError);
    setError(errorKey, errorMessage);
    opts.onError(lastError, context);
    return null;
  }, [opts, setLoading, setError]);

  /**
   * Fetch repository data
   */
  const fetchRepository = useCallback(async (
    repositoryId: string, 
    force: boolean = false
  ): Promise<Repository | null> => {
    if (!force && !isStale('repository') && state.repository?.id === repositoryId) {
      return state.repository;
    }

    const result = await apiCall(
      () => api.hub.overview.getRepositoryOverview(repositoryId),
      'fetchRepository',
      'repository',
      'repository'
    );

    if (result) {
      updateData('repository', result, 'repository');
    }

    setLoading('repository', false);
    return result;
  }, [state.repository, isStale, apiCall, updateData, setLoading]);

  /**
   * Fetch repositories list
   */
  const fetchRepositories = useCallback(async (force: boolean = false): Promise<Repository[] | null> => {
    if (!force && !isStale('repositories') && state.repositories.length > 0) {
      return state.repositories;
    }

    const result = await apiCall(
      async () => {
        const dashboard = await api.hub.overview.getUserDashboard();
        return dashboard.repositories;
      },
      'fetchRepositories',
      'repositories',
      'repositories'
    );

    if (result) {
      updateData('repositories', result, 'repositories');
    }

    setLoading('repositories', false);
    return result;
  }, [state.repositories, isStale, apiCall, updateData, setLoading]);

  /**
   * Fetch dashboard data
   */
  const fetchDashboard = useCallback(async (force: boolean = false): Promise<HubDataState['dashboard'] | null> => {
    if (!force && !isStale('dashboard') && state.dashboard) {
      return state.dashboard;
    }

    const result = await apiCall(
      () => api.hub.overview.getUserDashboard(),
      'fetchDashboard',
      'dashboard',
      'dashboard'
    );

    if (result) {
      updateData('dashboard', result, 'dashboard');
      // Also update repositories from dashboard data
      updateData('repositories', result.repositories, 'repositories');
    }

    setLoading('dashboard', false);
    return result;
  }, [state.dashboard, isStale, apiCall, updateData, setLoading]);

  /**
   * Fetch quick actions
   */
  const fetchQuickActions = useCallback(async (
    repositoryId: string, 
    force: boolean = false
  ): Promise<HubDataState['quickActions'] | null> => {
    if (!force && !isStale('quickActions') && state.quickActions) {
      return state.quickActions;
    }

    const result = await apiCall(
      () => api.hub.overview.getQuickActions(repositoryId),
      'fetchQuickActions',
      'quickActions',
      'quickActions'
    );

    if (result) {
      updateData('quickActions', result, 'quickActions');
    }

    setLoading('quickActions', false);
    return result;
  }, [state.quickActions, isStale, apiCall, updateData, setLoading]);

  /**
   * Clear cache
   */
  const clearCache = useCallback((type?: keyof HubDataState['lastUpdated']) => {
    if (type) {
      setState(prev => ({
        ...prev,
        lastUpdated: {
          ...prev.lastUpdated,
          [type]: null,
        },
      }));
    } else {
      setState(prev => ({
        ...prev,
        lastUpdated: {
          repository: null,
          repositories: null,
          dashboard: null,
          quickActions: null,
        },
      }));
    }
  }, []);

  /**
   * Refresh all data
   */
  const refreshAll = useCallback(async () => {
    const promises: Promise<any>[] = [
      fetchDashboard(true),
      fetchRepositories(true),
    ];

    if (state.repository) {
      promises.push(fetchRepository(state.repository.id, true));
      promises.push(fetchQuickActions(state.repository.id, true));
    }

    await Promise.allSettled(promises);
  }, [state.repository, fetchDashboard, fetchRepositories, fetchRepository, fetchQuickActions]);

  /**
   * Auto-fetch dashboard on mount
   */
  useEffect(() => {
    if (opts.autoFetchDashboard) {
      fetchDashboard();
    }
  }, [opts.autoFetchDashboard, fetchDashboard]);

  /**
   * Set up polling if enabled
   */
  useEffect(() => {
    if (opts.enablePolling) {
      pollingIntervalRef.current = setInterval(() => {
        if (!isLoading()) {
          refreshAll();
        }
      }, opts.pollingInterval);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [opts.enablePolling, opts.pollingInterval, isLoading, refreshAll]);

  return {
    state,
    fetchRepository,
    fetchRepositories,
    fetchDashboard,
    fetchQuickActions,
    clearCache,
    refreshAll,
    isStale,
    hasError,
    isLoading,
  };
};

export default useHubData;