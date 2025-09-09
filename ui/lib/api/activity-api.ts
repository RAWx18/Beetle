/**
 * Activity-specific API calls for the Beetle application
 * Handles activity feeds, notifications, and real-time updates
 */

import { Activity, User, Repository } from '@/types/hub';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

/**
 * API error class for activity
 */
export class ActivityApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ActivityApiError';
  }
}

/**
 * Generic API request handler with retry logic and exponential backoff
 */
async function apiRequest<T>(
  endpoint: string, 
  options?: RequestInit,
  retries: number = 3
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Don't retry on client errors (4xx)
        if (response.status >= 400 && response.status < 500) {
          throw new ActivityApiError(
            errorData.message || `HTTP ${response.status}: ${response.statusText}`,
            response.status,
            errorData.code
          );
        }
        
        // Retry on server errors (5xx) if attempts remaining
        if (attempt < retries) {
          const delay = Math.min(Math.pow(2, attempt) * 1000, 10000); // Max 10s delay
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        throw new ActivityApiError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData.code
        );
      }

      return response.json();
    } catch (error) {
      if (error instanceof ActivityApiError) {
        throw error;
      }
      
      // Retry on network errors if attempts remaining
      if (attempt < retries) {
        const delay = Math.min(Math.pow(2, attempt) * 1000, 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw new ActivityApiError('Network error occurred', 0);
    }
  }
  
  throw new ActivityApiError('Max retries exceeded', 0);
}

/**
 * Activity feed management
 */
export const activityFeedApi = {
  /**
   * Get activity feed with filtering and pagination
   */
  async getActivityFeed(params?: {
    page?: number;
    limit?: number;
    type?: 'commit' | 'pull_request' | 'issue' | 'release' | 'comment' | 'review';
    repositoryId?: string;
    userId?: string;
    projectId?: string;
    dateRange?: {
      start: string;
      end: string;
    };
    sortBy?: 'created_at' | 'updated_at' | 'relevance';
    sortOrder?: 'asc' | 'desc';
    includePrivate?: boolean;
  }): Promise<{
    activities: Activity[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
    hasMore: boolean;
    nextCursor?: string;
  }> {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.type) searchParams.append('type', params.type);
    if (params?.repositoryId) searchParams.append('repository_id', params.repositoryId);
    if (params?.userId) searchParams.append('user_id', params.userId);
    if (params?.projectId) searchParams.append('project_id', params.projectId);
    if (params?.sortBy) searchParams.append('sort_by', params.sortBy);
    if (params?.sortOrder) searchParams.append('sort_order', params.sortOrder);
    if (params?.includePrivate) searchParams.append('include_private', 'true');
    
    if (params?.dateRange) {
      searchParams.append('start_date', params.dateRange.start);
      searchParams.append('end_date', params.dateRange.end);
    }
    
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return apiRequest(`/activity${query}`);
  },

  /**
   * Get activity by ID
   */
  async getActivity(activityId: string): Promise<Activity> {
    return apiRequest<Activity>(`/activity/${activityId}`);
  },

  /**
   * Get user's personal activity feed
   */
  async getPersonalFeed(params?: {
    page?: number;
    limit?: number;
    includeFollowing?: boolean;
    includeOrganizations?: boolean;
  }): Promise<{
    activities: Activity[];
    totalCount: number;
    hasMore: boolean;
  }> {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.includeFollowing) searchParams.append('include_following', 'true');
    if (params?.includeOrganizations) searchParams.append('include_orgs', 'true');
    
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return apiRequest(`/activity/personal${query}`);
  },

  /**
   * Get repository activity feed
   */
  async getRepositoryFeed(
    repositoryId: string,
    params?: {
      page?: number;
      limit?: number;
      type?: string;
      branch?: string;
    }
  ): Promise<{
    activities: Activity[];
    totalCount: number;
    hasMore: boolean;
  }> {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.type) searchParams.append('type', params.type);
    if (params?.branch) searchParams.append('branch', params.branch);
    
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return apiRequest(`/repositories/${repositoryId}/activity${query}`);
  },

  /**
   * Mark activity as read
   */
  async markAsRead(activityId: string): Promise<{ success: boolean }> {
    return apiRequest(`/activity/${activityId}/read`, {
      method: 'POST',
    });
  },

  /**
   * Mark multiple activities as read
   */
  async markMultipleAsRead(activityIds: string[]): Promise<{ success: boolean }> {
    return apiRequest('/activity/mark-read', {
      method: 'POST',
      body: JSON.stringify({ activityIds }),
    });
  },
};

