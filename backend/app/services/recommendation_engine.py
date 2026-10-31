import json
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.models import (
    AcademicIssue, InterventionRecommendation, RecommendationStatus, Course, IssueSeverity
)
from app.services.ollama_client import ollama_client

logger = logging.getLogger(__name__)

INTERVENTION_TEMPLATES = {
    "Teaching clarity": [
        {
            "title": "Interactive Step-by-Step Problem Solving Workshop",
            "action": "Schedule a 45-minute live walkthrough dedicating specific slides to breaking down multi-step proofs or algorithms.",
            "benefit": "Allows students to observe the cognitive process in real time and ask immediate clarifying questions."
        },
        {
            "title": "Visual Concept Diagrams & Annotated Cheat-Sheets",
            "action": "Distribute a single-page visual flow diagram illustrating state transitions or core formulas before the next lecture.",
            "benefit": "Helps visual learners anchor abstract logic into tangible structural diagrams."
        }
    ],
    "Lecture pace": [
        {
            "title": "Dedicated Mid-Lecture Checkpoint Polls",
            "action": "Pause at the 25-minute mark to run a 2-minute quick check question before proceeding to advanced extensions.",
            "benefit": "Prevents cognitive overload and flags unmastered prerequisites early."
        },
        {
            "title": "Pre-Lecture Primer Handout & Asynchronous Recaps",
            "action": "Share brief 5-minute pre-reading notes highlighting terminology so class time can focus on application.",
            "benefit": "Decreases in-class cognitive friction, enabling a more comfortable absorption pace."
        }
    ],
    "Assignment workload": [
        {
            "title": "Milestone-Based Assignment Scaffolding",
            "action": "Divide the upcoming major homework assignment into two smaller checkpoint submissions with starter test cases.",
            "benefit": "Reduces end-of-week cramming and allows early debugging support."
        }
    ],
    "Practical examples": [
        {
            "title": "Real-World Case Study Demonstration",
            "action": "Incorporate a 15-minute demonstration of how this week's algorithm is applied in actual industrial software.",
            "benefit": "Enhances student motivation and contextual understanding through concrete application."
        }
    ]
}

class RecommendationEngine:
    async def generate_recommendations_for_issue(
        self, db: Session, issue: AcademicIssue
    ) -> List[InterventionRecommendation]:
        """
        Generates actionable, evidence-backed intervention options for an academic issue.
        """
        course = db.query(Course).filter(Course.id == issue.course_id).first()
        course_name = course.title if course else "Course"

        # Check existing recommendations
        existing = db.query(InterventionRecommendation).filter(
            InterventionRecommendation.issue_id == issue.id
        ).all()
        if existing:
            return existing

        recs_to_create = []

        # Use curated templates matched with category
        templates = INTERVENTION_TEMPLATES.get(
            issue.category,
            INTERVENTION_TEMPLATES["Teaching clarity"]
        )

        for tmpl in templates:
            priority = "HIGH" if issue.severity in [IssueSeverity.CRITICAL, IssueSeverity.HIGH] else "MEDIUM"
            rec = InterventionRecommendation(
                issue_id=issue.id,
                course_id=issue.course_id,
                title=tmpl["title"],
                problem_addressed=f"Student difficulty regarding {issue.topic} ({issue.category})",
                explanation=f"Based on student feedback in {course_name}, students face comprehension barriers in {issue.topic}. {tmpl['benefit']}",
                suggested_action=tmpl["action"],
                expected_benefit=tmpl["benefit"],
                priority=priority,
                status=RecommendationStatus.SUGGESTED
            )
            db.add(rec)
            recs_to_create.append(rec)

        db.commit()
        for r in recs_to_create:
            db.refresh(r)
        return recs_to_create

recommendation_engine = RecommendationEngine()
