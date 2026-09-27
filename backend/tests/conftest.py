import json
import os
import tempfile

# Configure env before the app (and its cached settings) are imported.
_db_dir = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = f"sqlite:///{_db_dir}/test.db"
os.environ["GEMINI_API_KEY"] = ""

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.database import Base, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.routes.patterns import optional_ai_service  # noqa: E402
from app.services.ai_service import AIService, get_ai_service  # noqa: E402

VALID_ANALYSIS = {
    "overall_score": 7.8,
    "clarity_score": 8.1,
    "structure_score": 7.0,
    "conciseness_score": 6.5,
    "confidence_score": 7.9,
    "grammar_score": 9.0,
    "relevance_score": 8.4,
    "score_explanations": {"clarity": "Easy to follow."},
    "strengths": ["Clear opening", "Relevant project example"],
    "improvements": [
        {"text": "The conclusion could be more direct.", "severity": "medium"},
        "Reduce repeated phrases.",
    ],
    "summary": "Clear and relevant, could be tighter.",
    "improved_answer": "I'm a computer science student who has built several projects.",
}


class FakeAI(AIService):
    """Test double: returns queued raw outputs in order."""

    name = "fake"

    def __init__(self, outputs: list[str]):
        self.outputs = list(outputs)
        self.calls = 0

    async def generate_json(self, system_prompt: str, user_prompt: str, temperature: float = 0.3) -> str:
        self.calls += 1
        return self.outputs.pop(0)


@pytest.fixture
def fake_ai():
    def install(*outputs):
        ai = FakeAI([o if isinstance(o, str) else json.dumps(o) for o in outputs])
        app.dependency_overrides[get_ai_service] = lambda: ai
        app.dependency_overrides[optional_ai_service] = lambda: ai
        return ai

    yield install
    app.dependency_overrides.clear()


@pytest.fixture
def client():
    Base.metadata.drop_all(bind=engine)
    with TestClient(app) as c:
        yield c
