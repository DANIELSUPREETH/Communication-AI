import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import AnalysisView from '../components/AnalysisView';
import ErrorState from '../components/ErrorState';
import Skeleton from '../components/Skeleton';
import { useFetch } from '../hooks/useFetch';
import { api } from '../services/api';

export function AnalysisSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading analysis">
      <Skeleton width={140} height={14} />
      <Skeleton width="min(420px, 90%)" height={34} style={{ margin: '14px 0 36px' }} />
      <div className="card card-lg" style={{ display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap' }}>
        <Skeleton width={168} height={168} radius="50%" />
        <div style={{ flex: 1, minWidth: 200, display: 'grid', gap: 12 }}>
          <Skeleton width="60%" height={24} />
          <Skeleton width="90%" />
          <Skeleton width="75%" />
        </div>
      </div>
      <div className="grid grid-3" style={{ marginTop: 48 }}>
        {Array.from({ length: 6 }, (_, i) => (
          <div className="card" key={i} style={{ display: 'grid', gap: 12 }}>
            <Skeleton width="50%" />
            <Skeleton height={6} />
            <Skeleton width="80%" height={12} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SessionDetails() {
  const { id } = useParams();
  const { data, error, loading, reload } = useFetch(() => api.getSession(id), [id]);

  return (
    <div className="page">
      <div className="container">
        <Link to="/history" className="btn btn-ghost btn-sm" style={{ marginBottom: 20, marginLeft: -12 }}>
          <ArrowLeft /> Back to history
        </Link>
        {loading && !data && <AnalysisSkeleton />}
        {error && (
          <ErrorState
            title={error.status === 404 ? 'Session not found' : "We couldn't load this session"}
            message={error.message}
            onRetry={error.status === 404 ? undefined : reload}
            secondaryLabel="Back to history"
            secondaryTo="/history"
          />
        )}
        {data && <AnalysisView session={data} heading="Session Analysis" showQuestion />}
      </div>
    </div>
  );
}
