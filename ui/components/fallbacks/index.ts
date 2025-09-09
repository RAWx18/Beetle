/**
 * Fallback Components Index
 * Centralized exports for all error and loading fallback components
 */

// Error Boundary
export { 
  ErrorBoundary, 
  withErrorBoundary, 
  useErrorHandler,
  type ErrorFallbackProps 
} from '../ErrorBoundary';

// Loading Fallback
export { 
  LoadingFallback,
  PageLoader,
  SectionLoader,
  ComponentLoader,
  DataLoader,
  ApiLoader,
  FileLoader,
  AuthLoader,
  SearchLoader,
  UploadLoader,
  ProcessingLoader,
  TableSkeleton,
  CardSkeleton,
  ListSkeleton,
  withLoadingFallback,
  useLoadingState,
  type LoadingFallbackProps,
  type LoadingType
} from '../LoadingFallback';

// Error Fallback
export { 
  ErrorFallback,
  NetworkError,
  ServerError,
  AuthError,
  NotFoundError,
  PermissionError,
  ValidationError,
  TimeoutError,
  MaintenanceError,
  RateLimitError,
  createErrorFallback,
  useErrorFallback,
  type ErrorType,
  type ErrorSeverity
} from '../ErrorFallback';

// Combined fallback utilities
export const fallbackComponents = {
  // Error components
  ErrorBoundary,
  ErrorFallback,
  NetworkError,
  ServerError,
  AuthError,
  NotFoundError,
  PermissionError,
  ValidationError,
  TimeoutError,
  MaintenanceError,
  RateLimitError,
  
  // Loading components
  LoadingFallback,
  PageLoader,
  SectionLoader,
  ComponentLoader,
  DataLoader,
  ApiLoader,
  FileLoader,
  AuthLoader,
  SearchLoader,
  UploadLoader,
  ProcessingLoader,
  
  // Skeleton components
  TableSkeleton,
  CardSkeleton,
  ListSkeleton,
};

export const fallbackHooks = {
  useErrorHandler,
  useLoadingState,
  useErrorFallback,
};

export const fallbackHOCs = {
  withErrorBoundary,
  withLoadingFallback,
  createErrorFallback,
};

export default fallbackComponents;