import { motion } from 'framer-motion';
import {
  AlignLeft, ArrowRight, BadgeCheck, Check, Crosshair, Eye, LineChart, Mic, Scissors, Sparkles,
  SpellCheck, Target, Wand2, AlertCircle, Repeat,
} from 'lucide-react';
import Button from '../components/Button';

// Illustrative example values for the product preview only (not user data).
const PREVIEW = {
  overall: 8.6,
  metrics: [
    ['Clarity', 8.9],
    ['Structure', 8.4],
    ['Confidence', 8.7],
    ['Conciseness', 7.8],
  ],
};

const FEATURES = [
  { icon: Sparkles, title: 'Structured AI feedback', text: 'Scores for six communication dimensions, each with a short explanation.' },
  { icon: Wand2, title: 'Improved answer', text: 'A rewrite that keeps your facts and experience, with tighter structure.' },
  { icon: Mic, title: 'Type or speak', text: 'Dictate your answer with voice input, or type it. Your choice, every time.' },
  { icon: Scissors, title: 'Filler word detection', text: 'Exact counts of “um”, “like”, “basically” and more, highlighted in context.' },
  { icon: LineChart, title: 'Progress tracking', text: 'Every session is saved so you can see your scores trend over time.' },
  { icon: Repeat, title: 'Pattern detection', text: 'Spots habits that repeat across sessions and sets your next practice goal.' },
];

const STEPS = [
  { title: 'Choose a mode', text: 'Interview, presentation or general communication.' },
  { title: 'Answer a question', text: 'Pick a suggested question or bring your own.' },
  { title: 'Get your analysis', text: 'See scores, strengths, improvements and a better version.' },
  { title: 'Practice again', text: 'Apply the feedback and watch your progress build.' },
];

const METRIC_INFO = [
  { icon: Eye, title: 'Clarity', text: 'How easy your answer is to follow on first listen.' },
  { icon: AlignLeft, title: 'Structure', text: 'A clear opening, logical flow and a direct close.' },
  { icon: Scissors, title: 'Conciseness', text: 'Getting to the point without repetition or padding.' },
  { icon: BadgeCheck, title: 'Confidence', text: 'Direct statements instead of hedging phrases.' },
  { icon: SpellCheck, title: 'Grammar', text: 'Correct, natural sentences that read well aloud.' },
  { icon: Crosshair, title: 'Relevance', text: 'How directly you answer the question asked.' },
];

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.45, ease: 'easeOut' },
};

