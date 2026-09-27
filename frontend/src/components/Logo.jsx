import { Link } from 'react-router-dom';
import { MessageSquareText } from 'lucide-react';

export default function Logo({ onClick }) {
  return (
    <Link to="/" className="logo" aria-label="Communicate AI home" onClick={onClick}>
      <span className="logo-mark" aria-hidden="true">
        <MessageSquareText />
      </span>
      COMMUNICATE AI
    </Link>
  );
}
