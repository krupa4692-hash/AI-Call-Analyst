# 📋 Prompt Log — AI Call Intelligence Platform
**Hackathon:** CP Prompt-X: The AI Vibe Coding Hackathon
**Date:** 20th March 2026
**Venue:** CP House, Ahmedabad
**Developer:** [Your Name]
**Duration:** 4-Hour AI Coding Sprint

---

## 🧠 Vibe Coding Methodology

This document captures the complete AI interaction 
strategy used to build the AI Call Intelligence 
Platform from scratch in under 4 hours.

### What is Vibe Coding?
Vibe Coding is a development approach where the 
developer acts as the ARCHITECT and AI acts as the 
BUILDER. The developer's skill lies in:
- Knowing WHAT to build (vision)
- Knowing HOW to prompt (precision)
- Knowing WHEN to intervene (judgment)
- Knowing HOW to debug (expertise)

### My AI Stack
| Tool | Role |
|------|------|
| Claude (Anthropic) | Architecture mentor, 
                       database design, 
                       strategy guidance |
| Cursor IDE | Primary vibe coding tool —
               Plan, Ask, Agent, Debug modes |
| OpenAI GPT-4 | Inside the app — 
                 call analysis engine |
| OpenAI Whisper | Inside the app — 
                   audio transcription |
| ChatGPT | Quick debugging reference |

---

## 🏗️ Phase 1: Architecture & Planning

### Prompt #1 — Requirements Analysis
**Time:** 9:00 AM
**Tool:** Claude (Anthropic)
**Mode:** Conversation
**Prompt:**
```
I have an AI Hackathon today. The requirement is to 
build an AI Call Intelligence Platform that:
- Reads audio call recordings from a folder
- Transcribes them using OpenAI Whisper
- Analyzes them using GPT-4
- Shows insights on a dashboard

Tech Stack: Next.js 14 + FastAPI + MongoDB + OpenAI
Guide me step by step.
```
**AI Response Summary:**
Claude analyzed requirements, suggested complete 
architecture, identified MongoDB as perfect fit for 
nested JSON analysis data, recommended processing 
pipeline approach.

**Key Decision Made:**
No file upload — pre-saved recordings folder approach.
This simplified the architecture significantly.

**Result:** ✅ Clear project vision established

---

### Prompt #2 — Database Architecture Design
**Time:** 9:05 AM
**Tool:** Claude (Anthropic)
**Mode:** Conversation
**Prompt:**
```
Let's design the MongoDB collections for this system.
I need to store:
- Call recordings metadata
- AI analysis results
- Processing queue
- Logging for each stage
- Dashboard statistics
- Questionnaire questions

What collections do you recommend and what fields
should each have?
```
**AI Response Summary:**
Claude designed 5 collections with complete field 
schemas:
1. calls — main data store
2. dashboard_stats — pre-calculated metrics
3. questionnaire — discovery questions
4. call_logs — stage by stage logging
5. processing_queue — file management

**Key Decision Made:**
Added agent_name + customer_name extraction via GPT-4.
"Not Found" fallback if names not in transcript.
Added review_status field for manager workflow.

**Result:** ✅ Complete MongoDB schema finalized

---

### Prompt #3 — Cursor Plan Mode
**Time:** 9:15 AM
**Tool:** Cursor IDE
**Mode:** PLAN MODE
**Prompt:**
```
I am building an AI-powered Call Intelligence Platform.

Tech Stack (fixed):
- Frontend: Next.js 14 + Tailwind CSS
- Backend: Python FastAPI
- Database: MongoDB
- AI: OpenAI Whisper + GPT-4
- No file upload — audio files pre-saved 
  in /call_recordings/

MongoDB Collections designed:
[full schema pasted here]

Give me:
1. Complete folder structure
2. Every file with one line description
3. All dependencies for requirements.txt
4. All npm packages needed
5. Top 3 risks in this build
6. Suggested build order
Do NOT write any code yet. Plan only.
```
**AI Response Summary:**
Cursor generated complete project blueprint:
- 13 backend files mapped
- 18 frontend files mapped
- Full dependency list
- Build order: schemas → services → 
  routes → frontend
- Top 3 risks identified:
  1. OpenAI rate limits + cost
  2. Queue consistency
  3. Dashboard stats sync

**Result:** ✅ Complete architecture blueprint ready

---

