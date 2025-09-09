/**
 * Hub-specific API calls for the Beetle application
 * Handles data fetching for overview, projects, activity, and insights
 */

import { Repository, User, Project, Activity, Metrics } from '@/types/hub';
import { BaseApiClient, BaseApiError } from './base-api';

/**
 * Hub API error class
 */
export class ApiError extends BaseApiError {
  constructor(
    message: string,
    status: number,
    code?: string
  ) {
    super(message, status, code);
    this.name = 'HubApiError';
  }
}

/**
 * Hub API client instance
 */
const hubApiClient = new BaseApiClient();

/**
 * Generic API request handler with error handling and retry logic
 */
async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const response = await hubApiClient.request<T>(endpoint, options);
    return response.data;
  } catch (error) {
    if (error instanceof BaseApiError) {
      throw new ApiError(error.message, error.status, error.code);
    }
    throw new ApiError('Network error occurred', 0);
  }
}

/**
 * Hub Overview API calls
 */
export const hubOverviewApi = {
  /**
   * Get repository overview data
   */
  async getRepositoryOverview(repositoryId: string): Promise<Repository> {
    return apiRequest<Repository>(`/repositories/${repositoryId}/overview`);
  },

  /**
   * Get user dashboard data
   */
  async getUserDashboard(): Promise<{
    repositories: Repository[];
    recentActivity: Activity[];
    quickStats: Metrics;
  }> {
    return apiRequest(`/dashboard`);
  },

  /**
   * Get repository quick actions
   */
  async getQuickActions(repositoryId: string): Promise<{
    canCreateBranch: boolean;
    canCreatePR: boolean;
    canManageIssues: boolean;
  }> {
    return apiRequest(`/repositories/${repositoryId}/quick-actions`);
  },
};

/**
 * Hub Projects API calls
 */
export const hubProjectsApi = {
  /**
   * Get all projects for the current user
   */
  async getProjects(filters?: {
    status?: string;
    search?: string;
    sortBy?: string;
  }): Promise<{
    projects: Project[];
    totalCount: number;
  }> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.sortBy) params.append('sort', filters.sortBy);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/projects${query}`);
  },

  /**
   * Get project details
   */
  async getProject(projectId: string): Promise<Project> {
    return apiRequest<Project>(`/projects/${projectId}`);
  },

  /**
   * Create a new project
   */
  async createProject(projectData: Partial<Project>): Promise<Project> {
    return apiRequest<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  },

  /**
   * Update project
   */
  async updateProject(projectId: string, projectData: Partial<Project>): Promise<Project> {
    return apiRequest<Project>(`/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(projectData),
    });
  },
};

/**
 * Hub Activity API calls
 */
export const hubActivityApi = {
  /**
   * Get activity feed
   */
  async getActivityFeed(filters?: {
    type?: string;
    dateRange?: { start: Date; end: Date };
    repositoryId?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    activities: Activity[];
    totalCount: number;
    hasMore: boolean;
  }> {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.repositoryId) params.append('repository', filters.repositoryId);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.dateRange) {
      params.append('start_date', filters.dateRange.start.toISOString());
      params.append('end_date', filters.dateRange.end.toISOString());
    }
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/activity${query}`);
  },

  /**
   * Get activity statistics
   */
  async getActivityStats(repositoryId?: string): Promise<{
    totalActivities: number;
    activitiesByType: Record<string, number>;
    recentTrends: Array<{ date: string; count: number }>;
  }> {
    const query = repositoryId ? `?repository=${repositoryId}` : '';
    return apiRequest(`/activity/stats${query}`);
  },
};

/**
 * Hub Insights API calls
 */
export const hubInsightsApi = {
  /**
   * Get repository metrics
   */
  async getRepositoryMetrics(repositoryId: string, timeRange?: string): Promise<Metrics> {
    const query = timeRange ? `?range=${timeRange}` : '';
    return apiRequest<Metrics>(`/repositories/${repositoryId}/metrics${query}`);
  },

  /**
   * Get user analytics
   */
  async getUserAnalytics(timeRange?: string): Promise<{
    contributionStats: Metrics;
    repositoryStats: Metrics;
    collaborationStats: Metrics;
  }> {
    const query = timeRange ? `?range=${timeRange}` : '';
    return apiRequest(`/analytics/user${query}`);
  },

  /**
   * Get team insights
   */
  async getTeamInsights(repositoryId: string): Promise<{
    teamMembers: User[];
    contributionBreakdown: Record<string, number>;
    collaborationMetrics: Metrics;
  }> {
    return apiRequest(`/repositories/${repositoryId}/team-insights`);
  },
};

/**
 * Export all API modules
 */
export const hubApi = {
  overview: hubOverviewApi,
  projects: hubProjectsApi,
  activity: hubActivityApi,
  insights: hubInsightsApi,
};

export default hubApi;