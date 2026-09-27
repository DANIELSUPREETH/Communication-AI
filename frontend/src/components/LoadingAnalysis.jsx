import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';

// UI progress messages only. The backend performs a single AI call; these steps
// describe what that call evaluates rather than separate requests.
const STEPS = [
  'Understanding your answer...',
  'Checking clarity...',
  'Analyzing structure...',
  'Finding filler words...',
  'Preparing recommendations...',
];

export default function LoadingAnalysis() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    // Advance through the steps, then hold on the last one until the response arrives.
    const id = setInterval(() => setCurrent((c) => Math.min(c + 1, STEPS.length - 1)), 1800);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      className="analysis-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="analysis-title"
      aria-describedby="analysis-step"
    >
      <motion.div
        className="card analysis-card"
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="orb" aria-hidden="true">
          <Sparkles />
        </div>
        <h2 id="analysis-title" style={{ fontSize: 20 }}>
          Analyzing your response
        </h2>
        <p className="muted" style={{ fontSize: 14, marginTop: 6 }}>
          This usually takes a few seconds.
        </p>
        <ul className="analysis-steps">
          {STEPS.map((step, i) => {
            const state = i < current ? 'done' : i === current ? 'current' : '';
            return (
              <li key={step} className={state} id={i === current ? 'analysis-step' : undefined}>
                <span className="step-icon" aria-hidden="true">
                  {state === 'done' ? <Check /> : state === 'current' ? <span className="mini-spinner" /> : <span className="dot-pending" />}
                </span>
                {step}
              </li>
            );
          })}
        </ul>
      </motion.div>
    </motion.div>
  );
}
