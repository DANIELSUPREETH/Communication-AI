import { useCallback, useRef, useState } from 'react';
import { api } from '../services/api';
import { invalidateInsights } from './useFetch';

/**
 * Submits an answer for analysis. Guards against duplicate submissions
 * (double clicks, Enter spam) with a ref that updates synchronously.
 */
export function useAnalysis() {
  const [status, setStatus] = useState('idle'); // idle | loading | error
  const [error, setError] = useState(null);
  const inFlight = useRef(false);

  const analyze = useCallback(async (payload) => {
    if (inFlight.current) return null;
    inFlight.current = true;
    setStatus('loading');
    setError(null);
    try {
      const session = await api.analyze(payload);
      invalidateInsights();
      setStatus('idle');
      return session;
    } catch (err) {
      setError(err);
      setStatus('error');
      return null;
    } finally {
      inFlight.current = false;
    }
  }, []);

  return { analyze, status, error, isLoading: status === 'loading', reset: () => setError(null) };
}
