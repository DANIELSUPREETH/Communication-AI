import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlignLeft, BadgeCheck, Calendar, Check, Clock, Copy, Crosshair, Eye, Info, MessageCircle,
  PenLine, RotateCcw, Scissors, SpellCheck, Wand2,
} from 'lucide-react';
import Button from './Button';
import ScoreRing from './ScoreRing';
import ScoreCard from './ScoreCard';
import FeedbackCard from './FeedbackCard';
import FillerWordChart from './FillerWordChart';
import AnswerComparison from './AnswerComparison';
import Toast from './Toast';
import { METRICS, MODE_LABELS, scoreVerdict } from '../data/coaching';
import { formatDateTime } from '../utils/formatDate';
import { formatDuration } from '../utils/formatDuration';
import { countWords } from '../utils/text';

const METRIC_ICONS = {
  clarity: Eye,
  structure: AlignLeft,
  conciseness: Scissors,
  confidence: BadgeCheck,
  grammar: SpellCheck,
  relevance: Crosshair,
};

const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 };

async function copyText(text) {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  // Fallback for non-secure contexts / older browsers
  const el = document.createElement('textarea');
  el.value = text;
  el.setAttribute('readonly', '');
  el.style.position = 'fixed';
  el.style.opacity = '0';
  document.body.appendChild(el);
  el.select();
  const ok = document.execCommand('copy');
  document.body.removeChild(el);
  if (!ok) throw new Error('copy failed');
}

function Section({ title, subtitle, children, delay = 0 }) {
  return (
    <motion.section
      className="section"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
    >
      <h2 className="section-title">
        {title}
        {subtitle && <span className="muted">{subtitle}</span>}
      </h2>
      {children}
    </motion.section>
  );
}

/** Full analysis for one session. Used by /results/:id and /history/:id. */
export default function AnalysisView({ session, heading, showQuestion = false }) {
  const navigate = useNavigate();
  const [toast, setToast] = useState('');
  const [copied, setCopied] = useState(false);
  const toastTimer = useRef(null);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const flash = (message) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      setToast('');
      setCopied(false);
    }, 2200);
  };

  const onCopy = async () => {
    try {
      await copyText(session.improved_answer);
      setCopied(true);
      flash('Improved answer copied');
    } catch {
      flash("Couldn't copy automatically. Select the text to copy it.");
    }
  };

  const practiceAgain = () =>
    navigate('/coach', { state: { mode: session.mode, question: session.question } });

  const useImproved = () =>
    navigate('/coach', {
      state: { mode: session.mode, question: session.question, answer: session.improved_answer },
    });

  const improvements = [...session.improvements].sort(
    (a, b) => (SEVERITY_ORDER[a.severity] ?? 1) - (SEVERITY_ORDER[b.severity] ?? 1),
  );

  return (
    <>
      <header className="page-header">
        <span className="eyebrow">
          <Wand2 size={14} aria-hidden="true" /> {MODE_LABELS[session.mode] || 'Practice'} session
        </span>
        <h1 style={{ marginTop: 10 }}>{heading}</h1>
      </header>

      {showQuestion && (
        <section className="card card-lg" style={{ marginBottom: 16 }} aria-label="Question and original answer">
          <p className="subtle" style={{ fontSize: 13, marginBottom: 6 }}>Question</p>
          <p className="question-block">{session.question}</p>
          <p className="subtle" style={{ fontSize: 13, margin: '20px 0 6px' }}>Your original answer</p>
          <p className="answer-block">{session.answer}</p>
        </section>
      )}

      <motion.section
        className="card card-lg"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        aria-label="Overall score"
      >
        <div className="score-hero">
          <ScoreRing score={session.overall_score} />
          <div style={{ minWidth: 0 }}>
            <p className="score-verdict">{scoreVerdict(session.overall_score)}</p>
            <p className="muted">{session.summary}</p>
            {!showQuestion && (
              <p className="subtle" style={{ fontSize: 14, marginTop: 12, overflowWrap: 'anywhere' }}>
                <MessageCircle size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }} aria-hidden="true" />
                {session.question}
              </p>
            )}
            <div className="meta-row">
              <span className="badge">
                <Calendar aria-hidden="true" />
                {formatDateTime(session.created_at)}
              </span>
              <span className="badge">
                <Clock aria-hidden="true" />
                {formatDuration(session.duration_seconds)}
              </span>
              <span className="badge">{countWords(session.answer)} words</span>
              <span className="badge badge-success">
                <Check aria-hidden="true" /> Saved to history
              </span>
            </div>
          </div>
        </div>
      </motion.section>

      <Section title="Communication metrics">
        <div className="grid grid-3">
          {METRICS.map((m, i) => (
            <ScoreCard
              key={m.key}
              index={i}
              icon={METRIC_ICONS[m.key]}
              label={m.label}
              score={session[`${m.key}_score`]}
              explanation={session.score_explanations?.[m.key] || m.blurb}
            />
          ))}
        </div>
      </Section>

      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <Section title="What You Did Well" delay={0.05}>
          <ul className="feedback-list">
            {session.strengths.map((s, i) => (
              <FeedbackCard key={i} kind="positive" text={s} index={i} />
            ))}
          </ul>
        </Section>
        <Section title="What You Can Improve" delay={0.1}>
          <ul className="feedback-list">
            {improvements.map((imp, i) => (
              <FeedbackCard key={i} kind="improve" text={imp.text} severity={imp.severity} index={i} />
            ))}
          </ul>
        </Section>
      </div>

      <Section title="Filler Words">
        <div className="card">
          <FillerWordChart fillerWords={session.filler_words} />
        </div>
      </Section>

      <Section title="AI-Improved Version">
        <div className="card card-lg improved-card">
          <p className="improved-text">{session.improved_answer}</p>
          <div className="btn-row" style={{ marginTop: 24 }}>
            <Button onClick={onCopy} aria-live="polite">
              {copied ? <Check /> : <Copy />} {copied ? 'Copied' : 'Copy'}
            </Button>
            <Button onClick={practiceAgain}>
              <RotateCcw /> Try Again
            </Button>
            <Button variant="primary" onClick={useImproved}>
              <PenLine /> Use This Version
            </Button>
          </div>
          <p className="ai-note">
            <Info aria-hidden="true" />
            AI suggestions improve structure and clarity while preserving your original information.
          </p>
        </div>
      </Section>

      <Section title="Side-by-side comparison">
        <AnswerComparison
          original={session.answer}
          improved={session.improved_answer}
          fillerWords={session.filler_words}
        />
      </Section>

      <div className="btn-row" style={{ marginTop: 40 }}>
        <Button variant="primary" size="lg" onClick={practiceAgain}>
          <RotateCcw /> Practice Again
        </Button>
        <Button size="lg" to="/dashboard">
          View Dashboard
        </Button>
      </div>

      <Toast message={toast} />
    </>
  );
}
