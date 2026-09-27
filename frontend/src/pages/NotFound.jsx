import { Compass } from 'lucide-react';
import EmptyState from '../components/EmptyState';

export default function NotFound() {
  return (
    <div className="page">
      <div className="container container-narrow">
        <EmptyState
          icon={Compass}
          headingLevel={1}
          title="Page not found"
          description="The page you're looking for doesn't exist or has moved."
          actionLabel="Go to the coach"
          actionTo="/coach"
        />
      </div>
    </div>
  );
}
