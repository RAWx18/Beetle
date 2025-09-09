/**
 * AI Service for interacting with the multi-agent system
 */

export interface ChatRequest {
  message: string;
  repository_id?: string;
  branch?: string;
  context_results?: Array<{
    content: string;
    source: string;
    score: number;
  }>;
}

export interface ChatResponse {
  success: boolean;
  answer?: string;
  sources?: string[];
  confidence?: number;
  error?: string;
}

// New interfaces for file-based chat
export interface FileData {
  path: string;
  content: string;
  branch: string;
  contentHash?: string;
}

export interface FileChatRequest {
  message: string;
  files: FileData[];
  repository_id: string;
  timestamp?: string;
  session_id?: string;
}

export interface FileChatResponse {
  success: boolean;
  response: string;
  referenced_files: string[];
  code_snippets: Array<{
    language: string;
    code: string;
    filePath?: string;
  }>;
  data?: {
    agent_used?: string;
    processing_time?: number;
    tokens_used?: number;
    files_processed?: number;
    context_length?: number;
    // Phase 5: RAG Integration
    chunks_retrieved?: number;
    confidence_score?: number;
    rag_enabled?: boolean;
    context_coverage?: number;
  };
  error?: string;
}

export interface MessageStatus {
  id: string;
  status: 'sending' | 'sent' | 'failed';
  timestamp: Date;
  retryCount: number;
}

export interface ChatSession {
  id: string;
  title: string;
  files: FileData[];
  lastActivity: Date;
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
  data?: Record<string, unknown>;
  error?: string;
}

// WebSocket event types
export interface WebSocketMessage {
  type: 'message' | 'status' | 'error' | 'typing';
  data: {
    message?: string;
    status?: string;
    error?: string;
    typing?: boolean;
    response?: string;
    referenced_files?: string[];
    code_snippets?: Array<{
      language: string;
      code: string;
      filePath?: string;
    }>;
  };
  session_id?: string;
}

class AIService {
  private baseUrl: string;
  private token: string | null;
  private ws: WebSocket | null = null;
  private wsReconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageQueue: Array<{ 
    request: FileChatRequest; 
    resolve: (value: FileChatResponse) => void; 
    reject: (reason: Error) => void; 
  }> = [];
  private isProcessingQueue = false;
  private retryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
  };

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
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
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    const url = `${this.baseUrl}/api/ai${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : this.retryConfig.baseDelay;
        await this.delay(delay);
        return this.makeRequest<T>(endpoint, options, retryCount);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error(`AI Service Error (${endpoint}):`, error);
      
      // Retry logic for network errors
      if (retryCount < this.retryConfig.maxRetries && this.isRetryableError(error)) {
        const delay = Math.min(
          this.retryConfig.baseDelay * Math.pow(2, retryCount),
          this.retryConfig.maxDelay
        );
        await this.delay(delay);
        return this.makeRequest<T>(endpoint, options, retryCount + 1);
      }
      
      throw error;
    }
  }

  private isRetryableError(error: unknown): boolean {
    // Retry on network errors, timeouts, and 5xx server errors
    if (error instanceof Error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return true;
      }
      if (error.message && error.message.includes('Failed to fetch')) {
        return true;
      }
    }
    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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
   * Send a file-based chat message
   */
  async chatWithFiles(request: FileChatRequest): Promise<FileChatResponse> {
    // Add timestamp if not provided
    if (!request.timestamp) {
      request.timestamp = new Date().toISOString();
    }

    return this.makeRequest<FileChatResponse>('/chat', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Queue a chat message for processing
   */
  async queueChatMessage(request: FileChatRequest): Promise<FileChatResponse> {
    return new Promise((resolve, reject) => {
      this.messageQueue.push({ request, resolve, reject });
      this.processMessageQueue();
    });
  }

  /**
   * Process the message queue
   */
  private async processMessageQueue() {
    if (this.isProcessingQueue || this.messageQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.messageQueue.length > 0) {
      const { request, resolve, reject } = this.messageQueue.shift()!;
      
      try {
        const response = await this.chatWithFiles(request);
        resolve(response);
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
      
      // Small delay between messages to prevent overwhelming the server
      await this.delay(100);
    }

    this.isProcessingQueue = false;
  }

  /**
   * Initialize WebSocket connection for real-time chat
   */
  connectWebSocket(sessionId: string, onMessage?: (message: WebSocketMessage) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = this.baseUrl.replace('http', 'ws') + `/api/ai/chat/ws?session_id=${sessionId}`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.wsReconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            if (onMessage) {
              onMessage(message);
            }
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          if (event.code !== 1000 && this.wsReconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectWebSocket(sessionId, onMessage);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Reconnect WebSocket with exponential backoff
   */
  private async reconnectWebSocket(sessionId: string, onMessage?: (message: WebSocketMessage) => void) {
    this.wsReconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.wsReconnectAttempts - 1);
    
    console.log(`Reconnecting WebSocket in ${delay}ms (attempt ${this.wsReconnectAttempts})`);
    
    setTimeout(() => {
      this.connectWebSocket(sessionId, onMessage).catch(error => {
        console.error('WebSocket reconnection failed:', error);
      });
    }, delay);
  }

  /**
   * Send message via WebSocket
   */
  sendWebSocketMessage(message: WebSocketMessage): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  /**
   * Close WebSocket connection
   */
  disconnectWebSocket(): void {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
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

    const url = `${this.baseUrl}/api/ai/import`;
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
  async getStatus(): Promise<Record<string, unknown>> {
    return this.makeRequest<Record<string, unknown>>('/status');
  }

  /**
   * Update the authentication token
   */
  updateToken(token: string | null): void {
    this.token = token;
  }

  /**
   * Get WebSocket connection status
   */
  getWebSocketStatus(): 'connecting' | 'open' | 'closing' | 'closed' {
    if (!this.ws) return 'closed';
    return this.ws.readyState === WebSocket.CONNECTING ? 'connecting' :
           this.ws.readyState === WebSocket.OPEN ? 'open' :
           this.ws.readyState === WebSocket.CLOSING ? 'closing' : 'closed';
  }

  /**
   * Clear the message queue
   */
  clearMessageQueue(): void {
    this.messageQueue = [];
  }
}

// Export a singleton instance
export const aiService = new AIService();

// Export the class for testing or custom instances
export default AIService; 