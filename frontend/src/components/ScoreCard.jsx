import { motion, useReducedMotion } from 'framer-motion';

export default function ScoreCard({ icon: Icon, label, score, explanation, index = 0 }) {
  const reduce = useReducedMotion();
  return (
    <motion.article
      className="card score-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.05 * index }}
    >
      <div className="score-card-top">
        <span className="score-card-label">
          {Icon && <Icon aria-hidden="true" />}
          {label}
        </span>
        <span className="score-card-value">
          {score.toFixed(1)} <small>/ 10</small>
        </span>
      </div>
      <div
        className="progress"
        role="progressbar"
        aria-label={`${label} score`}
        aria-valuemin={0}
        aria-valuemax={10}
        aria-valuenow={score}
      >
        <motion.span
          initial={{ width: reduce ? `${score * 10}%` : 0 }}
          animate={{ width: `${score * 10}%` }}
          transition={{ duration: 0.8, delay: 0.1 + 0.05 * index, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      {explanation && <p>{explanation}</p>}
    </motion.article>
  );
}
