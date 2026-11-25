import os
import sys
import json
import httpx
from pathlib import Path

# Ensure backend root is on sys.path
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.core.config import settings

def mask_key(k: str) -> str:
    if not k:
        return "<NONE>"
    if len(k) <= 8:
        return "***"
    return f"{k[:4]}...{k[-4:]} (length: {len(k)})"

def run_diagnostics():
    print("=" * 60)
    print("      FEEDBACKLOOP REMOTE OLLAMA API DIAGNOSTIC REPORT      ")
    print("=" * 60)

    # 1. Configuration Verification
    print("\n--- 1. CONFIGURATION VERIFICATION ---")
    print(f"Loaded Settings:")
    print(f"  OLLAMA_BASE_URL: {settings.OLLAMA_BASE_URL}")
    print(f"  OLLAMA_MODEL:    {settings.OLLAMA_MODEL}")
    print(f"  OLLAMA_TIMEOUT:  {settings.OLLAMA_TIMEOUT}s")
    print(f"  OLLAMA_API_KEY:  {mask_key(settings.OLLAMA_API_KEY)}")

    raw_env_key = os.environ.get("OLLAMA_API_KEY")
    print(f"  Process env OLLAMA_API_KEY: {mask_key(raw_env_key) if raw_env_key else '<NOT IN PROCESS ENV>'}")

    api_key = settings.OLLAMA_API_KEY
    base_url = settings.OLLAMA_BASE_URL.rstrip("/")
    model = settings.OLLAMA_MODEL

    headers = {}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
        headers["Content-Type"] = "application/json"

    # 2. Test Endpoints Independently
    print("\n--- 2. ENDPOINT CONNECTIVITY & AUTHENTICATION ---")
    endpoints_to_test = [
        ("GET", f"{base_url}/api/version", None),
        ("GET", f"{base_url}/api/tags", None),
        ("POST", f"{base_url}/api/chat", {
            "model": model,
            "messages": [{"role": "user", "content": "ping"}],
            "stream": False
        }),
        ("POST", f"{base_url}/v1/chat/completions", {
            "model": model,
            "messages": [{"role": "user", "content": "ping"}],
            "stream": False
        })
    ]

    available_models = []

    with httpx.Client(timeout=15.0) as client:
        for method, url, payload in endpoints_to_test:
            print(f"\nProbing {method} {url}:")
            try:
                if method == "GET":
                    resp = client.get(url, headers=headers)
                else:
                    resp = client.post(url, headers=headers, json=payload)

                print(f"  HTTP Status: {resp.status_code} {resp.reason_phrase}")
                
                # Check for sensitive info in body
                body_text = resp.text
                sanitized_body = body_text
                if api_key and api_key in sanitized_body:
                    sanitized_body = sanitized_body.replace(api_key, mask_key(api_key))

                # Truncate if long
                if len(sanitized_body) > 300:
                    preview = sanitized_body[:300] + "... [truncated]"
                else:
                    preview = sanitized_body
                print(f"  Response Body: {preview}")

                if url.endswith("/api/tags") and resp.status_code == 200:
                    try:
                        data = resp.json()
                        available_models = [m.get("name") or m.get("model") for m in data.get("models", [])]
                    except Exception:
                        pass

            except httpx.ConnectError as e:
                print(f"  Connection Failed: {e}")
            except httpx.TimeoutException:
                print(f"  Request Timed Out (exceeded 15s)")
            except Exception as e:
                print(f"  Error: {e}")

    # 3. Model Availability & Free Tier Evaluation
    print("\n--- 3. MODEL AVAILABILITY & FREE TIER EVALUATION ---")
    print(f"Models reported by provider ({len(available_models)} total):")
    for m in available_models[:10]:
        print(f"  - {m}")
    if len(available_models) > 10:
        print(f"  ... and {len(available_models) - 10} more.")

    # Test top candidate models for inference to check if ANY is free
    print("\nTesting candidate models for inference under current account:")
    candidates = [model]
    for c in ["glm-5.3-flash", "deepseek-v4.1-flash", "kimi-k2.6", "llama3.2:3b", "llama3.1:8b", "qwen2.5:7b"]:
        if c not in candidates and c in available_models:
            candidates.append(c)

    free_working_model = None
    with httpx.Client(timeout=15.0) as client:
        for cand in candidates:
            try:
                chat_resp = client.post(
                    f"{base_url}/api/chat",
                    headers=headers,
                    json={
                        "model": cand,
                        "messages": [{"role": "user", "content": "Say hello in one word."}],
                        "stream": False
                    }
                )
                print(f"  Model '{cand}': HTTP {chat_resp.status_code} - {chat_resp.text[:120].strip()}")
                if chat_resp.status_code == 200:
                    free_working_model = cand
                    break
            except Exception as e:
                print(f"  Model '{cand}': Exception {e}")

    print("\n--- 4. SUMMARY OF FINDINGS ---")
    if free_working_model:
        print(f"  [RESULT] Found working model without credit restriction: '{free_working_model}'")
    else:
        print("  [RESULT] No models currently succeed without payment/credits on this remote account.")

if __name__ == "__main__":
    run_diagnostics()
