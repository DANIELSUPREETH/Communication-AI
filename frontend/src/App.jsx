import { Suspense, lazy, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PageTransition from './components/PageTransition';
import Skeleton from './components/Skeleton';
import Landing from './pages/Landing';
import Coach from './pages/Coach';

// Heavier pages (charts, analysis views) load on demand.
const Results = lazy(() => import('./pages/Results'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const History = lazy(() => import('./pages/History'));
const SessionDetails = lazy(() => import('./pages/SessionDetails'));
const NotFound = lazy(() => import('./pages/NotFound'));

const TITLES = {
  '/': 'Communicate AI · Communication & Interview Coach',
  '/coach': 'Coach · Communicate AI',
  '/dashboard': 'Dashboard · Communicate AI',
  '/history': 'History · Communicate AI',
};

function PageFallback() {
  return (
    <div className="page">
      <div className="container" aria-busy="true" aria-label="Loading page">
        <Skeleton width={260} height={32} />
        <Skeleton width="60%" style={{ marginTop: 14 }} />
      </div>
    </div>
  );
}

function RouteEffects() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title =
      TITLES[pathname] ||
      (pathname.startsWith('/results') ? 'Analysis · Communicate AI' : pathname.startsWith('/history/') ? 'Session · Communicate AI' : 'Communicate AI');
  }, [pathname]);
  return null;
}

export default function App() {
  const location = useLocation();

  return (
    <MotionConfig reducedMotion="user">
      <div className="app-shell">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <RouteEffects />
        <Navbar />
        <main id="main" className="app-main" tabIndex={-1}>
          <Suspense fallback={<PageFallback />}>
            <AnimatePresence mode="wait" initial={false}>
              <PageTransition key={location.pathname}>
                <Routes location={location}>
                  <Route path="/" element={<Landing />} />
                  <Route path="/coach" element={<Coach />} />
                  <Route path="/results/:sessionId" element={<Results />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/history" element={<History />} />
                  <Route path="/history/:id" element={<SessionDetails />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </PageTransition>
            </AnimatePresence>
          </Suspense>
        </main>
        <Footer />
      </div>
    </MotionConfig>
  );
}
