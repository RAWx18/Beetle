/**
 * Projects-specific API calls for the Beetle application
 * Handles project management, team collaboration, and project analytics
 */

import { Project, User, Repository } from '@/types/hub';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

/**
 * API error class for projects
 */
export class ProjectsApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ProjectsApiError';
  }
}

/**
 * Generic API request handler with retry logic
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
          throw new ProjectsApiError(
            errorData.message || `HTTP ${response.status}: ${response.statusText}`,
            response.status,
            errorData.code
          );
        }
        
        // Retry on server errors (5xx) if attempts remaining
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }
        
        throw new ProjectsApiError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData.code
        );
      }

      return response.json();
    } catch (error) {
      if (error instanceof ProjectsApiError) {
        throw error;
      }
      
      // Retry on network errors if attempts remaining
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        continue;
      }
      
      throw new ProjectsApiError('Network error occurred', 0);
    }
  }
  
  throw new ProjectsApiError('Max retries exceeded', 0);
}

/**
 * Project CRUD operations
 */
export const projectsCrudApi = {
  /**
   * Get all projects with filtering and pagination
   */
  async getProjects(params?: {
    page?: number;
    limit?: number;
    status?: 'active' | 'completed' | 'archived' | 'on-hold';
    search?: string;
    sortBy?: 'name' | 'created_at' | 'updated_at' | 'status';
    sortOrder?: 'asc' | 'desc';
    repositoryId?: string;
    ownerId?: string;
  }): Promise<{
    projects: Project[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
    hasMore: boolean;
  }> {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.status) searchParams.append('status', params.status);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.sortBy) searchParams.append('sort_by', params.sortBy);
    if (params?.sortOrder) searchParams.append('sort_order', params.sortOrder);
    if (params?.repositoryId) searchParams.append('repository_id', params.repositoryId);
    if (params?.ownerId) searchParams.append('owner_id', params.ownerId);
    
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return apiRequest(`/projects${query}`);
  },

  /**
   * Get project by ID
   */
  async getProject(projectId: string): Promise<Project> {
    return apiRequest<Project>(`/projects/${projectId}`);
  },

  /**
   * Create new project
   */
  async createProject(projectData: {
    name: string;
    description?: string;
    repositoryId: string;
    status?: 'active' | 'completed' | 'archived' | 'on-hold';
    tags?: string[];
    teamMembers?: string[];
    dueDate?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  }): Promise<Project> {
    return apiRequest<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  },

  /**
   * Update project
   */
  async updateProject(
    projectId: string, 
    updates: Partial<Project>
  ): Promise<Project> {
    return apiRequest<Project>(`/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  /**
   * Delete project
   */
  async deleteProject(projectId: string): Promise<{ success: boolean }> {
    return apiRequest(`/projects/${projectId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Archive project
   */
  async archiveProject(projectId: string): Promise<Project> {
    return apiRequest<Project>(`/projects/${projectId}/archive`, {
      method: 'POST',
    });
  },

  /**
   * Restore archived project
   */
  async restoreProject(projectId: string): Promise<Project> {
    return apiRequest<Project>(`/projects/${projectId}/restore`, {
      method: 'POST',
    });
  },
};

/**
 * Project team management
 */
export const projectsTeamApi = {
  /**
   * Get project team members
   */
  async getTeamMembers(projectId: string): Promise<{
    members: Array<User & { role: string; joinedAt: string; permissions: string[] }>;
    totalCount: number;
  }> {
    return apiRequest(`/projects/${projectId}/team`);
  },

  /**
   * Add team member to project
   */
  async addTeamMember(
    projectId: string, 
    userId: string, 
    role: string = 'member'
  ): Promise<{ success: boolean }> {
    return apiRequest(`/projects/${projectId}/team`, {
      method: 'POST',
      body: JSON.stringify({ userId, role }),
    });
  },

  /**
   * Update team member role
   */
  async updateTeamMemberRole(
    projectId: string, 
    userId: string, 
    role: string
  ): Promise<{ success: boolean }> {
    return apiRequest(`/projects/${projectId}/team/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  },

  /**
   * Remove team member from project
   */
  async removeTeamMember(
    projectId: string, 
    userId: string
  ): Promise<{ success: boolean }> {
    return apiRequest(`/projects/${projectId}/team/${userId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get team member permissions
   */
  async getTeamMemberPermissions(
    projectId: string, 
    userId: string
  ): Promise<{ permissions: string[] }> {
    return apiRequest(`/projects/${projectId}/team/${userId}/permissions`);
  },
};

/**
 * Project analytics and insights
 */
export const projectsAnalyticsApi = {
  /**
   * Get project analytics
   */
  async getProjectAnalytics(
    projectId: string,
    timeRange?: '7d' | '30d' | '90d' | '1y' | 'all'
  ): Promise<{
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
  }> {
    const query = timeRange ? `?range=${timeRange}` : '';
    return apiRequest(`/projects/${projectId}/analytics${query}`);
  },

  /**
   * Get project performance metrics
   */
  async getProjectMetrics(projectId: string): Promise<{
    velocity: {
      current: number;
      average: number;
      trend: 'up' | 'down' | 'stable';
    };
    quality: {
      codeReviewCoverage: number;
      testCoverage: number;
      bugRate: number;
    };
    collaboration: {
      avgResponseTime: number;
      pairProgrammingHours: number;
      knowledgeSharing: number;
    };
  }> {
    return apiRequest(`/projects/${projectId}/metrics`);
  },

  /**
   * Get project timeline
   */
  async getProjectTimeline(
    projectId: string,
    limit?: number
  ): Promise<{
    events: Array<{
      id: string;
      type: 'milestone' | 'release' | 'task_completed' | 'team_change';
      title: string;
      description: string;
      date: string;
      user: User;
      metadata?: Record<string, any>;
    }>;
    hasMore: boolean;
  }> {
    const query = limit ? `?limit=${limit}` : '';
    return apiRequest(`/projects/${projectId}/timeline${query}`);
  },
};

/**
 * Project templates and initialization
 */
export const projectsTemplateApi = {
  /**
   * Get available project templates
   */
  async getProjectTemplates(): Promise<{
    templates: Array<{
      id: string;
      name: string;
      description: string;
      category: string;
      tags: string[];
      defaultSettings: Record<string, any>;
    }>;
  }> {
    return apiRequest('/projects/templates');
  },

  /**
   * Create project from template
   */
  async createProjectFromTemplate(
    templateId: string,
    projectData: {
      name: string;
      description?: string;
      repositoryId: string;
      customSettings?: Record<string, any>;
    }
  ): Promise<Project> {
    return apiRequest<Project>('/projects/from-template', {
      method: 'POST',
      body: JSON.stringify({
        templateId,
        ...projectData,
      }),
    });
  },

  /**
   * Save project as template
   */
  async saveAsTemplate(
    projectId: string,
    templateData: {
      name: string;
      description: string;
      category: string;
      tags: string[];
      includeTeam?: boolean;
      includeSettings?: boolean;
    }
  ): Promise<{ templateId: string }> {
    return apiRequest(`/projects/${projectId}/save-as-template`, {
      method: 'POST',
      body: JSON.stringify(templateData),
    });
  },
};

/**
 * Project search and discovery
 */
export const projectsSearchApi = {
  /**
   * Search projects across the platform
   */
  async searchProjects(params: {
    query: string;
    filters?: {
      status?: string[];
      tags?: string[];
      language?: string[];
      dateRange?: { start: string; end: string };
    };
    page?: number;
    limit?: number;
  }): Promise<{
    projects: Project[];
    totalCount: number;
    facets: {
      status: Record<string, number>;
      tags: Record<string, number>;
      languages: Record<string, number>;
    };
  }> {
    return apiRequest('/projects/search', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  /**
   * Get trending projects
   */
  async getTrendingProjects(
    timeRange: '24h' | '7d' | '30d' = '7d',
    limit: number = 10
  ): Promise<{
    projects: Array<Project & { trendingScore: number; growthRate: number }>;
  }> {
    return apiRequest(`/projects/trending?range=${timeRange}&limit=${limit}`);
  },

  /**
   * Get recommended projects for user
   */
  async getRecommendedProjects(limit: number = 5): Promise<{
    projects: Array<Project & { recommendationScore: number; reason: string }>;
  }> {
    return apiRequest(`/projects/recommended?limit=${limit}`);
  },
};

/**
 * Export all projects API modules
 */
export const projectsApi = {
  crud: projectsCrudApi,
  team: projectsTeamApi,
  analytics: projectsAnalyticsApi,
  templates: projectsTemplateApi,
  search: projectsSearchApi,
};

export default projectsApi;