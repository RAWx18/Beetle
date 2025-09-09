/**
 * Fallback Components Usage Examples
 * Demonstrates how to use error boundaries, loading states, and error fallbacks
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ErrorBoundary,
  LoadingFallback,
  ErrorFallback,
  PageLoader,
  SectionLoader,
  ComponentLoader,
  DataLoader,
  TableSkeleton,
  CardSkeleton,
  ListSkeleton,
  NetworkError,
  ServerError,
  AuthError,
  NotFoundError,
  withErrorBoundary,
  withLoadingFallback,
  useLoadingState,
  useErrorFallback,
  useErrorHandler
} from './index';

/**
 * Component that throws errors for testing
 */
const ErrorThrowingComponent: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('This is a test error thrown by the component');
  }
  
  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
      <p className="text-green-800">Component rendered successfully!</p>
    </div>
  );
};

/**
 * Component wrapped with error boundary
 */
const SafeErrorThrowingComponent = withErrorBoundary(ErrorThrowingComponent, {
  level: 'component',
  context: 'Example Component',
  enableRetry: true,
  maxRetries: 3,
});

/**
 * Loading component example
 */
const LoadingComponent: React.FC<{ isLoading: boolean }> = ({ isLoading }) => {
  if (isLoading) {
    return <ComponentLoader message="Loading component data..." />;
  }
  
  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <p className="text-blue-800">Component loaded successfully!</p>
    </div>
  );
};

/**
 * Component with loading HOC
 */
const LoadingComponentWithHOC = withLoadingFallback(
  ({ data }: { data: string }) => (
    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
      <p className="text-purple-800">Data: {data}</p>
    </div>
  ),
  { type: 'data', variant: 'minimal' }
);

/**
 * Error Boundary Examples
 */
