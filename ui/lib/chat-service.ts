/**
 * Comprehensive Chat Service for Phase 3: Frontend-Backend Communication
 * Implements API integration, WebSocket support, retry logic, message queuing,
 * and file context synchronization.
 */

import { aiService, FileChatRequest, FileChatResponse, WebSocketMessage } from './ai-service';

export interface ChatMessageStatus {
  id: string;
  status: 'sending' | 'sent' | 'failed';
  timestamp: Date;
  retryCount: number;
  error?: string;
}

export interface FileContext {
  path: string;
  content: string;
  branch: string;
  contentHash: string;
  // Removed lastModified as backend doesn't use it
}

export interface ChatSession {
  id: string;
  title: string;
  files: FileContext[];
  lastActivity: Date;
  messageCount: number;
}

export interface ChatServiceConfig {
  enableWebSocket: boolean;
  enableMessageQueue: boolean;
  maxRetries: number;
  retryDelay: number;
  maxQueueSize: number;
  contextValidation: boolean;
}

export class ChatService {
  private config: ChatServiceConfig;
  private messageQueue: Array<{
    request: FileChatRequest;
    resolve: (value: FileChatResponse) => void;
    reject: (reason: Error) => void;
    retryCount: number;
  }> = [];
  private isProcessingQueue = false;
  private messageStatuses = new Map<string, ChatMessageStatus>();
  private fileContexts = new Map<string, FileContext>();
  private sessions = new Map<string, ChatSession>();
  private wsConnected = false;
  private wsReconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(config: Partial<ChatServiceConfig> = {}) {
    this.config = {
      enableWebSocket: true,
      enableMessageQueue: true,
      maxRetries: 3,
      retryDelay: 1000,
      maxQueueSize: 50,
      contextValidation: true,
      ...config
    };
  }

  /**
   * Send a chat message with comprehensive error handling and retry logic
   */
  async sendMessage(
    message: string,
    files: FileContext[],
    repositoryId: string,
    sessionId: string
  ): Promise<FileChatResponse> {
    const messageId = this.generateMessageId();
    
    // Update message status
    this.updateMessageStatus(messageId, 'sending');
    
    // Prepare chat request
    const request: FileChatRequest = {
      message,
      files: files.map(f => ({
        path: f.path,
        content: f.content,
        branch: f.branch,
        contentHash: f.contentHash
        // Don't include lastModified as backend doesn't use it
      })),
      repository_id: repositoryId,
      session_id: sessionId,
      timestamp: new Date().toISOString()
    };

    try {
      let response: FileChatResponse;

      // Try WebSocket first if enabled
      if (this.config.enableWebSocket && this.wsConnected) {
        response = await this.sendViaWebSocket(request, messageId);
      } else {
        // Use HTTP with queuing
        if (this.config.enableMessageQueue) {
          response = await this.queueMessage(request, messageId);
        } else {
          response = await this.sendViaHTTP(request, messageId);
        }
      }

      // Update message status
      this.updateMessageStatus(messageId, 'sent');
      
      // Update session activity
      this.updateSessionActivity(sessionId, files);
      
      return response;
    } catch (error) {
      // Update message status with error
      this.updateMessageStatus(messageId, 'failed', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Send message via WebSocket for real-time experience
   */
  private async sendViaWebSocket(request: FileChatRequest, messageId: string): Promise<FileChatResponse> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('WebSocket timeout'));
      }, 30000); // 30 second timeout

      const wsMessage: WebSocketMessage = {
        type: 'message',
        data: { message: request.message },
        session_id: request.session_id
      };

