import { Briefcase, MessageSquare, Presentation } from 'lucide-react';

export const MODES = [
  {
    id: 'interview',
    title: 'Interview',
    description: 'Technical, HR and behavioral interview answers.',
    icon: Briefcase,
  },
  {
    id: 'presentation',
    title: 'Presentation',
    description: 'Project demos, talks and technical explanations.',
    icon: Presentation,
  },
  {
    id: 'general',
    title: 'General',
    description: 'Everyday professional communication and clarity.',
    icon: MessageSquare,
  },
];

export const MODE_LABELS = Object.fromEntries(MODES.map((m) => [m.id, m.title]));

export const SUGGESTED_QUESTIONS = {
  interview: [
    'Tell me about yourself.',
    'Why do you want this role?',
    'Explain your most challenging project.',
    'Describe a time you solved a difficult problem.',
    'What are your strengths?',
    'Why should we hire you?',
  ],
  presentation: [
    'Introduce your project and the problem it solves.',
    'Explain how your system works to a non-technical audience.',
    'Summarize the key results of your work.',
    'What would you do differently next time?',
  ],
  general: [
    'Explain an idea you care about in under a minute.',
    'Give a quick status update on your current work.',
    'Describe a decision you made and why.',
    'Explain a technical concept to a new teammate.',
  ],
};

export const METRICS = [
  { key: 'clarity', label: 'Clarity', blurb: 'How easy your answer is to follow.' },
  { key: 'structure', label: 'Structure', blurb: 'Whether ideas flow in a logical order.' },
  { key: 'conciseness', label: 'Conciseness', blurb: 'Saying what matters without extra words.' },
  { key: 'confidence', label: 'Confidence', blurb: 'Direct wording instead of hedging.' },
  { key: 'grammar', label: 'Grammar', blurb: 'Correct, natural sentence construction.' },
  { key: 'relevance', label: 'Relevance', blurb: 'How directly you answer the question.' },
];

export function scoreVerdict(score) {
  if (score >= 9) return 'Excellent response. Keep practicing to stay consistent.';
  if (score >= 8) return 'Strong response with a few areas to improve.';
  if (score >= 6.5) return 'Solid foundation with clear opportunities to improve.';
  if (score >= 5) return 'A good start. Focus on the suggestions below.';
  return 'Plenty of room to grow. The suggestions below are a great next step.';
}

export function scoreTone(score) {
  if (score >= 8) return 'score-good';
  if (score >= 6) return 'score-mid';
  return 'score-low';
}
