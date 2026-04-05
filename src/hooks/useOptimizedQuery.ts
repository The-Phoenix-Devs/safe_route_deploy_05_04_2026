import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface QueryOptions {
  enabled?: boolean;
  refetchInterval?: number;
  staleTime?: number; // Time in ms to consider data fresh
}

// Optimized query hook with caching and automatic refetching
export const useOptimizedQuery = <T>(
  key: string,
  queryFn: () => Promise<T>,
  options: QueryOptions = {}
) => {
  const { enabled = true, refetchInterval, staleTime = 5 * 60 * 1000 } = options; // 5 min default stale time
  
  const [state, setState] = useState<QueryState<T>>({
    data: null,
    loading: false,
    error: null
  });
  
  const cacheRef = useRef<Map<string, { data: T; timestamp: number }>>(new Map());
  const intervalRef = useRef<NodeJS.Timeout>();

  const executeQuery = useCallback(async (force = false) => {
    if (!enabled) return;

    // Check cache first
    const cached = cacheRef.current.get(key);
    const now = Date.now();
    
    if (!force && cached && (now - cached.timestamp) < staleTime) {
      setState({ data: cached.data, loading: false, error: null });
      return cached.data;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await queryFn();
      
      // Update cache
      cacheRef.current.set(key, { data: result, timestamp: now });
      
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (error: any) {
      const errorMessage = error.message || 'Query failed';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      throw error;
    }
  }, [key, queryFn, enabled, staleTime]);

  const refetch = useCallback(() => executeQuery(true), [executeQuery]);

  useEffect(() => {
    executeQuery();

    // Set up automatic refetching if interval is specified
    if (refetchInterval && refetchInterval > 0) {
      intervalRef.current = setInterval(() => {
        executeQuery();
      }, refetchInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [executeQuery, refetchInterval]);

  return {
    ...state,
    refetch,
    isStale: () => {
      const cached = cacheRef.current.get(key);
      return !cached || (Date.now() - cached.timestamp) >= staleTime;
    }
  };
};

// Example usage with specific tables
export const useDriversQuery = (options?: QueryOptions) => {
  const queryFn = useCallback(async () => {
    const { data, error } = await supabase.from('drivers').select('*');
    if (error) throw error;
    return data;
  }, []);

  return useOptimizedQuery('drivers', queryFn, options);
};

export const useStudentsQuery = (options?: QueryOptions) => {
  const queryFn = useCallback(async () => {
    const { data, error } = await supabase.from('students').select('*');
    if (error) throw error;
    return data;
  }, []);

  return useOptimizedQuery('students', queryFn, options);
};