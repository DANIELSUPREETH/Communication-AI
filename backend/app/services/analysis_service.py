"""Builds prompts, calls the AI, validates/repairs its JSON and persists sessions."""

import json
import logging
import re

from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.models.session import PracticeSession
from app.schemas.analysis import AIAnalysis, AnalyzeRequest
from app.services.ai_service import AIResponseError, AIService
from app.services.speech_service import detect_filler_words, estimate_duration_seconds

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an objective communication coach. You evaluate how a person communicates in a single written or transcribed answer.

Rules:
- Evaluate ONLY observable communication characteristics of the text: clarity, structure, conciseness, confidence of wording, grammar, relevance to the question, and filler words.
- Never infer or comment on intelligence, personality, emotions, mental health, or any medical/psychological condition.
- Never invent achievements, projects, companies, numbers, qualifications or experiences. The improved answer may reorganize, tighten and rephrase, but every fact in it must come from the original answer. If the answer lacks a detail that would help, mention it in "improvements" instead of making it up.
- Be constructive and specific. Use neutral, non-judgmental language ("The conclusion could be more direct", not "Your conclusion is bad").
- Keep feedback concise. Each strength / improvement is one short sentence.
- Score each dimension from 0 to 10 (one decimal). 5 = understandable but clearly needs work, 7 = solid, 9+ = excellent. overall_score reflects all dimensions, weighted toward clarity, structure and relevance.
- "confidence" means confidence of wording only: direct statements vs hedging ("I think maybe", "I guess", "sort of").
- Return ONLY valid JSON matching the schema. No markdown, no code fences, no commentary."""

JSON_SCHEMA_HINT = """{
  "overall_score": number,
  "clarity_score": number,
  "structure_score": number,
  "conciseness_score": number,
  "confidence_score": number,
  "grammar_score": number,
  "relevance_score": number,
  "score_explanations": {
    "clarity": "one sentence explaining the clarity score",
    "structure": "...", "conciseness": "...", "confidence": "...", "grammar": "...", "relevance": "..."
  },
  "strengths": ["2-4 short sentences"],
  "improvements": [{"text": "short actionable sentence", "severity": "low" | "medium" | "high"}],
  "summary": "one or two sentences",
  "improved_answer": "rewritten answer that preserves every original fact and adds none"
}"""

MODE_CONTEXT = {
    "interview": "a job interview (technical, HR or behavioral). A strong answer is relevant, structured (e.g. situation → action → result), specific and ends with a clear point.",
    "presentation": "a presentation or spoken explanation to an audience. A strong answer has a clear opening, logical flow, signposting and a memorable close.",
    "general": "everyday professional communication. A strong answer is clear, concise and gets to the point quickly.",
}


def build_user_prompt(req: AnalyzeRequest, filler_words: dict[str, int], duration: int) -> str:
    fillers = ", ".join(f'"{w}" x{c}' for w, c in filler_words.items()) or "none detected"
    return f"""Context: the person is practicing {MODE_CONTEXT[req.mode.value]}

Question:
\"\"\"{req.question}\"\"\"

Answer:
\"\"\"{req.answer}\"\"\"

Measured facts (computed by code, treat as accurate):
- Word count: {len(req.answer.split())}
- Estimated speaking time: {duration} seconds
- Filler words detected: {fillers}

Return JSON with exactly this shape:
{JSON_SCHEMA_HINT}"""


_FENCE_RE = re.compile(r"^```(?:json)?\s*|\s*```$", re.IGNORECASE)
_TRAILING_COMMA_RE = re.compile(r",\s*([}\]])")


def repair_json(raw: str) -> dict:
    """Best-effort extraction of a JSON object from model output.

    Handles code fences, leading/trailing prose and trailing commas.
    Raises ValueError if nothing parseable is found.
    """
    text = raw.strip()
    text = _FENCE_RE.sub("", text).strip()
    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        start, end = text.find("{"), text.rfind("}")
        if start == -1 or end <= start:
            raise ValueError("no JSON object found")
        candidate = _TRAILING_COMMA_RE.sub(r"\1", text[start : end + 1])
        parsed = json.loads(candidate)  # may raise JSONDecodeError (a ValueError)
    if not isinstance(parsed, dict):
        raise ValueError("top-level JSON is not an object")
    return parsed


def _normalize(data: dict) -> dict:
    """Coerce common, harmless deviations before strict validation."""
    # Improvements as plain strings -> objects
    imps = data.get("improvements")
    if isinstance(imps, list):
        data["improvements"] = [
            {"text": i, "severity": "medium"} if isinstance(i, str) else i for i in imps
        ]
        for item in data["improvements"]:
            if isinstance(item, dict) and isinstance(item.get("severity"), str):
                item["severity"] = item["severity"].strip().lower()
    # Scores given out of 100
    for key, value in list(data.items()):
        if key.endswith("_score") and isinstance(value, (int, float)) and 10 < value <= 100:
            data[key] = value / 10
    return data


async def run_ai_analysis(ai: AIService, req: AnalyzeRequest, filler_words: dict[str, int], duration: int) -> AIAnalysis:
    """Call the model, validate, and retry once with the validation error if needed."""
    user_prompt = build_user_prompt(req, filler_words, duration)
    last_error = ""
    for attempt in range(2):
        prompt = user_prompt
        if attempt == 1:
            prompt += (
                "\n\nYour previous reply was not valid for this schema "
                f"({last_error}). Return ONLY the corrected JSON object."
            )
        raw = await ai.generate_json(SYSTEM_PROMPT, prompt)
        try:
            return AIAnalysis.model_validate(_normalize(repair_json(raw)))
        except (ValueError, ValidationError) as exc:
            # ValidationError subclasses ValueError; keep message short for the retry prompt.
            last_error = " ".join(str(exc).split())[:400]
            logger.warning("AI output invalid on attempt %d: %s", attempt + 1, last_error)
    raise AIResponseError("AI output failed validation twice")


async def analyze_and_save(db: Session, ai: AIService, req: AnalyzeRequest) -> PracticeSession:
    filler_words = detect_filler_words(req.answer)
    duration = req.recorded_seconds or estimate_duration_seconds(req.answer)

    analysis = await run_ai_analysis(ai, req, filler_words, duration)

    session = PracticeSession(
        mode=req.mode.value,
        question=req.question,
        answer=req.answer,
        overall_score=analysis.overall_score,
        clarity_score=analysis.clarity_score,
        structure_score=analysis.structure_score,
        conciseness_score=analysis.conciseness_score,
        confidence_score=analysis.confidence_score,
        grammar_score=analysis.grammar_score,
        relevance_score=analysis.relevance_score,
        duration_seconds=duration,
        # Filler counts come from deterministic detection, not the model.
        filler_words_json=json.dumps(filler_words),
        strengths_json=json.dumps(analysis.strengths),
        improvements_json=json.dumps([i.model_dump(mode="json") for i in analysis.improvements]),
        score_explanations_json=analysis.score_explanations.model_dump_json(),
        summary=analysis.summary,
        improved_answer=analysis.improved_answer,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session
