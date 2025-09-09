'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Loader2, 
  RefreshCw, 
  Clock, 
  Database, 
  Wifi, 
  Server,
  FileText,
  Users,
  BarChart3,
  Settings,
  Zap
} from 'lucide-react';

/**
 * Loading state types
 */
export type LoadingType = 
  | 'page' 
  | 'section' 
  | 'component' 
  | 'data' 
  | 'api' 
  | 'file' 
  | 'auth' 
  | 'search'
  | 'upload'
  | 'processing';

/**
 * Loading fallback props interface
 */
export interface LoadingFallbackProps {
  type?: LoadingType;
  message?: string;
  description?: string;
  progress?: number;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'minimal' | 'detailed' | 'skeleton';
  icon?: React.ReactNode;
  timeout?: number;
  onTimeout?: () => void;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Skeleton loading component
 */
const SkeletonLoader: React.FC<{
  lines?: number;
  showAvatar?: boolean;
  showHeader?: boolean;
  className?: string;
}> = ({ 
  lines = 3, 
  showAvatar = false, 
  showHeader = false, 
  className = '' 
}) => (
  <div className={`animate-pulse space-y-4 ${className}`}>
    {showHeader && (
      <div className="space-y-2">
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    )}
    
    {showAvatar && (
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    )}
    
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`h-4 bg-gray-200 rounded ${
            index === lines - 1 ? 'w-2/3' : 'w-full'
          }`}
        />
      ))}
    </div>
  </div>
);

/**
 * Get loading icon based on type
 */
const getLoadingIcon = (type: LoadingType): React.ReactNode => {
  switch (type) {
    case 'page':
      return <FileText className="w-5 h-5" />;
    case 'section':
      return <BarChart3 className="w-5 h-5" />;
    case 'data':
      return <Database className="w-5 h-5" />;
    case 'api':
      return <Server className="w-5 h-5" />;
    case 'file':
      return <FileText className="w-5 h-5" />;
    case 'auth':
      return <Users className="w-5 h-5" />;
    case 'search':
      return <Zap className="w-5 h-5" />;
    case 'upload':
      return <RefreshCw className="w-5 h-5" />;
    case 'processing':
      return <Settings className="w-5 h-5" />;
    default:
      return <Loader2 className="w-5 h-5" />;
  }
};

/**
 * Get loading message based on type
 */
const getLoadingMessage = (type: LoadingType): string => {
  switch (type) {
    case 'page':
      return 'Loading page...';
    case 'section':
      return 'Loading section...';
    case 'component':
      return 'Loading component...';
    case 'data':
      return 'Loading data...';
    case 'api':
      return 'Connecting to server...';
    case 'file':
      return 'Loading file...';
    case 'auth':
      return 'Authenticating...';
    case 'search':
      return 'Searching...';
    case 'upload':
      return 'Uploading...';
    case 'processing':
      return 'Processing...';
    default:
      return 'Loading...';
  }
};

/**
 * Get loading description based on type
 */
const getLoadingDescription = (type: LoadingType): string => {
  switch (type) {
    case 'page':
      return 'Please wait while we load the page content.';
    case 'section':
      return 'Loading this section of the page.';
    case 'component':
      return 'Initializing component...';
    case 'data':
      return 'Fetching the latest data from our servers.';
    case 'api':
      return 'Establishing connection with the server.';
    case 'file':
      return 'Reading file contents...';
    case 'auth':
      return 'Verifying your credentials...';
    case 'search':
      return 'Finding relevant results...';
    case 'upload':
      return 'Uploading your file to the server.';
    case 'processing':
      return 'Processing your request...';
    default:
      return 'This should only take a moment.';
  }
};

/**
 * Minimal loading component
 */
const MinimalLoader: React.FC<LoadingFallbackProps> = ({
  type = 'component',
  message,
  icon,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  };

  const displayIcon = icon || getLoadingIcon(type);
  const displayMessage = message || getLoadingMessage(type);

  return (
    <div className={`flex items-center justify-center gap-2 p-4 ${className}`}>
      <div className={`animate-spin ${sizeClasses[size]}`}>
        {displayIcon}
      </div>
      <span className="text-sm text-muted-foreground">{displayMessage}</span>
    </div>
  );
};

/**
 * Detailed loading component
 */
