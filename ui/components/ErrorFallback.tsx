'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  Bug, 
  Wifi, 
  WifiOff, 
  Server, 
  Clock, 
  Shield, 
  FileX, 
  Search, 
  Database,
  ExternalLink,
  Copy,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';

/**
 * Error types for different scenarios
 */
export type ErrorType = 
  | 'network' 
  | 'server' 
  | 'client' 
  | 'auth' 
  | 'permission' 
  | 'notFound' 
  | 'timeout' 
  | 'validation' 
  | 'unknown'
  | 'maintenance'
  | 'rateLimit';

/**
 * Error severity levels
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Error fallback props interface
 */
export interface ErrorFallbackProps {
  type?: ErrorType;
  severity?: ErrorSeverity;
  title?: string;
  message?: string;
  description?: string;
  errorCode?: string;
  statusCode?: number;
  canRetry?: boolean;
  canGoHome?: boolean;
  canReport?: boolean;
  showDetails?: boolean;
  onRetry?: () => void;
  onGoHome?: () => void;
  onReport?: () => void;
  className?: string;
  children?: React.ReactNode;
  context?: string;
  timestamp?: Date;
  userAgent?: string;
  url?: string;
}

/**
 * Get error icon based on type
 */
const getErrorIcon = (type: ErrorType): React.ReactNode => {
  switch (type) {
    case 'network':
      return <WifiOff className="w-6 h-6" />;
    case 'server':
      return <Server className="w-6 h-6" />;
    case 'client':
      return <Bug className="w-6 h-6" />;
    case 'auth':
      return <Shield className="w-6 h-6" />;
    case 'permission':
      return <Shield className="w-6 h-6" />;
    case 'notFound':
      return <FileX className="w-6 h-6" />;
    case 'timeout':
      return <Clock className="w-6 h-6" />;
    case 'validation':
      return <AlertTriangle className="w-6 h-6" />;
    case 'maintenance':
      return <Server className="w-6 h-6" />;
    case 'rateLimit':
      return <Clock className="w-6 h-6" />;
    default:
      return <AlertTriangle className="w-6 h-6" />;
  }
};

/**
 * Get error title based on type
 */
const getErrorTitle = (type: ErrorType, statusCode?: number): string => {
  if (statusCode) {
    switch (statusCode) {
      case 400:
        return 'Bad Request';
      case 401:
        return 'Authentication Required';
      case 403:
        return 'Access Denied';
      case 404:
        return 'Not Found';
      case 408:
        return 'Request Timeout';
      case 429:
        return 'Too Many Requests';
      case 500:
        return 'Server Error';
      case 502:
        return 'Bad Gateway';
      case 503:
        return 'Service Unavailable';
      case 504:
        return 'Gateway Timeout';
    }
  }

  switch (type) {
    case 'network':
      return 'Connection Error';
    case 'server':
      return 'Server Error';
    case 'client':
      return 'Application Error';
    case 'auth':
      return 'Authentication Error';
    case 'permission':
      return 'Permission Denied';
    case 'notFound':
      return 'Not Found';
    case 'timeout':
      return 'Request Timeout';
    case 'validation':
      return 'Validation Error';
    case 'maintenance':
      return 'Under Maintenance';
    case 'rateLimit':
      return 'Rate Limit Exceeded';
    default:
      return 'Something Went Wrong';
  }
};

/**
 * Get error message based on type
 */
const getErrorMessage = (type: ErrorType, statusCode?: number): string => {
  if (statusCode) {
    switch (statusCode) {
      case 400:
        return 'The request was invalid or malformed.';
      case 401:
        return 'You need to log in to access this resource.';
      case 403:
        return 'You don\'t have permission to access this resource.';
      case 404:
        return 'The requested resource could not be found.';
      case 408:
        return 'The request took too long to complete.';
      case 429:
        return 'You\'ve made too many requests. Please wait before trying again.';
      case 500:
        return 'An internal server error occurred.';
      case 502:
        return 'The server received an invalid response from upstream.';
      case 503:
        return 'The service is temporarily unavailable.';
      case 504:
        return 'The server didn\'t respond in time.';
    }
  }

  switch (type) {
    case 'network':
      return 'Unable to connect to the server. Please check your internet connection.';
    case 'server':
      return 'The server encountered an error while processing your request.';
    case 'client':
      return 'An unexpected error occurred in the application.';
    case 'auth':
      return 'Your session has expired. Please log in again.';
    case 'permission':
      return 'You don\'t have the necessary permissions to perform this action.';
    case 'notFound':
      return 'The page or resource you\'re looking for doesn\'t exist.';
    case 'timeout':
      return 'The request took too long to complete. Please try again.';
    case 'validation':
      return 'The provided data is invalid or incomplete.';
    case 'maintenance':
      return 'The system is currently under maintenance. Please try again later.';
    case 'rateLimit':
      return 'You\'ve exceeded the rate limit. Please wait before making more requests.';
    default:
      return 'An unexpected error occurred. Please try again or contact support.';
  }
};

