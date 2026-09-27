import { motion } from 'framer-motion';
import { AlertCircle, Check } from 'lucide-react';

const SEVERITY = {
  low: { label: 'Low', className: 'badge' },
  medium: { label: 'Medium', className: 'badge badge-warning' },
  high: { label: 'High', className: 'badge badge-danger' },
};

/** One strength or improvement. `severity` only applies to improvements. */
export default function FeedbackCard({ kind = 'positive', text, severity, index = 0 }) {
  const sev = severity ? SEVERITY[severity] || SEVERITY.medium : null;
  return (
    <motion.li
      className={`feedback-item ${kind === 'positive' ? 'positive' : 'improve'}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.04 * index }}
    >
      <span className="fi-icon" aria-hidden="true">
        {kind === 'positive' ? <Check strokeWidth={3} /> : <AlertCircle strokeWidth={2.5} />}
      </span>
      <span className="fi-body">{text}</span>
      {sev && (
        <span className={sev.className}>
          <span className="sr-only">Priority: </span>
          {sev.label}
        </span>
      )}
    </motion.li>
  );
}
