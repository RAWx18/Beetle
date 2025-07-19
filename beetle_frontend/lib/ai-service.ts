/**
 * AI Service for interacting with the multi-agent system
 */

export interface ChatRequest {
  message: string;
  repository_id?: string;
  branch?: string;
  context_results?: any[];
}

export interface ChatResponse {
  success: boolean;
  answer?: string;
  sources?: string[];
  confidence?: number;
  error?: string;
}

export interface SearchRequest {
  query: string;
  repository_id?: string;
  branch?: string;
  max_results?: number;
  similarity_threshold?: number;
}

export interface SearchResponse {
  success: boolean;
  results?: Array<{
    title: string;
    content: string;
    source_type: string;
    similarity_score: number;
  }>;
  total_found?: number;
  error?: string;
}

export interface ImportRequest {
  repository_id?: string;
  branch?: string;
  data_types?: string[];
  github_token?: string;
}

export interface ImportResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

class AIService {
  private baseUrl: string;
  private token: string | null;

  constructor() {
    this.baseUrl = '/api/ai';
    this.token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error(`AI Service Error (${endpoint}):`, error);
      throw error;
    }
  }

  /**
   * Send a chat message to the multi-agent system
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    return this.makeRequest<ChatResponse>('/chat', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Search for relevant documents using the multi-agent system
   */
  async search(request: SearchRequest): Promise<SearchResponse> {
    return this.makeRequest<SearchResponse>('/search', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Import GitHub data using the multi-agent system
   */
  async importGitHub(request: ImportRequest): Promise<ImportResponse> {
    return this.makeRequest<ImportResponse>('/import-github', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Import files using the multi-agent system
   */
  async importFiles(
    files: File[],
    repository_id?: string,
    branch?: string
  ): Promise<ImportResponse> {
    const formData = new FormData();
    
    if (repository_id) {
      formData.append('repository_id', repository_id);
    }
    if (branch) {
      formData.append('branch', branch);
    }
    formData.append('source_type', 'file');

    files.forEach((file) => {
      formData.append('files', file);
    });

    const url = `${this.baseUrl}/import`;
    const config: RequestInit = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
      body: formData,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('AI Service Error (import):', error);
      throw error;
    }
  }

  /**
   * Get the status of the AI system
   */
  async getStatus(): Promise<any> {
    return this.makeRequest('/status');
  }

  /**
   * Update the authentication token
   */
  updateToken(token: string | null): void {
    this.token = token;
  }
}

// Export a singleton instance
export const aiService = new AIService();

// Export the class for testing or custom instances
export default AIService; 