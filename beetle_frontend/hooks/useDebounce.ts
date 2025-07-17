import { useState, useEffect, useCallback } from 'react';

// Custom hook for debounced values
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Custom hook for debounced search
export function useDebouncedSearch<T>(
  searchFunction: (query: string) => Promise<T>,
  delay: number = 300
) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, delay);

  const search = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults(null);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await searchFunction(searchQuery);
        setResults(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
        setResults(null);
      } finally {
        setIsLoading(false);
      }
    },
    [searchFunction]
  );

  useEffect(() => {
    search(debouncedQuery);
  }, [debouncedQuery, search]);

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    search: (newQuery: string) => {
      setQuery(newQuery);
    }
  };
}