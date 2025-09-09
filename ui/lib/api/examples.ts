/**
 * API Usage Examples
 * Demonstrates how to use the various API services
 */

import { api, apiUtils } from './index';
import type { Project, Activity } from '@/types/hub';

/**
 * Example: Hub API Usage
 */
export const hubApiExamples = {
  /**
   * Get repository overview
   */
  async getRepositoryOverview(repositoryId: string) {
    try {
      const repository = await api.hub.overview.getRepositoryOverview(repositoryId);
      console.log('Repository overview:', repository);
      return repository;
    } catch (error) {
      console.error('Failed to get repository overview:', apiUtils.getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Get user dashboard with error handling
   */
  async getUserDashboard() {
    try {
      const dashboard = await api.hub.overview.getUserDashboard();
      console.log('User dashboard:', dashboard);
      return dashboard;
    } catch (error) {
      const userMessage = apiUtils.formatErrorForUser(error);
      console.error('Dashboard error:', userMessage);
      throw error;
    }
  },

  /**
   * Get activity feed with pagination
   */
  async getActivityFeed(page: number = 1, limit: number = 20) {
    try {
      const activities = await api.hub.activity.getActivityFeed({
        page,
        limit,
        type: 'commit',
      });
      console.log('Activity feed:', activities);
      return activities;
    } catch (error) {
      console.error('Failed to get activity feed:', apiUtils.getErrorMessage(error));
      throw error;
    }
  },
};

/**
 * Example: Projects API Usage
 */
export const projectsApiExamples = {
  /**
   * Create a new project
   */
  async createProject(projectData: {
    name: string;
    description: string;
    repositoryId: string;
  }) {
    try {
      const project = await api.projects.crud.createProject({
        ...projectData,
        status: 'active',
        priority: 'medium',
      });
      console.log('Created project:', project);
      return project;
    } catch (error) {
      console.error('Failed to create project:', apiUtils.getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Get projects with filtering
   */
  async getFilteredProjects(filters: {
    status?: 'active' | 'completed' | 'archived';
    search?: string;
  }) {
    try {
      const result = await api.projects.crud.getProjects({
        ...filters,
        page: 1,
        limit: 10,
        sortBy: 'updated_at',
        sortOrder: 'desc',
      });
      console.log('Filtered projects:', result);
      return result;
    } catch (error) {
      console.error('Failed to get projects:', apiUtils.getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Get project analytics
   */
  async getProjectAnalytics(projectId: string) {
    try {
      const analytics = await api.projects.analytics.getProjectAnalytics(projectId, '30d');
      console.log('Project analytics:', analytics);
      return analytics;
    } catch (error) {
      console.error('Failed to get project analytics:', apiUtils.getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Add team member to project
   */
  async addTeamMember(projectId: string, userId: string, role: string = 'member') {
    try {
      const result = await api.projects.team.addTeamMember(projectId, userId, role);
      console.log('Added team member:', result);
      return result;
    } catch (error) {
      console.error('Failed to add team member:', apiUtils.getErrorMessage(error));
      throw error;
    }
  },
};

/**
 * Example: Activity API Usage
 */
export const activityApiExamples = {
  /**
   * Get personal activity feed
   */
  async getPersonalFeed() {
    try {
      const feed = await api.activity.feed.getPersonalFeed({
        page: 1,
        limit: 20,
        includeFollowing: true,
      });
      console.log('Personal feed:', feed);
      return feed;
    } catch (error) {
      console.error('Failed to get personal feed:', apiUtils.getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Get activity statistics
   */
  async getActivityStats(repositoryId?: string) {
    try {
      const stats = await api.activity.stats.getActivityStats({
        repositoryId,
        timeRange: '30d',
        groupBy: 'day',
      });
      console.log('Activity stats:', stats);
      return stats;
    } catch (error) {
      console.error('Failed to get activity stats:', apiUtils.getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Search activities
   */
  async searchActivities(query: string) {
    try {
      const results = await api.activity.search.searchActivities({
        query,
        filters: {
          type: ['commit', 'pull_request'],
          isPublic: true,
        },
        page: 1,
        limit: 10,
        sortBy: 'relevance',
      });
      console.log('Activity search results:', results);
      return results;
    } catch (error) {
      console.error('Failed to search activities:', apiUtils.getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Get notifications
   */
  async getNotifications() {
    try {
      const notifications = await api.activity.notifications.getNotifications({
        page: 1,
        limit: 20,
        unreadOnly: false,
      });
      console.log('Notifications:', notifications);
      return notifications;
    } catch (error) {
      console.error('Failed to get notifications:', apiUtils.getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Create real-time activity stream
   */
  createActivityStream(repositoryId?: string) {
    try {
      const ws = api.activity.realtime.createActivityStream({
        repositoryId,
        types: ['commit', 'pull_request', 'issue'],
      });

      if (ws) {
        ws.onopen = () => {
          console.log('Activity stream connected');
        };

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          console.log('Real-time activity:', data);
        };

        ws.onerror = (error) => {
          console.error('Activity stream error:', error);
        };

        ws.onclose = () => {
          console.log('Activity stream disconnected');
        };
      }

      return ws;
    } catch (error) {
      console.error('Failed to create activity stream:', apiUtils.getErrorMessage(error));
      return null;
    }
  },
};

/**
 * Example: Error Handling Patterns
 */
export const errorHandlingExamples = {
  /**
   * Retry failed requests
   */
  async retryableRequest<T>(
    apiCall: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        lastError = error;
        
        // Only retry if error is retryable
        if (!apiUtils.isRetryableError(error)) {
          throw error;
        }

        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  },

  /**
   * Handle API errors with user-friendly messages
   */
  async handleApiCall<T>(
    apiCall: () => Promise<T>,
    onSuccess?: (data: T) => void,
    onError?: (message: string) => void
  ): Promise<T | null> {
    try {
      const result = await apiCall();
      onSuccess?.(result);
      return result;
    } catch (error) {
      const userMessage = apiUtils.formatErrorForUser(error);
      onError?.(userMessage);
      console.error('API call failed:', apiUtils.getErrorMessage(error));
      return null;
    }
  },

  /**
   * Batch API calls with error handling
   */
  async batchApiCalls<T>(
    apiCalls: Array<() => Promise<T>>,
    options: {
      failFast?: boolean;
      maxConcurrent?: number;
    } = {}
  ): Promise<Array<T | Error>> {
    const { failFast = false, maxConcurrent = 5 } = options;
    const results: Array<T | Error> = [];

    // Process in batches to avoid overwhelming the server
    for (let i = 0; i < apiCalls.length; i += maxConcurrent) {
      const batch = apiCalls.slice(i, i + maxConcurrent);
      
      const batchPromises = batch.map(async (apiCall) => {
        try {
          return await apiCall();
        } catch (error) {
          if (failFast) {
            throw error;
          }
          return error instanceof Error ? error : new Error(String(error));
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // If fail fast is enabled and we have an error, stop processing
      if (failFast && batchResults.some(result => result instanceof Error)) {
        break;
      }
    }

    return results;
  },
};

/**
 * Example: Pagination Helper
 */
export const paginationExamples = {
  /**
   * Auto-paginate through all results
   */
  async getAllPages<T>(
    apiCall: (page: number, limit: number) => Promise<{
      data: T[];
      hasMore: boolean;
      totalCount: number;
    }>,
    limit: number = 20
  ): Promise<T[]> {
    const allResults: T[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      try {
        const result = await apiCall(page, limit);
        allResults.push(...result.data);
        hasMore = result.hasMore;
        page++;

        // Safety check to prevent infinite loops
        if (page > 100) {
          console.warn('Pagination stopped at page 100 to prevent infinite loop');
          break;
        }
      } catch (error) {
        console.error(`Failed to fetch page ${page}:`, apiUtils.getErrorMessage(error));
        break;
      }
    }

    return allResults;
  },

  /**
   * Paginate with progress callback
   */
  async paginateWithProgress<T>(
    apiCall: (page: number, limit: number) => Promise<{
      data: T[];
      hasMore: boolean;
      totalCount: number;
    }>,
    onProgress: (current: number, total: number) => void,
    limit: number = 20
  ): Promise<T[]> {
    const allResults: T[] = [];
    let page = 1;
    let hasMore = true;
    let totalCount = 0;

    while (hasMore) {
      try {
        const result = await apiCall(page, limit);
        allResults.push(...result.data);
        hasMore = result.hasMore;
        totalCount = result.totalCount;
        
        onProgress(allResults.length, totalCount);
        page++;
      } catch (error) {
        console.error(`Failed to fetch page ${page}:`, apiUtils.getErrorMessage(error));
        break;
      }
    }

    return allResults;
  },
};

export default {
  hub: hubApiExamples,
  projects: projectsApiExamples,
  activity: activityApiExamples,
  errorHandling: errorHandlingExamples,
  pagination: paginationExamples,
};