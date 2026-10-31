import os
import sys
from datetime import datetime, timedelta, timezone

# Add parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.models import (
    User, Department, Course, CourseEnrollment, FacultyCourseAssignment,
    FeedbackOpportunity, SubmissionToken, FeedbackSubmission, FeedbackTheme,
    AcademicIssue, EarlyWarningAlert, InterventionRecommendation,
    FacultyAction, ActionStatusHistory, ResolutionVerification, Notification,
    UserRole, IssueSeverity, IssueStatus, WarningSeverity, RecommendationStatus, VerificationOutcome
)
from app.api.routers.verifications import hash_student_vote
from app.services.early_warning import early_warning_engine

def seed():
    print("Dropping and recreating tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    now = datetime.now(timezone.utc)

    print("Creating departments...")
    depts = [
        Department(name="Computer Science & Engineering", code="CSE"),
        Department(name="Mathematics & Statistics", code="MATH"),
        Department(name="Electrical & Computer Engineering", code="ECE"),
        Department(name="Biological Sciences", code="BIO")
    ]
    db.add_all(depts)
    db.commit()

    print("Creating users...")
    admin = User(
        email="admin@feedbackloop.edu",
        hashed_password=get_password_hash("admin123"),
        full_name="Dr. Eleanor Vance (Dean)",
        role=UserRole.ADMIN,
        department_id=depts[0].id
    )

    prof1 = User(
        email="prof.davis@feedbackloop.edu",
        hashed_password=get_password_hash("faculty123"),
        full_name="Prof. Marcus Davis",
        role=UserRole.FACULTY,
        department_id=depts[0].id
    )
    prof2 = User(
        email="prof.chen@feedbackloop.edu",
        hashed_password=get_password_hash("faculty123"),
        full_name="Prof. Sarah Chen",
        role=UserRole.FACULTY,
        department_id=depts[0].id
    )
    prof3 = User(
        email="prof.smith@feedbackloop.edu",
        hashed_password=get_password_hash("faculty123"),
        full_name="Prof. Robert Smith",
        role=UserRole.FACULTY,
        department_id=depts[1].id
    )

    students = []
    student_names = [
        "Alex Rivera", "Bella Martinez", "Charlie Zhang", "Devon Patel",
        "Emma Watson", "Farhan Ali", "Grace Hopper", "Henry Ford",
        "Isabella Rossi", "James Wilson"
    ]
    for idx, name in enumerate(student_names, start=1):
        students.append(User(
            email=f"student{idx}@feedbackloop.edu",
            hashed_password=get_password_hash("student123"),
            full_name=name,
            role=UserRole.STUDENT,
            department_id=depts[0].id if idx <= 6 else depts[1].id
        ))

    db.add_all([admin, prof1, prof2, prof3] + students)
    db.commit()

    print("Creating courses...")
    courses = [
        Course(code="CS201", title="Data Structures and Algorithms", department_id=depts[0].id, term="Fall 2026", privacy_threshold=3),
        Course(code="CS301", title="Database Management Systems", department_id=depts[0].id, term="Fall 2026", privacy_threshold=3),
        Course(code="MATH210", title="Linear Algebra & Differential Equations", department_id=depts[1].id, term="Fall 2026", privacy_threshold=3),
        Course(code="EE204", title="Signals and Digital Systems", department_id=depts[2].id, term="Fall 2026", privacy_threshold=3),
        Course(code="BIO105", title="Fundamentals of Molecular Biology", department_id=depts[3].id, term="Fall 2026", privacy_threshold=3)
    ]
    db.add_all(courses)
    db.commit()

    print("Assigning faculty...")
    assignments = [
        FacultyCourseAssignment(faculty_id=prof1.id, course_id=courses[0].id, is_primary=True), # Davis -> CS201
        FacultyCourseAssignment(faculty_id=prof2.id, course_id=courses[1].id, is_primary=True), # Chen -> CS301
        FacultyCourseAssignment(faculty_id=prof3.id, course_id=courses[2].id, is_primary=True), # Smith -> MATH210
        FacultyCourseAssignment(faculty_id=prof1.id, course_id=courses[3].id, is_primary=False),# Davis -> EE204
    ]
    db.add_all(assignments)

    print("Enrolling students...")
    enrollments = []
    for s in students:
        enrollments.append(CourseEnrollment(student_id=s.id, course_id=courses[0].id)) # All in CS201
        enrollments.append(CourseEnrollment(student_id=s.id, course_id=courses[1].id)) # All in CS301
        if s.id % 2 == 0:
            enrollments.append(CourseEnrollment(student_id=s.id, course_id=courses[2].id))
        else:
            enrollments.append(CourseEnrollment(student_id=s.id, course_id=courses[3].id))
    db.add_all(enrollments)
    db.commit()

    print("Creating weekly feedback opportunities for CS201 (Data Structures)...")
    cs201_opps = [
        FeedbackOpportunity(course_id=courses[0].id, week_number=1, title="Week 1: Algorithmic Complexity & Big-O", topic="Asymptotic Notation", start_date=now - timedelta(days=28), end_date=now - timedelta(days=21), is_active=False),
        FeedbackOpportunity(course_id=courses[0].id, week_number=2, title="Week 2: Linked Lists and Pointers", topic="Linked Structures", start_date=now - timedelta(days=21), end_date=now - timedelta(days=14), is_active=False),
        FeedbackOpportunity(course_id=courses[0].id, week_number=3, title="Week 3: Recursive Problem Solving", topic="Recursion", start_date=now - timedelta(days=14), end_date=now - timedelta(days=7), is_active=False),
        FeedbackOpportunity(course_id=courses[0].id, week_number=4, title="Week 4: Advanced Recursion & Backtracking", topic="Recursion & Trees", start_date=now - timedelta(days=7), end_date=now + timedelta(days=7), is_active=True)
    ]
    # CS301 current active opportunity
    cs301_opp = FeedbackOpportunity(course_id=courses[1].id, week_number=4, title="Week 4: Relational Algebra and SQL Joins", topic="SQL Query Optimization", start_date=now - timedelta(days=5), end_date=now + timedelta(days=9), is_active=True)
    db.add_all(cs201_opps + [cs301_opp])
    db.commit()

    print("Seeding multi-week feedback showing 10% -> 25% -> 45% -> 55% difficulty progression in CS201...")
    # Week 1 (10% difficulty)
    w1_feedbacks = [
        (4, "Big-O notation was explained very clearly.", "Teaching clarity", "positive", 0.8),
        (5, "Great visual slides for worst-case runtime.", "Teaching clarity", "positive", 0.9),
        (4, "Enjoyed the examples.", "Practical examples", "positive", 0.6),
        (4, "Good pace.", "Lecture pace", "positive", 0.5),
        (3, "Decent introduction to complexity.", "Teaching clarity", "neutral", 0.0),
        (4, "Helpful lecture.", "Teaching clarity", "positive", 0.6),
        (4, "Everything made sense so far.", "Course difficulty", "positive", 0.5),
        (4, "Straightforward concept.", "Teaching clarity", "positive", 0.7),
        (3, "Need a bit more practice on logarithmic time.", "Practical examples", "neutral", 0.0),
        (2, "Mathematical proofs moved a bit quick.", "Lecture pace", "negative", -0.5), # 1 out of 10 = 10%
    ]
    for idx, (rating, text, cat, sent, score) in enumerate(w1_feedbacks):
        sub = FeedbackSubmission(
            course_id=courses[0].id,
            opportunity_id=cs201_opps[0].id,
            faculty_id=prof1.id,
            topic=cs201_opps[0].topic,
            category=cat,
            rating=rating,
            written_feedback=text,
            structured_need="More practice examples" if rating <= 2 else None,
            sentiment=sent,
            sentiment_score=score,
            created_at=now - timedelta(days=25)
        )
        db.add(sub)
        tok = SubmissionToken(
            opportunity_id=cs201_opps[0].id,
            student_id=students[idx].id,
            has_submitted=True,
            submitted_at=now - timedelta(days=25)
        )
        db.add(tok)

    # Week 2 (25% difficulty)
    w2_feedbacks = [
        (4, "Liked pointer memory tracing.", "Teaching clarity", "positive", 0.7),
        (4, "Pointers made sense after diagrams.", "Practical examples", "positive", 0.6),
        (3, "Double pointers are slightly tricky.", "Course difficulty", "neutral", -0.1),
        (4, "Good session.", "Teaching clarity", "positive", 0.5),
        (3, "Pace was fine.", "Lecture pace", "neutral", 0.1),
        (4, "Understood singly linked list reversal.", "Teaching clarity", "positive", 0.6),
        (3, "Okay lecture.", "Teaching clarity", "neutral", 0.0),
        (2, "Memory allocation was confusing.", "Course difficulty", "negative", -0.5),
        (2, "Lost during the double linked list delete function.", "Teaching clarity", "negative", -0.6),
        (1, "Coding part moved way too fast, please slow down.", "Lecture pace", "negative", -0.8),
    ]
    for idx, (rating, text, cat, sent, score) in enumerate(w2_feedbacks):
        sub = FeedbackSubmission(
            course_id=courses[0].id,
            opportunity_id=cs201_opps[1].id,
            faculty_id=prof1.id,
            topic=cs201_opps[1].topic,
            category=cat,
            rating=rating,
            written_feedback=text,
            structured_need="Slower live coding demonstration" if rating <= 2 else None,
            sentiment=sent,
            sentiment_score=score,
            created_at=now - timedelta(days=18)
        )
        db.add(sub)
        tok = SubmissionToken(
            opportunity_id=cs201_opps[1].id,
            student_id=students[idx].id,
            has_submitted=True,
            submitted_at=now - timedelta(days=18)
        )
        db.add(tok)

    # Week 3 (45% difficulty - Emergence of critical Recursion issue!)
    w3_feedbacks = [
        (4, "Recursion base cases were clear.", "Teaching clarity", "positive", 0.5),
        (4, "Interesting topic.", "Course difficulty", "positive", 0.4),
        (3, "Recursion is counterintuitive.", "Course difficulty", "neutral", -0.1),
        (3, "Call stack visualization was okay.", "Learning resources", "neutral", 0.0),
        (3, "Neutral on lecture pace.", "Lecture pace", "neutral", 0.0),
        (2, "Recursion is difficult to understand without more visual examples.", "Practical examples", "negative", -0.6),
        (2, "The teacher moves too quickly through recursive functions.", "Lecture pace", "negative", -0.7),
        (2, "We need more step-by-step examples of recursion trees.", "Practical examples", "negative", -0.6),
        (1, "Recursive problems are confusing and lecture pace is too fast.", "Teaching clarity", "negative", -0.8),
        (2, "I don't understand how call stack unrolling works in the homework.", "Assignment workload", "negative", -0.6),
    ]
    for idx, (rating, text, cat, sent, score) in enumerate(w3_feedbacks):
        sub = FeedbackSubmission(
            course_id=courses[0].id,
            opportunity_id=cs201_opps[2].id,
            faculty_id=prof1.id,
            topic=cs201_opps[2].topic,
            category=cat,
            rating=rating,
            written_feedback=text,
            structured_need="More visual worked examples of recursion trees" if rating <= 2 else None,
            sentiment=sent,
            sentiment_score=score,
            created_at=now - timedelta(days=10)
        )
        db.add(sub)
        tok = SubmissionToken(
            opportunity_id=cs201_opps[2].id,
            student_id=students[idx].id,
            has_submitted=True,
            submitted_at=now - timedelta(days=10)
        )
        db.add(tok)

    # Week 4 (50% difficulty with ongoing submissions)
    w4_feedbacks = [
        (4, "Backtracking n-queens problem was neat.", "Teaching clarity", "positive", 0.6),
        (3, "Tree traversal seems easier than pure math recursion.", "Course difficulty", "neutral", 0.1),
        (2, "Still struggling with recursive backtracking runtime.", "Course difficulty", "negative", -0.5),
        (1, "The pace on recursive trees was overwhelming.", "Lecture pace", "negative", -0.8),
        (2, "Need more worked examples on tree recursion.", "Practical examples", "negative", -0.6),
        (2, "Homework 4 is way too difficult given the brief explanation in class.", "Assignment workload", "negative", -0.7),
    ]
    for idx, (rating, text, cat, sent, score) in enumerate(w4_feedbacks):
        sub = FeedbackSubmission(
            course_id=courses[0].id,
            opportunity_id=cs201_opps[3].id,
            faculty_id=prof1.id,
            topic=cs201_opps[3].topic,
            category=cat,
            rating=rating,
            written_feedback=text,
            structured_need="Dedicated problem-solving tutorial",
            sentiment=sent,
            sentiment_score=score,
            created_at=now - timedelta(days=2)
        )
        db.add(sub)
        tok = SubmissionToken(
            opportunity_id=cs201_opps[3].id,
            student_id=students[idx].id,
            has_submitted=True,
            submitted_at=now - timedelta(days=2)
        )
        db.add(tok)

    db.commit()

    print("Running early warning calculation on CS201...")
    early_warning_engine.analyze_course_trends(db, courses[0].id)

    print("Creating AI synthesized themes for CS201...")
    themes = [
        FeedbackTheme(
            course_id=courses[0].id,
            week_number=3,
            topic="Recursion",
            theme_title="Lecture Pace & Practical Examples: Recursion",
            summary="Multiple students report difficulty understanding recursion, particularly due to lecture pace and insufficient worked examples.",
            sample_size=10,
            negative_ratio=0.45,
            cluster_id=0,
            created_at=now - timedelta(days=8)
        ),
        FeedbackTheme(
            course_id=courses[0].id,
            week_number=4,
            topic="Recursion & Trees",
            theme_title="Assignment Workload & Tree Recursion",
            summary="Students express elevated stress on recursion backtracking homework, requesting a walkthrough of state-tree branching.",
            sample_size=6,
            negative_ratio=0.50,
            cluster_id=1,
            created_at=now - timedelta(days=1)
        )
    ]
    db.add_all(themes)

    print("Creating Academic Issue and Closed Feedback Loop...")
    issue = AcademicIssue(
        course_id=courses[0].id,
        title="Student Comprehension Barrier in Recursion Call Stacks",
        topic="Recursion",
        category="Teaching clarity",
        description="Students reported difficulties visualizing call stack execution and recursive branching, with difficulty climbing from 10% in Week 1 to 45% in Week 3.",
        severity=IssueSeverity.HIGH,
        status=IssueStatus.VERIFICATION_PENDING,
        created_at=now - timedelta(days=7),
        updated_at=now - timedelta(days=1)
    )
    db.add(issue)
    db.commit()

    print("Generating AI Intervention Recommendations...")
    recs = [
        InterventionRecommendation(
            issue_id=issue.id,
            course_id=courses[0].id,
            title="Interactive Step-by-Step Problem Solving Workshop",
            problem_addressed="Student difficulty regarding Recursion (Teaching clarity)",
            explanation="Based on student feedback in Data Structures and Algorithms, students face comprehension barriers in Recursion. Scheduling a dedicated live problem-solving tutorial enables immediate clarifying questions.",
            suggested_action="Schedule an additional 45-minute problem-solving tutorial dedicated to visual call stack unrolling and recursion trees.",
            expected_benefit="Allows students to observe the cognitive process in real time and ask immediate clarifying questions.",
            priority="HIGH",
            status=RecommendationStatus.ACCEPTED,
            created_at=now - timedelta(days=6)
        ),
        InterventionRecommendation(
            issue_id=issue.id,
            course_id=courses[0].id,
            title="Visual Recursion Tree Cheat-Sheet Handout",
            problem_addressed="Need for visual aids in Recursion",
            explanation="Students indicated call stack tracing was confusing without permanent reference diagrams.",
            suggested_action="Distribute an annotated visual guide on tracing divide-and-conquer recursion.",
            expected_benefit="Provides persistent reference scaffolding during homework assignments.",
            priority="MEDIUM",
            status=RecommendationStatus.MODIFIED,
            created_at=now - timedelta(days=6)
        )
    ]
    db.add_all(recs)
    db.commit()

    print("Creating Faculty Action and lifecycle history...")
    action = FacultyAction(
        issue_id=issue.id,
        faculty_id=prof1.id,
        title="Special Supplementary Recursion Tutorial & Visual Aids",
        description="Prof. Davis scheduled a 45-minute live problem-solving tutorial dedicated to visual call stack unrolling and recursion trees.",
        target_completion_date=now - timedelta(days=2),
        current_status=IssueStatus.VERIFICATION_PENDING,
        public_update="Tutorial completed this Friday with 30 students attending. Visual cheat sheet posted to course portal. Please submit your verification feedback below!",
        created_at=now - timedelta(days=6),
        completed_at=now - timedelta(days=2)
    )
    db.add(action)
    db.commit()

    # Status History
    histories = [
        ActionStatusHistory(action_id=action.id, from_status=IssueStatus.SUBMITTED, to_status=IssueStatus.ACTION_PLANNED, changed_by_user_id=prof1.id, comment="Accepted recommendation to schedule supplementary workshop.", created_at=now - timedelta(days=6)),
        ActionStatusHistory(action_id=action.id, from_status=IssueStatus.ACTION_PLANNED, to_status=IssueStatus.IN_PROGRESS, changed_by_user_id=prof1.id, comment="Workshop scheduled for Friday 4pm in Hall B.", created_at=now - timedelta(days=4)),
        ActionStatusHistory(action_id=action.id, from_status=IssueStatus.IN_PROGRESS, to_status=IssueStatus.ACTION_COMPLETED, changed_by_user_id=prof1.id, comment="Conducted tutorial and distributed visual diagrams.", created_at=now - timedelta(days=2)),
        ActionStatusHistory(action_id=action.id, from_status=IssueStatus.ACTION_COMPLETED, to_status=IssueStatus.VERIFICATION_PENDING, changed_by_user_id=prof1.id, comment="Requested enrolled student verification.", created_at=now - timedelta(days=2))
    ]
    db.add_all(histories)

    print("Seeding Student Resolution Verifications (Impact Measurement)...")
    verification_votes = [
        (students[0].id, VerificationOutcome.YES, "The visual recursion tree diagrams made the call stack completely click for me!"),
        (students[1].id, VerificationOutcome.YES, "Much better understanding now. The step-by-step example was exactly what I needed."),
        (students[2].id, VerificationOutcome.PARTIALLY, "Helped with single recursion, still finding binary tree recursion tricky."),
        (students[3].id, VerificationOutcome.YES, "Great tutorial. Thank you for addressing our feedback so fast!"),
        (students[4].id, VerificationOutcome.PARTIALLY, "Better than before, homework is still challenging."),
        (students[5].id, VerificationOutcome.YES, "The live tracing made a huge difference.")
    ]
    for s_id, outcome, comment in verification_votes:
        vote = ResolutionVerification(
            action_id=action.id,
            student_id_hash=hash_student_vote(s_id, action.id),
            outcome=outcome,
            comment=comment,
            created_at=now - timedelta(days=1)
        )
        db.add(vote)

    print("Creating notifications...")
    for s in students[:5]:
        notif = Notification(
            user_id=s.id,
            title="Please Verify Improvement: Supplementary Recursion Tutorial",
            message="Prof. Davis completed the tutorial on Recursion. Did this improve your understanding? Tap to verify.",
            link_url=f"/student/verify/{action.id}",
            created_at=now - timedelta(days=1)
        )
        db.add(notif)

    db.commit()
    db.close()
    print("Database seeding completed successfully!")

if __name__ == "__main__":
    seed()
