'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api, apiUtils } from '@/lib/api';
import { Project, User } from '@/types/hub';

/**
 * Project filters interface
 */
interface ProjectFilters {
  status?: 'active' | 'completed' | 'archived' | 'on-hold';
  search?: string;
  sortBy?: 'name' | 'created_at' | 'updated_at' | 'status';
  sortOrder?: 'asc' | 'desc';
  repositoryId?: string;
  ownerId?: string;
  tags?: string[];
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

/**
 * Projects data state interface
 */
interface ProjectsDataState {
  // Projects data
  projects: Project[];
  currentProject: Project | null;
  
  // Team data
  teamMembers: Array<User & { role: string; joinedAt: string; permissions: string[] }>;
  
  // Analytics data
  analytics: {
    progress: {
      completedTasks: number;
      totalTasks: number;
      completionRate: number;
    };
    activity: {
      commits: number;
      pullRequests: number;
      issues: number;
      codeReviews: number;
    };
    team: {
      activeMembers: number;
      totalMembers: number;
      contributionDistribution: Record<string, number>;
    };
    timeline: Array<{
      date: string;
      commits: number;
      pullRequests: number;
      issues: number;
    }>;
  } | null;
  
  // Templates data
  templates: Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    tags: string[];
    defaultSettings: Record<string, any>;
  }>;
  
  // Pagination data
  pagination: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    hasMore: boolean;
  };
  
  // Filters
  filters: ProjectFilters;
  
  // Loading states
  loading: {
    projects: boolean;
    currentProject: boolean;
    teamMembers: boolean;
    analytics: boolean;
    templates: boolean;
    creating: boolean;
    updating: boolean;
    deleting: boolean;
  };
  
  // Error states
  errors: {
    projects: string | null;
    currentProject: string | null;
    teamMembers: string | null;
    analytics: string | null;
    templates: string | null;
    creating: string | null;
    updating: string | null;
    deleting: string | null;
  };
  
  // Cache metadata
  lastUpdated: {
    projects: Date | null;
    currentProject: Date | null;
    teamMembers: Date | null;
    analytics: Date | null;
    templates: Date | null;
  };
}

/**
 * Projects hook options
 */
interface UseProjectsOptions {
  // Auto-fetch options
  autoFetchProjects?: boolean;
  autoFetchTemplates?: boolean;
  
  // Initial filters
  initialFilters?: ProjectFilters;
  
  // Pagination
  pageSize?: number;
  
  // Cache options
  cacheTimeout?: number;
  enableCache?: boolean;
  
  // Retry options
  maxRetries?: number;
  retryDelay?: number;
  
  // Real-time updates
  enableRealTimeUpdates?: boolean;
  
  // Error handling
  onError?: (error: any, context: string) => void;
  onSuccess?: (data: any, context: string) => void;
}

/**
 * Projects hook return type
 */
interface UseProjectsReturn {
  // State
  state: ProjectsDataState;
  
  // Project CRUD operations
  fetchProjects: (filters?: ProjectFilters, page?: number, force?: boolean) => Promise<Project[] | null>;
  fetchProject: (projectId: string, force?: boolean) => Promise<Project | null>;
  createProject: (projectData: any) => Promise<Project | null>;
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<Project | null>;
  deleteProject: (projectId: string) => Promise<boolean>;
  archiveProject: (projectId: string) => Promise<Project | null>;
  restoreProject: (projectId: string) => Promise<Project | null>;
  
  // Team management
  fetchTeamMembers: (projectId: string, force?: boolean) => Promise<any[] | null>;
  addTeamMember: (projectId: string, userId: string, role?: string) => Promise<boolean>;
  updateTeamMemberRole: (projectId: string, userId: string, role: string) => Promise<boolean>;
  removeTeamMember: (projectId: string, userId: string) => Promise<boolean>;
  
  // Analytics
  fetchAnalytics: (projectId: string, timeRange?: string, force?: boolean) => Promise<any | null>;
  
  // Templates
  fetchTemplates: (force?: boolean) => Promise<any[] | null>;
  createFromTemplate: (templateId: string, projectData: any) => Promise<Project | null>;
  saveAsTemplate: (projectId: string, templateData: any) => Promise<string | null>;
  
