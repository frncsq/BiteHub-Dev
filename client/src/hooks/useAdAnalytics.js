import { useState, useEffect, useCallback } from 'react';
import { adsService } from '../services/adsService';

/** Admin hook: loads advertisement analytics summary. */
export function useAdAnalytics(enabled = true) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const res = await adsService.getAnalytics();
      setAnalytics(res.data?.analytics || null);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { analytics, loading, error, refetch: fetchAnalytics };
}

export default useAdAnalytics;
