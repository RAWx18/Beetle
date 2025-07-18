const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface PageContent {
  title: string;
  description: string;
  sections?: Array<{
    title: string;
    content: string;
    icon?: string;
  }>;
  features?: Array<{
    title: string;
    description: string;
    skills?: string[];
  }>;
  quickStart?: string[];
  areas?: Array<{
    title: string;
    description: string;
    skills: string[];
  }>;
  setup?: string[];
  workflow?: string[];
  lastUpdated?: string;
  updatedBy?: string;
}

export interface ContentResponse {
  content: PageContent;
  lastUpdated: string | null;
  updatedBy: string | null;
}

export type PageType = 'why' | 'how' | 'contribute';

export class ContentAPI {
  private static async request(url: string, options: RequestInit = {}) {
    const token = localStorage.getItem('authToken');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  static async getPageContent(projectId: string, pageType: PageType): Promise<ContentResponse> {
    return this.request(`/projects/${projectId}/content/${pageType}`);
  }

  static async updatePageContent(
    projectId: string, 
    pageType: PageType, 
    content: PageContent
  ): Promise<{ message: string; content: PageContent }> {
    return this.request(`/projects/${projectId}/content/${pageType}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
  }

  static async isProjectOwner(projectId: string): Promise<boolean> {
    try {
      const response = await this.request(`/projects/${projectId}`);
      const token = localStorage.getItem('authToken');
      if (!token) return false;
      
      // Simple check - in a real app, you'd have a dedicated endpoint
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return response.project?.created_by === user.id;
    } catch (error) {
      console.error('Error checking project ownership:', error);
      return false;
    }
  }
}