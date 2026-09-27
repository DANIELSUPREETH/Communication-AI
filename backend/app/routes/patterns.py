from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.session import PracticeSession
from app.schemas.analysis import PatternsResponse
from app.services.ai_service import AIConfigError, AIService, get_ai_service
from app.services.pattern_service import MAX_SESSIONS, detect_patterns

router = APIRouter(prefix="/api", tags=["patterns"])


def optional_ai_service() -> AIService | None:
    """Patterns still work (statistics only) when the AI isn't configured."""
    try:
        return get_ai_service()
    except AIConfigError:
        return None


@router.post("/patterns", response_model=PatternsResponse)
async def patterns(
    db: Session = Depends(get_db),
    ai: AIService | None = Depends(optional_ai_service),
) -> PatternsResponse:
    sessions = db.scalars(
        select(PracticeSession)
        .order_by(PracticeSession.created_at.desc(), PracticeSession.id.desc())
        .limit(MAX_SESSIONS)
    ).all()
    return await detect_patterns(list(sessions), ai)
