'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api, apiUtils } from '@/lib/api';
import { Activity, User } from '@/types/hub';

/**
 * Activity filters interface
 */
interface ActivityFilters {
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
}

/**
 * Activity data state interface
 */
interface ActivityDataState {
  // Activity feed data
  activities: Activity[];
  personalFeed: Activity[];
  repositoryFeed: Activity[];
  
  // Current activity
  currentActivity: Activity | null;
  
  // Statistics
  stats: {
    totalActivities: number;
    activitiesByType: Record<string, number>;
    activitiesByDay: Array<{ date: string; count: number }>;
    topContributors: Array<{ user: User; activityCount: number }>;
    trends: {
      growth: number;
      mostActiveDay: string;
      averagePerDay: number;
    };
  } | null;
  
  // Heatmap data
  heatmap: {
    data: Array<{
      date: string;
      count: number;
      level: 0 | 1 | 2 | 3 | 4;
    }>;
    totalContributions: number;
    longestStreak: number;
    currentStreak: number;
  } | null;
  
  // Notifications
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
  
  // Notification preferences
  notificationPreferences: {
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
  } | null;
  
  // Pagination data
  pagination: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    hasMore: boolean;
    nextCursor?: string;
  };
  
  // Filters
  filters: ActivityFilters;
  
  // Real-time connection
  isConnected: boolean;
  
  // Loading states
  loading: {
    activities: boolean;
    personalFeed: boolean;
    repositoryFeed: boolean;
    currentActivity: boolean;
    stats: boolean;
    heatmap: boolean;
    notifications: boolean;
    preferences: boolean;
    markingRead: boolean;
    subscribing: boolean;
  };
  
  // Error states
  errors: {
    activities: string | null;
    personalFeed: string | null;
    repositoryFeed: string | null;
    currentActivity: string | null;
    stats: string | null;
    heatmap: string | null;
    notifications: string | null;
    preferences: string | null;
    markingRead: string | null;
    subscribing: string | null;
    connection: string | null;
  };
  
  // Cache metadata
  lastUpdated: {
    activities: Date | null;
    personalFeed: Date | null;
    repositoryFeed: Date | null;
    currentActivity: Date | null;
    stats: Date | null;
    heatmap: Date | null;
    notifications: Date | null;
    preferences: Date | null;
  };
}

/**
 * Activity hook options
 */
interface UseActivityOptions {
  // Auto-fetch options
  autoFetchActivities?: boolean;
  autoFetchPersonalFeed?: boolean;
  autoFetchNotifications?: boolean;
  
  // Initial filters
  initialFilters?: ActivityFilters;
  
  // Pagination
  pageSize?: number;
  
  // Cache options
  cacheTimeout?: number;
  enableCache?: boolean;
  
  // Real-time options
  enableRealTime?: boolean;
  realTimeTypes?: string[];
  
  // Retry options
  maxRetries?: number;
  retryDelay?: number;
  
  // Error handling
  onError?: (error: any, context: string) => void;
  onSuccess?: (data: any, context: string) => void;
  onActivityUpdate?: (activity: Activity) => void;
  onNotification?: (notification: any) => void;
}

/**
 * Activity hook return type
 */
interface UseActivityReturn {
  // State
  state: ActivityDataState;
  
  // Activity feed operations
  fetchActivities: (filters?: ActivityFilters, page?: number, force?: boolean) => Promise<Activity[] | null>;
  fetchPersonalFeed: (options?: any, force?: boolean) => Promise<Activity[] | null>;
  fetchRepositoryFeed: (repositoryId: string, options?: any, force?: boolean) => Promise<Activity[] | null>;
  fetchActivity: (activityId: string, force?: boolean) => Promise<Activity | null>;
  markAsRead: (activityId: string) => Promise<boolean>;
  markMultipleAsRead: (activityIds: string[]) => Promise<boolean>;
  
  // Statistics and analytics
  fetchStats: (params?: any, force?: boolean) => Promise<any | null>;
  fetchHeatmap: (userId: string, year?: number, force?: boolean) => Promise<any | null>;
  
