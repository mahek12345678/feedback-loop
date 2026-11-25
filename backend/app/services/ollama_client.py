import json
import logging
from typing import Dict, Any, List, Optional
import httpx
from ollama import Client, AsyncClient, ResponseError
from app.core.config import settings

logger = logging.getLogger(__name__)

class OllamaServiceError(Exception):
    """Base exception for remote Ollama API errors."""
    pass

class OllamaAuthError(OllamaServiceError):
    """Raised when remote Ollama authentication fails (HTTP 401: Invalid or missing API credentials)."""
    pass

class OllamaAccessDeniedError(OllamaServiceError):
    """Raised when remote Ollama access is denied by policy or permissions (HTTP 403)."""
    pass

class OllamaPaymentError(OllamaServiceError):
    """Raised when remote Ollama account requires usage credits or subscription (HTTP 402)."""
    pass

class OllamaNotFoundError(OllamaServiceError):
    """Raised when requested remote endpoint or model is not found (HTTP 404)."""
    pass

class OllamaRateLimitError(OllamaServiceError):
    """Raised when remote Ollama rate limits are exceeded (HTTP 429)."""
    pass

class OllamaUnavailableError(OllamaServiceError):
    """Raised when remote Ollama endpoint is unreachable or returning 500/502/503/504."""
    pass

