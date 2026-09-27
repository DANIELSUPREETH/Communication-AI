import { Mic, Pause, Play, Square, X } from 'lucide-react';
import Button from './Button';
import { formatClock } from '../utils/formatDuration';

/** Recording status bar with Pause / Resume, Stop and Cancel controls. */
export default function VoiceRecorder({ speech, onStop }) {
  const paused = speech.status === 'paused';
  return (
    <div className={`recorder${paused ? ' paused' : ''}`} role="status" aria-live="polite">
      <span className="rec-dot" aria-hidden="true" />
      <span className="rec-label">{paused ? 'Paused' : 'Recording...'}</span>
      <span className="rec-time" aria-label={`Elapsed ${speech.elapsed} seconds`}>
        {formatClock(speech.elapsed)}
      </span>
      <span className="rec-bars" aria-hidden="true">
        <i /><i /><i /><i />
      </span>
      <div className="rec-actions">
        {paused ? (
          <Button size="sm" onClick={speech.resume}>
            <Play /> Resume
          </Button>
        ) : (
          <Button size="sm" onClick={speech.pause}>
            <Pause /> Pause
          </Button>
        )}
        <Button size="sm" onClick={onStop}>
          <Square /> Stop
        </Button>
        <Button size="sm" variant="ghost" onClick={speech.cancel}>
          <X /> Cancel
        </Button>
      </div>
    </div>
  );
}

export function RecordButton({ onClick, disabled }) {
  return (
    <Button size="sm" onClick={onClick} disabled={disabled}>
      <Mic /> Record Answer
    </Button>
  );
}
