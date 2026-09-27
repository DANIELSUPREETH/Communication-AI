import { useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { History as HistoryIcon, Plus } from 'lucide-react';
import Button from '../components/Button';
import SessionCard from '../components/SessionCard';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import Modal from '../components/Modal';
import Skeleton from '../components/Skeleton';
import Toast from '../components/Toast';
import { MODES } from '../data/coaching';
import { useFetch, invalidateInsights } from '../hooks/useFetch';
import { api } from '../services/api';

export default function History() {
  const { data: sessions, error, loading, reload, setData } = useFetch(() => api.listSessions(), []);
  const [filter, setFilter] = useState('all');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [toast, setToast] = useState('');

  const visible = useMemo(
    () => (sessions || []).filter((s) => filter === 'all' || s.mode === filter),
    [sessions, filter],
  );

  const closeModal = () => {
    if (deleting) return;
    setPendingDelete(null);
    setDeleteError(null);
  };

  const confirmDelete = async () => {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await api.deleteSession(pendingDelete.id);
      setData(sessions.filter((s) => s.id !== pendingDelete.id));
      invalidateInsights();
      setPendingDelete(null);
      setToast('Session deleted');
      setTimeout(() => setToast(''), 2000);
    } catch (err) {
      // Already gone on the server: treat as deleted.
      if (err.status === 404) {
        setData(sessions.filter((s) => s.id !== pendingDelete.id));
        setPendingDelete(null);
      } else {
        setDeleteError(err.message);
      }
    } finally {
      setDeleting(false);
    }
  };

  const counts = useMemo(() => {
    const c = { all: sessions?.length || 0 };
    for (const s of sessions || []) c[s.mode] = (c[s.mode] || 0) + 1;
    return c;
  }, [sessions]);

  return (
    <div className="page">
      <div className="container container-narrow">
        <header className="page-header page-header-row">
          <div>
            <h1>Practice History</h1>
            <p>Review past analyses and see how your answers have changed.</p>
          </div>
          {sessions?.length > 0 && (
            <Button to="/coach" variant="primary">
              <Plus /> New session
            </Button>
          )}
        </header>

        {loading && !sessions && (
          <div className="session-list" aria-busy="true" aria-label="Loading sessions">
            {Array.from({ length: 4 }, (_, i) => (
              <div className="card" key={i} style={{ display: 'grid', gap: 10 }}>
                <Skeleton width={80} height={22} radius={999} />
                <Skeleton width="70%" height={18} />
                <Skeleton width={180} height={12} />
              </div>
            ))}
          </div>
        )}

        {error && <ErrorState title="We couldn't load your history" message={error.message} onRetry={reload} />}

        {sessions && sessions.length === 0 && (
          <EmptyState
            icon={HistoryIcon}
            title="Your practice history will appear here."
            description="Each analysis is saved automatically so you can review it later."
            actionLabel="Start Your First Session"
            actionTo="/coach"
          />
        )}

        {sessions?.length > 0 && (
          <>
            <div className="chip-row" style={{ marginBottom: 20 }} role="group" aria-label="Filter by mode">
              {[{ id: 'all', title: 'All' }, ...MODES].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className="chip"
                  aria-pressed={filter === m.id}
                  onClick={() => setFilter(m.id)}
                >
                  {m.title} <span className="subtle" style={{ marginLeft: 6 }}>{counts[m.id] || 0}</span>
                </button>
              ))}
            </div>
            {visible.length === 0 ? (
              <p className="muted" style={{ padding: '24px 0' }}>
                No sessions in this mode yet.
              </p>
            ) : (
              <div className="session-list">
                <AnimatePresence initial={false}>
                  {visible.map((s, i) => (
                    <SessionCard key={s.id} session={s} index={i} onDelete={setPendingDelete} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        open={Boolean(pendingDelete)}
        title="Delete this session?"
        onClose={closeModal}
        actions={
          <>
            <Button onClick={closeModal} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </>
        }
      >
        <p>
          “{pendingDelete?.question}” and its analysis will be permanently removed. Your dashboard statistics will
          update.
        </p>
        {deleteError && (
          <p className="field-error" role="alert">
            {deleteError}
          </p>
        )}
      </Modal>
      <Toast message={toast} />
    </div>
  );
}
