'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  RefreshCw, 
  Bug, 
  Home, 
  ChevronDown, 
  ChevronUp,
  Copy,
  ExternalLink
} from 'lucide-react';

/**
 * Error boundary state interface
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  showDetails: boolean;
  retryCount: number;
}

/**
 * Error boundary props interface
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void;
  enableRetry?: boolean;
  maxRetries?: number;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
  isolate?: boolean;
  level?: 'page' | 'section' | 'component';
  context?: string;
}

/**
 * Error fallback props interface
 */
export interface ErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo | null;
  errorId: string;
  resetError: () => void;
  retryCount: number;
  maxRetries: number;
  canRetry: boolean;
  showDetails: boolean;
  toggleDetails: () => void;
  level: 'page' | 'section' | 'component';
  context?: string;
}

/**
 * Error reporting service
 */
class ErrorReportingService {
  private static instance: ErrorReportingService;
  private reportingEndpoint: string;
  private enableReporting: boolean;

  private constructor() {
    this.reportingEndpoint = process.env.NEXT_PUBLIC_ERROR_REPORTING_URL || '/api/errors';
    this.enableReporting = process.env.NODE_ENV === 'production';
  }

  static getInstance(): ErrorReportingService {
    if (!ErrorReportingService.instance) {
      ErrorReportingService.instance = new ErrorReportingService();
    }
    return ErrorReportingService.instance;
  }

  async reportError(
    error: Error,
    errorInfo: ErrorInfo,
    errorId: string,
    context?: string,
    userAgent?: string,
    url?: string
  ): Promise<void> {
    if (!this.enableReporting) {
      console.error('Error reported (dev mode):', { error, errorInfo, errorId, context });
      return;
    }

    try {
      const errorReport = {
        errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        context,
        userAgent: userAgent || navigator.userAgent,
        url: url || window.location.href,
        timestamp: new Date().toISOString(),
        userId: this.getUserId(),
        sessionId: this.getSessionId(),
        buildVersion: process.env.NEXT_PUBLIC_BUILD_VERSION,
      };

      await fetch(this.reportingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorReport),
      });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }

  private getUserId(): string | null {
    // Get user ID from localStorage or auth context
    if (typeof window !== 'undefined') {
      return localStorage.getItem('user_id');
    }
    return null;
  }

  private getSessionId(): string | null {
    // Get session ID from localStorage or generate one
    if (typeof window !== 'undefined') {
      let sessionId = sessionStorage.getItem('session_id');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('session_id', sessionId);
      }
      return sessionId;
    }
    return null;
  }
}

/**
 * Generate unique error ID
 */
