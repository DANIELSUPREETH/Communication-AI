import { AlertTriangle, RotateCw } from 'lucide-react';
import Button from './Button';

export default function ErrorState({
  title = 'Something went wrong',
  message = "We couldn't load this right now. Please try again.",
  onRetry,
  secondaryLabel,
  secondaryTo,
}) {
  return (
    <div className="state-box error" role="alert">
      <div className="icon-tile" aria-hidden="true">
        <AlertTriangle />
      </div>
      <h2>{title}</h2>
      <p>{message}</p>
      {(onRetry || secondaryTo) && (
        <div className="btn-row">
          {onRetry && (
            <Button variant="primary" onClick={onRetry}>
              <RotateCw /> Try again
            </Button>
          )}
          {secondaryTo && <Button to={secondaryTo}>{secondaryLabel}</Button>}
        </div>
      )}
    </div>
  );
}
