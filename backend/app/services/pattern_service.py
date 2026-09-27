"""Detects recurring communication patterns across a user's recent sessions.

Two layers:
1. Statistics computed in code (metric averages, recurring fillers, length).
2. An AI pass that turns those statistics plus the sessions' own feedback into
   short, plain-language patterns and one next practice goal.

If the AI is unavailable, the statistical patterns are returned on their own, so
the feature still works and never fabricates anything.
"""

import json
import logging
from collections import Counter
from statistics import mean

from pydantic import ValidationError

from app.models.session import PracticeSession
from app.schemas.analysis import AIPatterns, PatternInsight, PatternsResponse
from app.services.ai_service import AIError, AIService
from app.services.analysis_service import repair_json

logger = logging.getLogger(__name__)

MIN_SESSIONS = 2
MAX_SESSIONS = 10

METRICS = {
    "clarity_score": "clarity",
    "structure_score": "structure",
    "conciseness_score": "conciseness",
    "confidence_score": "confident wording",
    "grammar_score": "grammar",
    "relevance_score": "relevance",
}

PATTERN_SYSTEM_PROMPT = """You are an objective communication coach reviewing several of one person's practice answers.
Identify recurring communication patterns that appear in MORE THAN ONE session.
Rules:
- Base every statement only on the data provided. Do not invent sessions, numbers or details.
- Describe observable communication habits only. Never comment on personality, intelligence, emotions or mental health.
- Write in second person, neutral and encouraging, one sentence per pattern, starting with phrases like "Across your recent sessions," or "Your answers tend to".
- Include at least one strength and at least one focus area if the data supports it.
- next_goal is ONE concrete, measurable goal for the next practice answer (e.g. a time limit, a structure to follow, a filler word to avoid).
Return ONLY JSON: {"patterns": [{"kind": "strength" | "focus", "text": "..."}], "next_goal": "..."}"""


def compute_statistics(sessions: list[PracticeSession]) -> dict:
    averages = {label: round(mean(getattr(s, col) for s in sessions), 1) for col, label in METRICS.items()}

    filler_totals: Counter[str] = Counter()
    filler_sessions: Counter[str] = Counter()
    for s in sessions:
        for word, count in s.filler_words.items():
            filler_totals[word] += count
            filler_sessions[word] += 1

    recurring_fillers = [
        {"word": w, "total": filler_totals[w], "sessions": filler_sessions[w]}
        for w, _ in filler_totals.most_common()
        if filler_sessions[w] >= 2
    ]

    return {
        "sessions": len(sessions),
        "metric_averages": averages,
        "strongest": max(averages, key=lambda k: averages[k]),
        "weakest": min(averages, key=lambda k: averages[k]),
        "avg_duration_seconds": round(mean(s.duration_seconds for s in sessions)),
        "recurring_fillers": recurring_fillers[:3],
    }


def statistical_patterns(stats: dict) -> tuple[list[PatternInsight], str]:
    avgs = stats["metric_averages"]
    strongest, weakest = stats["strongest"], stats["weakest"]
    patterns = [
        PatternInsight(
            kind="strength",
            text=f"Across your recent sessions, {strongest} is your most consistent strength (average {avgs[strongest]:.1f}/10).",
        )
    ]
    if avgs[weakest] < avgs[strongest]:
        patterns.append(
            PatternInsight(
                kind="focus",
                text=f"{weakest.capitalize()} is the area with the most room to grow (average {avgs[weakest]:.1f}/10).",
            )
        )
    for f in stats["recurring_fillers"][:2]:
        patterns.append(
            PatternInsight(
                kind="focus",
                text=f"You used \"{f['word']}\" {f['total']} times across {f['sessions']} sessions.",
            )
        )

    if stats["recurring_fillers"]:
        goal = f"In your next answer, avoid \"{stats['recurring_fillers'][0]['word']}\" and pause briefly instead."
    elif weakest == "conciseness" or stats["avg_duration_seconds"] > 120:
        goal = "Keep your next answer under 90 seconds and finish with a one-sentence conclusion."
    elif weakest == "structure":
        goal = "Structure your next answer in three parts: context, what you did, and the result."
    else:
        goal = f"Focus on {weakest} in your next answer and compare the score with your average of {avgs[weakest]:.1f}."
    return patterns, goal


def _session_digest(s: PracticeSession) -> dict:
    return {
        "date": s.created_at.date().isoformat(),
        "mode": s.mode,
        "question": s.question[:200],
        "scores": {label: getattr(s, col) for col, label in METRICS.items()},
        "duration_seconds": s.duration_seconds,
        "filler_words": s.filler_words,
        "strengths": s.strengths,
        "improvements": [i.get("text", "") for i in s.improvements],
    }


async def detect_patterns(sessions: list[PracticeSession], ai: AIService | None) -> PatternsResponse:
    if len(sessions) < MIN_SESSIONS:
        return PatternsResponse(
            available=False,
            sessions_analyzed=len(sessions),
            message=f"Complete at least {MIN_SESSIONS} sessions to discover your communication patterns.",
        )

    recent = sessions[:MAX_SESSIONS]
    stats = compute_statistics(recent)

    if ai is not None:
        prompt = (
            "Statistics computed from the sessions (accurate):\n"
            f"{json.dumps(stats, indent=2)}\n\n"
            "Per-session feedback, newest first:\n"
            f"{json.dumps([_session_digest(s) for s in recent], indent=2)}"
        )
        try:
            raw = await ai.generate_json(PATTERN_SYSTEM_PROMPT, prompt, temperature=0.2)
            result = AIPatterns.model_validate(repair_json(raw))
            return PatternsResponse(
                available=True,
                sessions_analyzed=len(recent),
                patterns=result.patterns,
                next_goal=result.next_goal,
                source="ai",
            )
        except (AIError, ValueError, ValidationError) as exc:
            logger.warning("AI pattern detection failed, using statistics: %s", type(exc).__name__)

    patterns, goal = statistical_patterns(stats)
    return PatternsResponse(
        available=True, sessions_analyzed=len(recent), patterns=patterns, next_goal=goal, source="statistics"
    )