/**
 * Get error description based on type
 */
const getErrorDescription = (type: ErrorType): string => {
  switch (type) {
    case 'network':
      return 'This could be due to a poor internet connection or server issues.';
    case 'server':
      return 'Our team has been notified and is working to resolve the issue.';
    case 'client':
      return 'This is likely a temporary issue. Refreshing the page might help.';
    case 'auth':
      return 'For security reasons, you\'ll need to authenticate again.';
    case 'permission':
      return 'Contact your administrator if you believe this is an error.';
    case 'notFound':
      return 'The URL might be incorrect or the content may have been moved.';
    case 'timeout':
      return 'The server is taking longer than expected to respond.';
    case 'validation':
      return 'Please check your input and try again.';
    case 'maintenance':
      return 'We\'re making improvements to serve you better.';
    case 'rateLimit':
      return 'This helps us maintain service quality for all users.';
    default:
      return 'If the problem persists, please contact our support team.';
  }
};

/**
 * Get severity color classes
 */
const getSeverityClasses = (severity: ErrorSeverity) => {
  switch (severity) {
    case 'low':
      return {
        border: 'border-blue-200',
        bg: 'bg-blue-50',
        text: 'text-blue-800',
        icon: 'text-blue-500',
      };
    case 'medium':
      return {
        border: 'border-yellow-200',
        bg: 'bg-yellow-50',
        text: 'text-yellow-800',
        icon: 'text-yellow-500',
      };
    case 'high':
      return {
        border: 'border-orange-200',
        bg: 'bg-orange-50',
        text: 'text-orange-800',
        icon: 'text-orange-500',
      };
    case 'critical':
      return {
        border: 'border-red-200',
        bg: 'bg-red-50',
        text: 'text-red-800',
        icon: 'text-red-500',
      };
    default:
      return {
        border: 'border-gray-200',
        bg: 'bg-gray-50',
        text: 'text-gray-800',
        icon: 'text-gray-500',
      };
  }
};

/**
 * Error details component
 */
