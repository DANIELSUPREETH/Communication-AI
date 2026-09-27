"""Deterministic speech/text metrics.

These are computed in code (not by the LLM) so counts are exact and reproducible.
Voice capture itself happens in the browser via the Web Speech API; the backend
receives the transcript plus, optionally, the real recording length.
"""

import re

# Average conversational speaking rate used to estimate duration from text.
WORDS_PER_MINUTE = 140

# Multi-word fillers first so "you know" is matched as a unit.
FILLER_WORDS: tuple[str, ...] = (
    "you know",
    "i mean",
    "kind of",
    "sort of",
    "um",
    "uh",
    "erm",
    "like",
    "actually",
    "basically",
    "literally",
    "so",
)

_WORD_RE = re.compile(r"[A-Za-z0-9']+")


def _filler_pattern(filler: str) -> re.Pattern[str]:
    # \b on both sides + flexible whitespace: "actual" never matches "actually",
    # "likely" never matches "like", "also" never matches "so".
    parts = [re.escape(p) for p in filler.split()]
    return re.compile(r"(?<![A-Za-z0-9'])" + r"\s+".join(parts) + r"(?![A-Za-z0-9'])", re.IGNORECASE)


_FILLER_PATTERNS = {f: _filler_pattern(f) for f in FILLER_WORDS}

_LIKE_NON_FILLER_BEFORE = re.compile(
    r"(?:\b(?:i|we|they|you|he|she|would|'d|really|also|don't|didn't|do|does|did|"
    r"look|looks|looked|feel|feels|felt|seem|seems|seemed|sound|sounds|things|"
    r"something|anything|tools|languages|frameworks|companies|much|just)|[a-z]'d)\s+$",
    re.IGNORECASE,
)


def count_words(text: str) -> int:
    return len(_WORD_RE.findall(text))


def estimate_duration_seconds(text: str) -> int:
    words = count_words(text)
    if words == 0:
        return 0
    return max(1, round(words / WORDS_PER_MINUTE * 60))


def detect_filler_words(text: str) -> dict[str, int]:
    """Return {filler: count} for fillers that appear at least once, most frequent first.

    Multi-word fillers are removed from the text after counting so that, for
    example, the "like" in "kind of like" isn't hidden and "you know" isn't
    double-counted elsewhere.
    """
    remaining = text
    counts: dict[str, int] = {}
    for filler, pattern in _FILLER_PATTERNS.items():
        matches = pattern.findall(remaining)
        if matches:
            counts[filler] = len(matches)
            remaining = pattern.sub(" ", remaining)

    # "so" and "like" are often legitimate words. Only count "so" when it opens a
    # sentence/clause (the filler usage) rather than "so that" / "not so good".
    if "so" in counts:
        counts["so"] = len(re.findall(r"(?:^|[.!?,]\s*)so(?![A-Za-z0-9'])(?!\s+that\b)", text, re.IGNORECASE))
        if counts["so"] == 0:
            del counts["so"]

    # "like" is a filler in "it was, like, hard" but not in "I would like to" or
    # "tools like Docker". Skip it when preceded by a verb/subject that makes it
    # a real verb or preposition.
    if "like" in counts:
        counts["like"] = sum(
            1 for m in _FILLER_PATTERNS["like"].finditer(text)
            if not _LIKE_NON_FILLER_BEFORE.search(text[: m.start()])
        )
        if counts["like"] == 0:
            del counts["like"]

    return dict(sorted(counts.items(), key=lambda kv: (-kv[1], kv[0])))


def sentence_stats(text: str) -> dict[str, float]:
    sentences = [s for s in re.split(r"(?<=[.!?])\s+", text.strip()) if s.strip()]
    words = count_words(text)
    return {
        "sentences": len(sentences),
        "avg_sentence_words": round(words / len(sentences), 1) if sentences else 0.0,
    }
