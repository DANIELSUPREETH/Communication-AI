import { motion, useReducedMotion } from 'framer-motion';
import AnimatedNumber from './AnimatedNumber';

const R = 70;
const CIRC = 2 * Math.PI * R;

export default function ScoreRing({ score }) {
  const reduce = useReducedMotion();
  const offset = CIRC * (1 - Math.min(Math.max(score, 0), 10) / 10);
  return (
    <div className="score-ring" role="img" aria-label={`Overall score ${score} out of 10`}>
      <svg viewBox="0 0 160 160" aria-hidden="true">
        <circle cx="80" cy="80" r={R} fill="none" stroke="var(--surface-3)" strokeWidth="10" />
        <motion.circle
          cx="80"
          cy="80"
          r={R}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          initial={{ strokeDashoffset: reduce ? offset : CIRC }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="score-ring-value" aria-hidden="true">
        <strong>
          <AnimatedNumber value={score} />
        </strong>
        <span>out of 10</span>
      </div>
    </div>
  );
}