const generateErrorId = (): string => {
  return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Default error fallback component
 */
const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  errorId,
  resetError,
  retryCount,
  maxRetries,
  canRetry,
  showDetails,
  toggleDetails,
  level,
  context,
}) => {
  const copyErrorDetails = async () => {
    const errorDetails = `
Error ID: ${errorId}
Message: ${error.message}
Context: ${context || 'Unknown'}
Stack: ${error.stack}
Component Stack: ${errorInfo?.componentStack}
Timestamp: ${new Date().toISOString()}
    `.trim();

    try {
      await navigator.clipboard.writeText(errorDetails);
      // Could show a toast notification here
    } catch (err) {
      console.error('Failed to copy error details:', err);
    }
  };

  const reportIssue = () => {
    const issueUrl = `https://github.com/your-org/beetle/issues/new?title=Error%20Report%20${errorId}&body=${encodeURIComponent(`
**Error ID:** ${errorId}
**Message:** ${error.message}
**Context:** ${context || 'Unknown'}
**Steps to reproduce:** Please describe what you were doing when this error occurred.

**Error Details:**
\`\`\`
${error.stack}
\`\`\`
    `)}`;
    window.open(issueUrl, '_blank');
  };

  const getErrorTitle = () => {
    switch (level) {
      case 'page':
        return 'Page Error';
      case 'section':
        return 'Section Error';
      case 'component':
        return 'Component Error';
      default:
        return 'Application Error';
    }
  };

  const getErrorDescription = () => {
    switch (level) {
      case 'page':
        return 'An error occurred while loading this page. You can try refreshing or go back to the home page.';
      case 'section':
        return 'An error occurred in this section. The rest of the page should still work normally.';
      case 'component':
        return 'A component failed to render. This might affect some functionality.';
      default:
        return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-500" />
          <div className="flex-1">
            <CardTitle className="text-red-700">{getErrorTitle()}</CardTitle>
            <CardDescription className="mt-1">
              {getErrorDescription()}
            </CardDescription>
          </div>
          <Badge variant="destructive" className="text-xs">
            {errorId.split('_')[1]}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Error Message */}
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800 font-medium">
            {error.message || 'An unknown error occurred'}
          </p>
          {context && (
            <p className="text-xs text-red-600 mt-1">
              Context: {context}
            </p>
          )}
        </div>

        {/* Retry Information */}
        {maxRetries > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="w-4 h-4" />
            <span>
              Retry attempts: {retryCount} / {maxRetries}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {canRetry && (
            <Button onClick={resetError} className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          )}
          
          {level === 'page' && (
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/'}
              className="flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Go Home
            </Button>
          )}
          
          <Button 
            variant="outline" 
            onClick={copyErrorDetails}
            className="flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Copy Details
          </Button>
          
          <Button 
            variant="outline" 
            onClick={reportIssue}
            className="flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Report Issue
          </Button>
        </div>

        {/* Error Details Toggle */}
        <div className="border-t pt-4">
          <Button
            variant="ghost"
            onClick={toggleDetails}
            className="flex items-center gap-2 text-sm"
          >
            <Bug className="w-4 h-4" />
            Technical Details
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          
          {showDetails && (
            <div className="mt-3 space-y-3">
              <div>
                <h4 className="text-sm font-medium mb-2">Error Stack:</h4>
                <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                  {error.stack}
                </pre>
              </div>
              
              {errorInfo?.componentStack && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Component Stack:</h4>
                  <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                    {errorInfo.componentStack}
                  </pre>
                </div>
              )}
              
              <div>
                <h4 className="text-sm font-medium mb-2">Error ID:</h4>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {errorId}
                </code>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Error Boundary Component
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private errorReporter: ErrorReportingService;
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      showDetails: false,
      retryCount: 0,
    };

    this.errorReporter = ErrorReportingService.getInstance();
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: generateErrorId(),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.state.errorId || generateErrorId();
    
    this.setState({
      errorInfo,
      errorId,
    });

    // Report error
    this.errorReporter.reportError(
      error,
      errorInfo,
      errorId,
      this.props.context,
    );

    // Call onError callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo, errorId);
    }

    // Log error for development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error Boundary Caught Error (${errorId})`);
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Context:', this.props.context);
      console.groupEnd();
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    // Reset error state if resetKeys changed
    if (hasError && resetOnPropsChange && resetKeys) {
      const prevResetKeys = prevProps.resetKeys || [];
      const hasResetKeyChanged = resetKeys.some(
        (key, index) => key !== prevResetKeys[index]
      );

      if (hasResetKeyChanged) {
        this.resetError();
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      window.clearTimeout(this.resetTimeoutId);
    }
  }

  resetError = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) {
      return;
    }

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      showDetails: false,
      retryCount: prevState.retryCount + 1,
    }));

    // Reset retry count after successful render
    this.resetTimeoutId = window.setTimeout(() => {
      this.setState({ retryCount: 0 });
    }, 10000); // Reset after 10 seconds
  };

  toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails,
    }));
  };

  render() {
    const { 
      children, 
      fallback: FallbackComponent = DefaultErrorFallback,
      enableRetry = true,
      maxRetries = 3,
      level = 'component',
      isolate = false,
    } = this.props;

    const { hasError, error, errorInfo, errorId, showDetails, retryCount } = this.state;

    if (hasError && error && errorId) {
      const canRetry = enableRetry && retryCount < maxRetries;
      
      const fallbackProps: ErrorFallbackProps = {
        error,
        errorInfo,
        errorId,
        resetError: this.resetError,
        retryCount,
        maxRetries,
        canRetry,
        showDetails,
        toggleDetails: this.toggleDetails,
        level,
        context: this.props.context,
      };

      const fallbackElement = <FallbackComponent {...fallbackProps} />;

      // If isolate is true, wrap in an error container
      if (isolate) {
        return (
          <div className="error-boundary-container p-4">
            {fallbackElement}
          </div>
        );
      }

      return fallbackElement;
    }

    return children;
  }
}

/**
 * Higher-order component for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Hook for error boundary integration
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error | string) => {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    setError(errorObj);
  }, []);

  return { captureError, resetError };
}

export default ErrorBoundary;