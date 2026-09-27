import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AlertTriangle, MicOff, Sparkles } from 'lucide-react';
import Button from '../components/Button';
import ModeSelector from '../components/ModeSelector';
import VoiceRecorder, { RecordButton } from '../components/VoiceRecorder';
import LoadingAnalysis from '../components/LoadingAnalysis';
import { SUGGESTED_QUESTIONS } from '../data/coaching';
import { useSpeech } from '../hooks/useSpeech';
import { useAnalysis } from '../hooks/useAnalysis';
import { formatDuration } from '../utils/formatDuration';
import {
  MAX_ANSWER_CHARS, MAX_QUESTION_CHARS, MIN_ANSWER_WORDS, countWords, estimateSeconds,
} from '../utils/text';

const VALID_MODES = Object.keys(SUGGESTED_QUESTIONS);

export default function Coach() {
  const location = useLocation();
  const navigate = useNavigate();
  const prefill = location.state || {};

  const [mode, setMode] = useState(VALID_MODES.includes(prefill.mode) ? prefill.mode : 'interview');
  const [question, setQuestion] = useState(prefill.question || '');
  const [answer, setAnswer] = useState(prefill.answer || '');
  const [recordedSeconds, setRecordedSeconds] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const questionId = useId();
  const answerId = useId();
  const answerRef = useRef(null);

  const speech = useSpeech({ onTranscript: setAnswer });
  const { analyze, isLoading, error: apiError } = useAnalysis();

  // Clear router state so a refresh doesn't re-apply the prefill after edits.
  useEffect(() => {
    if (location.state) navigate(location.pathname, { replace: true, state: null });
    if (prefill.answer) answerRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const words = useMemo(() => countWords(answer), [answer]);
  const chars = answer.length;
  const estimate = useMemo(() => estimateSeconds(answer), [answer]);
  const overLimit = chars > MAX_ANSWER_CHARS;
  const recording = speech.status !== 'idle';

  const validate = (q = question, a = answer) => {
    const next = {};
    if (!q.trim()) next.question = 'Choose a suggested question or write your own.';
    else if (q.length > MAX_QUESTION_CHARS)
      next.question = `Keep the question under ${MAX_QUESTION_CHARS} characters.`;
    if (!a.trim()) next.answer = 'Type or record your answer before analyzing.';
    else if (countWords(a) < MIN_ANSWER_WORDS)
      next.answer = `Write at least ${MIN_ANSWER_WORDS} words so there's something to analyze.`;
    else if (a.length > MAX_ANSWER_CHARS) next.answer = `Your answer is over the ${MAX_ANSWER_CHARS.toLocaleString()} character limit.`;
    return next;
  };

  // Re-validate live once the user has tried to submit.
  useEffect(() => {
    if (submitted) setErrors(validate());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question, answer, submitted]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    // Submitting mid-recording finalizes the transcript first.
    let finalAnswer = answer;
    let finalSeconds = recordedSeconds;
    if (recording) {
      const result = speech.stop();
      if (result) {
        finalAnswer = result.text;
        finalSeconds = result.seconds || null;
        setRecordedSeconds(finalSeconds);
      }
    }
    setSubmitted(true);
    const found = validate(question, finalAnswer);
    setErrors(found);
    if (Object.keys(found).length) {
      document.getElementById(found.question ? questionId : answerId)?.focus();
      return;
    }
    const session = await analyze({
      mode,
      question: question.trim(),
      answer: finalAnswer.trim(),
      ...(finalSeconds ? { recorded_seconds: finalSeconds } : {}),
    });
    if (session) navigate(`/results/${session.id}`, { state: { session } });
  };

  const onStartRecording = () => {
    setRecordedSeconds(null);
    speech.start(answer);
  };

  const onStopRecording = () => {
    const result = speech.stop();
    setRecordedSeconds(result?.seconds || null);
    answerRef.current?.focus();
  };

  const onAnswerChange = (e) => {
    setAnswer(e.target.value);
    if (!e.target.value.trim()) setRecordedSeconds(null);
  };

  const suggestions = SUGGESTED_QUESTIONS[mode];

  return (
    <div className="page">
      <div className="container container-narrow">
        <header className="page-header">
          <span className="eyebrow">
            <Sparkles size={14} aria-hidden="true" /> Practice session
          </span>
          <h1 style={{ marginTop: 10 }}>AI Communication Coach</h1>
          <p>Practice your response and get personalized feedback.</p>
        </header>

        <form onSubmit={onSubmit} noValidate>
          <section aria-labelledby="mode-heading">
            <p className="coach-step" id="mode-heading">
              <b>1</b> Choose a coaching mode
            </p>
            <ModeSelector value={mode} onChange={setMode} />
          </section>

          <section className="section" aria-labelledby="question-heading" style={{ marginTop: 36 }}>
            <p className="coach-step" id="question-heading">
              <b>2</b> Pick or write a question
            </p>
            <div className="chip-row" style={{ marginBottom: 14 }} aria-label="Suggested questions">
              {suggestions.map((q) => (
                <button
                  key={q}
                  type="button"
                  className="chip"
                  aria-pressed={question === q}
                  onClick={() => setQuestion(q)}
                >
                  {q}
                </button>
              ))}
            </div>
            <label className="sr-only" htmlFor={questionId}>
              Question
            </label>
            <input
              id={questionId}
              className="input"
              placeholder="Or type your own question..."
              value={question}
              maxLength={MAX_QUESTION_CHARS}
              onChange={(e) => setQuestion(e.target.value)}
              aria-invalid={Boolean(errors.question)}
              aria-describedby={errors.question ? `${questionId}-error` : undefined}
            />
            {errors.question && (
              <p className="field-error" id={`${questionId}-error`}>
                {errors.question}
              </p>
            )}
          </section>

          <section className="section" aria-labelledby="answer-heading" style={{ marginTop: 36 }}>
            <div className="coach-step" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }} id="answer-heading">
                <b>3</b> Write or record your answer
              </span>
              {speech.supported && !recording && <RecordButton onClick={onStartRecording} disabled={isLoading} />}
            </div>

            {!speech.supported && (
              <div className="notice" style={{ marginBottom: 12 }}>
                <MicOff aria-hidden="true" />
                Voice input isn&apos;t supported in this browser. You can still type your answer.
              </div>
            )}
            {speech.error && (
              <div className="notice notice-danger" style={{ marginBottom: 12 }} role="alert">
                <MicOff aria-hidden="true" />
                {speech.error}
              </div>
            )}
            {recording && <VoiceRecorder speech={speech} onStop={onStopRecording} />}

            <label className="sr-only" htmlFor={answerId}>
              Your answer
            </label>
            <textarea
              id={answerId}
              ref={answerRef}
              className="textarea"
              placeholder="Type your answer here..."
              value={answer}
              onChange={onAnswerChange}
              readOnly={speech.status === 'recording'}
              aria-invalid={Boolean(errors.answer)}
              aria-describedby={`${answerId}-stats${errors.answer ? ` ${answerId}-error` : ''}`}
            />
            {errors.answer && (
              <p className="field-error" id={`${answerId}-error`}>
                {errors.answer}
              </p>
            )}
            <div className="editor-meta">
              <div className="editor-stats" id={`${answerId}-stats`} aria-live="off">
                <span>
                  Words: <b>{words}</b>
                </span>
                <span className={overLimit ? 'over' : ''}>
                  Characters: <b className={overLimit ? 'over' : ''}>{chars.toLocaleString()}</b>
                  <span className="subtle"> / {MAX_ANSWER_CHARS.toLocaleString()}</span>
                </span>
                <span>
                  Estimated time: <b>{formatDuration(recordedSeconds || estimate)}</b>
                </span>
              </div>
              {answer && !recording && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setAnswer('');
                    setRecordedSeconds(null);
                    answerRef.current?.focus();
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </section>

          {apiError && (
            <div className="notice notice-danger" role="alert" style={{ marginTop: 24 }}>
              <AlertTriangle aria-hidden="true" />
              <span>{apiError.message}</span>
            </div>
          )}

          <div className="submit-bar">
            <p className="subtle" style={{ fontSize: 13 }}>
              Your session is saved automatically after analysis.
            </p>
            <Button type="submit" variant="primary" size="lg" disabled={isLoading} aria-busy={isLoading}>
              <Sparkles /> {isLoading ? 'Analyzing...' : 'Analyze My Response'}
            </Button>
          </div>
        </form>
      </div>

      <AnimatePresence>{isLoading && <LoadingAnalysis />}</AnimatePresence>
    </div>
  );
}
