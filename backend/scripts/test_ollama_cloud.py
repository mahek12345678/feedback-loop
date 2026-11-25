import sys
import os
import asyncio
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.ollama_client import (
    ollama_client, OllamaAuthError, OllamaPaymentError,
    OllamaUnavailableError, OllamaTimeoutError, OllamaServiceError
)
from app.core.config import settings

async def main():
    print("Testing Remote Hosted Ollama API")
    print(f"Remote URL: {settings.OLLAMA_BASE_URL}")
    print(f"Model: {settings.OLLAMA_MODEL}")
    print(f"API Key configured: {bool(settings.OLLAMA_API_KEY)}")
    print("-" * 50)

    # 1. Health check
    print("1. Running remote health check...")
    health = await ollama_client.check_health()
    print("Health check response:", health)

    # 2. Test chat completion
    print("\n2. Testing chat completion request...")
    try:
        reply = await ollama_client.chat([
            {"role": "user", "content": "Respond in one short sentence: Why is student feedback important?"}
        ])
        print("Reply received successfully:")
        print(reply)
    except OllamaAuthError as e:
        print(f"[AUTH ERROR] {e}")
    except OllamaPaymentError as e:
        print(f"[PAYMENT / CREDITS REQUIRED] {e}")
    except OllamaTimeoutError as e:
        print(f"[TIMEOUT ERROR] {e}")
    except (OllamaUnavailableError, OllamaServiceError) as e:
        print(f"[SERVICE ERROR] {e}")

if __name__ == "__main__":
    asyncio.run(main())
