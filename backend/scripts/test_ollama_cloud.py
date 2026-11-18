import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.ollama_client import ollama_client
from app.core.config import settings

def main():
    print(f"Connecting to: {settings.OLLAMA_BASE_URL} with model: {settings.OLLAMA_MODEL}")
    reply = ollama_client.chat_sync([
        {"role": "user", "content": "Respond in one short sentence: Why is student feedback important in higher education?"}
    ])
    print("OLLAMA_REPLY_START")
    print(reply)
    print("OLLAMA_REPLY_END")

if __name__ == "__main__":
    main()
