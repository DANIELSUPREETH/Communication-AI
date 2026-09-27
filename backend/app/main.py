"""FastAPI application entry point."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.config import get_settings
from app.database import init_db
from app.routes import analysis, dashboard, patterns, sessions
from app.services.ai_service import AIError

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("communicate_ai")
settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    if not settings.gemini_api_key:
        logger.warning("GEMINI_API_KEY is not set. /api/analyze will return a configuration error.")
    yield


app = FastAPI(
    title="Communicate AI API",
    version="1.0.0",
    description="AI-powered communication and interview coaching.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type"],
)


# ---------- Error handling: friendly messages, never stack traces ----------

_FIELD_LABELS = {"question": "Question", "answer": "Answer", "mode": "Coaching mode"}


@app.exception_handler(AIError)
async def ai_error_handler(_: Request, exc: AIError) -> JSONResponse:
    logger.warning("AI error: %s (%s)", type(exc).__name__, exc)
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.user_message, "code": type(exc).__name__})


@app.exception_handler(RequestValidationError)
async def validation_error_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    errors = []
    for err in exc.errors():
        field = str(err["loc"][-1]) if err.get("loc") else "request"
        label = _FIELD_LABELS.get(field, field.replace("_", " ").capitalize())
        message = err.get("msg", "is invalid").removeprefix("Value error, ")
        if err.get("type") == "string_too_long":
            limit = (err.get("ctx") or {}).get("max_length")
            message = f"is too long (maximum {limit} characters)"
        elif err.get("type") == "string_too_short":
            message = "must not be empty"
        errors.append({"field": field, "message": f"{label} {message}"})
    detail = errors[0]["message"] if errors else "The request was invalid."
    return JSONResponse(status_code=422, content={"detail": detail, "errors": errors, "code": "ValidationError"})


@app.exception_handler(SQLAlchemyError)
async def database_error_handler(_: Request, exc: SQLAlchemyError) -> JSONResponse:
    logger.error("Database error: %s", type(exc).__name__)
    return JSONResponse(
        status_code=500,
        content={"detail": "We couldn't reach the database. Please try again.", "code": "DatabaseError"},
    )


@app.exception_handler(Exception)
async def unhandled_error_handler(_: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled error: %s", type(exc).__name__)
    return JSONResponse(
        status_code=500, content={"detail": "Something went wrong on our side. Please try again.", "code": "ServerError"}
    )


# ---------- Routes ----------

@app.get("/api/health", tags=["health"])
def health() -> dict:
    return {"status": "ok"}


@app.get("/", include_in_schema=False)
def root() -> dict:
    return {"name": settings.app_name, "docs": "/docs", "health": "/api/health"}


app.include_router(analysis.router)
app.include_router(sessions.router)
app.include_router(dashboard.router)
app.include_router(patterns.router)
