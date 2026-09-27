import { motion } from 'framer-motion';
import { Calendar, Clock, Trash2 } from 'lucide-react';
import Button from './Button';
import { MODE_LABELS, scoreTone } from '../data/coaching';
import { formatDate } from '../utils/formatDate';
import { formatDuration } from '../utils/formatDuration';

export default function SessionCard({ session, onDelete, index = 0 }) {
  return (
    <motion.article
      className="card session-card"
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.25, delay: Math.min(index, 10) * 0.03 }}
    >
      <div style={{ minWidth: 0 }}>
        <div className="sc-top">
          <span className="badge badge-accent">{MODE_LABELS[session.mode] || session.mode}</span>
        </div>
        <h3 className="sc-question">“{session.question}”</h3>
        <div className="sc-meta">
          <span>
            <Calendar aria-hidden="true" />
            <time dateTime={session.created_at}>{formatDate(session.created_at)}</time>
          </span>
          <span>
            <Clock aria-hidden="true" />
            {formatDuration(session.duration_seconds)}
          </span>
        </div>
      </div>
      <div className="sc-right">
        <div className="sc-score">
          <strong className={scoreTone(session.overall_score)}>{session.overall_score.toFixed(1)}</strong>
          <span> / 10</span>
        </div>
        <div className="btn-row" style={{ flexWrap: 'nowrap' }}>
          <Button to={`/history/${session.id}`} size="sm">
            View Analysis
          </Button>
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              icon
              aria-label={`Delete session: ${session.question}`}
              onClick={() => onDelete(session)}
            >
              <Trash2 />
            </Button>
          )}
        </div>
      </div>
    </motion.article>
  );
}
