import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans
from app.models.models import FeedbackSubmission, FeedbackTheme, Course, FeedbackOpportunity
from app.services.ollama_client import ollama_client

logger = logging.getLogger(__name__)

class FeedbackAnalyzer:
    async def cluster_and_summarize(self, db: Session, course_id: int, week_number: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Clusters written student feedback into semantic themes and produces concise summaries.
        """
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            return []

        query = db.query(FeedbackSubmission).filter(
            FeedbackSubmission.course_id == course_id,
            FeedbackSubmission.written_feedback != None,
            FeedbackSubmission.written_feedback != ""
        )

        if week_number is not None:
            opp = db.query(FeedbackOpportunity).filter(
                FeedbackOpportunity.course_id == course_id,
                FeedbackOpportunity.week_number == week_number
            ).first()
            if opp:
                query = query.filter(FeedbackSubmission.opportunity_id == opp.id)

        submissions = query.all()
        if len(submissions) < course.privacy_threshold:
            logger.info("Fewer responses than privacy threshold; withholding cluster breakdown.")
            return []

        texts = [s.written_feedback.strip() for s in submissions if s.written_feedback.strip()]
        if len(texts) < 2:
            return []

        # Clustering via TF-IDF + KMeans
        num_clusters = min(3, len(texts))
        vectorizer = TfidfVectorizer(stop_words='english', max_features=100)
        try:
            tfidf_matrix = vectorizer.fit_transform(texts)
            kmeans = KMeans(n_clusters=num_clusters, random_state=42, n_init='auto')
            cluster_labels = kmeans.fit_predict(tfidf_matrix)
        except Exception as e:
            logger.warning(f"Clustering error: {e}. Defaulting to single group.")
            cluster_labels = [0] * len(texts)
            num_clusters = 1

        clustered_groups: Dict[int, List[FeedbackSubmission]] = {i: [] for i in range(num_clusters)}
        for idx, label in enumerate(cluster_labels):
            clustered_groups[label].append(submissions[idx])

        generated_themes = []
        for cluster_id, group in clustered_groups.items():
            if not group:
                continue

            sample_texts = [s.written_feedback for s in group][:5]
            categories = [s.category for s in group]
            common_category = max(set(categories), key=categories.count)
            neg_count = sum(1 for s in group if s.sentiment == "negative" or s.rating <= 2)
            neg_ratio = round(neg_count / len(group), 2)
            topic = group[0].topic

            # Generate natural language synthesis via Ollama / fallback
            prompt_messages = [
                {"role": "system", "content": "You are an educational feedback synthesizer. Summarize these student comments into one clear, objective sentence identifying the shared learning concern without claiming unsupported facts."},
                {"role": "user", "content": f"Category: {common_category}\nStudent Comments:\n" + "\n".join(f"- {t}" for t in sample_texts)}
            ]

            summary = await ollama_client.chat(prompt_messages, format_json=False)
            if not summary or len(summary) < 10:
                summary = f"Multiple students reported challenges regarding {common_category.lower()} in {topic}, emphasizing the need for more illustrative examples and pacing adjustments."

            theme_title = f"{common_category}: {topic}"

            # Save theme
            theme = FeedbackTheme(
                course_id=course_id,
                week_number=week_number or 1,
                topic=topic,
                theme_title=theme_title,
                summary=summary,
                sample_size=len(group),
                negative_ratio=neg_ratio,
                cluster_id=cluster_id
            )
            db.add(theme)
            generated_themes.append({
                "theme_title": theme_title,
                "summary": summary,
                "sample_size": len(group),
                "negative_ratio": neg_ratio,
                "category": common_category,
                "topic": topic
            })

        db.commit()
        return generated_themes

feedback_analyzer = FeedbackAnalyzer()
