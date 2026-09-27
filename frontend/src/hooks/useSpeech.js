import { useCallback, useEffect, useRef, useState } from 'react';

const SpeechRecognitionImpl =
  typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : undefined;

const ERROR_MESSAGES = {
  'not-allowed': 'Microphone access was blocked. Allow it in your browser settings, or type your answer instead.',
  'service-not-allowed': 'Voice input is blocked in this browser. You can still type your answer.',
  'audio-capture': "We couldn't find a microphone. You can still type your answer.",
  network: 'Voice input needs an internet connection in this browser. You can still type your answer.',
};

/**
 * Browser speech-to-text with pause / resume / stop / cancel.
 *
 * `onTranscript(text)` receives the full text (text before recording + everything
 * dictated so far, including interim words) whenever it changes.
 * Voice input is always optional: when unsupported, `supported` is false and
 * nothing else happens.
 */
export function useSpeech({ onTranscript, lang = 'en-US' } = {}) {
  const supported = Boolean(SpeechRecognitionImpl);
  const [status, setStatus] = useState('idle'); // idle | recording | paused
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const statusRef = useRef('idle');
  const baseTextRef = useRef(''); // text in the editor when recording started
  const finalRef = useRef(''); // finalized dictated text
  const timerRef = useRef(null);
  const elapsedRef = useRef(0);
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  const setStatusBoth = (s) => {
    statusRef.current = s;
    setStatus(s);
  };

  const compose = (interim = '') => {
    const dictated = `${finalRef.current}${interim}`.replace(/\s+/g, ' ').trim();
    const base = baseTextRef.current.trimEnd();
    if (!dictated) return baseTextRef.current;
    return base ? `${base} ${dictated}` : dictated;
  };

  const stopTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const startTimer = () => {
    stopTimer();
    timerRef.current = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
    }, 1000);
  };

  const teardownRecognition = () => {
    const rec = recognitionRef.current;
    recognitionRef.current = null;
    if (rec) {
      rec.onresult = rec.onerror = rec.onend = null;
      try {
        rec.abort();
      } catch {
        /* already stopped */
      }
    }
  };

  const createRecognition = useCallback(() => {
    const rec = new SpeechRecognitionImpl();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = lang;

    rec.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalRef.current += `${transcript} `;
        else interim += transcript;
      }
      onTranscriptRef.current?.(compose(interim));
    };

    rec.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      setError(ERROR_MESSAGES[event.error] || 'Voice input stopped unexpectedly. You can keep typing your answer.');
      stopTimer();
      teardownRecognition();
      setStatusBoth('idle');
    };

    // Some browsers end continuous recognition after silence; restart while recording.
    rec.onend = () => {
      if (statusRef.current === 'recording' && recognitionRef.current === rec) {
        try {
          rec.start();
        } catch {
          stopTimer();
          setStatusBoth('idle');
        }
      }
    };
    return rec;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const begin = () => {
    const rec = createRecognition();
    recognitionRef.current = rec;
    try {
      rec.start();
      return true;
    } catch {
      setError('Voice input could not start. You can still type your answer.');
      recognitionRef.current = null;
      return false;
    }
  };

  const start = useCallback(
    (currentText = '') => {
      if (!supported || statusRef.current !== 'idle') return;
      setError(null);
      baseTextRef.current = currentText;
      finalRef.current = '';
      elapsedRef.current = 0;
      setElapsed(0);
      if (begin()) {
        setStatusBoth('recording');
        startTimer();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [supported, createRecognition],
  );

  const pause = useCallback(() => {
    if (statusRef.current !== 'recording') return;
    setStatusBoth('paused');
    stopTimer();
    teardownRecognition();
    onTranscriptRef.current?.(compose()); // drop unfinished interim words
  }, []);

  const resume = useCallback(() => {
    if (statusRef.current !== 'paused') return;
    if (begin()) {
      setStatusBoth('recording');
      startTimer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createRecognition]);

  /** Finish recording and keep the transcript. Returns { seconds, text }. */
  const stop = useCallback(() => {
    if (statusRef.current === 'idle') return null;
    stopTimer();
    teardownRecognition();
    setStatusBoth('idle');
    const text = compose();
    onTranscriptRef.current?.(text);
    return { seconds: elapsedRef.current, text };
  }, []);

  /** Discard everything dictated in this recording. */
  const cancel = useCallback(() => {
    if (statusRef.current === 'idle') return;
    stopTimer();
    teardownRecognition();
    setStatusBoth('idle');
    finalRef.current = '';
    elapsedRef.current = 0;
    setElapsed(0);
    onTranscriptRef.current?.(baseTextRef.current);
  }, []);

  useEffect(
    () => () => {
      stopTimer();
      teardownRecognition();
    },
    [],
  );

  return { supported, status, elapsed, error, clearError: () => setError(null), start, pause, resume, stop, cancel };
}
