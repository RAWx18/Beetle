/**
 * API modules index
 * Centralized exports for all API functionality
 */

// Base API utilities
export { 
  BaseApiClient, 
  BaseApiError, 
  apiClient, 
  apiUtils,
  type RequestConfig,
  type ApiResponse,
  type PaginatedResponse
} from './base-api';

// Hub API
export { 
  hubApi, 
  hubOverviewApi, 
  hubProjectsApi, 
  hubActivityApi, 
  hubInsightsApi,
  ApiError as HubApiError
} from './hub-api';

// Projects API
export { 
  projectsApi, 
  projectsCrudApi, 
  projectsTeamApi, 
  projectsAnalyticsApi, 
  projectsTemplateApi, 
  projectsSearchApi,
  ProjectsApiError
} from './projects-api';

// Activity API
export { 
  activityApi, 
  activityFeedApi, 
  activityStatsApi, 
  activityNotificationsApi, 
  activityRealtimeApi, 
  activitySearchApi,
  ActivityApiError
} from './activity-api';

// Unified API interface
export const api = {
  hub: hubApi,
  projects: projectsApi,
  activity: activityApi,
};

export default api;