class OllamaTimeoutError(OllamaServiceError):
    """Raised when remote Ollama request exceeds timeout limit."""
    pass

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
        self.is_openai_compat = self.base_url.endswith("/v1")

        headers = {}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        # Standard Ollama client for native endpoint (strip /v1 if present)
        native_host = self.base_url[:-3] if self.is_openai_compat else self.base_url
        self.client = Client(host=native_host, headers=headers, timeout=self.timeout)
        self.async_client = AsyncClient(host=native_host, headers=headers, timeout=self.timeout)

    def _get_headers(self) -> Dict[str, str]:
        h = {
            "Content-Type": "application/json",
            "User-Agent": "FeedbackLoop/1.0"
        }
        if self.api_key:
            h["Authorization"] = f"Bearer {self.api_key}"
        return h

    async def check_health(self) -> Dict[str, Any]:
        """Check if remote Ollama service is reachable, authenticated, and list models."""
        try:
            models = []
            if self.is_openai_compat:
                async with httpx.AsyncClient(timeout=10.0) as http_c:
                    r = await http_c.get(f"{self.base_url}/models", headers=self._get_headers())
                    if r.status_code == 200:
                        data = r.json()
                        models = [m.get("id") for m in data.get("data", [])]
                    elif r.status_code in [401, 403]:
                        return {
                            "available": False,
                            "status": "auth_error",
                            "active_model": self.model,
                            "model_ready": False,
                            "remote_url": self.base_url,
                            "error": f"HTTP {r.status_code}: Authentication failed",
                        }
                    elif r.status_code == 402:
                        return {
                            "available": False,
                            "status": "payment_required",
                            "active_model": self.model,
                            "model_ready": False,
                            "remote_url": self.base_url,
                            "error": "HTTP 402: Payment or credits required",
                        }
            else:
                res = await self.async_client.list()
                models = [m.model for m in res.models] if hasattr(res, "models") else []

            has_model = any(self.model in m for m in models)
            return {
                "available": True,
                "status": "healthy",
                "models": models,
                "active_model": self.model,
                "model_ready": has_model,
                "remote_url": self.base_url,
                "authenticated": bool(self.api_key),
            }
        except ResponseError as e:
            logger.warning(f"Remote Ollama authentication/API error: {e.status_code} - {e.error}")
            return {
                "available": False,
                "status": "auth_error" if e.status_code in [401, 403] else "payment_required" if e.status_code == 402 else "error",
                "active_model": self.model,
                "model_ready": False,
                "remote_url": self.base_url,
                "error": f"HTTP {e.status_code}: {e.error}",
            }
        except Exception as e:
            logger.warning(f"Remote Ollama health check error: {e}")
            return {
                "available": False,
                "status": "unavailable",
                "active_model": self.model,
                "model_ready": False,
                "remote_url": self.base_url,
                "error": str(e),
            }

    async def chat(self, messages: List[Dict[str, str]], format_json: bool = False, temperature: float = 0.3) -> str:
        """Send chat completion request to the remote Ollama API (native or OpenAI-compatible)."""
        if self.is_openai_compat:
            payload = {
                "model": self.model,
                "messages": messages,
                "temperature": temperature,
                "stream": False,
            }
            if format_json:
                payload["response_format"] = {"type": "json_object"}

            try:
                async with httpx.AsyncClient(timeout=float(self.timeout)) as http_c:
                    resp = await http_c.post(
                        f"{self.base_url}/chat/completions",
                        headers=self._get_headers(),
                        json=payload
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        return data.get("choices", [{}])[0].get("message", {}).get("content", "")
                    
                    # Handle non-200 responses
                    logger.error(f"OpenAI-compat remote returned HTTP {resp.status_code}: {resp.text}")
                    if resp.status_code == 401:
                        raise OllamaAuthError(f"Remote authentication failed (HTTP 401): {resp.text}")
                    elif resp.status_code == 403:
                        raise OllamaAccessDeniedError(f"Remote access denied (HTTP 403): {resp.text}")
                    elif resp.status_code == 402:
                        raise OllamaPaymentError(f"Remote usage credits required (HTTP 402): {resp.text}")
                    elif resp.status_code == 404:
                        raise OllamaNotFoundError(f"Remote endpoint or model not found (HTTP 404): {resp.text}")
                    elif resp.status_code == 429:
                        raise OllamaRateLimitError(f"Remote rate limit exceeded (HTTP 429): {resp.text}")
                    elif resp.status_code in [500, 502, 503, 504]:
                        raise OllamaUnavailableError(f"Remote service unavailable (HTTP {resp.status_code}): {resp.text}")
                    raise OllamaServiceError(f"Remote service returned HTTP {resp.status_code}: {resp.text}")
            except httpx.TimeoutException as e:
                raise OllamaTimeoutError(f"Remote request timed out after {self.timeout} seconds")
            except (httpx.ConnectError, httpx.RequestError) as e:
                raise OllamaUnavailableError(f"Cannot connect to remote endpoint at {self.base_url}: {e}")
            except OllamaServiceError:
                raise
            except Exception as e:
                raise OllamaServiceError(f"Unexpected remote error: {e}")

        # Native Ollama endpoint mode
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
            logger.error(f"Remote Ollama ResponseError: {e.status_code} - {e.error}")
            if e.status_code == 401:
                raise OllamaAuthError(f"Remote Ollama authentication failed (HTTP 401): {e.error}")
            elif e.status_code == 403:
                raise OllamaAccessDeniedError(f"Remote Ollama access denied (HTTP 403): {e.error}")
            elif e.status_code == 402:
                raise OllamaPaymentError(f"Remote Ollama usage credits required (HTTP 402): {e.error}")
            elif e.status_code == 404:
                raise OllamaNotFoundError(f"Remote Ollama endpoint or model not found (HTTP 404): {e.error}")
            elif e.status_code == 429:
                raise OllamaRateLimitError(f"Remote Ollama rate limit exceeded (HTTP 429): {e.error}")
            elif e.status_code in [500, 502, 503, 504]:
                raise OllamaUnavailableError(f"Remote Ollama service unavailable (HTTP {e.status_code}): {e.error}")
            elif "not allowed" in str(e.error).lower() or "connection" in str(e.error).lower():
                raise OllamaUnavailableError(f"Remote Ollama service unavailable: {e.error}")
            raise OllamaServiceError(f"Remote Ollama returned HTTP {e.status_code}: {e.error}")
        except httpx.TimeoutException as e:
            logger.error(f"Remote Ollama request timed out after {self.timeout}s: {e}")
            raise OllamaTimeoutError(f"Remote Ollama request timed out after {self.timeout} seconds")
        except (httpx.ConnectError, httpx.RequestError, ConnectionRefusedError, OSError) as e:
            logger.error(f"Remote Ollama connection error: {e}")
            raise OllamaUnavailableError(f"Cannot connect to remote Ollama at {self.base_url}: {e}")
        except Exception as e:
            logger.error(f"Unexpected remote Ollama error: {e}")
            raise OllamaServiceError(f"Remote Ollama service error: {e}")

    def chat_sync(self, messages: List[Dict[str, str]], format_json: bool = False, temperature: float = 0.3) -> str:
        """Synchronous chat completion request to the remote Ollama API."""
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

            response = self.client.chat(**kwargs)
            return response.message.content or ""
        except ResponseError as e:
            if e.status_code == 401:
                raise OllamaAuthError(f"Remote Ollama authentication failed: {e.error}")
            elif e.status_code == 403:
                raise OllamaAccessDeniedError(f"Remote Ollama access denied: {e.error}")
            elif e.status_code == 402:
                raise OllamaPaymentError(f"Remote Ollama credits required: {e.error}")
            elif e.status_code == 404:
                raise OllamaNotFoundError(f"Remote Ollama model or endpoint not found: {e.error}")
            elif e.status_code == 429:
                raise OllamaRateLimitError(f"Remote Ollama rate limit exceeded: {e.error}")
            elif e.status_code in [500, 502, 503, 504]:
                raise OllamaUnavailableError(f"Remote Ollama service unavailable: {e.error}")
            raise OllamaServiceError(f"Remote Ollama returned HTTP {e.status_code}: {e.error}")
        except httpx.TimeoutException as e:
            raise OllamaTimeoutError(f"Remote Ollama request timed out after {self.timeout} seconds")
        except Exception as e:
            raise OllamaUnavailableError(f"Remote Ollama communication failure: {e}")

ollama_client = OllamaClient()