### Prompt #4 — Risk Assessment
**Time:** 9:20 AM
**Tool:** Cursor IDE
**Mode:** ASK MODE
**Prompt:**
```
Based on the plan above answer these:
1. Simplest way to handle Whisper for 5-10 min 
   files without timeout?
2. Folder scanner: once on startup or poll?
3. One big GPT-4 prompt or separate prompts?
4. How to avoid re-processing existing files?
5. fetch() or axios for Next.js API calls?
6. Fastest way to seed questionnaire on startup?
7. What to cut if running out of time?
```
**AI Response Summary:**
- Whisper: background worker + 600s timeout
- Scanner: startup + 30 second polling
- GPT-4: ONE structured JSON prompt (faster + cheaper)
- Dedup: unique index on file_path in MongoDB
- Frontend: fetch() with typed wrapper
- Seed: insert_many on startup if collection empty
- Cut: charts → numbers, skip call_logs UI

**Key Prompt Engineering Learning:**
Ask mode is perfect for de-risking before building.
It saved at least 1 hour of potential mistakes.

**Result:** ✅ All risks addressed before coding

---

## ⚙️ Phase 2: Backend Development

### Prompt #5 — Complete Backend Generation
**Time:** 9:30 AM
**Tool:** Cursor IDE
**Mode:** AGENT MODE
**Prompt Strategy:**
Single comprehensive prompt covering all 14 backend 
files in exact build order. Key prompt engineering 
techniques used:

1. SPECIFICITY: Named every file explicitly
2. SCHEMA FIRST: Provided exact MongoDB field names
3. ORDER MATTERS: Told Cursor exact sequence to build
4. NO PLACEHOLDERS: Explicitly stated "no TODOs"
5. ERROR HANDLING: Required try/except everywhere
6. LOGGING: Required log_stage() at every step

**Sample from Prompt:**
```
STEP 7 — backend/services/whisper_service.py
- Async function: transcribe_audio(file_path, call_id)
- Validate file exists and size < 25MB
- Create OpenAI client with timeout=600 seconds
- Call openai.audio.transcriptions.create
  model="whisper-1", response_format="verbose_json"
- Log stages: transcription_started, 
  transcription_completed or transcription_failed
- Return dict: {transcript: str, duration_seconds: float}
- Handle all OpenAI errors gracefully
```
**Files Generated:**
✅ models/schemas.py
✅ services/mongo_service.py
✅ services/logger_service.py
✅ services/whisper_service.py
✅ services/gpt_service.py
✅ services/queue_service.py
✅ processor/call_processor.py
✅ routes/calls.py
✅ routes/dashboard.py
✅ routes/queue.py
✅ main.py
✅ requirements.txt
✅ .env (template)
✅ questionnaire_seed.json

**Result:** ✅ Complete backend generated in ~4 minutes

---

### Prompt #6 — GPT-4 Analysis Prompt Engineering
**Time:** 9:35 AM (inside gpt_service.py)
**Tool:** Cursor IDE + OpenAI GPT-4
**Mode:** AGENT MODE
**This was the most critical prompt of the project.**

The system prompt engineered for GPT-4 to analyze 
sales calls:
```
SYSTEM:
You are an expert sales call analyzer specializing 
in kitchen cabinet sales. Analyze the provided 
transcript and return ONLY valid JSON.

STRICT SCORING RULES:
- Score based on ACTUAL conversation behavior
- Negative sentiment calls rarely score above 6.0
- If agent told customer to go elsewhere → 
  Problem Handling max 3/10
- If customer left frustrated → Overall max 5/10
- Be tough but fair — never inflate scores

AGENT NAME EXTRACTION:
- Identify agent from: greetings, self-introduction,
  company references
- Identify customer from: caller questions, 
  name mentions
- Default: "Not Found" if unclear

OBSERVATION FORMAT:
Each observation must include:
- observation: what happened
- evidence: why this was flagged
- quote: exact words from transcript
- coaching_tip: specific improvement advice

Return this exact JSON structure:
{
  "agent_name": "...",
  "customer_name": "...",
  "summary": "...",
  "sentiment": "positive|neutral|negative",
  "overall_score": 0.0,
  "talk_time": {
    "agent_percent": 0,
    "customer_percent": 0
  },
  "agent_scores": {
    "communication_clarity": 0,
    "politeness": 0,
    "business_knowledge": 0,
    "problem_handling": 0,
    "listening_ability": 0
  },
  "keywords": [],
  "action_items": [],
  "questionnaire_coverage": [],
  "positive_observations": [
    {
      "observation": "",
      "evidence": "",
      "quote": "",
      "coaching_tip": ""
    }
  ],
  "negative_observations": [
    {
      "observation": "",
      "evidence": "",
      "quote": "",
      "coaching_tip": ""
    }
  ]
}
```
**Prompt Engineering Techniques:**
1. Role assignment: "expert sales call analyzer"
2. Domain specificity: "kitchen cabinet sales"
3. Strict output format: "ONLY valid JSON"
4. Scoring rules: explicit thresholds
5. Evidence requirement: quotes from transcript
6. Coaching focus: actionable improvement tips

**Result:** ✅ Consistent, structured, high quality 
             analysis across all 7 calls

