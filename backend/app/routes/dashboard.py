from statistics import mean

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.session import PracticeSession
from app.routes.sessions import as_utc
from app.schemas.session import DashboardStats, TrendPoint

router = APIRouter(prefix="/api", tags=["dashboard"])

TREND_LIMIT = 50


def compute_dashboard(sessions: list[PracticeSession]) -> DashboardStats:
    """`sessions` must be ordered oldest → newest. Every number derives from stored data."""
    total = len(sessions)
    if total == 0:
        return DashboardStats(
            total_sessions=0, average_score=None, best_score=None,
            recent_improvement=None, trend=[], metric_averages={},
        )

    overall = [s.overall_score for s in sessions]

    improvement = None
    if total >= 2:
        window = min(3, total // 2)
        first_avg = mean(overall[:window])
        last_avg = mean(overall[-window:])
        if first_avg > 0:
            improvement = round((last_avg - first_avg) / first_avg * 100, 1)

    metric_averages = {
        name: round(mean(getattr(s, f"{name}_score") for s in sessions), 1)
        for name in ("clarity", "structure", "conciseness", "confidence", "grammar", "relevance")
    }

    trend = [
        TrendPoint(
            id=s.id, created_at=as_utc(s.created_at), overall=s.overall_score, clarity=s.clarity_score,
            confidence=s.confidence_score, conciseness=s.conciseness_score,
        )
        for s in sessions[-TREND_LIMIT:]
    ]

    return DashboardStats(
        total_sessions=total,
        average_score=round(mean(overall), 1),
        best_score=max(overall),
        recent_improvement=improvement,
        trend=trend,
        metric_averages=metric_averages,
    )


@router.get("/dashboard", response_model=DashboardStats)
def dashboard(db: Session = Depends(get_db)) -> DashboardStats:
    sessions = db.scalars(
        select(PracticeSession).order_by(PracticeSession.created_at.asc(), PracticeSession.id.asc())
    ).all()
    return compute_dashboard(list(sessions))
