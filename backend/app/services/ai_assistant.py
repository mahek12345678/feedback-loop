import json
import logging
from typing import Dict, Any, List, Optional
from app.services.ollama_client import ollama_client
from app.schemas.schemas import ExtractedFeedback

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are FeedbackLoop AI, an empathetic academic feedback assistant helping university students articulate constructive, actionable feedback for their professors.
Your goal is to guide students from vague statements (e.g., 'I do not get this class') to specific root causes (e.g. pace too fast, lack of worked examples, heavy workload, confusing slides).
Rules:
1. Be polite, concise, and academically focused.
2. Ask at most ONE clarifying question at a time.
3. Never ask for student personal identity (grades, student ID, personal names).
4. Offer 2-3 specific options to help them clarify.
"""

EXTRACTION_PROMPT = """Analyze the following conversation between a student and an academic assistant.
Extract structured feedback as a valid JSON object matching this schema exactly:
{
  "topic": string (the subject or specific topic mentioned, e.g. "Recursion", "Calculus"),
  "category": string (must be one of: "Teaching clarity", "Lecture pace", "Course difficulty", "Assignment workload", "Practical examples", "Learning resources", "Assessment concerns", "Other"),
  "issue": string (concise description of the problem),
  "suggested_need": string (what would resolve it, e.g. "More worked examples", "Slower explanation pace"),
  "rating": integer between 1 and 5 (estimate student satisfaction: 1 or 2 if frustrated/struggling, 3 neutral, 4 or 5 if satisfied),
  "sentiment": string (must be "positive", "neutral", or "negative")
}
Respond with ONLY valid JSON.
"""

class FeedbackAssistant:
    async def process_turn(
        self,
        user_message: str,
        conversation_history: List[Dict[str, str]],
        turn_count: int,
        topic_hint: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Processes a student message in the feedback conversation.
        After 2-3 turns or when feedback is sufficiently detailed, extracts structured feedback.
        """
        # Determine if we should conclude and extract
        ready_keywords = ["example", "pace", "slow", "fast", "workload", "submit", "that would help", "that's all", "help", "practice", "lecture"]
        has_clear_need = any(kw in user_message.lower() for kw in ready_keywords)
        is_ready_to_extract = (turn_count >= 1 and has_clear_need) or turn_count >= 2 or len(conversation_history) >= 4

        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        if topic_hint:
            messages.append({"role": "system", "content": f"The current course topic being discussed is '{topic_hint}'."})
            
        for msg in conversation_history:
            messages.append({"role": msg["role"], "content": msg["content"]})
        messages.append({"role": "user", "content": user_message})

        if is_ready_to_extract:
            # Concluding response
            bot_reply = "Thank you! I have structured your feedback based on our conversation so you can review and confirm it before submitting."
            extracted = await self.extract_structured_feedback(messages)
            return {
                "reply": bot_reply,
                "is_completed": True,
                "extracted_feedback": extracted,
                "turn_count": turn_count + 1
            }
        else:
            bot_reply = await ollama_client.chat(messages, format_json=False)
            return {
                "reply": bot_reply,
                "is_completed": False,
                "extracted_feedback": None,
                "turn_count": turn_count + 1
            }

    async def extract_structured_feedback(self, messages: List[Dict[str, str]]) -> ExtractedFeedback:
        """Extract structured feedback using Ollama JSON mode with fallback."""
        extract_messages = list(messages)
        extract_messages.append({"role": "system", "content": EXTRACTION_PROMPT})
        
        raw_json = await ollama_client.chat(extract_messages, format_json=True)
        try:
            # Parse JSON and validate with Pydantic
            data = json.loads(raw_json)
            # Normalize category if slightly off
            valid_categories = [
                "Teaching clarity", "Lecture pace", "Course difficulty", "Assignment workload",
                "Practical examples", "Learning resources", "Assessment concerns", "Other"
            ]
            cat = data.get("category", "Teaching clarity")
            matched_cat = next((c for c in valid_categories if c.lower() in cat.lower()), "Teaching clarity")
            data["category"] = matched_cat
            return ExtractedFeedback(**data)
        except Exception as e:
            logger.warning(f"Failed to parse LLM structured feedback JSON: {e}. Using deterministic fallback.")
            # Deterministic fallback based on conversation contents
            full_text = " ".join([m.get("content", "") for m in messages]).lower()
            category = "Teaching clarity"
            if "pace" in full_text or "fast" in full_text:
                category = "Lecture pace"
            elif "example" in full_text:
                category = "Practical examples"
            elif "workload" in full_text or "assignment" in full_text:
                category = "Assignment workload"

            return ExtractedFeedback(
                topic="Course Material",
                category=category,
                issue="Student indicated challenges with current lecture pace or topic depth.",
                suggested_need="Additional step-by-step worked examples during lecture.",
                rating=2,
                sentiment="negative"
            )

feedback_assistant = FeedbackAssistant()
