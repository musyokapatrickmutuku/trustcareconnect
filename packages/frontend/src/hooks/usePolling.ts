import { useState, useEffect, useRef, useCallback } from 'react';

export interface PollingOptions {
  interval?: number; // Polling interval in milliseconds
  enabled?: boolean; // Whether polling is enabled
  immediate?: boolean; // Whether to execute immediately on mount
  retryOnError?: boolean; // Whether to retry on errors
  maxRetries?: number; // Maximum number of consecutive retries
  retryDelay?: number; // Delay between retries
  dependencies?: any[]; // Dependencies to watch for changes
  onError?: (error: Error) => void; // Error callback
  onSuccess?: (data: any) => void; // Success callback
}

export interface PollingState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  isPolling: boolean;
  lastUpdated: Date | null;
  retryCount: number;
}

export interface PollingControls {
  start: () => void;
  stop: () => void;
  refresh: () => Promise<void>;
  reset: () => void;
}

/**
 * Custom hook for periodic data polling with error handling and retry logic
 */
export function usePolling<T>(
  pollingFunction: () => Promise<T>,
  options: PollingOptions = {}
): [PollingState<T>, PollingControls] {
  const {
    interval = 5000,
    enabled = true,
    immediate = true,
    retryOnError = true,
    maxRetries = 3,
    retryDelay = 1000,
    dependencies = [],
    onError,
    onSuccess
  } = options;

  const [state, setState] = useState<PollingState<T>>({
    data: null,
    loading: immediate,
    error: null,
    isPolling: false,
    lastUpdated: null,
    retryCount: 0
  });

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const isPollingRef = useRef(false);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  // Execute polling function
  const execute = useCallback(async (isRetry = false) => {
    if (!mountedRef.current) return;

    try {
      if (!isRetry) {
        setState(prev => ({ ...prev, loading: true, error: null }));
      }

      const result = await pollingFunction();

      if (!mountedRef.current) return;

      setState(prev => ({
        ...prev,
        data: result,
        loading: false,
        error: null,
        lastUpdated: new Date(),
        retryCount: 0
      }));

      onSuccess?.(result);
    } catch (error) {
      if (!mountedRef.current) return;

      const errorObj = error instanceof Error ? error : new Error(String(error));
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorObj,
        retryCount: prev.retryCount + 1
      }));

      onError?.(errorObj);

      // Retry logic
      if (retryOnError && state.retryCount < maxRetries) {
        retryTimeoutRef.current = setTimeout(() => {
          execute(true);
        }, retryDelay);
      }
    }
  }, [pollingFunction, onError, onSuccess, retryOnError, maxRetries, retryDelay, state.retryCount]);

  // Start polling
  const start = useCallback(() => {
    if (isPollingRef.current) return;

    isPollingRef.current = true;
    setState(prev => ({ ...prev, isPolling: true }));

    // Execute immediately if requested
    if (immediate && !state.data) {
      execute();
    }

    // Set up polling interval
    pollingRef.current = setInterval(() => {
      execute();
    }, interval);
  }, [execute, immediate, interval, state.data]);

  // Stop polling
  const stop = useCallback(() => {
    cleanup();
    isPollingRef.current = false;
    setState(prev => ({ ...prev, isPolling: false }));
  }, [cleanup]);

  // Manual refresh
  const refresh = useCallback(async () => {
    await execute();
  }, [execute]);

  // Reset state
  const reset = useCallback(() => {
    cleanup();
    isPollingRef.current = false;
    setState({
      data: null,
      loading: false,
      error: null,
      isPolling: false,
      lastUpdated: null,
      retryCount: 0
    });
  }, [cleanup]);

  // Effect to handle enabled/disabled state and dependencies
  useEffect(() => {
    if (enabled) {
      start();
    } else {
      stop();
    }

    return stop;
  }, [enabled, start, stop, ...dependencies]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  return [state, { start, stop, refresh, reset }];
}

/**
 * Hook for polling query updates
 */
export function useQueryPolling(queryId: string, options: Omit<PollingOptions, 'dependencies'> = {}) {
  const pollingFunction = useCallback(async () => {
    const response = await fetch(`/api/queries/${queryId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch query: ${response.statusText}`);
    }
    return response.json();
  }, [queryId]);

  return usePolling(pollingFunction, {
    ...options,
    dependencies: [queryId]
  });
}

/**
 * Hook for polling system statistics
 */
export function useSystemStatsPolling(options: PollingOptions = {}) {
  const pollingFunction = useCallback(async () => {
    const response = await fetch('/api/system/stats');
    if (!response.ok) {
      throw new Error(`Failed to fetch system stats: ${response.statusText}`);
    }
    return response.json();
  }, []);

  return usePolling(pollingFunction, options);
}

/**
 * Hook for polling patient queries
 */
