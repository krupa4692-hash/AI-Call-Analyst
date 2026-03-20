# 📞 Call Intelligence Platform
### AI-Powered Sales Call Analysis System

> Built during **CP Prompt-X: The AI Vibe Coding Hackathon**
> March 20, 2026 | CP House, Ahmedabad
> Built in **4 hours** using Vibe Coding methodology

![Dashboard Preview](screenshots/dashboard.png)

---

## 🎯 What is This?

Call Intelligence Platform is an AI-powered system 
that automatically analyzes sales call recordings 
and generates structured, actionable insights for 
sales managers and team leads.

Simply drop your audio recordings in a folder — 
the system automatically transcribes, analyzes, 
scores, and presents everything in a beautiful 
dashboard.

---

## ✨ Key Features

### 🔄 Automatic Processing Pipeline
- Monitors a folder for audio files
- Auto-transcribes using OpenAI Whisper
- Analyzes conversations using GPT-4
- Stores results in MongoDB
- No manual intervention needed

### 📊 Management Dashboard
- **Team Health Banner** — instant red/amber/green
  status showing if your team needs attention
- **Sentiment Overview** — positive/neutral/negative
  split across all calls
- **Performance Scores** — average call quality score
- **Top Keywords** — most discussed topics
- **Action Items** — follow-up tasks identified
- **Review Workflow** — mark calls as reviewed

### 🔍 Individual Call Analysis
- **AI Summary** — 2-3 sentence call overview
- **Audio Player** — listen to original recording
- **Full Transcript** — complete call transcript
- **Talk Time Split** — agent vs customer balance
- **Overall Score** — 0-10 quality rating
- **Agent Performance** — 5 dimension scoring:
  - Communication Clarity
  - Politeness
  - Business Knowledge
  - Problem Handling
  - Listening Ability
- **Discovery Coverage** — which sales questions
  were asked out of 15 standard questions
- **Keywords** — topics discussed in this call
- **Action Items** — follow-up tasks from call
- **Coaching Insights** — positive and negative
  observations with:
  - Evidence (why it was flagged)
  - Exact quote from transcript
  - Coaching tip for improvement

### 🔐 Secure Access
- Login protected dashboard
- Cookie-based session management
- Automatic redirect to login

---

## 🏗️ Architecture
```
📁 call_recordings/     ← Drop audio files here
        ↓
🐍 FastAPI Backend
        ↓
   ┌────────────────────────────┐
   │   Queue Service            │
   │   Scans folder on startup  │
   │   Polls every 30 seconds   │
   └────────────┬───────────────┘
                ↓
   ┌────────────────────────────┐
   │   Call Processor           │
   │   1. Whisper → Transcript  │
   │   2. GPT-4  → Analysis     │
   │   3. MongoDB → Save        │
   │   4. Stats  → Update       │
   └────────────┬───────────────┘
                ↓
   ┌────────────────────────────┐
   │   MongoDB                  │
   │   5 Collections            │
   └────────────┬───────────────┘
                ↓
⚛️  Next.js 14 Dashboard
```

---

## 📦 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 14 + TypeScript | Dashboard UI |
| **Styling** | Tailwind CSS | Design system |
| **Backend** | Python FastAPI | REST API |
| **Database** | MongoDB + Motor | Data storage |
| **Transcription** | OpenAI Whisper | Audio → Text |
| **Analysis** | OpenAI GPT-4 | Call insights |
| **Icons** | Lucide React | UI icons |
| **Charts** | Recharts | Data viz |
| **Dates** | date-fns | Time formatting |

---

## 🗄️ Database Collections

### `calls`
Main collection storing all call data and 
AI analysis results.