/**
 * Activity statistics and analytics
 */
export const activityStatsApi = {
  /**
   * Get activity statistics
   */
  async getActivityStats(params?: {
    repositoryId?: string;
    userId?: string;
    projectId?: string;
    timeRange?: '24h' | '7d' | '30d' | '90d' | '1y';
    groupBy?: 'day' | 'week' | 'month';
  }): Promise<{
    totalActivities: number;
    activitiesByType: Record<string, number>;
    activitiesByDay: Array<{ date: string; count: number }>;
    topContributors: Array<{ user: User; activityCount: number }>;
    trends: {
      growth: number;
      mostActiveDay: string;
      averagePerDay: number;
    };
  }> {
    const searchParams = new URLSearchParams();
    
    if (params?.repositoryId) searchParams.append('repository_id', params.repositoryId);
    if (params?.userId) searchParams.append('user_id', params.userId);
    if (params?.projectId) searchParams.append('project_id', params.projectId);
    if (params?.timeRange) searchParams.append('time_range', params.timeRange);
    if (params?.groupBy) searchParams.append('group_by', params.groupBy);
    
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return apiRequest(`/activity/stats${query}`);
  },

  /**
   * Get activity heatmap data
   */
  async getActivityHeatmap(
    userId: string,
    year?: number
  ): Promise<{
    data: Array<{
      date: string;
      count: number;
      level: 0 | 1 | 2 | 3 | 4; // GitHub-style contribution levels
    }>;
    totalContributions: number;
    longestStreak: number;
    currentStreak: number;
  }> {
    const query = year ? `?year=${year}` : '';
    return apiRequest(`/users/${userId}/activity-heatmap${query}`);
  },

  /**
   * Get team activity summary
   */
  async getTeamActivitySummary(
    repositoryId: string,
    timeRange: '7d' | '30d' | '90d' = '30d'
  ): Promise<{
    teamMembers: Array<{
      user: User;
      commits: number;
      pullRequests: number;
      issues: number;
      codeReviews: number;
      totalActivity: number;
    }>;
    collaborationMetrics: {
      crossTeamInteractions: number;
      averageResponseTime: number;
      pairProgrammingEvents: number;
    };
  }> {
    return apiRequest(`/repositories/${repositoryId}/team-activity?range=${timeRange}`);
  },
};

/**
 * Activity notifications and subscriptions
 */
