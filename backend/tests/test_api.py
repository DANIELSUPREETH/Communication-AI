import json

from tests.conftest import VALID_ANALYSIS

REQUEST = {
    "mode": "interview",
    "question": "Tell me about yourself.",
    "answer": "Um, I am a computer science student and I have basically worked on several projects.",
}


def test_health(client):
    assert client.get("/api/health").json() == {"status": "ok"}


def test_analyze_saves_session_and_uses_deterministic_fillers(client, fake_ai):
    ai = fake_ai(VALID_ANALYSIS)
    res = client.post("/api/analyze", json=REQUEST)
    assert res.status_code == 201, res.text
    body = res.json()
    assert ai.calls == 1
    assert body["overall_score"] == 7.8
    assert body["filler_words"] == {"basically": 1, "um": 1}
    assert body["improvements"][1] == {"text": "Reduce repeated phrases.", "severity": "medium"}
    assert body["created_at"].endswith(("Z", "+00:00"))

    # Persisted and retrievable
    assert client.get(f"/api/sessions/{body['id']}").json()["question"] == REQUEST["question"]
    assert len(client.get("/api/sessions").json()) == 1


def test_repairs_fenced_json_with_trailing_comma(client, fake_ai):
    raw = "Here you go:\n```json\n" + json.dumps(VALID_ANALYSIS)[:-1] + ",}\n```"
    fake_ai(raw)
    assert client.post("/api/analyze", json=REQUEST).status_code == 201


def test_retries_once_then_succeeds(client, fake_ai):
    bad = {**VALID_ANALYSIS, "clarity_score": 400}  # out of range even after /100 normalization
    ai = fake_ai(bad, VALID_ANALYSIS)
    assert client.post("/api/analyze", json=REQUEST).status_code == 201
    assert ai.calls == 2


def test_invalid_twice_returns_controlled_error(client, fake_ai):
    fake_ai("not json", "{still not json")
    res = client.post("/api/analyze", json=REQUEST)
    assert res.status_code == 502
    assert res.json()["detail"] == "The AI returned an unexpected response. Please try again."
    assert "Traceback" not in res.text
    assert client.get("/api/sessions").json() == []


def test_missing_api_key_gives_useful_error(client):
    res = client.post("/api/analyze", json=REQUEST)
    assert res.status_code == 503
    assert "GEMINI_API_KEY" in res.json()["detail"]


def test_validation_errors_are_friendly(client, fake_ai):
    fake_ai(VALID_ANALYSIS)
    res = client.post("/api/analyze", json={**REQUEST, "answer": "   "})
    assert res.status_code == 422
    assert res.json()["detail"].startswith("Answer")

    res = client.post("/api/analyze", json={**REQUEST, "answer": "word " * 2000})
    assert res.status_code == 422
    assert "too long" in res.json()["detail"]

    res = client.post("/api/analyze", json={**REQUEST, "mode": "karaoke"})
    assert res.status_code == 422


def test_delete_and_404(client, fake_ai):
    fake_ai(VALID_ANALYSIS)
    sid = client.post("/api/analyze", json=REQUEST).json()["id"]
    assert client.delete(f"/api/sessions/{sid}").status_code == 204
    assert client.get(f"/api/sessions/{sid}").status_code == 404
    assert client.delete(f"/api/sessions/{sid}").status_code == 404


def test_dashboard_empty_then_real_numbers(client, fake_ai):
    empty = client.get("/api/dashboard").json()
    assert empty["total_sessions"] == 0 and empty["average_score"] is None and empty["trend"] == []

    fake_ai({**VALID_ANALYSIS, "overall_score": 6.0}, {**VALID_ANALYSIS, "overall_score": 9.0})
    client.post("/api/analyze", json=REQUEST)
    client.post("/api/analyze", json=REQUEST)
    stats = client.get("/api/dashboard").json()
    assert stats["total_sessions"] == 2
    assert stats["average_score"] == 7.5
    assert stats["best_score"] == 9.0
    assert stats["recent_improvement"] == 50.0
    assert [p["overall"] for p in stats["trend"]] == [6.0, 9.0]


def test_patterns_need_two_sessions_and_fall_back_to_statistics(client, fake_ai):
    assert client.post("/api/patterns").json()["available"] is False

    fake_ai(VALID_ANALYSIS, VALID_ANALYSIS, "garbage")  # third output = failed AI pattern call
    client.post("/api/analyze", json=REQUEST)
    client.post("/api/analyze", json=REQUEST)
    res = client.post("/api/patterns").json()
    assert res["available"] is True
    assert res["source"] == "statistics"
    assert res["next_goal"]
    assert any("um" in p["text"] or "basically" in p["text"] for p in res["patterns"])


def test_patterns_from_ai(client, fake_ai):
    ai_patterns = {
        "patterns": [{"kind": "strength", "text": "Across your recent sessions, you open clearly."}],
        "next_goal": "Keep your next answer under 90 seconds.",
    }
    fake_ai(VALID_ANALYSIS, VALID_ANALYSIS, ai_patterns)
    client.post("/api/analyze", json=REQUEST)
    client.post("/api/analyze", json=REQUEST)
    res = client.post("/api/patterns").json()
    assert res["source"] == "ai"
    assert res["next_goal"] == "Keep your next answer under 90 seconds."
