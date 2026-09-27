"""Response schemas for stored sessions and dashboard statistics."""

from datetime import datetime

from pydantic import BaseModel

from app.schemas.analysis import Improvement, ScoreExplanations


class SessionSummary(BaseModel):
    id: int
    mode: str
    question: str
    overall_score: float
    duration_seconds: int
    created_at: datetime


class SessionDetail(SessionSummary):
    answer: str
    clarity_score: float
    structure_score: float
    conciseness_score: float
    confidence_score: float
    grammar_score: float
    relevance_score: float
    filler_words: dict[str, int]
    strengths: list[str]
    improvements: list[Improvement]
    score_explanations: ScoreExplanations
    summary: str
    improved_answer: str


class TrendPoint(BaseModel):
    id: int
    created_at: datetime
    overall: float
    clarity: float
    confidence: float
    conciseness: float


class DashboardStats(BaseModel):
    total_sessions: int
    average_score: float | None
    best_score: float | None
    # Percent change: avg of latest 3 sessions vs avg of the first 3. None when < 2 sessions.
    recent_improvement: float | None
    trend: list[TrendPoint]
    metric_averages: dict[str, float]
