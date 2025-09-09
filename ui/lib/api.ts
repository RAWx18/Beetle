// API service for Beetle backend integration

const API_BASE_URL = 'http://localhost:8000/api/v1';

interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    status: number;
  };
}

class ApiService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('gitmesh_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: {
            message: data.error?.message || 'Request failed',
            status: response.status,
          },
        };
      }

      return { data };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Network error',
          status: 0,
        },
      };
    }
  }

  // Authentication
  async getGitHubAuthUrl(): Promise<ApiResponse<{ authUrl: string; state: string }>> {
    return this.request('/auth/github/url');
  }

  async validateToken(): Promise<ApiResponse<{ valid: boolean; user?: any }>> {
    return this.request('/auth/validate');
  }

  async logout(): Promise<ApiResponse<{ message: string; success: boolean }>> {
    return this.request('/auth/logout', { method: 'POST' });
  }

  async getUserProfile(): Promise<ApiResponse<{ user: any }>> {
    return this.request('/auth/profile');
  }

  // GitHub Integration
  async getUserRepositories(page = 1, perPage = 100): Promise<ApiResponse<{ repositories: any[]; pagination: any }>> {
    return this.request(`/github/repositories?page=${page}&per_page=${perPage}`);
  }

  async getRepositoryDetails(owner: string, repo: string): Promise<ApiResponse<{ repository: any }>> {
    return this.request(`/github/repositories/${owner}/${repo}`);
  }

  async getRepositoryBranches(owner: string, repo: string): Promise<ApiResponse<{ branches: any[]; total: number }>> {
    return this.request<{ branches: any[]; total: number }>(`/github/repositories/${owner}/${repo}/branches`);
  }

  async getRepositoryIssues(owner: string, repo: string, state = 'open', page = 1): Promise<ApiResponse<{ issues: any[]; pagination: any }>> {
    return this.request(`/github/repositories/${owner}/${repo}/issues?state=${state}&page=${page}`);
  }

  async getRepositoryPullRequests(owner: string, repo: string, state = 'open', page = 1): Promise<ApiResponse<{ pullRequests: any[]; pagination: any }>> {
    return this.request(`/github/repositories/${owner}/${repo}/pulls?state=${state}&page=${page}`);
  }

  async getRepositoryCommits(owner: string, repo: string, branch = 'main', page = 1): Promise<ApiResponse<{ commits: any[]; pagination: any }>> {
    return this.request(`/github/repositories/${owner}/${repo}/commits?branch=${branch}&page=${page}`);
  }

  async getUserActivity(username?: string, page = 1): Promise<ApiResponse<{ activity: any[]; pagination: any }>> {
    const params = new URLSearchParams({ page: page.toString() });
    if (username) params.append('username', username);
    return this.request(`/github/activity?${params}`);
  }

  async searchRepositories(query: string, sort = 'stars', order = 'desc', page = 1): Promise<ApiResponse<any>> {
    const params = new URLSearchParams({
      q: query,
      sort,
      order,
      page: page.toString(),
    });
    return this.request(`/github/search/repositories?${params}`);
  }

  async getRepositoryStats(owner: string, repo: string): Promise<ApiResponse<any>> {
    return this.request(`/github/repositories/${owner}/${repo}/stats`);
  }

  async getDashboardData(): Promise<ApiResponse<any>> {
    return this.request('/github/dashboard');
  }

  async getBranchData(owner: string, repo: string, branch: string, params?: { since?: string }): Promise<ApiResponse<any>> {
    const queryString = params?.since ? `?since=${params.since}` : '';
    return this.request(`/github/repositories/${owner}/${repo}/branches/${branch}${queryString}`);
  }

  // Analytics
  async getAnalyticsOverview(): Promise<ApiResponse<any>> {
    return this.request('/analytics/overview');
  }

  async getRepositoryAnalytics(owner: string, repo: string): Promise<ApiResponse<any>> {
    return this.request(`/analytics/repositories/${owner}/${repo}`);
  }

  async getBranchAnalytics(owner: string, repo: string, branch: string): Promise<ApiResponse<any>> {
    return this.request(`/analytics/repositories/${owner}/${repo}/branches/${branch}`);
  }

  async getContributionAnalytics(period = 'month', username?: string): Promise<ApiResponse<any>> {
    const params = new URLSearchParams({ period });
    if (username) params.append('username', username);
    return this.request(`/analytics/contributions?${params}`);
  }

  async getInsights(): Promise<ApiResponse<any>> {
    return this.request('/analytics/insights');
  }

  // Projects
  async getProjects(): Promise<ApiResponse<{ projects: any[]; total: number }>> {
    return this.request('/projects');
  }

  async getProject(projectId: string): Promise<ApiResponse<{ project: any }>> {
    return this.request(`/projects/${projectId}`);
  }

  async createProject(projectData: any): Promise<ApiResponse<{ message: string; project: any }>> {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  }

  async updateProject(projectId: string, updates: any): Promise<ApiResponse<{ message: string; project: any }>> {
    return this.request(`/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async getProjectBranches(projectId: string): Promise<ApiResponse<{ branches: any[] }>> {
    return this.request(`/projects/${projectId}/branches`);
  }

  async getProjectAnalytics(projectId: string): Promise<ApiResponse<any>> {
    return this.request(`/projects/${projectId}/analytics`);
  }

  async importRepository(repositoryUrl: string, branches?: string[], settings?: any): Promise<ApiResponse<{ message: string; project: any }>> {
    return this.request('/projects/import', {
      method: 'POST',
      body: JSON.stringify({
        repository_url: repositoryUrl,
        branches: branches || [],
        settings: settings || {},
      }),
    });
  }

  async getBeetleProjectData(projectId: string): Promise<ApiResponse<any>> {
    return this.request(`/projects/${projectId}/beetle`);
  }

  // User Notes
  async getNotes(): Promise<ApiResponse<{ notes: any[] }>> {
    return this.request('/auth/notes');
  }
  async addNote(note: any): Promise<ApiResponse<{ notes: any[] }>> {
    return this.request('/auth/notes', {
      method: 'POST',
      body: JSON.stringify(note),
    });
  }
  async updateNote(noteId: string, updates: any): Promise<ApiResponse<{ notes: any[] }>> {
    return this.request(`/auth/notes/${noteId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }
  async deleteNote(noteId: string): Promise<ApiResponse<{ notes: any[] }>> {
    return this.request(`/auth/notes/${noteId}`, {
      method: 'DELETE',
    });
  }
  // Saved Filters
  async getFilters(): Promise<ApiResponse<{ filters: any[] }>> {
    return this.request('/auth/filters');
  }
  async addFilter(filter: any): Promise<ApiResponse<{ filters: any[] }>> {
    return this.request('/auth/filters', {
      method: 'POST',
      body: JSON.stringify(filter),
    });
  }
  async updateFilter(filterId: string, updates: any): Promise<ApiResponse<{ filters: any[] }>> {
    return this.request(`/auth/filters/${filterId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }
  async deleteFilter(filterId: string): Promise<ApiResponse<{ filters: any[] }>> {
    return this.request(`/auth/filters/${filterId}`, {
      method: 'DELETE',
    });
  }
  // Pinned Items
  async getPins(): Promise<ApiResponse<{ pins: any[] }>> {
    return this.request('/auth/pins');
  }
  async addPin(pin: any): Promise<ApiResponse<{ pins: any[] }>> {
    return this.request('/auth/pins', {
      method: 'POST',
      body: JSON.stringify(pin),
    });
  }
  async deletePin(pinId: string): Promise<ApiResponse<{ pins: any[] }>> {
    return this.request(`/auth/pins/${pinId}`, {
      method: 'DELETE',
    });
  }
  // Smart Suggestions
  async getSmartSuggestions(projectId: string, branch: string): Promise<ApiResponse<{ suggestions: any[] }>> {
    return this.request(`/projects/${projectId}/branches/${branch}/suggestions`);
  }

  // User Settings
  async getUserSettings(): Promise<ApiResponse<{ settings: any }>> {
    return this.request('/auth/settings');
  }

  async updateUserSettings(settings: any): Promise<ApiResponse<{ settings: any; message: string }>> {
    return this.request('/auth/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async resetUserSettings(): Promise<ApiResponse<{ settings: any; message: string }>> {
    return this.request('/auth/settings/reset', {
      method: 'POST',
    });
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Export types for better TypeScript support
export interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  private: boolean;
  fork: boolean;
  language: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  updated_at: string;
  created_at: string;
  pushed_at: string;
  owner: {
    login: string;
    avatar_url: string;
    type: string;
  };
  topics: string[];
  license: any;
  archived: boolean;
  disabled: boolean;
  homepage: string;
  html_url: string;
  clone_url: string;
  ssh_url: string;
}

export interface Branch {
  name: string;
  commit: {
    sha: string;
    url: string;
    html_url: string;
    author: any;
    committer: any;
    message: string;
    tree: any;
    parents: any[];
  };
  protected: boolean;
  protection: any;
}

export interface Issue {
  id: number;
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  locked: boolean;
  assignees: any[];
  labels: any[];
  user: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
  updated_at: string;
  closed_at: string;
  html_url: string;
  comments: number;
  reactions: any;
  milestone: any;
  pull_request: any;
}

export interface PullRequest {
  id: number;
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  locked: boolean;
  draft: boolean;
  merged: boolean;
  mergeable: boolean;
  mergeable_state: string;
  merged_at: string;
  closed_at: string;
  user: {
    login: string;
    avatar_url: string;
  };
  assignees: any[];
  requested_reviewers: any[];
  labels: any[];
  head: {
    label: string;
    ref: string;
    sha: string;
    user: any;
    repo: any;
  };
  base: {
    label: string;
    ref: string;
    sha: string;
    user: any;
    repo: any;
  };
  created_at: string;
  updated_at: string;
  html_url: string;
  comments: number;
  review_comments: number;
  commits: number;
  additions: number;
  deletions: number;
  changed_files: number;
}

export interface Commit {
  sha: string;
  node_id: string;
  commit: {
    author: any;
    committer: any;
    message: string;
    tree: any;
    url: string;
    comment_count: number;
    verification: any;
  };
  url: string;
  html_url: string;
  comments_url: string;
  author: any;
  committer: any;
  parents: any[];
} 