  // Notifications
  fetchNotifications: (params?: any, force?: boolean) => Promise<any[] | null>;
  markNotificationAsRead: (notificationId: string) => Promise<boolean>;
  markAllNotificationsAsRead: () => Promise<boolean>;
  fetchNotificationPreferences: (force?: boolean) => Promise<any | null>;
  updateNotificationPreferences: (preferences: any) => Promise<boolean>;
  
  // Subscriptions
  subscribeToRepository: (repositoryId: string, types?: string[]) => Promise<boolean>;
  unsubscribeFromRepository: (repositoryId: string) => Promise<boolean>;
  
  // Search
  searchActivities: (query: string, filters?: any) => Promise<any | null>;
  getTrendingActivities: (timeRange?: string, limit?: number) => Promise<Activity[] | null>;
  
  // Real-time
  connectRealTime: (params?: any) => void;
  disconnectRealTime: () => void;
  
  // Filters and pagination
  updateFilters: (newFilters: Partial<ActivityFilters>) => void;
  resetFilters: () => void;
  loadMore: () => Promise<void>;
  
  // Cache management
  clearCache: (type?: keyof ActivityDataState['lastUpdated']) => void;
  refreshAll: () => Promise<void>;
  
  // Utilities
  isStale: (type: keyof ActivityDataState['lastUpdated']) => boolean;
  hasError: (type?: keyof ActivityDataState['errors']) => boolean;
  isLoading: (type?: keyof ActivityDataState['loading']) => boolean;
  getUnreadCount: () => number;
}

/**
 * Default options
 */
const defaultOptions: Required<UseActivityOptions> = {
  autoFetchActivities: true,
  autoFetchPersonalFeed: false,
  autoFetchNotifications: true,
  initialFilters: {},
  pageSize: 20,
  cacheTimeout: 2 * 60 * 1000, // 2 minutes (shorter for activity data)
  enableCache: true,
  enableRealTime: false,
  realTimeTypes: ['commit', 'pull_request', 'issue'],
  maxRetries: 3,
  retryDelay: 1000,
  onError: () => {},
  onSuccess: () => {},
  onActivityUpdate: () => {},
  onNotification: () => {},
};

/**
 * Activity data management hook
 */
