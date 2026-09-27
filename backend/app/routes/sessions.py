from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.session import PracticeSession
from app.schemas.session import SessionDetail, SessionSummary

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


def to_summary(s: PracticeSession) -> SessionSummary:
    return SessionSummary(
        id=s.id,
        mode=s.mode,
        question=s.question,
        overall_score=s.overall_score,
        duration_seconds=s.duration_seconds,
        created_at=as_utc(s.created_at),
    )


def as_utc(value: datetime) -> datetime:
    # SQLite drops tzinfo on read; values are always stored in UTC.
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value


def to_detail(s: PracticeSession) -> SessionDetail:
    return SessionDetail(
        **to_summary(s).model_dump(),
        answer=s.answer,
        clarity_score=s.clarity_score,
        structure_score=s.structure_score,
        conciseness_score=s.conciseness_score,
        confidence_score=s.confidence_score,
        grammar_score=s.grammar_score,
        relevance_score=s.relevance_score,
        filler_words=s.filler_words,
        strengths=s.strengths,
        improvements=s.improvements,
        score_explanations=s.score_explanations,
        summary=s.summary,
        improved_answer=s.improved_answer,
    )


def _get_or_404(db: Session, session_id: int) -> PracticeSession:
    session = db.get(PracticeSession, session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="We couldn't find that session. It may have been deleted.")
    return session


@router.get("", response_model=list[SessionSummary])
def list_sessions(
    db: Session = Depends(get_db),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
) -> list[SessionSummary]:
    rows = db.scalars(
        select(PracticeSession)
        .order_by(PracticeSession.created_at.desc(), PracticeSession.id.desc())
        .limit(limit)
        .offset(offset)
    ).all()
    return [to_summary(s) for s in rows]


@router.get("/{session_id}", response_model=SessionDetail)
def get_session(session_id: int, db: Session = Depends(get_db)) -> SessionDetail:
    return to_detail(_get_or_404(db, session_id))


@router.delete("/{session_id}", status_code=204)
def delete_session(session_id: int, db: Session = Depends(get_db)) -> Response:
    db.delete(_get_or_404(db, session_id))
    db.commit()
    return Response(status_code=204)