function PreviewWindow() {
  return (
    <div className="mock-window" aria-label="Example analysis preview" role="img">
      <div className="mock-bar" aria-hidden="true">
        <i /><i /><i />
        <span>Example analysis</span>
      </div>
      <div className="mock-body" aria-hidden="true">
        <span className="subtle" style={{ fontSize: 13 }}>Communication Score</span>
        <div className="mock-score">
          <strong>{PREVIEW.overall}</strong>
          <span className="subtle">/ 10</span>
        </div>
        {PREVIEW.metrics.map(([label, value], i) => (
          <div className="metric-row" key={label}>
            <span className="muted">{label}</span>
            <span className="progress">
              <motion.span
                initial={{ width: 0 }}
                animate={{ width: `${value * 10}%` }}
                transition={{ duration: 1, delay: 0.3 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              />
            </span>
            <span className="value">{value}</span>
          </div>
        ))}
        <div className="feedback-item positive" style={{ marginTop: 18, background: 'var(--bg-elevated)' }}>
          <span className="fi-icon"><Check strokeWidth={3} /></span>
          <span className="fi-body">Strong opening that answers the question directly.</span>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="badge badge-accent">
              <Sparkles aria-hidden="true" /> AI communication coach
            </span>
            <h1>
              Speak with confidence.
              <br />
              <span className="accent">Communicate with clarity.</span>
            </h1>
            <p className="hero-lead">
              Practice your answers, receive AI-powered communication feedback, and build better communication habits.
            </p>
            <div className="hero-ctas">
              <Button to="/coach" variant="primary" size="lg">
                Start Coaching <ArrowRight />
              </Button>
              <Button size="lg" onClick={() => document.getElementById('how-it-works')?.scrollIntoView()}>
                See How It Works
              </Button>
            </div>
            <p className="hero-note">No account needed. Type or speak your answer.</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <PreviewWindow />
          </motion.div>
        </div>
      </section>

      <section className="landing-section" aria-labelledby="preview-title">
        <div className="container">
          <motion.div className="landing-section-header" {...fadeUp}>
            <span className="eyebrow">Product preview</span>
            <h2 id="preview-title">Feedback you can act on in minutes</h2>
            <p>Every analysis explains what worked, what to improve, and shows a stronger version of your own answer.</p>
          </motion.div>
          <motion.div className="mock-window" {...fadeUp}>
            <div className="mock-bar" aria-hidden="true">
              <i /><i /><i />
              <span>Example · “Tell me about yourself.”</span>
            </div>
            <div className="mock-body example-grid">
              <div>
                <h3 className="card-title" style={{ marginBottom: 12 }}>What You Can Improve</h3>
                <ul className="feedback-list">
                  {[
                    ['The answer becomes lengthy after the main point.', 'Medium', 'badge-warning'],
                    ['Several sentences repeat the same idea.', 'Low', ''],
                    ['The conclusion could be more direct.', 'Medium', 'badge-warning'],
                  ].map(([t, sev, cls]) => (
                    <li className="feedback-item improve" key={t} style={{ background: 'var(--bg-elevated)' }}>
                      <span className="fi-icon" aria-hidden="true"><AlertCircle strokeWidth={2.5} /></span>
                      <span className="fi-body">{t}</span>
                      <span className={`badge ${cls}`}>{sev}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="card-title" style={{ marginBottom: 12 }}>Filler Words</h3>
                {[['basically', 4], ['um', 3], ['like', 2], ['actually', 1]].map(([w, c]) => (
                  <div className="filler-row" key={w}>
                    <span className="word">{w}</span>
                    <span className="filler-bar"><span style={{ width: `${(c / 4) * 100}%` }} /></span>
                    <span className="count">{c}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="landing-section" aria-labelledby="features-title">
        <div className="container">
          <motion.div className="landing-section-header" {...fadeUp}>
            <span className="eyebrow">Features</span>
            <h2 id="features-title">A coach, not a chatbot</h2>
            <p>Communicate AI focuses on one loop: practice, understand, improve, repeat.</p>
          </motion.div>
          <div className="grid grid-3">
            {FEATURES.map((f, i) => (
              <motion.article
                className="card feature-card"
                key={f.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.05 }}
              >
                <span className="icon-tile" aria-hidden="true"><f.icon /></span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section" id="how-it-works" aria-labelledby="how-title" style={{ scrollMarginTop: 72 }}>
        <div className="container">
          <motion.div className="landing-section-header" {...fadeUp}>
            <span className="eyebrow">How it works</span>
            <h2 id="how-title">Four steps to a better answer</h2>
          </motion.div>
          <ol className="steps">
            {STEPS.map((s, i) => (
              <motion.li className="step" key={s.title} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.06 }}>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      <section className="landing-section" aria-labelledby="metrics-title">
        <div className="container">
          <motion.div className="landing-section-header" {...fadeUp}>
            <span className="eyebrow">Communication metrics</span>
            <h2 id="metrics-title">Six dimensions, scored from 0 to 10</h2>
            <p>Only observable communication is evaluated. No personality or psychological judgments, ever.</p>
          </motion.div>
          <div className="grid grid-3">
            {METRIC_INFO.map((m, i) => (
              <motion.div
                className="card feature-card"
                key={m.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.04 }}
              >
                <span className="icon-tile" aria-hidden="true"><m.icon /></span>
                <h3>{m.title}</h3>
                <p>{m.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section" aria-labelledby="example-title">
        <div className="container">
          <motion.div className="landing-section-header" {...fadeUp}>
            <span className="eyebrow">Example feedback</span>
            <h2 id="example-title">Same experience, clearer answer</h2>
            <p>The improved version reorganizes what you said. It never invents projects, companies or results.</p>
          </motion.div>
          <div className="example-grid">
            <motion.div className="card card-lg" {...fadeUp}>
              <p className="subtle" style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
                Original
              </p>
              <p className="quote-block">
                “Um, so basically I am a computer science student and, like, I have worked on several projects. One
                project was a chat app that I built with React and, um, Node. I basically like building things.”
              </p>
            </motion.div>
            <motion.div className="card card-lg improved-card" {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.08 }}>
              <p className="eyebrow" style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
                <Target size={13} aria-hidden="true" /> Improved
              </p>
              <p className="quote-block" style={{ color: 'var(--text)', borderColor: 'var(--accent)' }}>
                “I’m a computer science student who enjoys building things. My most recent project is a chat app I
                built with React and Node, and I’ve worked on several other projects along the way.”
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="container">
          <motion.div className="cta-panel" {...fadeUp}>
            <h2>Your next answer can be your best one.</h2>
            <p>Practice a question now and get your first analysis in seconds.</p>
            <div className="btn-row">
              <Button to="/coach" variant="primary" size="lg">
                Start Coaching <ArrowRight />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