export const useActivity = (options: UseActivityOptions = {}): UseActivityReturn => {
  const opts = { ...defaultOptions, ...options };
  
  // State
  const [state, setState] = useState<ActivityDataState>({
    activities: [],
    personalFeed: [],
    repositoryFeed: [],
    currentActivity: null,
    stats: null,
    heatmap: null,
    notifications: [],
    notificationPreferences: null,
    pagination: {
      totalCount: 0,
      totalPages: 0,
      currentPage: 1,
      hasMore: false,
    },
    filters: opts.initialFilters,
    isConnected: false,
    loading: {
      activities: false,
      personalFeed: false,
      repositoryFeed: false,
      currentActivity: false,
      stats: false,
      heatmap: false,
      notifications: false,
      preferences: false,
      markingRead: false,
      subscribing: false,
    },
    errors: {
      activities: null,
      personalFeed: null,
      repositoryFeed: null,
      currentActivity: null,
      stats: null,
      heatmap: null,
      notifications: null,
      preferences: null,
      markingRead: null,
      subscribing: null,
      connection: null,
    },
    lastUpdated: {
      activities: null,
      personalFeed: null,
      repositoryFeed: null,
      currentActivity: null,
      stats: null,
      heatmap: null,
      notifications: null,
      preferences: null,
    },
  });

  // Refs for cleanup
  const mountedRef = useRef(true);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      wsRef.current?.close();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Update loading state
   */
  const setLoading = useCallback((type: keyof ActivityDataState['loading'], loading: boolean) => {
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
  const setError = useCallback((type: keyof ActivityDataState['errors'], error: string | null) => {
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
    type: keyof ActivityDataState,
    data: T,
    metadataKey?: keyof ActivityDataState['lastUpdated']
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
  const isStale = useCallback((type: keyof ActivityDataState['lastUpdated']): boolean => {
    if (!opts.enableCache) return true;
    
    const lastUpdated = state.lastUpdated[type];
    if (!lastUpdated) return true;
    
    return Date.now() - lastUpdated.getTime() > opts.cacheTimeout;
  }, [state.lastUpdated, opts.enableCache, opts.cacheTimeout]);

  /**
   * Check if there's an error
   */
  const hasError = useCallback((type?: keyof ActivityDataState['errors']): boolean => {
    if (type) {
      return state.errors[type] !== null;
    }
    return Object.values(state.errors).some(error => error !== null);
  }, [state.errors]);

  /**
   * Check if loading
   */
  const isLoading = useCallback((type?: keyof ActivityDataState['loading']): boolean => {
    if (type) {
      return state.loading[type];
    }
    return Object.values(state.loading).some(loading => loading);
  }, [state.loading]);

  /**
   * Get unread notification count
   */
  const getUnreadCount = useCallback((): number => {
    return state.notifications.filter(n => !n.isRead).length;
  }, [state.notifications]);

  /**
   * Generic API call wrapper
   */
  const apiCall = useCallback(async <T>(
    apiFunction: () => Promise<T>,
    context: string,
    loadingKey: keyof ActivityDataState['loading'],
    errorKey: keyof ActivityDataState['errors']
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
   * Fetch activities with filters and pagination
   */
  const fetchActivities = useCallback(async (
    filters: ActivityFilters = {},
    page: number = 1,
    force: boolean = false
  ): Promise<Activity[] | null> => {
    const mergedFilters = { ...state.filters, ...filters };
    
    if (!force && !isStale('activities') && page === 1 && JSON.stringify(mergedFilters) === JSON.stringify(state.filters)) {
      return state.activities;
    }

    const result = await apiCall(
      () => api.activity.feed.getActivityFeed({
        ...mergedFilters,
        page,
        limit: opts.pageSize,
      }),
      'fetchActivities',
      'activities',
      'activities'
    );

    if (result) {
      const { activities, totalCount, totalPages, currentPage, hasMore, nextCursor } = result;
      
      updateData('activities', page === 1 ? activities : [...state.activities, ...activities], 'activities');
      updateData('pagination', { totalCount, totalPages, currentPage, hasMore, nextCursor });
      updateData('filters', mergedFilters);
    }

    return result?.activities || null;
  }, [state.activities, state.filters, isStale, apiCall, updateData, opts.pageSize]);

  /**
   * Fetch personal feed
   */
  const fetchPersonalFeed = useCallback(async (
    options: any = {},
    force: boolean = false
  ): Promise<Activity[] | null> => {
    if (!force && !isStale('personalFeed') && state.personalFeed.length > 0) {
      return state.personalFeed;
    }

    const result = await apiCall(
      () => api.activity.feed.getPersonalFeed({
        page: 1,
        limit: opts.pageSize,
        includeFollowing: true,
        ...options,
      }),
      'fetchPersonalFeed',
      'personalFeed',
      'personalFeed'
    );

    if (result) {
      updateData('personalFeed', result.activities, 'personalFeed');
    }

    return result?.activities || null;
  }, [state.personalFeed, isStale, apiCall, updateData, opts.pageSize]);

  /**
   * Fetch repository feed
   */
  const fetchRepositoryFeed = useCallback(async (
    repositoryId: string,
    options: any = {},
    force: boolean = false
  ): Promise<Activity[] | null> => {
    if (!force && !isStale('repositoryFeed') && state.repositoryFeed.length > 0) {
      return state.repositoryFeed;
    }

    const result = await apiCall(
      () => api.activity.feed.getRepositoryFeed(repositoryId, {
        page: 1,
        limit: opts.pageSize,
        ...options,
      }),
      'fetchRepositoryFeed',
      'repositoryFeed',
      'repositoryFeed'
    );

    if (result) {
      updateData('repositoryFeed', result.activities, 'repositoryFeed');
    }

    return result?.activities || null;
  }, [state.repositoryFeed, isStale, apiCall, updateData, opts.pageSize]);

  /**
   * Fetch single activity
   */
  const fetchActivity = useCallback(async (
    activityId: string,
    force: boolean = false
  ): Promise<Activity | null> => {
    if (!force && !isStale('currentActivity') && state.currentActivity?.id === activityId) {
      return state.currentActivity;
    }

    const result = await apiCall(
      () => api.activity.feed.getActivity(activityId),
      'fetchActivity',
      'currentActivity',
      'currentActivity'
    );

    if (result) {
      updateData('currentActivity', result, 'currentActivity');
    }

    return result;
  }, [state.currentActivity, isStale, apiCall, updateData]);

  /**
   * Mark activity as read
   */
  const markAsRead = useCallback(async (activityId: string): Promise<boolean> => {
    const result = await apiCall(
      () => api.activity.feed.markAsRead(activityId),
      'markAsRead',
      'markingRead',
      'markingRead'
    );

    if (result?.success) {
      // Update activity in local state
      const updateActivityInList = (activities: Activity[]) =>
        activities.map(activity =>
          activity.id === activityId ? { ...activity, isRead: true } : activity
        );

      updateData('activities', updateActivityInList(state.activities));
      updateData('personalFeed', updateActivityInList(state.personalFeed));
      updateData('repositoryFeed', updateActivityInList(state.repositoryFeed));
    }

    return result?.success || false;
  }, [state.activities, state.personalFeed, state.repositoryFeed, apiCall, updateData]);

  /**
   * Mark multiple activities as read
   */
  const markMultipleAsRead = useCallback(async (activityIds: string[]): Promise<boolean> => {
    const result = await apiCall(
      () => api.activity.feed.markMultipleAsRead(activityIds),
      'markMultipleAsRead',
      'markingRead',
      'markingRead'
    );

    if (result?.success) {
      // Update activities in local state
      const updateActivitiesInList = (activities: Activity[]) =>
        activities.map(activity =>
          activityIds.includes(activity.id) ? { ...activity, isRead: true } : activity
        );

      updateData('activities', updateActivitiesInList(state.activities));
      updateData('personalFeed', updateActivitiesInList(state.personalFeed));
      updateData('repositoryFeed', updateActivitiesInList(state.repositoryFeed));
    }

    return result?.success || false;
  }, [state.activities, state.personalFeed, state.repositoryFeed, apiCall, updateData]);

  /**
   * Fetch statistics
   */
  const fetchStats = useCallback(async (
    params: any = {},
    force: boolean = false
  ): Promise<any | null> => {
    if (!force && !isStale('stats') && state.stats) {
      return state.stats;
    }

    const result = await apiCall(
      () => api.activity.stats.getActivityStats({
        timeRange: '30d',
        groupBy: 'day',
        ...params,
      }),
      'fetchStats',
      'stats',
      'stats'
    );

    if (result) {
      updateData('stats', result, 'stats');
    }

    return result;
  }, [state.stats, isStale, apiCall, updateData]);

  /**
   * Fetch heatmap data
   */
  const fetchHeatmap = useCallback(async (
    userId: string,
    year?: number,
    force: boolean = false
  ): Promise<any | null> => {
    if (!force && !isStale('heatmap') && state.heatmap) {
      return state.heatmap;
    }

    const result = await apiCall(
      () => api.activity.stats.getActivityHeatmap(userId, year),
      'fetchHeatmap',
      'heatmap',
      'heatmap'
    );

    if (result) {
      updateData('heatmap', result, 'heatmap');
    }

    return result;
  }, [state.heatmap, isStale, apiCall, updateData]);

  /**
   * Fetch notifications
   */
  const fetchNotifications = useCallback(async (
    params: any = {},
    force: boolean = false
  ): Promise<any[] | null> => {
    if (!force && !isStale('notifications') && state.notifications.length > 0) {
      return state.notifications;
    }

    const result = await apiCall(
      () => api.activity.notifications.getNotifications({
        page: 1,
        limit: 50,
        ...params,
      }),
      'fetchNotifications',
      'notifications',
      'notifications'
    );

    if (result) {
      updateData('notifications', result.notifications, 'notifications');
    }

    return result?.notifications || null;
  }, [state.notifications, isStale, apiCall, updateData]);

  /**
   * Mark notification as read
   */
  const markNotificationAsRead = useCallback(async (notificationId: string): Promise<boolean> => {
    const result = await apiCall(
      () => api.activity.notifications.markNotificationAsRead(notificationId),
      'markNotificationAsRead',
      'markingRead',
      'markingRead'
    );

    if (result?.success) {
      // Update notification in local state
      const updatedNotifications = state.notifications.map(notification =>
        notification.id === notificationId ? { ...notification, isRead: true } : notification
      );
      updateData('notifications', updatedNotifications);
    }

    return result?.success || false;
  }, [state.notifications, apiCall, updateData]);

  /**
   * Mark all notifications as read
   */
  const markAllNotificationsAsRead = useCallback(async (): Promise<boolean> => {
    const result = await apiCall(
      () => api.activity.notifications.markAllNotificationsAsRead(),
      'markAllNotificationsAsRead',
      'markingRead',
      'markingRead'
    );

    if (result?.success) {
      // Mark all notifications as read in local state
      const updatedNotifications = state.notifications.map(notification => ({
        ...notification,
        isRead: true,
      }));
      updateData('notifications', updatedNotifications);
    }

    return result?.success || false;
  }, [state.notifications, apiCall, updateData]);

  /**
   * Fetch notification preferences
   */
  const fetchNotificationPreferences = useCallback(async (force: boolean = false): Promise<any | null> => {
    if (!force && !isStale('preferences') && state.notificationPreferences) {
      return state.notificationPreferences;
    }

    const result = await apiCall(
      () => api.activity.notifications.getNotificationPreferences(),
      'fetchNotificationPreferences',
      'preferences',
      'preferences'
    );

    if (result) {
      updateData('notificationPreferences', result, 'preferences');
    }

    return result;
  }, [state.notificationPreferences, isStale, apiCall, updateData]);

  /**
   * Update notification preferences
   */
  const updateNotificationPreferences = useCallback(async (preferences: any): Promise<boolean> => {
    const result = await apiCall(
      () => api.activity.notifications.updateNotificationPreferences(preferences),
      'updateNotificationPreferences',
      'preferences',
      'preferences'
    );

    if (result?.success) {
      // Refresh preferences
      fetchNotificationPreferences(true);
    }

    return result?.success || false;
  }, [apiCall, fetchNotificationPreferences]);

  /**
   * Subscribe to repository
   */
  const subscribeToRepository = useCallback(async (
    repositoryId: string,
    types: string[] = ['all']
  ): Promise<boolean> => {
    const result = await apiCall(
      () => api.activity.notifications.subscribeToRepository(repositoryId, types),
      'subscribeToRepository',
      'subscribing',
      'subscribing'
    );

    return result?.success || false;
  }, [apiCall]);

  /**
   * Unsubscribe from repository
   */
  const unsubscribeFromRepository = useCallback(async (repositoryId: string): Promise<boolean> => {
    const result = await apiCall(
      () => api.activity.notifications.unsubscribeFromRepository(repositoryId),
      'unsubscribeFromRepository',
      'subscribing',
      'subscribing'
    );

    return result?.success || false;
  }, [apiCall]);

  /**
   * Search activities
   */
  const searchActivities = useCallback(async (
    query: string,
    filters: any = {}
  ): Promise<any | null> => {
    const result = await apiCall(
      () => api.activity.search.searchActivities({
        query,
        filters,
        page: 1,
        limit: opts.pageSize,
        sortBy: 'relevance',
      }),
      'searchActivities',
      'activities',
      'activities'
    );

    return result;
  }, [apiCall, opts.pageSize]);

  /**
   * Get trending activities
   */
  const getTrendingActivities = useCallback(async (
    timeRange: string = '24h',
    limit: number = 10
  ): Promise<Activity[] | null> => {
    const result = await apiCall(
      () => api.activity.search.getTrendingActivities(timeRange as any, limit),
      'getTrendingActivities',
      'activities',
      'activities'
    );

    return result?.activities || null;
  }, [apiCall]);

  /**
   * Connect to real-time updates
   */
  const connectRealTime = useCallback((params: any = {}) => {
    if (!opts.enableRealTime || wsRef.current) return;

    try {
      const ws = api.activity.realtime.createActivityStream({
        types: opts.realTimeTypes,
        ...params,
      });

      if (ws) {
        wsRef.current = ws;

        ws.onopen = () => {
          updateData('isConnected', true);
          setError('connection', null);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'activity_update') {
              opts.onActivityUpdate(data.data);
              
              // Add new activity to the feed
              if (data.data) {
                updateData('activities', [data.data, ...state.activities.slice(0, opts.pageSize - 1)]);
              }
            } else if (data.type === 'notification') {
              opts.onNotification(data.data);
              
              // Add new notification
              if (data.data) {
                updateData('notifications', [data.data, ...state.notifications]);
              }
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setError('connection', 'Real-time connection error');
        };

        ws.onclose = () => {
          updateData('isConnected', false);
          wsRef.current = null;
          
          // Attempt to reconnect after a delay
          if (opts.enableRealTime && mountedRef.current) {
            reconnectTimeoutRef.current = setTimeout(() => {
              connectRealTime(params);
            }, 5000);
          }
        };
      }
    } catch (error) {
      console.error('Failed to connect to real-time updates:', error);
      setError('connection', 'Failed to establish real-time connection');
    }
  }, [opts, state.activities, state.notifications, updateData, setError]);

  /**
   * Disconnect from real-time updates
   */
  const disconnectRealTime = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    updateData('isConnected', false);
  }, [updateData]);

  /**
   * Update filters
   */
  const updateFilters = useCallback((newFilters: Partial<ActivityFilters>) => {
    const updatedFilters = { ...state.filters, ...newFilters };
    updateData('filters', updatedFilters);
    
    // Fetch activities with new filters
    fetchActivities(updatedFilters, 1, true);
  }, [state.filters, updateData, fetchActivities]);

  /**
   * Reset filters
   */
  const resetFilters = useCallback(() => {
    updateData('filters', opts.initialFilters);
    fetchActivities(opts.initialFilters, 1, true);
  }, [opts.initialFilters, updateData, fetchActivities]);

  /**
   * Load more activities
   */
  const loadMore = useCallback(async () => {
    if (state.pagination.hasMore && !isLoading('activities')) {
      await fetchActivities(state.filters, state.pagination.currentPage + 1);
    }
  }, [state.pagination, state.filters, isLoading, fetchActivities]);

  /**
   * Clear cache
   */
  const clearCache = useCallback((type?: keyof ActivityDataState['lastUpdated']) => {
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
          activities: null,
          personalFeed: null,
          repositoryFeed: null,
          currentActivity: null,
          stats: null,
          heatmap: null,
          notifications: null,
          preferences: null,
        },
      }));
    }
  }, []);

  /**
   * Refresh all data
   */
  const refreshAll = useCallback(async () => {
    const promises: Promise<any>[] = [
      fetchActivities(state.filters, 1, true),
    ];

    if (opts.autoFetchPersonalFeed) {
      promises.push(fetchPersonalFeed({}, true));
    }

    if (opts.autoFetchNotifications) {
      promises.push(fetchNotifications({}, true));
    }

    await Promise.allSettled(promises);
  }, [state.filters, opts.autoFetchPersonalFeed, opts.autoFetchNotifications, fetchActivities, fetchPersonalFeed, fetchNotifications]);

  /**
   * Auto-fetch activities on mount
   */
  useEffect(() => {
    if (opts.autoFetchActivities) {
      fetchActivities();
    }
  }, [opts.autoFetchActivities, fetchActivities]);

  /**
   * Auto-fetch personal feed on mount
   */
  useEffect(() => {
    if (opts.autoFetchPersonalFeed) {
      fetchPersonalFeed();
    }
  }, [opts.autoFetchPersonalFeed, fetchPersonalFeed]);

  /**
   * Auto-fetch notifications on mount
   */
  useEffect(() => {
    if (opts.autoFetchNotifications) {
      fetchNotifications();
      fetchNotificationPreferences();
    }
  }, [opts.autoFetchNotifications, fetchNotifications, fetchNotificationPreferences]);

  /**
   * Connect to real-time updates on mount
   */
  useEffect(() => {
    if (opts.enableRealTime) {
      connectRealTime();
    }

    return () => {
      disconnectRealTime();
    };
  }, [opts.enableRealTime, connectRealTime, disconnectRealTime]);

  return {
    state,
    fetchActivities,
    fetchPersonalFeed,
    fetchRepositoryFeed,
    fetchActivity,
    markAsRead,
    markMultipleAsRead,
    fetchStats,
    fetchHeatmap,
    fetchNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    fetchNotificationPreferences,
    updateNotificationPreferences,
    subscribeToRepository,
    unsubscribeFromRepository,
    searchActivities,
    getTrendingActivities,
    connectRealTime,
    disconnectRealTime,
    updateFilters,
    resetFilters,
    loadMore,
    clearCache,
    refreshAll,
    isStale,
    hasError,
    isLoading,
    getUnreadCount,
  };
};

export default useActivity;