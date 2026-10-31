from app.models.models import Department, Course, FeedbackOpportunity, FeedbackSubmission, WarningSeverity
from app.services.early_warning import early_warning_engine

def test_early_warning_trend_calculation(db_session):
    dept = Department(name="Math", code="MTH")
    db_session.add(dept)
    db_session.commit()

    course = Course(code="MTH101", title="Calculus", department_id=dept.id, privacy_threshold=3)
    db_session.add(course)
    db_session.commit()

    # Week 1: 10 responses, 1 negative (10% difficulty)
    opp1 = FeedbackOpportunity(course_id=course.id, week_number=1, title="Limits", topic="Limits", is_active=False)
    db_session.add(opp1)
    db_session.commit()

    for i in range(9):
        db_session.add(FeedbackSubmission(course_id=course.id, opportunity_id=opp1.id, topic="Limits", category="Teaching clarity", rating=4, sentiment="positive"))
    db_session.add(FeedbackSubmission(course_id=course.id, opportunity_id=opp1.id, topic="Limits", category="Lecture pace", rating=2, sentiment="negative"))
    db_session.commit()

    # Week 2: 10 responses, 4 negative (40% difficulty) -> WoW change +30%
    opp2 = FeedbackOpportunity(course_id=course.id, week_number=2, title="Derivatives", topic="Derivatives", is_active=True)
    db_session.add(opp2)
    db_session.commit()

    for i in range(6):
        db_session.add(FeedbackSubmission(course_id=course.id, opportunity_id=opp2.id, topic="Derivatives", category="Teaching clarity", rating=4, sentiment="positive"))
    for i in range(4):
        db_session.add(FeedbackSubmission(course_id=course.id, opportunity_id=opp2.id, topic="Derivatives", category="Course difficulty", rating=2, sentiment="negative"))
    db_session.commit()

    stats = early_warning_engine.analyze_course_trends(db_session, course.id)
    assert len(stats) == 2

    # Week 1 verification
    assert stats[0]["difficulty_pct"] == 10.0
    assert stats[0]["severity"] == WarningSeverity.NORMAL

    # Week 2 verification
    assert stats[1]["difficulty_pct"] == 40.0
    assert stats[1]["wow_change"] == 30.0
    assert stats[1]["severity"] in [WarningSeverity.HIGH_CONCERN, WarningSeverity.CRITICAL_CONCERN]