export const ErrorBoundaryExamples: React.FC = () => {
  const [shouldThrow, setShouldThrow] = useState(false);
  const { captureError, resetError } = useErrorHandler();

  const triggerError = () => {
    captureError(new Error('Error triggered by hook'));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Error Boundary Examples</CardTitle>
        <CardDescription>
          Demonstrates error boundaries with different configurations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Error Boundary */}
        <div className="space-y-2">
          <h4 className="font-medium">Basic Error Boundary:</h4>
          <div className="flex gap-2 mb-4">
            <Button 
              onClick={() => setShouldThrow(!shouldThrow)}
              variant={shouldThrow ? 'destructive' : 'default'}
            >
              {shouldThrow ? 'Fix Component' : 'Break Component'}
            </Button>
          </div>
          <ErrorBoundary
            level="component"
            context="Basic Example"
            enableRetry={true}
            maxRetries={3}
          >
            <ErrorThrowingComponent shouldThrow={shouldThrow} />
          </ErrorBoundary>
        </div>

        {/* HOC Error Boundary */}
        <div className="space-y-2">
          <h4 className="font-medium">HOC Error Boundary:</h4>
          <SafeErrorThrowingComponent shouldThrow={false} />
        </div>

        {/* Error Handler Hook */}
        <div className="space-y-2">
          <h4 className="font-medium">Error Handler Hook:</h4>
          <div className="flex gap-2">
            <Button onClick={triggerError} variant="destructive">
              Trigger Error
            </Button>
            <Button onClick={resetError} variant="outline">
              Reset Error
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Loading Fallback Examples
 */
export const LoadingFallbackExamples: React.FC = () => {
  const { isLoading, startLoading, stopLoading, updateProgress, progress } = useLoadingState();
  const [showSkeletons, setShowSkeletons] = useState(false);

  const simulateLoading = async () => {
    startLoading('Simulating data fetch...');
    
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      updateProgress(i, `Loading... ${i}%`);
    }
    
    stopLoading();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Loading Fallback Examples</CardTitle>
        <CardDescription>
          Various loading states and skeleton components
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Loading State Hook */}
        <div className="space-y-2">
          <h4 className="font-medium">Loading State Hook:</h4>
          <div className="flex gap-2 mb-4">
            <Button onClick={simulateLoading} disabled={isLoading}>
              Simulate Loading
            </Button>
            <Button 
              onClick={() => setShowSkeletons(!showSkeletons)}
              variant="outline"
            >
              {showSkeletons ? 'Hide' : 'Show'} Skeletons
            </Button>
          </div>
          
          {isLoading && (
            <LoadingFallback
              type="data"
              variant="detailed"
              progress={progress}
              showProgress={true}
            />
          )}
        </div>

        {/* Different Loading Types */}
        <div className="space-y-4">
          <h4 className="font-medium">Loading Variants:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Badge variant="outline">Page Loader</Badge>
              <PageLoader message="Loading page content..." />
            </div>
            <div className="space-y-2">
              <Badge variant="outline">Section Loader</Badge>
              <SectionLoader message="Loading section..." />
            </div>
            <div className="space-y-2">
              <Badge variant="outline">Component Loader</Badge>
              <ComponentLoader message="Loading component..." />
            </div>
            <div className="space-y-2">
              <Badge variant="outline">Data Loader</Badge>
              <DataLoader message="Fetching data..." />
            </div>
          </div>
        </div>

        {/* Skeleton Components */}
        {showSkeletons && (
          <div className="space-y-4">
            <h4 className="font-medium">Skeleton Components:</h4>
            <div className="space-y-4">
              <div>
                <Badge variant="outline" className="mb-2">Table Skeleton</Badge>
                <TableSkeleton rows={3} columns={4} />
              </div>
              <div>
                <Badge variant="outline" className="mb-2">Card Skeleton</Badge>
                <CardSkeleton />
              </div>
              <div>
                <Badge variant="outline" className="mb-2">List Skeleton</Badge>
                <ListSkeleton items={3} />
              </div>
            </div>
          </div>
        )}

        {/* HOC Loading Example */}
        <div className="space-y-2">
          <h4 className="font-medium">HOC Loading Example:</h4>
          <LoadingComponentWithHOC 
            isLoading={isLoading} 
            data="Sample data loaded successfully!" 
          />
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Error Fallback Examples
 */
export const ErrorFallbackExamples: React.FC = () => {
  const { error, showNetworkError, showServerError, showAuthError, showNotFoundError, clearError } = useErrorFallback();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Error Fallback Examples</CardTitle>
        <CardDescription>
          Different types of error displays and handling
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Error Trigger Buttons */}
        <div className="space-y-2">
          <h4 className="font-medium">Trigger Different Errors:</h4>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => showNetworkError()} variant="destructive" size="sm">
              Network Error
            </Button>
            <Button onClick={() => showServerError(500)} variant="destructive" size="sm">
              Server Error
            </Button>
            <Button onClick={() => showAuthError()} variant="destructive" size="sm">
              Auth Error
            </Button>
            <Button onClick={() => showNotFoundError()} variant="destructive" size="sm">
              Not Found Error
            </Button>
            <Button onClick={clearError} variant="outline" size="sm">
              Clear Error
            </Button>
          </div>
        </div>

        {/* Display Current Error */}
        {error && (
          <ErrorFallback
            type={error.type}
            message={error.message}
            statusCode={error.statusCode}
            context={error.context}
            showDetails={true}
            onRetry={clearError}
          />
        )}

        {/* Predefined Error Components */}
        {!error && (
          <div className="space-y-4">
            <h4 className="font-medium">Predefined Error Components:</h4>
            <div className="space-y-4">
              <div>
                <Badge variant="outline" className="mb-2">Network Error</Badge>
                <NetworkError 
                  message="Failed to connect to the server"
                  canRetry={true}
                  showDetails={false}
                />
              </div>
              
              <div>
                <Badge variant="outline" className="mb-2">Server Error</Badge>
                <ServerError 
                  statusCode={500}
                  message="Internal server error occurred"
                  canRetry={true}
                  showDetails={false}
                />
              </div>
              
              <div>
                <Badge variant="outline" className="mb-2">Auth Error</Badge>
                <AuthError 
                  message="Your session has expired"
                  canRetry={false}
                  showDetails={false}
                />
              </div>
              
              <div>
                <Badge variant="outline" className="mb-2">Not Found Error</Badge>
                <NotFoundError 
                  message="The requested page could not be found"
                  canRetry={false}
                  showDetails={false}
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Integration Examples
 */
export const IntegrationExamples: React.FC = () => {
  const [simulateError, setSimulateError] = useState(false);
  const [simulateLoading, setSimulateLoading] = useState(false);

  const SimulatedDataComponent: React.FC = () => {
    if (simulateLoading) {
      return <DataLoader message="Loading user data..." />;
    }
    
    if (simulateError) {
      throw new Error('Simulated data loading error');
    }
    
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <h4 className="font-medium text-green-800">User Data Loaded</h4>
        <p className="text-green-700 text-sm mt-1">
          All user information has been successfully loaded from the server.
        </p>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Integration Examples</CardTitle>
        <CardDescription>
          Real-world usage patterns combining error boundaries and loading states
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <h4 className="font-medium">Simulated Data Loading Component:</h4>
          <div className="flex gap-2 mb-4">
            <Button 
              onClick={() => {
                setSimulateLoading(true);
                setTimeout(() => setSimulateLoading(false), 2000);
              }}
              disabled={simulateLoading}
            >
              Simulate Loading
            </Button>
            <Button 
              onClick={() => setSimulateError(!simulateError)}
              variant={simulateError ? 'destructive' : 'outline'}
            >
              {simulateError ? 'Fix Error' : 'Simulate Error'}
            </Button>
          </div>
          
          <ErrorBoundary
            level="section"
            context="Data Loading Example"
            enableRetry={true}
            maxRetries={3}
          >
            <SimulatedDataComponent />
          </ErrorBoundary>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Main Examples Dashboard
 */
export const FallbackExamplesDashboard: React.FC = () => {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Fallback Components Examples</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive examples of error boundaries, loading states, and error fallbacks.
        </p>
      </div>
      
      <div className="space-y-6">
        <ErrorBoundaryExamples />
        <LoadingFallbackExamples />
        <ErrorFallbackExamples />
        <IntegrationExamples />
      </div>
    </div>
  );
};

export default FallbackExamplesDashboard;