export function usePatientQueriesPolling(patientId: string, options: Omit<PollingOptions, 'dependencies'> = {}) {
  const pollingFunction = useCallback(async () => {
    const response = await fetch(`/api/patients/${patientId}/queries`);
    if (!response.ok) {
      throw new Error(`Failed to fetch patient queries: ${response.statusText}`);
    }
    return response.json();
  }, [patientId]);

  return usePolling(pollingFunction, {
    ...options,
    dependencies: [patientId]
  });
}

/**
 * Hook for polling doctor queries
 */
export function useDoctorQueriesPolling(doctorId: string, options: Omit<PollingOptions, 'dependencies'> = {}) {
  const pollingFunction = useCallback(async () => {
    const response = await fetch(`/api/doctors/${doctorId}/queries`);
    if (!response.ok) {
      throw new Error(`Failed to fetch doctor queries: ${response.statusText}`);
    }
    return response.json();
  }, [doctorId]);

  return usePolling(pollingFunction, {
    ...options,
    dependencies: [doctorId]
  });
}

/**
 * Hook for polling notifications
 */
export function useNotificationsPolling(userId: string, userType: 'patient' | 'doctor', options: Omit<PollingOptions, 'dependencies'> = {}) {
  const pollingFunction = useCallback(async () => {
    const response = await fetch(`/api/notifications?userId=${userId}&userType=${userType}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch notifications: ${response.statusText}`);
    }
    return response.json();
  }, [userId, userType]);

  return usePolling(pollingFunction, {
    ...options,
    dependencies: [userId, userType]
  });
}

/**
 * Adaptive polling hook that adjusts interval based on activity
 */
export function useAdaptivePolling<T>(
  pollingFunction: () => Promise<T>,
  options: PollingOptions & {
    fastInterval?: number;
    slowInterval?: number;
    activityThreshold?: number; // milliseconds
  } = {}
) {
  const {
    fastInterval = 1000,
    slowInterval = 10000,
    activityThreshold = 60000, // 1 minute
    ...pollingOptions
  } = options;

  const [lastActivity, setLastActivity] = useState(Date.now());
  const [currentInterval, setCurrentInterval] = useState(fastInterval);

  // Track user activity
  useEffect(() => {
    const handleActivity = () => {
      setLastActivity(Date.now());
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, []);

  // Adjust polling interval based on activity
  useEffect(() => {
    const checkActivity = () => {
      const timeSinceActivity = Date.now() - lastActivity;
      const newInterval = timeSinceActivity > activityThreshold ? slowInterval : fastInterval;
      
      if (newInterval !== currentInterval) {
        setCurrentInterval(newInterval);
      }
    };

    const activityCheckInterval = setInterval(checkActivity, 5000);
    return () => clearInterval(activityCheckInterval);
  }, [lastActivity, activityThreshold, fastInterval, slowInterval, currentInterval]);

  return usePolling(pollingFunction, {
    ...pollingOptions,
    interval: currentInterval
  });
}

/**
 * Smart polling hook that falls back to polling when WebSocket is unavailable
 */
export function useSmartPolling<T>(
  pollingFunction: () => Promise<T>,
  webSocketConnected: boolean,
  options: PollingOptions = {}
) {
  // Only enable polling when WebSocket is not connected
  const pollingEnabled = !webSocketConnected && (options.enabled !== false);

  return usePolling(pollingFunction, {
    ...options,
    enabled: pollingEnabled
  });
}

/**
 * Hook for exponential backoff polling (useful for error scenarios)
 */
export function useExponentialBackoffPolling<T>(
  pollingFunction: () => Promise<T>,
  options: PollingOptions & {
    baseInterval?: number;
    maxInterval?: number;
    backoffFactor?: number;
  } = {}
) {
  const {
    baseInterval = 1000,
    maxInterval = 30000,
    backoffFactor = 2,
    ...pollingOptions
  } = options;

  const [currentInterval, setCurrentInterval] = useState(baseInterval);
  const consecutiveErrorsRef = useRef(0);

  const handleError = useCallback((error: Error) => {
    consecutiveErrorsRef.current++;
    const newInterval = Math.min(
      baseInterval * Math.pow(backoffFactor, consecutiveErrorsRef.current - 1),
      maxInterval
    );
    setCurrentInterval(newInterval);
    options.onError?.(error);
  }, [baseInterval, backoffFactor, maxInterval, options]);

  const handleSuccess = useCallback((data: any) => {
    consecutiveErrorsRef.current = 0;
    setCurrentInterval(baseInterval);
    options.onSuccess?.(data);
  }, [baseInterval, options]);

  return usePolling(pollingFunction, {
    ...pollingOptions,
    interval: currentInterval,
    onError: handleError,
    onSuccess: handleSuccess
  });
}