export const activityNotificationsApi = {
  /**
   * Get user notifications
   */
  async getNotifications(params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
    type?: 'mention' | 'assignment' | 'review_request' | 'comment' | 'follow';
  }): Promise<{
    notifications: Array<{
      id: string;
      type: string;
      title: string;
      message: string;
      isRead: boolean;
      createdAt: string;
      activity: Activity;
      actionUrl?: string;
    }>;
    totalCount: number;
    unreadCount: number;
    hasMore: boolean;
  }> {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.unreadOnly) searchParams.append('unread_only', 'true');
    if (params?.type) searchParams.append('type', params.type);
    
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return apiRequest(`/notifications${query}`);
  },

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<{ success: boolean }> {
    return apiRequest(`/notifications/${notificationId}/read`, {
      method: 'POST',
    });
  },

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsAsRead(): Promise<{ success: boolean }> {
    return apiRequest('/notifications/mark-all-read', {
      method: 'POST',
    });
  },

  /**
   * Subscribe to repository activity
   */
  async subscribeToRepository(
    repositoryId: string,
    types: string[] = ['all']
  ): Promise<{ success: boolean }> {
    return apiRequest(`/repositories/${repositoryId}/subscribe`, {
      method: 'POST',
      body: JSON.stringify({ types }),
    });
  },

  /**
   * Unsubscribe from repository activity
   */
  async unsubscribeFromRepository(repositoryId: string): Promise<{ success: boolean }> {
    return apiRequest(`/repositories/${repositoryId}/unsubscribe`, {
      method: 'POST',
    });
  },

  /**
   * Get notification preferences
   */
  async getNotificationPreferences(): Promise<{
    email: {
      enabled: boolean;
      types: string[];
      frequency: 'immediate' | 'daily' | 'weekly';
    };
    push: {
      enabled: boolean;
      types: string[];
    };
    inApp: {
      enabled: boolean;
      types: string[];
    };
  }> {
    return apiRequest('/notifications/preferences');
  },

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(preferences: {
    email?: {
      enabled?: boolean;
      types?: string[];
      frequency?: 'immediate' | 'daily' | 'weekly';
    };
    push?: {
      enabled?: boolean;
      types?: string[];
    };
    inApp?: {
      enabled?: boolean;
      types?: string[];
    };
  }): Promise<{ success: boolean }> {
    return apiRequest('/notifications/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  },
};

/**
 * Real-time activity updates
 */
export const activityRealtimeApi = {
  /**
   * Create WebSocket connection for real-time activity updates
   */
  createActivityStream(params?: {
    repositoryId?: string;
    projectId?: string;
    types?: string[];
  }): WebSocket | null {
    if (typeof window === 'undefined') return null;
    
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';
    const searchParams = new URLSearchParams();
    
    if (params?.repositoryId) searchParams.append('repository_id', params.repositoryId);
    if (params?.projectId) searchParams.append('project_id', params.projectId);
    if (params?.types) searchParams.append('types', params.types.join(','));
    
    const token = localStorage.getItem('auth_token');
    if (token) searchParams.append('token', token);
    
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    
    try {
      return new WebSocket(`${wsUrl}/activity${query}`);
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      return null;
    }
  },

  /**
   * Send activity update via WebSocket
   */
  sendActivityUpdate(
    ws: WebSocket,
    activity: Partial<Activity>
  ): boolean {
    if (ws.readyState !== WebSocket.OPEN) {
      return false;
    }
    
    try {
      ws.send(JSON.stringify({
        type: 'activity_update',
        data: activity,
      }));
      return true;
    } catch (error) {
      console.error('Failed to send activity update:', error);
      return false;
    }
  },

  /**
   * Subscribe to specific activity types
   */
  subscribeToActivityTypes(
    ws: WebSocket,
    types: string[]
  ): boolean {
    if (ws.readyState !== WebSocket.OPEN) {
      return false;
    }
    
    try {
      ws.send(JSON.stringify({
        type: 'subscribe',
        data: { types },
      }));
      return true;
    } catch (error) {
      console.error('Failed to subscribe to activity types:', error);
      return false;
    }
  },
};

/**
 * Activity search and filtering
 */
export const activitySearchApi = {
  /**
   * Search activities with advanced filtering
   */
  async searchActivities(params: {
    query: string;
    filters?: {
      type?: string[];
      users?: string[];
      repositories?: string[];
      dateRange?: { start: string; end: string };
      hasComments?: boolean;
      isPublic?: boolean;
    };
    page?: number;
    limit?: number;
    sortBy?: 'relevance' | 'date' | 'popularity';
  }): Promise<{
    activities: Activity[];
    totalCount: number;
    facets: {
      types: Record<string, number>;
      users: Record<string, number>;
      repositories: Record<string, number>;
    };
    suggestions: string[];
  }> {
    return apiRequest('/activity/search', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  /**
   * Get activity suggestions based on user behavior
   */
  async getActivitySuggestions(limit: number = 5): Promise<{
    suggestions: Array<{
      type: 'repository' | 'user' | 'project';
      title: string;
      description: string;
      actionUrl: string;
      priority: number;
    }>;
  }> {
    return apiRequest(`/activity/suggestions?limit=${limit}`);
  },

  /**
   * Get trending activities
   */
  async getTrendingActivities(
    timeRange: '1h' | '24h' | '7d' = '24h',
    limit: number = 10
  ): Promise<{
    activities: Array<Activity & { trendingScore: number; engagementRate: number }>;
  }> {
    return apiRequest(`/activity/trending?range=${timeRange}&limit=${limit}`);
  },
};

/**
 * Export all activity API modules
 */
export const activityApi = {
  feed: activityFeedApi,
  stats: activityStatsApi,
  notifications: activityNotificationsApi,
  realtime: activityRealtimeApi,
  search: activitySearchApi,
};

export default activityApi;