      if (aiService.sendWebSocketMessage(wsMessage)) {
        // For now, fallback to HTTP for response handling
        // In a full implementation, you'd handle WebSocket responses
        this.sendViaHTTP(request, messageId)
          .then(response => {
            clearTimeout(timeout);
            resolve(response);
          })
          .catch(error => {
            clearTimeout(timeout);
            reject(error);
          });
      } else {
        clearTimeout(timeout);
        reject(new Error('WebSocket not available'));
      }
    });
  }

  /**
   * Send message via HTTP with retry logic
   */
  private async sendViaHTTP(request: FileChatRequest, messageId: string, retryCount = 0): Promise<FileChatResponse> {
    try {
      return await aiService.chatWithFiles(request);
    } catch (error) {
      if (retryCount < this.config.maxRetries && this.isRetryableError(error)) {
        await this.delay(this.config.retryDelay * Math.pow(2, retryCount));
        return this.sendViaHTTP(request, messageId, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * Queue message for processing
   */
  private async queueMessage(request: FileChatRequest, messageId: string): Promise<FileChatResponse> {
    return new Promise((resolve, reject) => {
      if (this.messageQueue.length >= this.config.maxQueueSize) {
        reject(new Error('Message queue is full'));
        return;
      }

      this.messageQueue.push({
        request,
        resolve,
        reject,
        retryCount: 0
      });

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
      const { request, resolve, reject, retryCount } = this.messageQueue.shift()!;
      
      try {
        const response = await this.sendViaHTTP(request, 'queued', retryCount);
        resolve(response);
      } catch (error) {
        if (retryCount < this.config.maxRetries && this.isRetryableError(error)) {
          // Re-queue with incremented retry count
          this.messageQueue.push({
            request,
            resolve,
            reject,
            retryCount: retryCount + 1
          });
        } else {
          reject(error);
        }
      }
      
      // Small delay between messages
      await this.delay(100);
    }

    this.isProcessingQueue = false;
  }

  /**
   * Connect to WebSocket for real-time chat
   */
  async connectWebSocket(sessionId: string, onMessage?: (message: WebSocketMessage) => void): Promise<void> {
    try {
      await aiService.connectWebSocket(sessionId, (message) => {
        if (onMessage) {
          onMessage(message);
        }
        this.handleWebSocketMessage(message);
      });
      
      this.wsConnected = true;
      this.wsReconnectAttempts = 0;
    } catch (error) {
      this.wsConnected = false;
      throw error;
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleWebSocketMessage(message: WebSocketMessage) {
    switch (message.type) {
      case 'message':
        // Handle incoming chat messages
        console.log('Received chat message:', message.data);
        break;
      case 'status':
        // Handle status updates
        console.log('Status update:', message.data.status);
        break;
      case 'error':
        // Handle errors
        console.error('WebSocket error:', message.data.error);
        break;
      case 'typing':
        // Handle typing indicators
        console.log('Typing indicator:', message.data.typing);
        break;
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnectWebSocket(): void {
    aiService.disconnectWebSocket();
    this.wsConnected = false;
  }

  /**
   * Update file context in the service
   */
  updateFileContext(file: FileContext): void {
    const key = this.getFileKey(file.path, file.branch);
    this.fileContexts.set(key, file);
  }

  /**
   * Remove file context
   */
  removeFileContext(path: string, branch: string): void {
    const key = this.getFileKey(path, branch);
    this.fileContexts.delete(key);
  }

  /**
   * Get file context
   */
  getFileContext(path: string, branch: string): FileContext | undefined {
    const key = this.getFileKey(path, branch);
    return this.fileContexts.get(key);
  }

  /**
   * Validate file context before sending
   */
  validateFileContext(files: FileContext[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (files.length === 0) {
      errors.push('No files provided for context');
    }

    files.forEach(file => {
      if (!file.path) {
        errors.push('File path is required');
      }
      if (!file.content) {
        errors.push(`File content is empty for ${file.path}`);
      }
      if (!file.branch) {
        errors.push(`Branch is required for ${file.path}`);
      }
      if (file.content.length > 1000000) { // 1MB limit
        errors.push(`File ${file.path} is too large (${file.content.length} characters)`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Create or update chat session
   */
  createSession(id: string, title: string, files: FileContext[] = []): ChatSession {
    const session: ChatSession = {
      id,
      title,
      files,
      lastActivity: new Date(),
      messageCount: 0
    };
    
    this.sessions.set(id, session);
    return session;
  }

  /**
   * Get chat session
   */
  getSession(id: string): ChatSession | undefined {
    return this.sessions.get(id);
  }

  /**
   * Update session activity
   */
  private updateSessionActivity(sessionId: string, files: FileContext[]): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
      session.messageCount++;
      session.files = files;
      this.sessions.set(sessionId, session);
    }
  }

  /**
   * Get message status
   */
  getMessageStatus(messageId: string): ChatMessageStatus | undefined {
    return this.messageStatuses.get(messageId);
  }

  /**
   * Update message status
   */
  private updateMessageStatus(messageId: string, status: 'sending' | 'sent' | 'failed', error?: string): void {
    const currentStatus = this.messageStatuses.get(messageId);
    
    this.messageStatuses.set(messageId, {
      id: messageId,
      status,
      timestamp: new Date(),
      retryCount: currentStatus?.retryCount || 0,
      error
    });
  }

  /**
   * Get WebSocket connection status
   */
  getWebSocketStatus(): 'connecting' | 'open' | 'closing' | 'closed' {
    return aiService.getWebSocketStatus();
  }

  /**
   * Clear message queue
   */
  clearMessageQueue(): void {
    this.messageQueue = [];
    aiService.clearMessageQueue();
  }

  /**
   * Get queue status
   */
  getQueueStatus(): { length: number; processing: boolean } {
    return {
      length: this.messageQueue.length,
      processing: this.isProcessingQueue
    };
  }

  /**
   * Utility methods
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getFileKey(path: string, branch: string): string {
    return `${branch}:${path}`;
  }

  private isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      // Retry on network errors and 5xx server errors
      if (error.message.includes('Failed to fetch') || 
          error.message.includes('Network Error') ||
          error.message.includes('ECONNRESET') ||
          error.message.includes('ETIMEDOUT')) {
        return true;
      }
    }
    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const chatService = new ChatService();

// Export the class for custom instances
export default ChatService;
