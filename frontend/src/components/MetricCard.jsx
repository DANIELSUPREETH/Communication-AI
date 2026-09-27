import { motion } from 'framer-motion';

export default function MetricCard({ icon: Icon, label, value, hint, valueClassName = '', index = 0 }) {
  return (
    <motion.div
      className="card stat-card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.05 * index }}
    >
      <div className="stat-label">
        {Icon && <Icon aria-hidden="true" />}
        {label}
      </div>
      <div className={`stat-value ${valueClassName}`}>{value}</div>
      {hint && <div className="stat-hint">{hint}</div>}
    </motion.div>
  );
}
