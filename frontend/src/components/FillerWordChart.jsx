import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function FillerWordChart({ fillerWords }) {
  const reduce = useReducedMotion();
  const entries = Object.entries(fillerWords || {}).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, c]) => sum + c, 0);
  const max = entries[0]?.[1] || 1;

  if (!entries.length) {
    return (
      <div className="notice" role="status">
        <Sparkles aria-hidden="true" />
        No filler words detected. Your answer stays direct.
      </div>
    );
  }

  return (
    <div>
      <p className="muted" style={{ fontSize: 14, marginBottom: 12 }}>
        {total} filler {total === 1 ? 'word' : 'words'} detected
      </p>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }} aria-label="Filler word counts">
        {entries.map(([word, count], i) => (
          <li className="filler-row" key={word}>
            <span className="word">{word}</span>
            <span className="filler-bar" aria-hidden="true">
              <motion.span
                style={{ width: `${(count / max) * 100}%` }}
                initial={{ scaleX: reduce ? 1 : 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.6, delay: 0.05 * i, ease: [0.16, 1, 0.3, 1] }}
              />
            </span>
            <span className="count" aria-label={`${count} times`}>
              {count}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
