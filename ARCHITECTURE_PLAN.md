# FeedbackLoop: Master Architecture & Implementation Plan

FeedbackLoop is an AI-driven continuous student feedback, academic early warning, and intervention platform designed for modern higher education institutions.

---

## 1. Directory Structure

```plaintext
feedback-loop/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routers/
│   │   │   │   ├── auth.py             # Login, register, me
│   │   │   │   ├── courses.py          # Courses, enrollments, assignments
│   │   │   │   ├── feedback.py         # Submissions, opportunities, anonymous ingestion
│   │   │   │   ├── ai.py               # Conversational feedback assistant, clustering, summaries
│   │   │   │   ├── warnings.py         # Deterministic rule-based early warning alerts
│   │   │   │   ├── actions.py          # Faculty improvement actions & status progression
│   │   │   │   ├── verifications.py    # Student closed-loop resolution verification
│   │   │   │   └── analytics.py        # Student, faculty, and admin KPI calculations
│   │   │   └── deps.py                 # DB sessions, get_current_user, role guards
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── main.py
│   ├── scripts/
│   └── tests/
├── frontend/
│   ├── src/
│   └── ...
└── README.md
```
