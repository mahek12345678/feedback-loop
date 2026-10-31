from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.models import Course, FeedbackOpportunity, FeedbackSubmission, EarlyWarningAlert, WarningSeverity

class EarlyWarningEngine:
    def analyze_course_trends(self, db: Session, course_id: int) -> List[Dict[str, Any]]:
        """
        Calculates week-by-week difficulty metrics for a course,
        evaluates deterministic early warning rules, and generates alert records.
        """
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            return []

        # Fetch all feedback opportunities sorted by week number
        opportunities = db.query(FeedbackOpportunity).filter(
            FeedbackOpportunity.course_id == course_id
        ).order_by(FeedbackOpportunity.week_number.asc()).all()

        weekly_stats: List[Dict[str, Any]] = []
        alerts_generated: List[Dict[str, Any]] = []

        consecutive_worsening = 0
        prev_difficulty_pct: Optional[float] = None

        for opp in opportunities:
            subs = db.query(FeedbackSubmission).filter(
                FeedbackSubmission.opportunity_id == opp.id
            ).all()

            total_resp = len(subs)
            if total_resp == 0:
                weekly_stats.append({
                    "week_number": opp.week_number,
                    "topic": opp.topic,
                    "respondents": 0,
                    "difficulty_pct": 0.0,
                    "avg_rating": 0.0,
                    "wow_change": 0.0,
                    "is_low_sample": True
                })
                continue

            # Count students reporting difficulty: rating <= 2 or sentiment == 'negative'
            diff_count = sum(1 for s in subs if s.rating <= 2 or s.sentiment == "negative")
            diff_pct = round((diff_count / total_resp) * 100, 1)
            avg_rating = round(sum(s.rating for s in subs) / total_resp, 2)
            is_low_sample = total_resp < course.privacy_threshold

            wow_change = 0.0
            if prev_difficulty_pct is not None:
                wow_change = round(diff_pct - prev_difficulty_pct, 1)
                if wow_change > 5.0:
                    consecutive_worsening += 1
                else:
                    consecutive_worsening = 0
            else:
                consecutive_worsening = 1 if diff_pct > 25.0 else 0

            prev_difficulty_pct = diff_pct

            # Determine severity deterministically
            severity = WarningSeverity.NORMAL
            rule_triggered = "Feedback within expected academic variance"
            explanation = f"Week {opp.week_number} feedback shows normal student satisfaction ({diff_pct}% difficulty reports across {total_resp} responses)."

            if is_low_sample:
                rule_triggered = "Sample size below reliability threshold"
                explanation = f"Only {total_resp} student(s) responded for Week {opp.week_number}. Insufficient sample size to trigger high-confidence alert."
            elif diff_pct >= 50.0 or (diff_pct >= 40.0 and consecutive_worsening >= 2):
                severity = WarningSeverity.CRITICAL_CONCERN
                rule_triggered = "Critical difficulty report rate with sustained negative trend"
                explanation = (
                    f"CRITICAL: {diff_pct}% of responding students reported difficulty on '{opp.topic}' in Week {opp.week_number}. "
                    f"Difficulty has risen for {consecutive_worsening} consecutive evaluation period(s) (+{wow_change}% WoW). "
                    f"Immediate instructional intervention recommended."
                )
            elif diff_pct >= 35.0 or (wow_change >= 15.0 and diff_pct >= 25.0):
                severity = WarningSeverity.HIGH_CONCERN
                rule_triggered = "Sustained increase in student learning difficulty"
                explanation = (
                    f"HIGH CONCERN: Difficulty reported by {diff_pct}% of students for topic '{opp.topic}', "
                    f"increasing by +{wow_change}% since the previous week. Review lecture pacing and assignment clarity."
                )
            elif diff_pct >= 20.0 or wow_change >= 10.0:
                severity = WarningSeverity.WATCH
                rule_triggered = "Emerging learning friction detected"
                explanation = (
                    f"WATCH: Emerging difficulty ({diff_pct}%) noted for '{opp.topic}'. "
                    f"Monitor feedback progression over upcoming sessions."
                )

            stat_record = {
                "opportunity_id": opp.id,
                "week_number": opp.week_number,
                "topic": opp.topic,
                "respondents": total_resp,
                "difficulty_pct": diff_pct,
                "avg_rating": avg_rating,
                "wow_change": wow_change,
                "consecutive_worsening": consecutive_worsening,
                "severity": severity,
                "rule_triggered": rule_triggered,
                "explanation": explanation,
                "is_low_sample": is_low_sample
            }
            weekly_stats.append(stat_record)

            # Persist or update EarlyWarningAlert if severity is WATCH or higher
            if severity != WarningSeverity.NORMAL and not is_low_sample:
                existing_alert = db.query(EarlyWarningAlert).filter(
                    EarlyWarningAlert.course_id == course_id,
                    EarlyWarningAlert.week_number == opp.week_number
                ).first()

                if not existing_alert:
                    new_alert = EarlyWarningAlert(
                        course_id=course_id,
                        topic=opp.topic,
                        week_number=opp.week_number,
                        severity=severity,
                        respondent_count=total_resp,
                        difficulty_percentage=diff_pct,
                        wow_change=wow_change,
                        consecutive_worsening_weeks=consecutive_worsening,
                        rule_triggered=rule_triggered,
                        ai_explanation=explanation,
                        is_acknowledged=False
                    )
                    db.add(new_alert)
                    alerts_generated.append(stat_record)
                else:
                    existing_alert.severity = severity
                    existing_alert.difficulty_percentage = diff_pct
                    existing_alert.wow_change = wow_change
                    existing_alert.ai_explanation = explanation

        db.commit()
        return weekly_stats

early_warning_engine = EarlyWarningEngine()