| Field | Type | Description |
|-------|------|-------------|
| file_name | String | Audio file name |
| agent_name | String | Sales agent name |
| customer_name | String | Customer name |
| duration_seconds | Float | Call length |
| transcript | String | Full transcript |
| summary | String | AI summary |
| sentiment | Enum | positive/neutral/negative |
| overall_score | Float | 0-10 quality score |
| talk_time | Object | Agent/customer % split |
| agent_scores | Object | 5 dimension scores |
| keywords | Array | Topics discussed |
| action_items | Array | Follow-up tasks |
| questionnaire_coverage | Array | Questions asked |
| positive_observations | Array | Coaching strengths |
| negative_observations | Array | Coaching improvements |
| review_status | Enum | pending/done |
| status | Enum | pending/processing/completed/failed |

### `dashboard_stats`
Pre-calculated metrics for fast dashboard loading.

### `questionnaire`
15 standard sales discovery questions seeded 
on startup.

### `call_logs`
Stage-by-stage processing logs for every call.

### `processing_queue`
File queue with retry management (max 3 attempts).

---

## 🚀 Setup Instructions

### Prerequisites
```bash
# Required software
Node.js    >= 18.0
Python     >= 3.11
MongoDB    >= 6.0 (running locally)
FFmpeg     (for audio processing)

# Verify installations
node --version
python --version
mongod --version
ffmpeg -version
```

### Step 1 — Clone Repository
```bash
git clone https://github.com/YOUR_USERNAME/
          ai-call-analyst.git
cd ai-call-analyst
```

### Step 2 — Add Audio Files
```bash
# Place your audio files in:
/call_recordings/

# Supported formats:
.mp3  .wav  .m4a  .ogg

# Example:
call_recordings/
├── Call-1.mp3
├── Call-2.wav
└── Call-3.m4a
```

### Step 3 — Backend Setup
```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  
# Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your values:
nano .env
```

### Step 4 — Configure .env
```bash
# backend/.env
OPENAI_API_KEY=your_openai_api_key_here
MONGODB_URI=mongodb://localhost:27017
DB_NAME=call_intelligence
RECORDINGS_PATH=/full/absolute/path/to/call_recordings
```

### Step 5 — Start Backend
```bash
# From backend/ directory
uvicorn main:app --host 0.0.0.0 --port 8003

# You should see:
# ✅ Connected to MongoDB
# ✅ Questionnaire seeded (15 questions)
# ✅ Scanning call_recordings folder...
# ✅ 7 files queued for processing
# ✅ Processing started...
```

### Step 6 — Frontend Setup
```bash
# Open new terminal
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit with your values:
nano .env.local
```

### Step 7 — Configure Frontend .env.local
```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8003
```

### Step 8 — Start Frontend
```bash
# From frontend/ directory
npm run dev

# Open browser:
# http://localhost:3000
```

### Step 9 — Login
```
URL:      http://localhost:3000
Email:    admin@callintelligence.com
Password: Admin@123
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | System health check |
| GET | /api/dashboard/stats | Dashboard statistics |
| GET | /api/calls | All calls list |
| GET | /api/calls/{id} | Single call detail |
| GET | /api/calls/{id}/logs | Processing logs |
| GET | /api/calls/{id}/audio | Serve audio file |
| PATCH | /api/calls/{id}/review | Update review status |
| POST | /api/queue/process | Trigger processing |
| GET | /api/queue/status | Queue status |

### Interactive API Docs
```
http://localhost:8003/docs
```

---

## 🧠 How AI Analysis Works

### Step 1 — Transcription (Whisper)
```
Audio File → OpenAI Whisper API
           → Accurate text transcript
           → Duration in seconds
```

### Step 2 — Analysis (GPT-4)
Single structured prompt extracts everything:
```
Transcript + 15 Sales Questions
        ↓
GPT-4 Analysis
        ↓
{
  agent_name, customer_name,
  summary, sentiment,
  overall_score (0-10),
  talk_time (agent % vs customer %),
  agent_scores (5 dimensions),
  keywords (top topics),
  action_items (follow-ups),
  questionnaire_coverage (which asked),
  positive_observations (with evidence + quotes),
  negative_observations (with coaching tips)
}
```

### Scoring Methodology
```
Communication Clarity  → Was info clear first time?
Politeness            → Was tone respectful throughout?
Business Knowledge    → Could agent answer directly?
Problem Handling      → Were concerns resolved?
Listening Ability     → Did agent address what was asked?

