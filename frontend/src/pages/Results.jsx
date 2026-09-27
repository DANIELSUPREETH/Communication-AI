import { useLocation, useParams } from 'react-router-dom';
import AnalysisView from '../components/AnalysisView';
import ErrorState from '../components/ErrorState';
import { AnalysisSkeleton } from './SessionDetails';
import { useFetch } from '../hooks/useFetch';
import { api } from '../services/api';

export default function Results() {
  const { sessionId } = useParams();
  const location = useLocation();
  // Coming straight from the coach, the session is passed in router state; on
  // refresh or a direct link it's loaded from the API.
  const passed = location.state?.session;
  const initial = passed && String(passed.id) === sessionId ? passed : null;

  const { data, error, loading, reload } = useFetch(
    () => (initial ? Promise.resolve(initial) : api.getSession(sessionId)),
    [sessionId],
  );

  return (
    <div className="page">
      <div className="container">
        {loading && !data && <AnalysisSkeleton />}
        {error && (
          <ErrorState
            title={error.status === 404 ? 'Analysis not found' : "We couldn't load this analysis"}
            message={error.message}
            onRetry={error.status === 404 ? undefined : reload}
            secondaryLabel="Start a new session"
            secondaryTo="/coach"
          />
        )}
        {data && <AnalysisView session={data} heading="Your Communication Analysis" />}
      </div>
    </div>
  );
}