const ErrorDetails: React.FC<{
  errorCode?: string;
  statusCode?: number;
  context?: string;
  timestamp?: Date;
  userAgent?: string;
  url?: string;
  onCopy?: () => void;
}> = ({ errorCode, statusCode, context, timestamp, userAgent, url, onCopy }) => {
  const [showDetails, setShowDetails] = React.useState(false);

  const copyDetails = async () => {
    const details = `
Error Code: ${errorCode || 'N/A'}
Status Code: ${statusCode || 'N/A'}
Context: ${context || 'N/A'}
Timestamp: ${timestamp?.toISOString() || new Date().toISOString()}
URL: ${url || window.location.href}
User Agent: ${userAgent || navigator.userAgent}
    `.trim();

    try {
      await navigator.clipboard.writeText(details);
      onCopy?.();
    } catch (err) {
      console.error('Failed to copy error details:', err);
    }
  };

  return (
    <div className="border-t pt-4 mt-4">
      <Button
        variant="ghost"
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-2 text-sm p-0 h-auto"
      >
        <Info className="w-4 h-4" />
        Error Details
        {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </Button>
      
      {showDetails && (
        <div className="mt-3 space-y-2 text-sm">
          {errorCode && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Error Code:</span>
              <code className="bg-muted px-2 py-1 rounded text-xs">{errorCode}</code>
            </div>
          )}
          
          {statusCode && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status Code:</span>
              <Badge variant="outline">{statusCode}</Badge>
            </div>
          )}
          
          {context && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Context:</span>
              <span className="text-xs">{context}</span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Timestamp:</span>
            <span className="text-xs">{(timestamp || new Date()).toLocaleString()}</span>
          </div>
          
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyDetails}
              className="flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copy Details
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Main ErrorFallback component
 */
export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  type = 'unknown',
  severity = 'medium',
  title,
  message,
  description,
  errorCode,
  statusCode,
  canRetry = true,
  canGoHome = true,
  canReport = true,
  showDetails = false,
  onRetry,
  onGoHome,
  onReport,
  className = '',
  children,
  context,
  timestamp,
  userAgent,
  url,
}) => {
  const [detailsCopied, setDetailsCopied] = React.useState(false);
  
  const severityClasses = getSeverityClasses(severity);
  const displayTitle = title || getErrorTitle(type, statusCode);
  const displayMessage = message || getErrorMessage(type, statusCode);
  const displayDescription = description || getErrorDescription(type);
  const errorIcon = getErrorIcon(type);

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      window.location.href = '/';
    }
  };

  const handleReport = () => {
    if (onReport) {
      onReport();
    } else {
      // Default reporting behavior
      const issueUrl = `https://github.com/your-org/beetle/issues/new?title=Error%20Report&body=${encodeURIComponent(`
**Error Type:** ${type}
**Error Code:** ${errorCode || 'N/A'}
**Status Code:** ${statusCode || 'N/A'}
**Message:** ${displayMessage}
**Context:** ${context || 'N/A'}
**URL:** ${url || window.location.href}
**Timestamp:** ${(timestamp || new Date()).toISOString()}

**Steps to reproduce:**
Please describe what you were doing when this error occurred.
      `)}`;
      window.open(issueUrl, '_blank');
    }
  };

  const handleDetailsCopy = () => {
    setDetailsCopied(true);
    setTimeout(() => setDetailsCopied(false), 2000);
  };

  // Render children if provided
  if (children) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      <Alert className={`${severityClasses.border} ${severityClasses.bg}`}>
        <div className={severityClasses.icon}>
          {errorIcon}
        </div>
        <AlertTitle className={`${severityClasses.text} text-lg`}>
          {displayTitle}
          {statusCode && (
            <Badge variant="outline" className="ml-2">
              {statusCode}
            </Badge>
          )}
        </AlertTitle>
        <AlertDescription className={`${severityClasses.text} mt-2 space-y-3`}>
          <p className="font-medium">{displayMessage}</p>
          <p className="text-sm opacity-90">{displayDescription}</p>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            {canRetry && (
              <Button onClick={handleRetry} size="sm" className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
            )}
            
            {canGoHome && (
              <Button variant="outline" onClick={handleGoHome} size="sm" className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                Go Home
              </Button>
            )}
            
            {canReport && (
              <Button variant="outline" onClick={handleReport} size="sm" className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Report Issue
              </Button>
            )}
          </div>

          {/* Error Details */}
          {showDetails && (
            <ErrorDetails
              errorCode={errorCode}
              statusCode={statusCode}
              context={context}
              timestamp={timestamp}
              userAgent={userAgent}
              url={url}
              onCopy={handleDetailsCopy}
            />
          )}
          
          {detailsCopied && (
            <p className="text-xs text-green-600">Error details copied to clipboard!</p>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
};

/**
 * Specialized error components for common scenarios
 */
export const NetworkError: React.FC<Omit<ErrorFallbackProps, 'type'>> = (props) => (
  <ErrorFallback {...props} type="network" severity="high" />
);

export const ServerError: React.FC<Omit<ErrorFallbackProps, 'type'>> = (props) => (
  <ErrorFallback {...props} type="server" severity="high" />
);

export const AuthError: React.FC<Omit<ErrorFallbackProps, 'type'>> = (props) => (
  <ErrorFallback {...props} type="auth" severity="medium" canRetry={false} />
);

export const NotFoundError: React.FC<Omit<ErrorFallbackProps, 'type'>> = (props) => (
  <ErrorFallback {...props} type="notFound" severity="low" canRetry={false} />
);

export const PermissionError: React.FC<Omit<ErrorFallbackProps, 'type'>> = (props) => (
  <ErrorFallback {...props} type="permission" severity="medium" canRetry={false} />
);

export const ValidationError: React.FC<Omit<ErrorFallbackProps, 'type'>> = (props) => (
  <ErrorFallback {...props} type="validation" severity="low" />
);

export const TimeoutError: React.FC<Omit<ErrorFallbackProps, 'type'>> = (props) => (
  <ErrorFallback {...props} type="timeout" severity="medium" />
);

export const MaintenanceError: React.FC<Omit<ErrorFallbackProps, 'type'>> = (props) => (
  <ErrorFallback {...props} type="maintenance" severity="low" canRetry={false} />
);

export const RateLimitError: React.FC<Omit<ErrorFallbackProps, 'type'>> = (props) => (
  <ErrorFallback {...props} type="rateLimit" severity="medium" />
);

/**
 * Error fallback factory function
 */
export const createErrorFallback = (
  defaultProps: Partial<ErrorFallbackProps>
) => {
  return (props: ErrorFallbackProps) => (
    <ErrorFallback {...defaultProps} {...props} />
  );
};

/**
 * Hook for error fallback state management
 */
export function useErrorFallback() {
  const [error, setError] = React.useState<{
    type: ErrorType;
    message: string;
    statusCode?: number;
    context?: string;
  } | null>(null);

  const showError = React.useCallback((
    type: ErrorType,
    message: string,
    statusCode?: number,
    context?: string
  ) => {
    setError({ type, message, statusCode, context });
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  const showNetworkError = React.useCallback((message?: string) => {
    showError('network', message || 'Network connection failed');
  }, [showError]);

  const showServerError = React.useCallback((statusCode?: number, message?: string) => {
    showError('server', message || 'Server error occurred', statusCode);
  }, [showError]);

  const showAuthError = React.useCallback((message?: string) => {
    showError('auth', message || 'Authentication required');
  }, [showError]);

  const showNotFoundError = React.useCallback((message?: string) => {
    showError('notFound', message || 'Resource not found');
  }, [showError]);

  return {
    error,
    showError,
    clearError,
    showNetworkError,
    showServerError,
    showAuthError,
    showNotFoundError,
  };
}

export default ErrorFallback;