/**
 * Base API utilities and common functionality
 * Provides shared error handling, retry logic, and request utilities
 */

/**
 * Generic API error class
 */
export class BaseApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'BaseApiError';
  }

  /**
   * Check if error is a network error
   */
  isNetworkError(): boolean {
    return this.status === 0;
  }

  /**
   * Check if error is a client error (4xx)
   */
  isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  /**
   * Check if error is a server error (5xx)
   */
  isServerError(): boolean {
    return this.status >= 500 && this.status < 600;
  }

  /**
   * Check if error is retryable
   */
  isRetryable(): boolean {
    return this.isNetworkError() || this.isServerError();
  }
}

/**
 * Request configuration interface
 */
export interface RequestConfig extends RequestInit {
  retries?: number;
  retryDelay?: number;
  timeout?: number;
  skipAuth?: boolean;
}

/**
 * Response wrapper interface
 */
export interface ApiResponse<T = any> {
  data: T;
  status: number;
  headers: Headers;
  ok: boolean;
}

/**
 * Pagination interface
 */
export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasMore: boolean;
  nextCursor?: string;
  prevCursor?: string;
}

/**
 * Base API client class
 */
export class BaseApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private defaultRetries: number;
  private defaultTimeout: number;

  constructor(
    baseUrl: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
    options: {
      defaultHeaders?: Record<string, string>;
      defaultRetries?: number;
      defaultTimeout?: number;
    } = {}
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...options.defaultHeaders,
    };
    this.defaultRetries = options.defaultRetries || 3;
    this.defaultTimeout = options.defaultTimeout || 30000; // 30 seconds
  }

  /**
   * Get authentication token
   */
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  }

  /**
   * Build request headers
   */
  private buildHeaders(config?: RequestConfig): Record<string, string> {
    const headers = { ...this.defaultHeaders };

    // Add authorization header if not skipped
    if (!config?.skipAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    // Merge with custom headers
    if (config?.headers) {
      Object.assign(headers, config.headers);
    }

    return headers;
  }

  /**
   * Create AbortController with timeout
   */
  private createAbortController(timeout: number): AbortController {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), timeout);
    return controller;
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(attempt: number, baseDelay: number = 1000): number {
    const exponentialDelay = Math.pow(2, attempt) * baseDelay;
    const jitter = Math.random() * 0.1 * exponentialDelay; // Add 10% jitter
    return Math.min(exponentialDelay + jitter, 30000); // Max 30 seconds
  }

  /**
   * Sleep for specified duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Make HTTP request with retry logic
   */
  async request<T = any>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const retries = config.retries ?? this.defaultRetries;
    const timeout = config.timeout ?? this.defaultTimeout;
    const retryDelay = config.retryDelay ?? 1000;

    let lastError: BaseApiError;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = this.createAbortController(timeout);
        
        const response = await fetch(url, {
          ...config,
          headers: this.buildHeaders(config),
          signal: controller.signal,
        });

        // Handle successful response
        if (response.ok) {
          const data = await response.json();
          return {
            data,
            status: response.status,
            headers: response.headers,
            ok: response.ok,
          };
        }

        // Handle error response
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch {
          // Response body is not JSON
        }

        const error = new BaseApiError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData.code,
          errorData
        );

        // Don't retry client errors (4xx)
        if (error.isClientError()) {
          throw error;
        }

        lastError = error;

        // Retry on server errors (5xx) if attempts remaining
        if (attempt < retries && error.isRetryable()) {
          const delay = this.calculateRetryDelay(attempt, retryDelay);
          await this.sleep(delay);
          continue;
        }

        throw error;

      } catch (error) {
        if (error instanceof BaseApiError) {
          lastError = error;
        } else if (error instanceof DOMException && error.name === 'AbortError') {
          lastError = new BaseApiError('Request timeout', 408);
        } else {
          lastError = new BaseApiError('Network error occurred', 0);
        }

        // Retry on network errors if attempts remaining
        if (attempt < retries && lastError.isRetryable()) {
          const delay = this.calculateRetryDelay(attempt, retryDelay);
          await this.sleep(delay);
          continue;
        }

        throw lastError;
      }
    }

    throw lastError!;
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T = any>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T = any>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  /**
   * Build query string from parameters
   */
  buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(item => searchParams.append(key, String(item)));
        } else {
          searchParams.append(key, String(value));
        }
      }
    });
    
    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  /**
   * Upload file with progress tracking
   */
  async uploadFile<T = any>(
    endpoint: string,
    file: File,
    options: {
      fieldName?: string;
      additionalData?: Record<string, any>;
      onProgress?: (progress: number) => void;
      config?: RequestConfig;
    } = {}
  ): Promise<ApiResponse<T>> {
    const { fieldName = 'file', additionalData = {}, onProgress, config = {} } = options;
    
    const formData = new FormData();
    formData.append(fieldName, file);
    
    // Add additional form data
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, String(value));
    });

    // Remove Content-Type header to let browser set it with boundary
    const headers = this.buildHeaders(config);
    delete headers['Content-Type'];

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener('load', () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({
              data,
              status: xhr.status,
              headers: new Headers(), // XMLHttpRequest doesn't provide easy access to response headers
              ok: true,
            });
          } else {
            reject(new BaseApiError(
              data.message || `HTTP ${xhr.status}: ${xhr.statusText}`,
              xhr.status,
              data.code,
              data
            ));
          }
        } catch (error) {
          reject(new BaseApiError('Invalid JSON response', xhr.status));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new BaseApiError('Network error occurred', 0));
      });

      xhr.addEventListener('timeout', () => {
        reject(new BaseApiError('Request timeout', 408));
      });

      xhr.open('POST', `${this.baseUrl}${endpoint}`);
      
      // Set headers
      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });

      // Set timeout
      xhr.timeout = config.timeout ?? this.defaultTimeout;

      xhr.send(formData);
    });
  }
}

/**
 * Default API client instance
 */
export const apiClient = new BaseApiClient();

/**
 * Utility functions for common API operations
 */
export const apiUtils = {
  /**
   * Check if error is retryable
   */
  isRetryableError(error: any): boolean {
    return error instanceof BaseApiError && error.isRetryable();
  },

  /**
   * Extract error message from API error
   */
  getErrorMessage(error: any): string {
    if (error instanceof BaseApiError) {
      return error.message;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return 'An unknown error occurred';
  },

  /**
   * Format API error for user display
   */
  formatErrorForUser(error: any): string {
    if (error instanceof BaseApiError) {
      switch (error.status) {
        case 0:
          return 'Network connection error. Please check your internet connection.';
        case 401:
          return 'Authentication required. Please log in again.';
        case 403:
          return 'You do not have permission to perform this action.';
        case 404:
          return 'The requested resource was not found.';
        case 408:
          return 'Request timeout. Please try again.';
        case 429:
          return 'Too many requests. Please wait a moment and try again.';
        case 500:
          return 'Server error. Please try again later.';
        case 503:
          return 'Service temporarily unavailable. Please try again later.';
        default:
          return error.message || 'An error occurred. Please try again.';
      }
    }
    return 'An unexpected error occurred. Please try again.';
  },

  /**
   * Create pagination parameters
   */
  createPaginationParams(page: number = 1, limit: number = 20): Record<string, any> {
    return { page, limit };
  },

  /**
   * Create date range parameters
   */
  createDateRangeParams(start: Date, end: Date): Record<string, string> {
    return {
      start_date: start.toISOString(),
      end_date: end.toISOString(),
    };
  },
};

export default apiClient;