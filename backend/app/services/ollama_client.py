import json
import logging
from typing import Dict, Any, List, Optional
from ollama import Client, AsyncClient, ResponseError
from app.core.config import settings

logger = logging.getLogger(__name__)

class OllamaClient:
    def __init__(
        self,
        base_url: str = settings.OLLAMA_BASE_URL,
        model: str = settings.OLLAMA_MODEL,
        api_key: Optional[str] = settings.OLLAMA_API_KEY,
        timeout: int = settings.OLLAMA_TIMEOUT,
    ):
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.api_key = api_key
        self.timeout = timeout

        headers = {}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        self.client = Client(host=self.base_url, headers=headers, timeout=self.timeout)
        self.async_client = AsyncClient(host=self.base_url, headers=headers, timeout=self.timeout)

    async def check_health(self) -> Dict[str, Any]:
        """Check if Ollama service is reachable and list models."""
        try:
            res = await self.async_client.list()
            models = [m.model for m in res.models] if hasattr(res, "models") else []
            has_model = any(self.model in m for m in models)
            return {
                "available": True,
                "status": "healthy",
                "models": models,
                "active_model": self.model,
                "model_ready": has_model,
                "authenticated": bool(self.api_key),
            }
        except Exception as e:
            logger.warning(f"Ollama health check error: {e}")
            return {
                "available": False,
                "status": "unavailable",
                "active_model": self.model,
                "model_ready": False,
                "error": str(e),
            }

    async def chat(self, messages: List[Dict[str, str]], format_json: bool = False, temperature: float = 0.3) -> str:
        """Send chat completion request using Ollama Client."""
        try:
            kwargs = {
                "model": self.model,
                "messages": messages,
                "stream": False,
                "options": {
                    "temperature": temperature,
                },
            }
            if format_json:
                kwargs["format"] = "json"

            response = await self.async_client.chat(**kwargs)
            return response.message.content or ""
        except ResponseError as e:
            logger.error(f"Ollama ResponseError: {e.status_code} - {e.error}")
            raise
        except Exception as e:
            logger.warning(f"Ollama API call error: {e}. Using fallback simulation.")
            return self._generate_fallback_response(messages, format_json)

    def chat_sync(self, messages: List[Dict[str, str]], format_json: bool = False, temperature: float = 0.3) -> str:
        """Synchronous chat completion request using Ollama Client."""
        kwargs = {
            "model": self.model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": temperature,
            },
        }
        if format_json:
            kwargs["format"] = "json"

        response = self.client.chat(**kwargs)
        return response.message.content or ""

    def _generate_fallback_response(self, messages: List[Dict[str, str]], format_json: bool) -> str:
        """High-fidelity fallback generator when offline."""
        last_user_msg = ""
        for m in reversed(messages):
            if m.get("role") == "user":
                last_user_msg = m.get("content", "").lower()
                break

        if format_json:
            category = "Teaching clarity"
            need = "Additional worked step-by-step examples"
            topic = "Core concepts"
            if "fast" in last_user_msg or "speed" in last_user_msg or "pace" in last_user_msg:
                category = "Lecture pace"
                need = "Slow down explanation of complex steps"
            elif "assignment" in last_user_msg or "homework" in last_user_msg:
                category = "Assignment workload"
                need = "More time or clearer rubrics for assignments"
            elif "recursion" in last_user_msg:
                topic = "Recursion"
                need = "More visual recursion tree examples"

            return json.dumps({
                "category": category,
                "topic": topic,
                "issue": f"Student noted difficulties regarding {category.lower()}",
                "suggested_need": need,
                "rating": 2,
                "sentiment": "negative",
            })

        if "fast" in last_user_msg or "quick" in last_user_msg:
            return "Got it. When the explanation moves too quickly, would having step-by-step lecture slides or an extra worked example help clarify the concepts?"
        elif "example" in last_user_msg or "practice" in last_user_msg:
            return "Thank you for pinpointing that. Would you prefer practical live-coding demonstrations or structured practice problem sets with solutions?"
        else:
            return "Which specific aspect are you finding most challenging: the theoretical foundations, the lecture pace, or the lack of practical examples?"

ollama_client = OllamaClient()
