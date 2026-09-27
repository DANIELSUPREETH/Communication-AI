import { useRef } from 'react';
import { motion } from 'framer-motion';
import { MODES } from '../data/coaching';

/** Radio-group of mode cards with arrow-key navigation. */
export default function ModeSelector({ value, onChange }) {
  const refs = useRef([]);

  const onKeyDown = (e, index) => {
    const delta = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!delta) return;
    e.preventDefault();
    const next = (index + delta + MODES.length) % MODES.length;
    onChange(MODES[next].id);
    refs.current[next]?.focus();
  };

  return (
    <div className="mode-grid" role="radiogroup" aria-label="Coaching mode">
      {MODES.map((mode, i) => {
        const selected = value === mode.id;
        const Icon = mode.icon;
        return (
          <button
            key={mode.id}
            ref={(el) => (refs.current[i] = el)}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            className="mode-card"
            onClick={() => onChange(mode.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            {selected && (
              <motion.span
                layoutId="mode-ring"
                className="mode-card-selected-ring"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            <span className="icon-tile" aria-hidden="true">
              <Icon />
            </span>
            <span>
              <span className="mc-title">{mode.title}</span>
              <span className="mc-desc">{mode.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