const DetailedLoader: React.FC<LoadingFallbackProps> = ({
  type = 'component',
  message,
  description,
  progress,
  showProgress = false,
  icon,
  className = '',
}) => {
  const displayIcon = icon || getLoadingIcon(type);
  const displayMessage = message || getLoadingMessage(type);
  const displayDescription = description || getLoadingDescription(type);

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="animate-spin text-primary">
            {displayIcon}
          </div>
        </div>
        <CardTitle className="text-lg">{displayMessage}</CardTitle>
        <CardDescription>{displayDescription}</CardDescription>
      </CardHeader>
      
      {(showProgress || progress !== undefined) && (
        <CardContent>
          <div className="space-y-2">
            <Progress value={progress || 0} className="w-full" />
            {progress !== undefined && (
              <p className="text-xs text-center text-muted-foreground">
                {Math.round(progress)}% complete
              </p>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

/**
 * Default loading component
 */
const DefaultLoader: React.FC<LoadingFallbackProps> = ({
  type = 'component',
  message,
  description,
  icon,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const displayIcon = icon || getLoadingIcon(type);
  const displayMessage = message || getLoadingMessage(type);
  const displayDescription = description || getLoadingDescription(type);

  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <div className={`animate-spin text-primary mb-4 ${sizeClasses[size]}`}>
        {displayIcon}
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">
        {displayMessage}
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        {displayDescription}
      </p>
    </div>
  );
};

/**
 * Main LoadingFallback component
 */
export const LoadingFallback: React.FC<LoadingFallbackProps> = (props) => {
  const {
    variant = 'default',
    timeout,
    onTimeout,
    children,
  } = props;

  // Handle timeout
  React.useEffect(() => {
    if (timeout && onTimeout) {
      const timeoutId = setTimeout(onTimeout, timeout);
      return () => clearTimeout(timeoutId);
    }
  }, [timeout, onTimeout]);

  // Render children if provided
  if (children) {
    return <>{children}</>;
  }

  // Render based on variant
  switch (variant) {
    case 'minimal':
      return <MinimalLoader {...props} />;
    case 'detailed':
      return <DetailedLoader {...props} />;
    case 'skeleton':
      return <SkeletonLoader className={props.className} />;
    case 'default':
    default:
      return <DefaultLoader {...props} />;
  }
};

/**
 * Specialized loading components for common use cases
 */
export const PageLoader: React.FC<Omit<LoadingFallbackProps, 'type'>> = (props) => (
  <LoadingFallback {...props} type="page" variant="detailed" />
);

export const SectionLoader: React.FC<Omit<LoadingFallbackProps, 'type'>> = (props) => (
  <LoadingFallback {...props} type="section" variant="default" />
);

export const ComponentLoader: React.FC<Omit<LoadingFallbackProps, 'type'>> = (props) => (
  <LoadingFallback {...props} type="component" variant="minimal" />
);

export const DataLoader: React.FC<Omit<LoadingFallbackProps, 'type'>> = (props) => (
  <LoadingFallback {...props} type="data" variant="default" />
);

export const ApiLoader: React.FC<Omit<LoadingFallbackProps, 'type'>> = (props) => (
  <LoadingFallback {...props} type="api" variant="minimal" />
);

export const FileLoader: React.FC<Omit<LoadingFallbackProps, 'type' | 'showProgress'>> = (props) => (
  <LoadingFallback {...props} type="file" variant="detailed" showProgress />
);

export const AuthLoader: React.FC<Omit<LoadingFallbackProps, 'type'>> = (props) => (
  <LoadingFallback {...props} type="auth" variant="detailed" />
);

export const SearchLoader: React.FC<Omit<LoadingFallbackProps, 'type'>> = (props) => (
  <LoadingFallback {...props} type="search" variant="minimal" />
);

export const UploadLoader: React.FC<Omit<LoadingFallbackProps, 'type' | 'showProgress'>> = (props) => (
  <LoadingFallback {...props} type="upload" variant="detailed" showProgress />
);

export const ProcessingLoader: React.FC<Omit<LoadingFallbackProps, 'type'>> = (props) => (
  <LoadingFallback {...props} type="processing" variant="detailed" />
);

/**
 * Skeleton components for specific layouts
 */
export const TableSkeleton: React.FC<{ rows?: number; columns?: number; className?: string }> = ({
  rows = 5,
  columns = 4,
  className = '',
}) => (
  <div className={`animate-pulse space-y-4 ${className}`}>
    {/* Table header */}
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {Array.from({ length: columns }).map((_, index) => (
        <div key={`header-${index}`} className="h-4 bg-gray-200 rounded w-3/4" />
      ))}
    </div>
    
    {/* Table rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={`row-${rowIndex}`} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, colIndex) => (
          <div key={`cell-${rowIndex}-${colIndex}`} className="h-4 bg-gray-200 rounded" />
        ))}
      </div>
    ))}
  </div>
);

export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse ${className}`}>
    <div className="border rounded-lg p-6 space-y-4">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-gray-200 rounded-full" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="h-4 bg-gray-200 rounded w-4/6" />
      </div>
    </div>
  </div>
);

export const ListSkeleton: React.FC<{ items?: number; className?: string }> = ({
  items = 5,
  className = '',
}) => (
  <div className={`animate-pulse space-y-3 ${className}`}>
    {Array.from({ length: items }).map((_, index) => (
      <div key={index} className="flex items-center space-x-4 p-3 border rounded">
        <div className="w-8 h-8 bg-gray-200 rounded-full" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-3 bg-gray-200 rounded w-1/3" />
        </div>
        <div className="w-16 h-6 bg-gray-200 rounded" />
      </div>
    ))}
  </div>
);

/**
 * Higher-order component for adding loading states
 */
export function withLoadingFallback<P extends object>(
  Component: React.ComponentType<P>,
  loadingProps?: LoadingFallbackProps
) {
  return function WrappedComponent(props: P & { isLoading?: boolean }) {
    const { isLoading, ...componentProps } = props;
    
    if (isLoading) {
      return <LoadingFallback {...loadingProps} />;
    }
    
    return <Component {...(componentProps as P)} />;
  };
}

/**
 * Hook for managing loading states
 */
export function useLoadingState(initialState: boolean = false) {
  const [isLoading, setIsLoading] = React.useState(initialState);
  const [loadingMessage, setLoadingMessage] = React.useState<string>();
  const [progress, setProgress] = React.useState<number>();

  const startLoading = React.useCallback((message?: string) => {
    setIsLoading(true);
    setLoadingMessage(message);
    setProgress(undefined);
  }, []);

  const stopLoading = React.useCallback(() => {
    setIsLoading(false);
    setLoadingMessage(undefined);
    setProgress(undefined);
  }, []);

  const updateProgress = React.useCallback((value: number, message?: string) => {
    setProgress(value);
    if (message) setLoadingMessage(message);
  }, []);

  return {
    isLoading,
    loadingMessage,
    progress,
    startLoading,
    stopLoading,
    updateProgress,
  };
}

export default LoadingFallback;