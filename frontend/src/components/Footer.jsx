import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <span>© {new Date().getFullYear()} Communicate AI. Practice with purpose.</span>
        <nav className="footer-links" aria-label="Footer">
          <Link to="/coach">Coach</Link>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/history">History</Link>
        </nav>
      </div>
    </footer>
  );
}
