"""ORM model for a single practice session."""

import json
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class PracticeSession(Base):
    __tablename__ = "sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    mode: Mapped[str] = mapped_column(String(20), index=True)
    question: Mapped[str] = mapped_column(Text)
    answer: Mapped[str] = mapped_column(Text)

    overall_score: Mapped[float] = mapped_column(Float)
    clarity_score: Mapped[float] = mapped_column(Float)
    structure_score: Mapped[float] = mapped_column(Float)
    conciseness_score: Mapped[float] = mapped_column(Float)
    confidence_score: Mapped[float] = mapped_column(Float)
    grammar_score: Mapped[float] = mapped_column(Float)
    relevance_score: Mapped[float] = mapped_column(Float)

    duration_seconds: Mapped[int] = mapped_column(Integer)
    filler_words_json: Mapped[str] = mapped_column(Text, default="{}")
    strengths_json: Mapped[str] = mapped_column(Text, default="[]")
    improvements_json: Mapped[str] = mapped_column(Text, default="[]")
    score_explanations_json: Mapped[str] = mapped_column(Text, default="{}")
    summary: Mapped[str] = mapped_column(Text, default="")
    improved_answer: Mapped[str] = mapped_column(Text, default="")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, index=True)

    # Convenience accessors for JSON columns
    @property
    def filler_words(self) -> dict[str, int]:
        return json.loads(self.filler_words_json or "{}")

    @property
    def strengths(self) -> list[str]:
        return json.loads(self.strengths_json or "[]")

    @property
    def improvements(self) -> list[dict]:
        return json.loads(self.improvements_json or "[]")

    @property
    def score_explanations(self) -> dict[str, str]:
        return json.loads(self.score_explanations_json or "{}")