Overall Score Rules:
≥ 8.0  → Excellent Performance  🟢
5-7.9  → Good Performance       🟡
< 5.0  → Needs Improvement      🔴

Adjustments:
Customer satisfied    → keep score
Customer frustrated   → -1.0
Customer threatened   
to leave              → -1.5
Agent suggested 
customer leave        → Problem Handling max 3/10
```

---

## 🎨 Design System
```
Colors:
Green  #10B981 → Good performance
Amber  #F59E0B → Needs attention  
Red    #EF4444 → Critical issues
Blue   #3B82F6 → Neutral/actions
Slate  #1E293B → Dark UI elements

Philosophy:
"A manager should open this dashboard and 
immediately know if their team needs attention.
Color tells the story before reading a word."
```

---

## 📊 Sample Results

From 7 analyzed kitchen cabinet sales calls:
```
Total Calls:        7
Avg Score:          7.1/10
Positive Calls:     4 (57%)
Neutral Calls:      1 (14%)
Negative Calls:     2 (29%)
Avg Duration:       2 min 15 sec
Action Items:       7 total
Top Keywords:       pricing, budget, 
                    materials, installation
```

---

## 🏆 Hackathon Deliverables
```
✅ GitHub Repository
✅ Working Application
✅ README.md (this file)
✅ PROMPT_LOG.md
✅ Tools & Technologies documented
⬜ Demo Video (5-10 minutes)
```

---

## 🗂️ Project Structure
```
ai-call-analyst/
├── call_recordings/          ← Audio files here
│   ├── Call-1.mp3
│   └── Call-2.wav
│
├── backend/                  ← FastAPI
│   ├── main.py
│   ├── routes/
│   │   ├── calls.py
│   │   ├── dashboard.py
│   │   └── queue.py
│   ├── services/
│   │   ├── whisper_service.py
│   │   ├── gpt_service.py
│   │   ├── mongo_service.py
│   │   ├── queue_service.py
│   │   └── logger_service.py
│   ├── processor/
│   │   └── call_processor.py
│   ├── models/
│   │   └── schemas.py
│   ├── questionnaire_seed.json
│   ├── requirements.txt
│   └── .env
│
├── frontend/                 ← Next.js 14
│   ├── app/
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── calls/
│   │       └── [id]/
│   │           └── page.tsx
│   ├── components/
│   │   ├── TeamHealthBar.tsx
│   │   ├── StatsBar.tsx
│   │   ├── CallsTable.tsx
│   │   ├── SentimentChart.tsx
│   │   ├── KeywordsPanel.tsx
│   │   ├── AgentScores.tsx
│   │   ├── AudioPlayer.tsx
│   │   ├── TranscriptView.tsx
│   │   ├── TalkTimeBar.tsx
│   │   ├── ScoreGauge.tsx
│   │   ├── QuestionnaireTable.tsx
│   │   ├── ObservationCard.tsx
│   │   ├── ActionItems.tsx
│   │   └── LogoutButton.tsx
│   ├── lib/
│   │   └── api.ts
│   └── .env.local
│
├── README.md                 ← This file
└── PROMPT_LOG.md             ← AI prompt history
```

---

## 👨‍💻 Built With Vibe Coding

This entire application was built using 
**Vibe Coding** — AI-assisted development where:
```
Developer Role:  Architect + Director
AI Role:         Builder + Implementer

Tools Used:
├── Claude    → Architecture + Strategy
├── Cursor    → Code generation + Debugging  
├── GPT-4     → Call analysis (inside app)
└── Whisper   → Transcription (inside app)

Result: Production-ready app in 4 hours! 🚀
```

---

## 📝 License

Built for CP Prompt-X Hackathon 2026.
Internal use only.

---

*Powered by GPT-4 + Whisper*
*CP Prompt-X: The AI Vibe Coding Hackathon*
*March 20, 2026*