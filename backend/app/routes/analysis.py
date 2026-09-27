from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.routes.sessions import to_detail
from app.schemas.analysis import AnalyzeRequest
from app.schemas.session import SessionDetail
from app.services.ai_service import AIService, get_ai_service
from app.services.analysis_service import analyze_and_save

router = APIRouter(prefix="/api", tags=["analysis"])


@router.post("/analyze", response_model=SessionDetail, status_code=201)
async def analyze(
    req: AnalyzeRequest,
    db: Session = Depends(get_db),
    ai: AIService = Depends(get_ai_service),
) -> SessionDetail:
    """Analyze an answer with the configured AI provider and store the session."""
    session = await analyze_and_save(db, ai, req)
    return to_detail(session)