---

### Prompt #7 — Debug: Path Configuration
**Time:** 9:55 AM
**Tool:** Cursor IDE
**Mode:** DEBUG MODE
**Issue:** Audio files not being detected by scanner
**Prompt:**
```
My folder scanner is not picking up audio files.
Backend is at: /var/www/html/python/AI-Call-Analyst/backend
Recordings at: /var/www/html/python/AI-Call-Analyst/
               call_recordings/

Current .env:
RECORDINGS_PATH=./call_recordings

Error: No files found in queue after startup.

Fix the path issue and explain why.
```
**Root Cause:** Relative path ./call_recordings 
resolves to backend/call_recordings not project root.

**Fix:** Use absolute path:
RECORDINGS_PATH=/var/www/html/python/
               AI-Call-Analyst/call_recordings

**Result:** ✅ All 7 files detected and queued

---

### Prompt #8 — Quality Improvement: Scoring Rules
**Time:** 10:15 AM
**Tool:** Cursor IDE
**Mode:** AGENT MODE
**Issue:** GPT-4 giving inflated scores on bad calls
**Example:** Call-7 (customer threatened to leave) 
             scored 7.5/10 — clearly wrong!

**Prompt:**
```
GPT-4 is being too generous with scores.
Example: Call where customer threatened to leave,
agent said "you're free to choose another company"
was scored:
- Politeness: 9/10 ← WAY too high
- Problem Handling: 8/10 ← Way too high  
- Overall: 7.5 ← Too generous

Add these strict scoring rules to system prompt:
1. Negative sentiment → max overall 6.0
2. Agent suggests customer leave → 
   Problem Handling max 3/10
3. Customer repeats question 3+ times → 
   deduct 2 points from clarity
4. Customer frustrated at end →
   subtract 1.5 from final score

Also improve observations to include:
- evidence (why flagged)
- quote (exact transcript moment)
- coaching_tip (how to improve)
```
**Result:** ✅ Scores now realistic and fair
            Call-7 correctly scored 3.4/10

---

## 🎨 Phase 3: Frontend Development

### Prompt #9 — Complete Frontend Generation
**Time:** 10:45 AM
**Tool:** Cursor IDE
**Mode:** AGENT MODE
**Design Philosophy Prompt:**
```
Design Philosophy:
"A manager should open this dashboard and immediately 
know if their team needs attention. Color tells the 
story before reading a word."

Color System:
GREEN  #10B981 → Good (score 8-10, positive)
AMBER  #F59E0B → Warning (score 5-7, neutral)
RED    #EF4444 → Critical (score 0-4, negative)

Key component: TeamHealthBar
Shows instant team health status:
GREEN  → "Team Performance: Excellent"
AMBER  → "Team Performance: Needs Attention"  
RED    → "Team Performance: Critical"
```
**Prompt Engineering Technique:**
Provided complete data structures with real example
data so Cursor knew exactly what to render.

**Files Generated:**
✅ lib/api.ts
✅ app/globals.css
✅ app/layout.tsx
✅ app/page.tsx
✅ app/calls/[id]/page.tsx
✅ components/StatsBar.tsx
✅ components/TeamHealthBar.tsx
✅ components/SentimentChart.tsx
✅ components/KeywordsPanel.tsx
✅ components/CallsTable.tsx
✅ components/AudioPlayer.tsx
✅ components/TranscriptView.tsx
✅ components/TalkTimeBar.tsx
✅ components/ScoreGauge.tsx
✅ components/AgentScores.tsx
✅ components/QuestionnaireTable.tsx
✅ components/ObservationCard.tsx
✅ components/ActionItems.tsx

**Result:** ✅ Complete frontend in ~5 minutes

---

### Prompt #10 — UI Polish & Design Improvement
**Time:** 11:30 AM
**Tool:** Cursor IDE
**Mode:** AGENT MODE
**Prompt Strategy:**
Specific component-by-component redesign instructions.
Referenced real design systems for inspiration.
```
Design Inspiration: 
Linear.app + Vercel Dashboard + Stripe Dashboard

Key improvements needed:
1. Cards: add depth, hover lift effect
2. TeamHealthBar: gradient backgrounds per state
3. Sentiment bars: animated fill on load
4. Keywords: size/color by frequency
5. Table: professional spacing, pill badges
6. Navbar: dark gray (#1E293B) professional look
```
**Result:** ✅ Premium analytics dashboard look

---

### Prompt #11 — Review System Feature
**Time:** 12:00 PM
**Tool:** Cursor IDE
**Mode:** AGENT MODE
**Business Logic Prompt:**
```
Add manager review workflow:
- Each call gets review_status: pending | done
- Calls table shows dropdown per call
- Manager marks negative calls as reviewed
- TeamHealthBar counts ONLY pending negative calls
  (not total negative calls)
- When all negative calls reviewed → banner turns GREEN
```
**Prompt Engineering Technique:**
Described the USER JOURNEY not just the technical spec.
This gave Cursor better context for the right UX.

