import { Activity, Award, BarChart3, Layers, TrendingUp } from 'lucide-react';
import Button from '../components/Button';
import MetricCard from '../components/MetricCard';
import ProgressChart from '../components/ProgressChart';
import PatternInsights from '../components/PatternInsights';
import SessionCard from '../components/SessionCard';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import Skeleton from '../components/Skeleton';
import { useFetch } from '../hooks/useFetch';
import { api } from '../services/api';

function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading dashboard">
      <div className="grid grid-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div className="card" key={i} style={{ display: 'grid', gap: 12 }}>
            <Skeleton width="60%" height={14} />
            <Skeleton width="40%" height={30} />
          </div>
        ))}
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <Skeleton height={260} />
      </div>
    </div>
  );
}

function formatImprovement(value) {
  if (value === null || value === undefined) return '—';
  return `${value > 0 ? '+' : ''}${value}%`;
}

export default function Dashboard() {
  const stats = useFetch(() => api.dashboard(), []);
  const recent = useFetch(() => api.listSessions(), []);
  const data = stats.data;

  const lastId = data?.trend?.[data.trend.length - 1]?.id ?? 0;
  const insightsKey = `${data?.total_sessions ?? 0}:${lastId}`;
  const improvement = data?.recent_improvement;

  return (
    <div className="page">
      <div className="container">
        <header className="page-header page-header-row">
          <div>
            <h1>Your Communication Progress</h1>
            <p>Every number here comes from the sessions you&apos;ve completed.</p>
          </div>
          {data?.total_sessions > 0 && (
            <Button to="/coach" variant="primary">
              Practice now
            </Button>
          )}
        </header>

        {stats.loading && !data && <DashboardSkeleton />}

        {stats.error && (
          <ErrorState title="We couldn't load your dashboard" message={stats.error.message} onRetry={stats.reload} />
        )}

        {data && data.total_sessions === 0 && (
          <EmptyState
            icon={BarChart3}
            title="No practice sessions yet."
            description="Complete your first session to see your scores, trends and communication patterns here."
            actionLabel="Start Your First Session"
            actionTo="/coach"
          />
        )}

        {data && data.total_sessions > 0 && (
          <>
            <div className="grid grid-4">
              <MetricCard index={0} icon={Layers} label="Total Sessions" value={data.total_sessions} />
              <MetricCard
                index={1}
                icon={Activity}
                label="Average Score"
                value={data.average_score?.toFixed(1)}
                hint="out of 10"
              />
              <MetricCard index={2} icon={Award} label="Best Score" value={data.best_score?.toFixed(1)} hint="out of 10" />
              <MetricCard
                index={3}
                icon={TrendingUp}
                label="Recent Improvement"
                value={formatImprovement(improvement)}
                valueClassName={improvement > 0 ? 'positive-text' : improvement < 0 ? 'negative-text' : ''}
                hint={
                  improvement === null
                    ? 'Complete 2 sessions to compare'
                    : 'Latest sessions vs. your first sessions'
                }
              />
            </div>

            <section className="section" style={{ marginTop: 16 }}>
              <div className="card card-lg">
                <div className="card-header">
                  <h2 className="card-title">Overall score over time</h2>
                  <span className="subtle" style={{ fontSize: 13 }}>
                    Last {data.trend.length} {data.trend.length === 1 ? 'session' : 'sessions'}
                  </span>
                </div>
                <ProgressChart data={data.trend} dataKey="overall" label="Overall" />
              </div>
            </section>

            <div className="grid grid-3" style={{ marginTop: 16 }}>
              {[
                { key: 'clarity', label: 'Clarity', color: '#a78bfa' },
                { key: 'confidence', label: 'Confidence', color: '#34d399' },
                { key: 'conciseness', label: 'Conciseness', color: '#fbbf24' },
              ].map((m) => (
                <div className="card" key={m.key}>
                  <div className="card-header" style={{ marginBottom: 8 }}>
                    <h2 className="card-title">{m.label} trend</h2>
                    <span className="badge">avg {data.metric_averages[m.key]?.toFixed(1)}</span>
                  </div>
                  <ProgressChart data={data.trend} dataKey={m.key} label={m.label} color={m.color} small />
                </div>
              ))}
            </div>

            <div className="section" style={{ marginTop: 16 }}>
              <PatternInsights cacheKey={insightsKey} />
            </div>

            {recent.data?.length > 0 && (
              <section className="section">
                <div className="card-header">
                  <h2 className="section-title" style={{ margin: 0 }}>
                    Recent sessions
                  </h2>
                  <Button to="/history" variant="ghost" size="sm">
                    View all
                  </Button>
                </div>
                <div className="session-list">
                  {recent.data.slice(0, 3).map((s, i) => (
                    <SessionCard key={s.id} session={s} index={i} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
