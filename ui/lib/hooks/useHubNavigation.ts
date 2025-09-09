'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { HubView, HubState, AllViews } from '@/types/hub';

interface NavigationState {
  currentView: HubView;
  previousView: HubView | null;
  isTransitioning: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
}

interface UseHubNavigationReturn {
  navigationState: NavigationState;
  navigateToView: (view: HubView, options?: NavigationOptions) => Promise<void>;
  goBack: () => void;
  goForward: () => void;
  updateFilters: (filters: Partial<HubState['filters']>) => void;
  getShareableUrl: (view?: AllViews) => string;
}

interface NavigationOptions {
  replace?: boolean;
  preserveFilters?: boolean;
  transition?: boolean;
}

export const useHubNavigation = (): UseHubNavigationReturn => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [navigationState, setNavigationState] = useState<NavigationState>({
    currentView: 'overview',
    previousView: null,
    isTransitioning: false,
    canGoBack: false,
    canGoForward: false
  });

  const [navigationHistory, setNavigationHistory] = useState<HubView[]>(['overview']);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Determine current view from pathname
  const getCurrentViewFromPath = useCallback((): AllViews => {
    const pathSegments = pathname.split('/');
    const lastSegment = pathSegments[pathSegments.length - 1] as AllViews;
    
    // List of all valid views
    const validViews: AllViews[] = [
      'overview', 'projects', 'activity', 'insights', 
      'what', 'why', 'how', 'chat', 'contribute', 'import', 
      'manage', 'profile', 'search', 'settings'
    ];

    if (validViews.includes(lastSegment)) {
      return lastSegment;
    }
    
    if (lastSegment === 'contribution') {
      return 'what'; // Default to 'what' for /contribution
    }

    return 'overview'; // Default for /hub or any other case
  }, [pathname]);

  // Update navigation state when path changes
  useEffect(() => {
    const currentView = getCurrentViewFromPath();
    
    setNavigationState(prev => ({
      ...prev,
      previousView: prev.currentView !== currentView ? prev.currentView : prev.previousView,
      currentView,
      canGoBack: historyIndex > 0,
      canGoForward: historyIndex < navigationHistory.length - 1
    }));
  }, [pathname, getCurrentViewFromPath, historyIndex, navigationHistory.length]);

  // Navigate to a specific view
  const navigateToView = useCallback(async (
    view: HubView, 
    options: NavigationOptions = {}
  ): Promise<void> => {
    const { replace = false, preserveFilters = true, transition = true } = options;

    if (view === navigationState.currentView && !replace) {
      return;
    }

    if (transition) {
      setNavigationState(prev => ({ ...prev, isTransitioning: true }));
    }

    try {
      // Build URL with filters if preserving them
      const params = new URLSearchParams();
      
      if (preserveFilters) {
        // Copy existing search params
        searchParams.forEach((value, key) => {
          params.set(key, value);
        });
      }

      // Update view parameter
      params.set('view', view);

      const targetPath = `/contribution/${view}`;
      const fullUrl = params.toString() ? `${targetPath}?${params.toString()}` : targetPath;

      if (replace) {
        await router.replace(fullUrl);
      } else {
        await router.push(fullUrl);
        
        // Update navigation history
        setNavigationHistory(prev => {
          const newHistory = prev.slice(0, historyIndex + 1);
          newHistory.push(view);
          return newHistory;
        });
        
        setHistoryIndex(prev => prev + 1);
      }

      // Small delay for smooth transition
      if (transition) {
        await new Promise(resolve => setTimeout(resolve, 150));
      }

    } catch (error) {
      console.error('Navigation error:', error);
      throw error;
    } finally {
      if (transition) {
        setNavigationState(prev => ({ ...prev, isTransitioning: false }));
      }
    }
  }, [navigationState.currentView, router, searchParams, historyIndex]);

  // Go back in navigation history
  const goBack = useCallback(() => {
    if (historyIndex > 0) {
      const previousIndex = historyIndex - 1;
      const previousView = navigationHistory[previousIndex];
      
      setHistoryIndex(previousIndex);
      navigateToView(previousView, { replace: true, transition: true });
    }
  }, [historyIndex, navigationHistory, navigateToView]);

  // Go forward in navigation history
  const goForward = useCallback(() => {
    if (historyIndex < navigationHistory.length - 1) {
      const nextIndex = historyIndex + 1;
      const nextView = navigationHistory[nextIndex];
      
      setHistoryIndex(nextIndex);
      navigateToView(nextView, { replace: true, transition: true });
    }
  }, [historyIndex, navigationHistory, navigateToView]);

  // Update URL filters without navigation
  const updateFilters = useCallback((filters: Partial<HubState['filters']>) => {
    const params = new URLSearchParams(searchParams);
    
    // Update project filters
    if (filters.projects?.status?.length) {
      params.set('project_status', filters.projects.status[0]);
    } else {
      params.delete('project_status');
    }
    
    if (filters.projects?.search) {
      params.set('project_search', filters.projects.search);
    } else {
      params.delete('project_search');
    }
    
    // Update activity filters
    if (filters.activity?.type?.length) {
      params.set('activity_type', filters.activity.type[0]);
    } else {
      params.delete('activity_type');
    }
    
    if (filters.activity?.dateRange) {
      params.set('activity_start', filters.activity.dateRange.start.toISOString());
      params.set('activity_end', filters.activity.dateRange.end.toISOString());
    } else {
      params.delete('activity_start');
      params.delete('activity_end');
    }
    
    // Update insights filters
    if (filters.insights?.timeRange) {
      params.set('insights_range', filters.insights.timeRange);
    } else {
      params.delete('insights_range');
    }
    
    if (filters.insights?.metricType) {
      params.set('insights_metric', filters.insights.metricType);
    } else {
      params.delete('insights_metric');
    }

    // Update URL without navigation
    const newUrl = `${pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }, [pathname, searchParams]);

  // Get shareable URL for current or specified view
  const getShareableUrl = useCallback((view?: HubView): string => {
    const targetView = view || navigationState.currentView;
    const params = new URLSearchParams(searchParams);
    
    // Ensure view parameter is set
    params.set('view', targetView);
    
    const basePath = `/contribution/${targetView}`;
    const queryString = params.toString();
    
    return queryString ? `${basePath}?${queryString}` : basePath;
  }, [navigationState.currentView, searchParams]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const currentView = getCurrentViewFromPath();
      
      // Find the view in history or add it
      const viewIndex = navigationHistory.findIndex(view => view === currentView);
      
      if (viewIndex !== -1) {
        setHistoryIndex(viewIndex);
      } else {
        // Add to history if not found
        setNavigationHistory(prev => [...prev, currentView]);
        setHistoryIndex(navigationHistory.length);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [getCurrentViewFromPath, navigationHistory]);

  return {
    navigationState,
    navigateToView,
    goBack,
    goForward,
    updateFilters,
    getShareableUrl
  };
};;