**Result:** ✅ Complete review workflow implemented

---

## 🔍 Phase 4: Quality Assurance

### Prompt #12 — Data Quality Verification
**Time:** 11:00 AM
**Tool:** Claude (Anthropic) — New Tab
**Mode:** Quality Analysis
**Prompt:**
```
Act as a Quality Analyst for an AI Call Intelligence 
Platform. Review each call's analysis data and tell me:

1. Are scores realistic and fair?
2. Is sentiment label correct?
3. Do observations have proper evidence + quotes?
4. Is talk time split realistic?
5. Are names correctly identified?

For each call give me:
✅ What is correct
⚠️ What needs improvement  
❌ What is wrong
💡 Suggested correction
```
**Result:** ✅ Identified scoring inflation issues
            ✅ Fixed GPT prompt accordingly
            ✅ All 7 calls reprocessed with better data

---

## 📊 Final Results

### Application Metrics
```
Audio Files Processed:    7 calls
Processing Time:          ~2 min per call
Average Call Score:       7.1/10
Sentiment Split:
  Positive:               4 calls (57%)
  Neutral:                1 call  (14%)
  Negative:               2 calls (29%)
Total Action Items:       7 items
Top Keywords:             pricing, budget, 
                          materials, installation
```

### Technical Metrics
```
Backend Files:            14 files
Frontend Files:           18 files
API Endpoints:            8 endpoints
MongoDB Collections:      5 collections
Total Prompts Used:       12 major prompts
Lines of Code:            ~2,500 lines
Time to Build:            4 hours
```

---

## 🎓 Key Prompt Engineering Learnings

### Learning 1 — Plan Before You Build
```
Always use Plan Mode first.
A 5 minute planning prompt saves 1 hour of rework.
The build order matters more than the code itself.
```

### Learning 2 — Be Specific With File Names
```
❌ Bad:  "Build the backend services"
✅ Good: "Build backend/services/whisper_service.py
          with these exact functions..."

Specific prompts = specific output = less debugging
```

### Learning 3 — Provide Real Data Structures
```
When building frontend, paste ACTUAL MongoDB data.
Cursor renders exactly what you show it.
Never say "some data" — show the real shape.
```

### Learning 4 — Describe User Journey Not Just Code
```
❌ Bad:  "Add a dropdown with pending and done values"
✅ Good: "Manager opens dashboard, sees negative call,
          clicks dropdown, marks as reviewed, 
          banner updates to reflect new count"

Story context = better UX decisions by AI
```

### Learning 5 — Use Ask Mode to De-risk
```
Before any complex feature:
Ask mode → "What are the 3 biggest risks here?"
This consistently saved time and prevented mistakes.
```

### Learning 6 — Iterate on AI Prompts Like Code
```
GPT-4 gave inflated scores in v1.
Added strict scoring rules → much better in v2.
Treat your AI prompts as code — test and refine them.
```

### Learning 7 — Debug With Full Context
```
❌ Bad:  "It's not working"
✅ Good: "File path: X, Error: Y, 
          Expected: Z, Actual: W"

Full context = faster fixes = more time to build
```

---

## 🛠️ Tools & Technologies Used

### Development Tools
| Tool | Version | Purpose |
|------|---------|---------|
| Cursor IDE | Latest | Primary vibe coding |
| Claude (Anthropic) | Sonnet | Architecture + guidance |
| ChatGPT | GPT-4 | Quick references |

### Tech Stack
| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 14 | Frontend framework |
| React | 18 | UI library |
| TypeScript | 5 | Type safety |
| Tailwind CSS | 3 | Styling |
| Python | 3.11 | Backend language |
| FastAPI | 0.104 | API framework |
| MongoDB | 7.0 | Database |
| Motor | 3.3 | Async MongoDB driver |
| OpenAI Whisper | whisper-1 | Audio transcription |
| OpenAI GPT-4 | gpt-4 | Call analysis |
| Lucide React | Latest | Icons |
| Recharts | Latest | Charts |
| date-fns | Latest | Date formatting |

---

## 📁 Deliverables Checklist
```
✅ GitHub Repository with complete code
✅ Prompt Log Document (this document)
✅ Tools & Technologies list
✅ Working application
✅ README.md with setup instructions
⬜ 5-10 minute demo video
```

---

*Built with Vibe Coding methodology*
*CP Prompt-X Hackathon — March 20, 2026*
*"The best code is the code you didn't have to write"*
```

---

## Save This As
```
AI-Call-Analyst/PROMPT_LOG.md