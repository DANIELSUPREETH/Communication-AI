import { useEffect, useState } from 'react';
import { Lightbulb, RefreshCw, Target, ThumbsUp, TrendingUp } from 'lucide-react';
import Button from './Button';
import Skeleton from './Skeleton';
import { api } from '../services/api';
import { getCachedInsights, setCachedInsights } from '../hooks/useFetch';

/**
 * Communication Pattern Detector. `cacheKey` changes whenever the stored sessions
 * change, so the AI is only asked again when there's something new to analyze.
 */
export default function PatternInsights({ cacheKey }) {
  const [state, setState] = useState(() => {
    const cached = getCachedInsights(cacheKey);
    return { data: cached, loading: !cached, error: null };
  });

  const load = async (force = false) => {
    const cached = !force && getCachedInsights(cacheKey);
    if (cached) {
      setState({ data: cached, loading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await api.patterns();
      setCachedInsights(cacheKey, data);
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({ data: null, loading: false, error });
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  const { data, loading, error } = state;

  return (
    <section className="card card-lg pattern-card" aria-labelledby="patterns-title" aria-busy={loading}>
      <div className="card-header">
        <h2 id="patterns-title" className="section-title" style={{ margin: 0 }}>
          <span className="icon-tile" aria-hidden="true">
            <Lightbulb />
          </span>
          Communication Patterns
        </h2>
        {data?.available && !loading && (
          <Button size="sm" variant="ghost" onClick={() => load(true)}>
            <RefreshCw /> Refresh
          </Button>
        )}
      </div>

      {loading && (
        <div style={{ display: 'grid', gap: 12 }}>
          <Skeleton height={18} width="85%" />
          <Skeleton height={18} width="70%" />
          <Skeleton height={18} width="78%" />
          <Skeleton height={72} style={{ marginTop: 8 }} />
        </div>
      )}

      {!loading && error && (
        <div className="notice notice-danger" role="alert">
          <span>
            {error.message}{' '}
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => load(true)}>
              Try again
            </button>
          </span>
        </div>
      )}

      {!loading && data && !data.available && (
        <p className="muted" style={{ fontSize: 14 }}>
          <TrendingUp size={15} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }} aria-hidden="true" />
          {data.message}
        </p>
      )}

      {!loading && data?.available && (
        <>
          <p className="subtle" style={{ fontSize: 13, marginBottom: 16 }}>
            Based on your {data.sessions_analyzed} most recent sessions
            {data.source === 'statistics' ? ' (score statistics)' : ''}.
          </p>
          <ul className="pattern-list">
            {data.patterns.map((p, i) => (
              <li key={i} className={p.kind}>
                <span className="p-icon" aria-hidden="true">
                  {p.kind === 'strength' ? <ThumbsUp /> : <Target />}
                </span>
                <span>
                  <span className="sr-only">{p.kind === 'strength' ? 'Strength: ' : 'Focus area: '}</span>
                  {p.text}
                </span>
              </li>
            ))}
          </ul>
          {data.next_goal && (
            <div className="goal-box">
              <h4>
                <Target aria-hidden="true" /> Your Next Practice Goal
              </h4>
              <p>{data.next_goal}</p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
