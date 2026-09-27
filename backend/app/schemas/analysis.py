"""Request / AI-output schemas for response analysis."""

from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.config import get_settings

_settings = get_settings()

Score = Field(ge=0, le=10)


class CoachingMode(str, Enum):
    interview = "interview"
    presentation = "presentation"
    general = "general"


class Severity(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class AnalyzeRequest(BaseModel):
    mode: CoachingMode
    question: str = Field(min_length=1, max_length=_settings.max_question_chars)
    answer: str = Field(min_length=1, max_length=_settings.max_answer_chars)
    # Optional: real recording length when the answer came from voice input.
    recorded_seconds: int | None = Field(default=None, ge=0, le=3600)

    @field_validator("question", "answer")
    @classmethod
    def strip_and_require(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("must not be empty")
        return value

    @field_validator("answer")
    @classmethod
    def minimum_words(cls, value: str) -> str:
        if len(value.split()) < _settings.min_answer_words:
            raise ValueError(f"must contain at least {_settings.min_answer_words} words")
        return value


class Improvement(BaseModel):
    text: str = Field(min_length=1, max_length=400)
    severity: Severity = Severity.medium


class ScoreExplanations(BaseModel):
    clarity: str = ""
    structure: str = ""
    conciseness: str = ""
    confidence: str = ""
    grammar: str = ""
    relevance: str = ""


class AIAnalysis(BaseModel):
    """Shape the LLM must return. Validated before anything is stored."""

    overall_score: float = Score
    clarity_score: float = Score
    structure_score: float = Score
    conciseness_score: float = Score
    confidence_score: float = Score
    grammar_score: float = Score
    relevance_score: float = Score

    score_explanations: ScoreExplanations = Field(default_factory=ScoreExplanations)
    strengths: list[str] = Field(min_length=1, max_length=6)
    improvements: list[Improvement] = Field(min_length=1, max_length=6)
    summary: str = Field(min_length=1, max_length=600)
    improved_answer: str = Field(min_length=1, max_length=8000)

    @field_validator(
        "overall_score", "clarity_score", "structure_score", "conciseness_score",
        "confidence_score", "grammar_score", "relevance_score",
    )
    @classmethod
    def round_score(cls, value: float) -> float:
        return round(float(value), 1)

    @field_validator("strengths")
    @classmethod
    def clean_strengths(cls, value: list[str]) -> list[str]:
        cleaned = [s.strip() for s in value if isinstance(s, str) and s.strip()]
        if not cleaned:
            raise ValueError("at least one strength is required")
        return cleaned


class PatternInsight(BaseModel):
    kind: Literal["strength", "focus"]
    text: str = Field(min_length=1, max_length=400)


class PatternsResponse(BaseModel):
    available: bool
    sessions_analyzed: int
    patterns: list[PatternInsight] = []
    next_goal: str | None = None
    source: str = Field(default="none", description="'ai' or 'statistics' or 'none'")
    message: str | None = None


class AIPatterns(BaseModel):
    patterns: list[PatternInsight] = Field(min_length=1, max_length=6)
    next_goal: str = Field(min_length=1, max_length=400)
