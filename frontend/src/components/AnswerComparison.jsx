import { ArrowRight } from 'lucide-react';
import { countFillers, countWords, segmentFillers, sentenceStats } from '../utils/text';

function Stat({ label, before, after }) {
  return (
    <div className="compare-stat">
      <div className="label-sm">{label}</div>
      <div className="values">
        <span className="before">{before}</span>
        <ArrowRight aria-hidden="true" />
        <span>{after}</span>
        <span className="sr-only">
          {label}: {before} before, {after} after
        </span>
      </div>
    </div>
  );
}

export default function AnswerComparison({ original, improved, fillerWords }) {
  const segments = segmentFillers(original, fillerWords);
  const hasFillers = segments.some((s) => s.filler);
  const before = sentenceStats(original);
  const after = sentenceStats(improved);

  return (
    <div className="card card-lg">
      <div className="compare-grid">
        <div className="compare-col">
          <h3>Your answer</h3>
          <p className="compare-text">
            {segments.map((s, i) =>
              s.filler ? (
                <mark className="filler" key={i} title="Filler word">
                  {s.text}
                </mark>
              ) : (
                <span key={i}>{s.text}</span>
              ),
            )}
          </p>
          {hasFillers && (
            <p className="subtle" style={{ fontSize: 12, marginTop: 12 }}>
              <mark className="filler">marked</mark> words are filler words removed in the improved version.
            </p>
          )}
        </div>
        <div className="compare-col improved">
          <h3>Improved version</h3>
          <p className="compare-text">{improved}</p>
        </div>
      </div>
      <div className="compare-stats">
        <Stat label="Words" before={countWords(original)} after={countWords(improved)} />
        <Stat label="Avg. words per sentence" before={before.avgSentenceWords} after={after.avgSentenceWords} />
        <Stat
          label="Filler words"
          before={countFillers(original, fillerWords)}
          after={countFillers(improved, fillerWords)}
        />
      </div>
    </div>
  );
}
