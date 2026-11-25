# FeedbackLoop: AI-Driven Continuous Student Feedback & Academic Intervention Platform

FeedbackLoop is a university feedback management platform where students provide continuous, anonymous feedback throughout the semester. The system leverages local Ollama LLMs to analyze student sentiments, conduct multi-turn conversational follow-ups, trigger statistical early warnings, and recommend instructional interventions that professors can implement and students can verify.

---

## 🌟 Key Features

### 1. Anonymous Student Voice & AI Conversational Assistant
- **Decoupled Eligibility Tokens**: Student identity is strictly isolated from feedback rows via pseudonymous submission tokens, preventing duplicate entries without storing identity linkages.
- **AI Conversational Assistant**: Guides students through multi-turn dialogue (up to 3 turns) to convert ambiguous impressions (e.g., *"I don't get this class"*) into structured academic observations (Category, Specific Issue, Suggested Instructional Need, Rating).
- **Class Privacy Threshold**: When class respondent counts fall below the configured threshold (default: 3), individual written comments are withheld from faculty to protect anonymity.

### 2. Explainable Academic Early Warning Engine
- **Deterministic Statistical Detection**: Analyzes week-over-week (WoW) difficulty rates and flags consecutive worsening periods.
- **Severity Levels**: `NORMAL`, `WATCH`, `HIGH_CONCERN`, and `CRITICAL_CONCERN`.
- **Sample Size Guards**: Displays low-sample warnings and prevents single respondents from triggering department alerts.

### 3. AI-Powered Intervention Recommendations
- **Evidence-Based Suggestions**: Evaluates student feedback clusters and offers actionable instructional options (e.g. *Step-by-Step Problem Solving Workshop*, *Visual State Tree Diagrams*, *Pacing Checkpoints*).
- **Faculty Governance**: AI never autonomously modifies database records; recommendations require faculty review: **Accept**, **Modify**, or **Reject**.

### 4. Closed Feedback Loop & Impact Measurement
- **Issue Lifecycle**: `SUBMITTED` &rarr; `UNDER_REVIEW` &rarr; `ACTION_PLANNED` &rarr; `IN_PROGRESS` &rarr; `ACTION_COMPLETED` &rarr; `VERIFICATION_PENDING` &rarr; `VERIFIED_RESOLVED`.
- **Student Verification Voting**: Enrolled students anonymously vote (`YES`, `PARTIALLY`, `NO`) on whether an implemented faculty action helped resolve their difficulty.

### 5. Multi-Role Institutional Dashboards
- **Student Dashboard**: Enrolled courses, active weekly evaluation windows, AI assistant, and verification requests.
- **Faculty Dashboard**: Course trends, sentiment distribution, topic difficulty rates, early warnings, and action tracking.
- **Administrator / Dean Dashboard**: University KPIs, department feedback volume, response rates, and verified resolution percentages.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, Recharts, Lucide React |
| **Backend** | Python 3.12, FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2, PyJWT, Bcrypt, Scikit-Learn |
| **Database** | SQLite (flexible zero-config local dev) / PostgreSQL (production configured via `DATABASE_URL`) |
| **AI / Inference** | Remotely Hosted or Local Ollama API (Configurable via `OLLAMA_BASE_URL`, `OLLAMA_API_KEY`, `OLLAMA_MODEL`, `OLLAMA_TIMEOUT`) with graceful manual fallback |
| **Testing** | Pytest, Pytest-Asyncio, HTTPX |

---

## 🤖 Remote Hosted Ollama API Configuration

FeedbackLoop is configured to use a **remotely hosted Ollama API** (or local Ollama instance) without requiring local GPU or model downloads.

Configure these environment variables in `backend/.env`:

```env
# Remote Hosted Ollama API Configuration
OLLAMA_BASE_URL=https://ollama.com
OLLAMA_API_KEY=YOUR_REMOTE_API_KEY
OLLAMA_MODEL=glm-5.3-flash
OLLAMA_TIMEOUT=120
```

### Key AI Architecture Capabilities:
- **Zero Local Footprint**: No local Ollama installation, daemon, or model weight downloads required.
- **Enterprise Error Handling**: Securely manages connection errors, timeouts (120s), authentication errors (HTTP 401/403), and credit/quota exhaustion (HTTP 402) by cleanly directing students to the 3-step manual feedback form without ever crashing or faking responses.
- **Security & Privacy**: The API key is securely retained within the FastAPI backend service layer and is never exposed to the frontend or student browsers.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** v20+ and npm
- **Python** 3.11+
- *(Optional)* A remote Ollama API key or local Ollama instance

---

### 2. Backend Setup

```bash
cd backend

# 1. Install dependencies
pip install -r requirements.txt

# 2. Seed database with multi-week demo data
python scripts/seed_demo_data.py

# 3. Run automated tests
python -m pytest

# 4. Start the FastAPI server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API documentation is available at `http://127.0.0.1:8000/docs`.

---

### 3. Frontend Setup

```bash
cd frontend

# 1. Install packages
npm install

# 2. Start Vite development server
npm run dev -- --host 127.0.0.1 --port 5173
```
Open your browser at `http://127.0.0.1:5173`.

---

## 👥 Demo Personas (1-Click Switcher Available in UI)

| Role | Name | Email | Password | Details |
|---|---|---|---|---|
| **Student** | Alex Rivera | `student1@feedbackloop.edu` | `student123` | Enrolled in CS201 & CS301 |
| **Faculty** | Prof. Marcus Davis | `prof.davis@feedbackloop.edu` | `faculty123` | Instructor: CS201 Data Structures |
| **Dean / Admin** | Dr. Eleanor Vance | `admin@feedbackloop.edu` | `admin123` | Institutional Quality Oversight |

*Note: The top navigation bar includes an **Instant Demo Switch** allowing seamless one-click persona testing.*

---

## 🧪 Automated Test Suite

Run backend test suite covering authentication, RBAC, anonymous feedback privacy, early warning calculations, action lifecycle transitions, and Ollama client resilience:

```bash
cd backend
python -m pytest
```

Result: **12 passed, 0 failures** (including complete end-to-end closed loop workflow).
