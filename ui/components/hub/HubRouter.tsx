'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useHubNavigation } from '@/lib/hooks/useHubNavigation';
import { useAuth } from '@/contexts/AuthContext';
import { useRepository } from '@/contexts/RepositoryContext';
import { useBranch } from '@/contexts/BranchContext';
import { HubView, HubState } from '@/types/hub';
import { ContributionNavigation } from '../contribution/ContributionNavigation';
import { HubNavigation } from './HubNavigation';
import { OverviewDashboard } from './overview/OverviewDashboard';
import AnimatedTransition from '@/components/AnimatedTransition';
import { Loader2 } from 'lucide-react';

interface HubRouterProps {
  className?: string;
  onError?: (error: Error) => void;
  onLoading?: (isLoading: boolean) => void;
  isContribution?: boolean;
  children: React.ReactNode;
}

export const HubRouter: React.FC<HubRouterProps> = ({
  className = '',
  onError,
  onLoading,
  isContribution = false,
  children,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated, user } = useAuth();
  const { repository, isRepositoryLoaded } = useRepository();
  const { selectedBranch } = useBranch();
  
  // Use navigation hook for enhanced routing
  const { navigationState, navigateToView, updateFilters } = useHubNavigation();

  // Hub state management
  const [hubState, setHubState] = useState<HubState>({
    currentView: navigationState.currentView,
    repository: undefined,
    user: undefined,
    filters: {
      projects: {},
      activity: {},
      insights: {}
    },
    loading: {},
    errors: {}
  });

  // Update hub state when context or navigation changes
  useEffect(() => {
    setHubState(prev => ({
      ...prev,
      currentView: navigationState.currentView,
      repository: repository || undefined,
      user: user || undefined
    }));
  }, [repository, user, navigationState.currentView]);

  // Handle view changes with enhanced navigation
  const handleViewChange = useCallback(async (view: HubView) => {
    if (view === hubState.currentView) return;

    onLoading?.(true);

    try {
      // Update state immediately for responsive UI
      setHubState(prev => ({
        ...prev,
        currentView: view,
        loading: {
          ...prev.loading,
          [view]: true
        }
      }));

      // Use enhanced navigation
      await navigateToView(view, { 
        preserveFilters: true, 
        transition: true 
      });

    } catch (error) {
      console.error('Navigation error:', error);
      onError?.(error as Error);
    } finally {
      onLoading?.(false);
      
      // Clear loading state for the view
      setHubState(prev => ({
        ...prev,
        loading: {
          ...prev.loading,
          [view]: false
        }
      }));
    }
  }, [hubState.currentView, navigateToView, onError, onLoading]);

  // Handle URL parameter changes (for deep linking and browser navigation)
  useEffect(() => {
    const view = searchParams.get('view') as HubView;
    const repositoryId = searchParams.get('repository');
    const branch = searchParams.get('branch');

    if (view && view !== hubState.currentView) {
      handleViewChange(view);
    }

    // Update filters from URL parameters
    const projectStatus = searchParams.get('project_status');
    const activityType = searchParams.get('activity_type');
    const insightsRange = searchParams.get('insights_range');

    if (projectStatus || activityType || insightsRange) {
      setHubState(prev => ({
        ...prev,
        filters: {
          projects: {
            ...prev.filters.projects,
            ...(projectStatus && { status: [projectStatus as any] })
          },
          activity: {
            ...prev.filters.activity,
            ...(activityType && { type: [activityType as any] })
          },
          insights: {
            ...prev.filters.insights,
            ...(insightsRange && { timeRange: insightsRange as any })
          }
        }
      }));
    }
  }, [searchParams, hubState.currentView, handleViewChange]);

  // Update URL when filters change (for shareable URLs)
  const updateUrlWithFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams);
    
    // Add current view
    params.set('view', hubState.currentView);
    
    // Add repository context
    if (repository) {
      params.set('repository', repository.full_name);
    }
    
    // Add branch context
    if (selectedBranch) {
      params.set('branch', selectedBranch);
    }

    // Add filters
    if (hubState.filters.projects.status?.length) {
      params.set('project_status', hubState.filters.projects.status[0]);
    }
    
    if (hubState.filters.activity.type?.length) {
      params.set('activity_type', hubState.filters.activity.type[0]);
    }
    
    if (hubState.filters.insights.timeRange) {
      params.set('insights_range', hubState.filters.insights.timeRange);
    }

    // Update URL without triggering navigation
    const newUrl = `${pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }, [hubState, repository, selectedBranch, pathname, searchParams]);

  // Handle errors from child components
  const handleError = useCallback((error: Error) => {
    console.error('Hub router error:', error);
    
    setHubState(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [hubState.currentView]: error.message
      }
    }));
    
    onError?.(error);
  }, [hubState.currentView, onError]);

  // Handle loading states from child components
  const handleLoadingChange = useCallback((view: AllViews, isLoading: boolean) => {
    setHubState(prev => ({
      ...prev,
      loading: {
        ...prev.loading,
        [view]: isLoading
      }
    }));
    
    onLoading?.(isLoading);
  }, [onLoading]);

  // Clear errors when view changes
  useEffect(() => {
    setHubState(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [hubState.currentView]: undefined
      }
    }));
  }, [hubState.currentView]);

  // Show loading state while contexts are initializing
  if (!isRepositoryLoaded || navigationState.isTransitioning) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading hub...</span>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    router.push('/');
    return null;
  }

  // Redirect if no repository selected
  if (!repository) {
    router.push('/contribution');
    return null;
  }

  return (
    <div className={`min-h-screen bg-background ${className}`}>
      {/* Navigation */}
      {isContribution ? (
        <ContributionNavigation
          currentView={hubState.currentView}
          onViewChange={handleViewChange}
          repository={repository}
          user={user}
        />
      ) : (
        <HubNavigation
          currentView={hubState.currentView}
          onViewChange={handleViewChange}
          repository={repository}
          user={user}
        />
      )}

      {/* Main Content Area */}
      <main className="container mx-auto px-4 py-8">
        <AnimatedTransition 
          show={!navigationState.isTransitioning} 
          animation="fade" 
          duration={300}
        >
          {children}
        </AnimatedTransition>
      </main>

      {/* Global Error Display */}
      {hubState.errors[hubState.currentView] && (
        <div className="fixed bottom-4 right-4 max-w-md">
          <div className="bg-destructive text-destructive-foreground p-4 rounded-lg shadow-lg">
            <h4 className="font-semibold mb-2">Error</h4>
            <p className="text-sm">{hubState.errors[hubState.currentView]}</p>
            <button
              onClick={() => setHubState(prev => ({
                ...prev,
                errors: { ...prev.errors, [hubState.currentView]: undefined }
              }))}
              className="mt-2 text-xs underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {hubState.loading[hubState.currentView] && (
        <div className="fixed inset-0 bg-background/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-background border rounded-lg p-6 shadow-lg">
            <div className="flex items-center space-x-3">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading {hubState.currentView}...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HubRouter;