import { Inbox } from 'lucide-react';
import Button from './Button';

export default function EmptyState({ icon: Icon = Inbox, title, description, actionLabel, actionTo, headingLevel = 2 }) {
  const Heading = `h${headingLevel}`;
  return (
    <div className="state-box">
      <div className="icon-tile" aria-hidden="true">
        <Icon />
      </div>
      <Heading>{title}</Heading>
      {description && <p>{description}</p>}
      {actionLabel && actionTo && (
        <div className="btn-row">
          <Button to={actionTo} variant="primary">
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