  // Filters and pagination
  updateFilters: (newFilters: Partial<ProjectFilters>) => void;
  resetFilters: () => void;
  loadMore: () => Promise<void>;
  
  // Cache management
  clearCache: (type?: keyof ProjectsDataState['lastUpdated']) => void;
  refreshAll: () => Promise<void>;
  
  // Utilities
  isStale: (type: keyof ProjectsDataState['lastUpdated']) => boolean;
  hasError: (type?: keyof ProjectsDataState['errors']) => boolean;
  isLoading: (type?: keyof ProjectsDataState['loading']) => boolean;
}

/**
 * Default options
 */
const defaultOptions: Required<UseProjectsOptions> = {
  autoFetchProjects: true,
  autoFetchTemplates: false,
  initialFilters: {},
  pageSize: 20,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
  enableCache: true,
  maxRetries: 3,
  retryDelay: 1000,
  enableRealTimeUpdates: false,
  onError: () => {},
  onSuccess: () => {},
};

/**
 * Projects data management hook
 */
export const useProjects = (options: UseProjectsOptions = {}): UseProjectsReturn => {
  const opts = { ...defaultOptions, ...options };
  
  // State
  const [state, setState] = useState<ProjectsDataState>({
    projects: [],
    currentProject: null,
    teamMembers: [],
    analytics: null,
    templates: [],
    pagination: {
      totalCount: 0,
      totalPages: 0,
      currentPage: 1,
      hasMore: false,
    },
    filters: opts.initialFilters,
    loading: {
      projects: false,
      currentProject: false,
      teamMembers: false,
      analytics: false,
      templates: false,
      creating: false,
      updating: false,
      deleting: false,
    },
    errors: {
      projects: null,
      currentProject: null,
      teamMembers: null,
      analytics: null,
      templates: null,
      creating: null,
      updating: null,
      deleting: null,
    },
    lastUpdated: {
      projects: null,
      currentProject: null,
      teamMembers: null,
      analytics: null,
      templates: null,
    },
  });

  // Refs for cleanup
  const mountedRef = useRef(true);
  const wsRef = useRef<WebSocket | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      wsRef.current?.close();
    };
  }, []);

  /**
   * Update loading state
   */
  const setLoading = useCallback((type: keyof ProjectsDataState['loading'], loading: boolean) => {
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
  const setError = useCallback((type: keyof ProjectsDataState['errors'], error: string | null) => {
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
    type: keyof ProjectsDataState,
    data: T,
    metadataKey?: keyof ProjectsDataState['lastUpdated']
  ) => {
    if (!mountedRef.current) return;
    
    setState(prev => ({
      ...prev,
      [type]: data,
      ...(metadataKey && {
        lastUpdated: {
          ...prev.lastUpdated,
          [metadataKey]: new Date(),
        },
      }),
    }));
  }, []);

  /**
   * Check if data is stale
   */
  const isStale = useCallback((type: keyof ProjectsDataState['lastUpdated']): boolean => {
    if (!opts.enableCache) return true;
    
    const lastUpdated = state.lastUpdated[type];
    if (!lastUpdated) return true;
    
    return Date.now() - lastUpdated.getTime() > opts.cacheTimeout;
  }, [state.lastUpdated, opts.enableCache, opts.cacheTimeout]);

  /**
   * Check if there's an error
   */
  const hasError = useCallback((type?: keyof ProjectsDataState['errors']): boolean => {
    if (type) {
      return state.errors[type] !== null;
    }
    return Object.values(state.errors).some(error => error !== null);
  }, [state.errors]);

  /**
   * Check if loading
   */
  const isLoading = useCallback((type?: keyof ProjectsDataState['loading']): boolean => {
    if (type) {
      return state.loading[type];
    }
    return Object.values(state.loading).some(loading => loading);
  }, [state.loading]);

  /**
   * Generic API call wrapper
   */
  const apiCall = useCallback(async <T>(
    apiFunction: () => Promise<T>,
    context: string,
    loadingKey: keyof ProjectsDataState['loading'],
    errorKey: keyof ProjectsDataState['errors']
  ): Promise<T | null> => {
    setLoading(loadingKey, true);
    setError(errorKey, null);

    try {
      const result = await apiFunction();
      opts.onSuccess(result, context);
      return result;
    } catch (error) {
      const errorMessage = apiUtils.formatErrorForUser(error);
      setError(errorKey, errorMessage);
      opts.onError(error, context);
      return null;
    } finally {
      setLoading(loadingKey, false);
    }
  }, [opts, setLoading, setError]);

  /**
   * Fetch projects with filters and pagination
   */
  const fetchProjects = useCallback(async (
    filters: ProjectFilters = {},
    page: number = 1,
    force: boolean = false
  ): Promise<Project[] | null> => {
    const mergedFilters = { ...state.filters, ...filters };
    
    if (!force && !isStale('projects') && page === 1 && JSON.stringify(mergedFilters) === JSON.stringify(state.filters)) {
      return state.projects;
    }

    const result = await apiCall(
      () => api.projects.crud.getProjects({
        ...mergedFilters,
        page,
        limit: opts.pageSize,
      }),
      'fetchProjects',
      'projects',
      'projects'
    );

    if (result) {
      const { projects, totalCount, totalPages, currentPage, hasMore } = result;
      
      updateData('projects', page === 1 ? projects : [...state.projects, ...projects], 'projects');
      updateData('pagination', { totalCount, totalPages, currentPage, hasMore });
      updateData('filters', mergedFilters);
    }

    return result?.projects || null;
  }, [state.projects, state.filters, isStale, apiCall, updateData, opts.pageSize]);

  /**
   * Fetch single project
   */
  const fetchProject = useCallback(async (
    projectId: string,
    force: boolean = false
  ): Promise<Project | null> => {
    if (!force && !isStale('currentProject') && state.currentProject?.id === projectId) {
      return state.currentProject;
    }

    const result = await apiCall(
      () => api.projects.crud.getProject(projectId),
      'fetchProject',
      'currentProject',
      'currentProject'
    );

    if (result) {
      updateData('currentProject', result, 'currentProject');
    }

    return result;
  }, [state.currentProject, isStale, apiCall, updateData]);

  /**
   * Create new project
   */
  const createProject = useCallback(async (projectData: any): Promise<Project | null> => {
    const result = await apiCall(
      () => api.projects.crud.createProject(projectData),
      'createProject',
      'creating',
      'creating'
    );

    if (result) {
      // Add to projects list
      updateData('projects', [result, ...state.projects]);
      updateData('currentProject', result, 'currentProject');
    }

    return result;
  }, [state.projects, apiCall, updateData]);

  /**
   * Update project
   */
  const updateProject = useCallback(async (
    projectId: string,
    updates: Partial<Project>
  ): Promise<Project | null> => {
    const result = await apiCall(
      () => api.projects.crud.updateProject(projectId, updates),
      'updateProject',
      'updating',
      'updating'
    );

    if (result) {
      // Update in projects list
      const updatedProjects = state.projects.map(p => p.id === projectId ? result : p);
      updateData('projects', updatedProjects);
      
      // Update current project if it's the same
      if (state.currentProject?.id === projectId) {
        updateData('currentProject', result, 'currentProject');
      }
    }

    return result;
  }, [state.projects, state.currentProject, apiCall, updateData]);

  /**
   * Delete project
   */
  const deleteProject = useCallback(async (projectId: string): Promise<boolean> => {
    const result = await apiCall(
      () => api.projects.crud.deleteProject(projectId),
      'deleteProject',
      'deleting',
      'deleting'
    );

    if (result?.success) {
      // Remove from projects list
      const filteredProjects = state.projects.filter(p => p.id !== projectId);
      updateData('projects', filteredProjects);
      
      // Clear current project if it's the same
      if (state.currentProject?.id === projectId) {
        updateData('currentProject', null, 'currentProject');
      }
    }

    return result?.success || false;
  }, [state.projects, state.currentProject, apiCall, updateData]);

  /**
   * Archive project
   */
  const archiveProject = useCallback(async (projectId: string): Promise<Project | null> => {
    const result = await apiCall(
      () => api.projects.crud.archiveProject(projectId),
      'archiveProject',
      'updating',
      'updating'
    );

    if (result) {
      // Update in projects list
      const updatedProjects = state.projects.map(p => p.id === projectId ? result : p);
      updateData('projects', updatedProjects);
      
      // Update current project if it's the same
      if (state.currentProject?.id === projectId) {
        updateData('currentProject', result, 'currentProject');
      }
    }

    return result;
  }, [state.projects, state.currentProject, apiCall, updateData]);

  /**
   * Restore project
   */
  const restoreProject = useCallback(async (projectId: string): Promise<Project | null> => {
    const result = await apiCall(
      () => api.projects.crud.restoreProject(projectId),
      'restoreProject',
      'updating',
      'updating'
    );

    if (result) {
      // Update in projects list
      const updatedProjects = state.projects.map(p => p.id === projectId ? result : p);
      updateData('projects', updatedProjects);
      
      // Update current project if it's the same
      if (state.currentProject?.id === projectId) {
        updateData('currentProject', result, 'currentProject');
      }
    }

    return result;
  }, [state.projects, state.currentProject, apiCall, updateData]);

  /**
   * Fetch team members
   */
  const fetchTeamMembers = useCallback(async (
    projectId: string,
    force: boolean = false
  ): Promise<any[] | null> => {
    if (!force && !isStale('teamMembers') && state.teamMembers.length > 0) {
      return state.teamMembers;
    }

    const result = await apiCall(
      () => api.projects.team.getTeamMembers(projectId),
      'fetchTeamMembers',
      'teamMembers',
      'teamMembers'
    );

    if (result) {
      updateData('teamMembers', result.members, 'teamMembers');
    }

    return result?.members || null;
  }, [state.teamMembers, isStale, apiCall, updateData]);

  /**
   * Add team member
   */
  const addTeamMember = useCallback(async (
    projectId: string,
    userId: string,
    role: string = 'member'
  ): Promise<boolean> => {
    const result = await apiCall(
      () => api.projects.team.addTeamMember(projectId, userId, role),
      'addTeamMember',
      'updating',
      'updating'
    );

    if (result?.success) {
      // Refresh team members
      fetchTeamMembers(projectId, true);
    }

    return result?.success || false;
  }, [apiCall, fetchTeamMembers]);

  /**
   * Update team member role
   */
  const updateTeamMemberRole = useCallback(async (
    projectId: string,
    userId: string,
    role: string
  ): Promise<boolean> => {
    const result = await apiCall(
      () => api.projects.team.updateTeamMemberRole(projectId, userId, role),
      'updateTeamMemberRole',
      'updating',
      'updating'
    );

    if (result?.success) {
      // Update team member in local state
      const updatedMembers = state.teamMembers.map(member =>
        member.id === userId ? { ...member, role } : member
      );
      updateData('teamMembers', updatedMembers);
    }

    return result?.success || false;
  }, [state.teamMembers, apiCall, updateData]);

  /**
   * Remove team member
   */
  const removeTeamMember = useCallback(async (
    projectId: string,
    userId: string
  ): Promise<boolean> => {
    const result = await apiCall(
      () => api.projects.team.removeTeamMember(projectId, userId),
      'removeTeamMember',
      'updating',
      'updating'
    );

    if (result?.success) {
      // Remove team member from local state
      const filteredMembers = state.teamMembers.filter(member => member.id !== userId);
      updateData('teamMembers', filteredMembers);
    }

    return result?.success || false;
  }, [state.teamMembers, apiCall, updateData]);

  /**
   * Fetch analytics
   */
  const fetchAnalytics = useCallback(async (
    projectId: string,
    timeRange: string = '30d',
    force: boolean = false
  ): Promise<any | null> => {
    if (!force && !isStale('analytics') && state.analytics) {
      return state.analytics;
    }

    const result = await apiCall(
      () => api.projects.analytics.getProjectAnalytics(projectId, timeRange as any),
      'fetchAnalytics',
      'analytics',
      'analytics'
    );

    if (result) {
      updateData('analytics', result, 'analytics');
    }

    return result;
  }, [state.analytics, isStale, apiCall, updateData]);

  /**
   * Fetch templates
   */
  const fetchTemplates = useCallback(async (force: boolean = false): Promise<any[] | null> => {
    if (!force && !isStale('templates') && state.templates.length > 0) {
      return state.templates;
    }

    const result = await apiCall(
      () => api.projects.templates.getProjectTemplates(),
      'fetchTemplates',
      'templates',
      'templates'
    );

    if (result) {
      updateData('templates', result.templates, 'templates');
    }

    return result?.templates || null;
  }, [state.templates, isStale, apiCall, updateData]);

  /**
   * Create project from template
   */
  const createFromTemplate = useCallback(async (
    templateId: string,
    projectData: any
  ): Promise<Project | null> => {
    const result = await apiCall(
      () => api.projects.templates.createProjectFromTemplate(templateId, projectData),
      'createFromTemplate',
      'creating',
      'creating'
    );

    if (result) {
      // Add to projects list
      updateData('projects', [result, ...state.projects]);
      updateData('currentProject', result, 'currentProject');
    }

    return result;
  }, [state.projects, apiCall, updateData]);

  /**
   * Save project as template
   */
  const saveAsTemplate = useCallback(async (
    projectId: string,
    templateData: any
  ): Promise<string | null> => {
    const result = await apiCall(
      () => api.projects.templates.saveAsTemplate(projectId, templateData),
      'saveAsTemplate',
      'updating',
      'updating'
    );

    if (result) {
      // Refresh templates
      fetchTemplates(true);
    }

    return result?.templateId || null;
  }, [apiCall, fetchTemplates]);

  /**
   * Update filters
   */
  const updateFilters = useCallback((newFilters: Partial<ProjectFilters>) => {
    const updatedFilters = { ...state.filters, ...newFilters };
    updateData('filters', updatedFilters);
    
    // Fetch projects with new filters
    fetchProjects(updatedFilters, 1, true);
  }, [state.filters, updateData, fetchProjects]);

  /**
   * Reset filters
   */
  const resetFilters = useCallback(() => {
    updateData('filters', opts.initialFilters);
    fetchProjects(opts.initialFilters, 1, true);
  }, [opts.initialFilters, updateData, fetchProjects]);

  /**
   * Load more projects
   */
  const loadMore = useCallback(async () => {
    if (state.pagination.hasMore && !isLoading('projects')) {
      await fetchProjects(state.filters, state.pagination.currentPage + 1);
    }
  }, [state.pagination, state.filters, isLoading, fetchProjects]);

  /**
   * Clear cache
   */
  const clearCache = useCallback((type?: keyof ProjectsDataState['lastUpdated']) => {
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
          projects: null,
          currentProject: null,
          teamMembers: null,
          analytics: null,
          templates: null,
        },
      }));
    }
  }, []);

  /**
   * Refresh all data
   */
  const refreshAll = useCallback(async () => {
    const promises: Promise<any>[] = [
      fetchProjects(state.filters, 1, true),
    ];

    if (state.currentProject) {
      promises.push(
        fetchProject(state.currentProject.id, true),
        fetchTeamMembers(state.currentProject.id, true),
        fetchAnalytics(state.currentProject.id, '30d', true)
      );
    }

    if (opts.autoFetchTemplates) {
      promises.push(fetchTemplates(true));
    }

    await Promise.allSettled(promises);
  }, [state.filters, state.currentProject, opts.autoFetchTemplates, fetchProjects, fetchProject, fetchTeamMembers, fetchAnalytics, fetchTemplates]);

  /**
   * Auto-fetch projects on mount
   */
  useEffect(() => {
    if (opts.autoFetchProjects) {
      fetchProjects();
    }
  }, [opts.autoFetchProjects, fetchProjects]);

  /**
   * Auto-fetch templates on mount
   */
  useEffect(() => {
    if (opts.autoFetchTemplates) {
      fetchTemplates();
    }
  }, [opts.autoFetchTemplates, fetchTemplates]);

  return {
    state,
    fetchProjects,
    fetchProject,
    createProject,
    updateProject,
    deleteProject,
    archiveProject,
    restoreProject,
    fetchTeamMembers,
    addTeamMember,
    updateTeamMemberRole,
    removeTeamMember,
    fetchAnalytics,
    fetchTemplates,
    createFromTemplate,
    saveAsTemplate,
    updateFilters,
    resetFilters,
    loadMore,
    clearCache,
    refreshAll,
    isStale,
    hasError,
    isLoading,
  };
};

export default useProjects;