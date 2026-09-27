import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Minimal data-loading hook: { data, error, loading, reload }.
 * Ignores results from stale requests (e.g. after navigating away).
 */
export function useFetch(fetcher, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fetcher();
      if (id === requestId.current) setState({ data, error: null, loading: false });
    } catch (error) {
      if (id === requestId.current) setState({ data: null, error, loading: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    load();
    return () => {
      requestId.current += 1;
    };
  }, [load]);

  return { ...state, reload: load, setData: (data) => setState((s) => ({ ...s, data })) };
}

// Pattern insights call the AI, so cache them in memory until sessions change.
let insightsCache = null; // { key, data }

export function getCachedInsights(key) {
  return insightsCache?.key === key ? insightsCache.data : null;
}

export function setCachedInsights(key, data) {
  insightsCache = { key, data };
}

export function invalidateInsights() {
  insightsCache = null;
}
