"""Provider-agnostic AI service.

Routes and business logic depend only on `AIService`. Adding another provider
means implementing `generate_json` in a new subclass and registering it in
`get_ai_service`.
"""

import asyncio
import logging
from abc import ABC, abstractmethod

import httpx

from app.config import Settings, get_settings

logger = logging.getLogger(__name__)


class AIError(Exception):
    """Base class. `user_message` is safe to show to end users."""

    status_code = 502
    user_message = "We couldn't analyze your response right now. Please try again."


class AIConfigError(AIError):
    status_code = 503
    user_message = (
        "The AI service isn't configured. Add a valid GEMINI_API_KEY to the backend .env file "
        "and restart the server."
    )


class AIAuthError(AIError):
    status_code = 503
    user_message = "The AI provider rejected the API key. Check GEMINI_API_KEY in the backend .env file."


class AITimeoutError(AIError):
    status_code = 504
    user_message = "The analysis took too long. Please try again in a moment."


class AIUnavailableError(AIError):
    status_code = 503
    user_message = "The AI service is temporarily unavailable. Please try again in a moment."


class AIResponseError(AIError):
    status_code = 502
    user_message = "The AI returned an unexpected response. Please try again."


class AIService(ABC):
    name: str = "base"

    @abstractmethod
    async def generate_json(self, system_prompt: str, user_prompt: str, temperature: float = 0.3) -> str:
        """Return the model's raw text output, which is expected to be JSON."""


class GeminiService(AIService):
    name = "gemini"
    BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"
    MAX_ATTEMPTS = 3
    RETRY_DELAYS = (2.0, 5.0)  # seconds to wait before attempt 2 and attempt 3
    RETRYABLE_STATUS = {429, 500, 502, 503, 504}

    def __init__(self, settings: Settings):
        if not settings.gemini_api_key or settings.gemini_api_key.strip() in {"", "YOUR_API_KEY"}:
            raise AIConfigError("GEMINI_API_KEY is missing")
        self._api_key = settings.gemini_api_key.strip()
        self._model = settings.gemini_model
        self._timeout = settings.ai_timeout_seconds

    async def generate_json(self, system_prompt: str, user_prompt: str, temperature: float = 0.3) -> str:
        url = f"{self.BASE_URL}/{self._model}:generateContent"
        payload = {
            "systemInstruction": {"parts": [{"text": system_prompt}]},
            "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
            "generationConfig": {
                "temperature": temperature,
                "responseMimeType": "application/json",
            },
        }
        # Key goes in a header, never in the URL, so it can't leak into logs.
        headers = {"x-goog-api-key": self._api_key, "Content-Type": "application/json"}

        # Gemini sometimes answers 429/503 when a model is busy. Those usually clear
        # within seconds, so retry a few times with a growing pause before giving up.
        response = None
        for attempt in range(1, self.MAX_ATTEMPTS + 1):
            try:
                async with httpx.AsyncClient(timeout=self._timeout) as client:
                    response = await client.post(url, json=payload, headers=headers)
            except httpx.TimeoutException as exc:
                raise AITimeoutError("Gemini request timed out") from exc
            except httpx.HTTPError as exc:
                logger.warning("Gemini network error: %s", type(exc).__name__)
                if attempt == self.MAX_ATTEMPTS:
                    raise AIUnavailableError("Gemini network error") from exc
                await asyncio.sleep(self.RETRY_DELAYS[attempt - 1])
                continue

            if response.status_code in self.RETRYABLE_STATUS and attempt < self.MAX_ATTEMPTS:
                logger.warning(
                    "Gemini returned %s (attempt %d/%d), retrying",
                    response.status_code, attempt, self.MAX_ATTEMPTS,
                )
                await asyncio.sleep(self.RETRY_DELAYS[attempt - 1])
                continue
            break

        if response.status_code in (401, 403):
            raise AIAuthError("Gemini rejected credentials")
        if response.status_code == 400 and "API_KEY_INVALID" in response.text:
            raise AIAuthError("Gemini API key invalid")
        if response.status_code == 404:
            logger.warning("Gemini model '%s' not found. Check GEMINI_MODEL.", self._model)
            raise AIUnavailableError(f"Gemini model {self._model} not found")
        if response.status_code == 429 or response.status_code >= 500:
            raise AIUnavailableError(f"Gemini returned {response.status_code}")
        if response.status_code != 200:
            logger.warning("Gemini unexpected status %s: %s", response.status_code, response.text[:300])
            raise AIResponseError(f"Gemini returned {response.status_code}")

        try:
            data = response.json()
            candidate = data["candidates"][0]
            parts = candidate["content"]["parts"]
            return "".join(p.get("text", "") for p in parts)
        except (ValueError, KeyError, IndexError, TypeError) as exc:
            # e.g. the prompt was blocked by safety filters and no content came back
            raise AIResponseError("Gemini response had no text content") from exc


_PROVIDERS: dict[str, type[AIService]] = {
    "gemini": GeminiService,
}


def get_ai_service() -> AIService:
    """FastAPI dependency. Raises AIConfigError if the provider can't be built."""
    settings = get_settings()
    provider_cls = _PROVIDERS.get(settings.ai_provider.lower())
    if provider_cls is None:
        raise AIConfigError(f"Unknown AI_PROVIDER '{settings.ai_provider}'")
    return provider_cls(settings)
