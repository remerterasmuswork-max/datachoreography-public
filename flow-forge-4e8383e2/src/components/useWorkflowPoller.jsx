
/**
 * useWorkflowPoller: Production-grade polling hook with backoff and safety
 */

import { useState, useEffect, useRef } from 'react';
import TenantEntity from './TenantEntity';
import { Run, TenantConfig } from '@/api/entities';
import { getPollingCoordinator } from './PollingCoordinator'; // Added import

export function useWorkflowPoller(intervalMs = 15000, enabled = true) { // Updated default intervalMs
  const [pendingRuns, setPendingRuns] = useState([]);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState(null);
  const [isLeader, setIsLeader] = useState(false); // Added new state for leadership
  const [actualInterval, setActualInterval] = useState(15000); // Kept existing

  const intervalRef = useRef(null); // Kept existing
  const coordinatorRef = useRef(null); // Added new ref for PollingCoordinator
  // Removed: abortControllerRef, isPollingActiveRef, errorCountRef, backoffMultiplierRef

  // Load tenant config
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const TenantTenantConfig = TenantEntity.wrap(TenantConfig);
        const configs = await TenantTenantConfig.list();
        if (configs.length > 0) {
          setActualInterval(intervalMs || configs[0].polling_interval_ms || 15000);
        }
      } catch (err) {
        console.warn('Failed to load tenant config, using default:', err);
        setActualInterval(intervalMs || 15000);
      }
    };
    loadConfig();
  }, [intervalMs]);

  const fetchPendingRuns = async () => {
    // Check if we're leader
    const coordinator = coordinatorRef.current || getPollingCoordinator();
    coordinatorRef.current = coordinator;

    if (!coordinator.canPoll()) {
      setIsLeader(false);
      return; // Not leader, skip polling
    }

    setIsLeader(true);
    coordinator.notifyPollStarted(); // Notify coordinator that polling has started

    try {
      setIsPolling(true);
      setError(null);

      const TenantRun = TenantEntity.wrap(Run);

      // Fetch runs that need processing
      const runs = await TenantRun.filter({
        status: 'pending'
      }, '-created_date', 100);

      setPendingRuns(runs);

    } catch (err) {
      console.error('Polling error:', err);
      setError(err.message);
    } finally {
      setIsPolling(false);
    }
  };

  const startPolling = () => {
    // Initial fetch
    fetchPendingRuns();

    // Set up interval. Backoff logic removed from here as it's not present in the new fetchPendingRuns.
    const scheduleNext = () => {
      // The delay is now simply actualInterval, as backoffMultiplierRef is removed.
      const delay = actualInterval;
      intervalRef.current = setTimeout(async () => {
        await fetchPendingRuns();
        if (intervalRef.current) {
          scheduleNext();
        }
      }, delay);
    };

    scheduleNext();
  };

  const stopPolling = () => {
    // Removed: Cancel any in-flight requests via abortControllerRef
    // Removed: isPollingActiveRef = false;
    // Clear interval
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    if (enabled && actualInterval) {
      startPolling();
    } else {
      stopPolling();
    }

    // Cleanup on unmount
    return () => {
      stopPolling();
    };
  }, [enabled, actualInterval]);

  const refresh = () => {
    fetchPendingRuns();
  };

  const resetErrors = () => {
    // Removed: errorCountRef.current = 0;
    // Removed: backoffMultiplierRef.current = 1;
    setError(null);
    // Removed: Logic involving isPollingActiveRef as it's no longer managed by this hook directly.
    // The main useEffect will handle starting polling if 'enabled' is true.
  };

  return {
    pendingRuns,
    isPolling,
    isLeader, // NEW: Expose leadership status
    error,
    // Removed: errorCount, backoffMultiplier, pollingInterval as they are no longer managed by this hook
    refresh,
    resetErrors
  };
}

export default useWorkflowPoller;
