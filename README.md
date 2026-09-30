# Notes AI — Full-Stack React + FastAPI + MySQL Notes App with OpenRouter AI

> **Intern Training Final Project (Week 4)**  
> **Student:** Full-Stack AI Intern  
> **Stack:** React 19 (Vite + Tailwind CSS) · FastAPI (Python 3.11+) · MySQL 8.0 · OpenRouter AI (Free LLaMA-3.1)

---

## 🚀 Project Overview

This project is the culmination of the 4-week Intern Training Roadmap. It connects a modern React frontend with a high-performance FastAPI backend backed by a MySQL database for persistent storage, featuring an integrated AI capability that summarizes notes in one sentence via OpenRouter's free LLMs.

### Key Highlights
- **Full CRUD Workflow:** Create, read, update, and delete notes stored relationally in MySQL.
- **AI One-Line Summarizer:** One-click AI summarization using OpenRouter's `meta-llama/llama-3.1-8b-instruct:free` model with zero latency bottlenecks and instant UI reflection.
- **CORS & Routing Resolved:** Configured FastAPI `CORSMiddleware` with explicit origins and headers, eliminating cross-origin blocked requests.
- **Interactive Architecture & SQL Hub:** In-app inspection of MySQL tables, live queries, OpenAPI / Swagger interactive runner, and raw schema viewer.
- **Anti-AI-Slop Frontend:** Built according to modern design principles with zero-pill typography, clean hierarchy, quick search, and category filtering.

---

## 🛠 Tech Stack & Architecture

```
┌─────────────────────────────────┐
│        React Frontend           │
│   (Vite + Tailwind CSS + UI)    │
└────────────────┬────────────────┘
                 │ HTTP / REST (JSON)
                 │ CORS Enabled
┌────────────────▼────────────────┐
│        FastAPI Backend          │
│   (Python 3.11+ / SQLAlchemy)   │
└────────┬───────────────┬────────┘
         │               │
         ▼               ▼
┌────────────────┐ ┌─────────────────────────┐
│  MySQL Database│ │ OpenRouter AI API       │
│  (InnoDB Table)│ │ (Llama-3.1-8b Free LLM) │
└────────────────┘ └─────────────────────────┘
```

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Tailwind CSS, Lucide | Responsive UI, state management, search, filters, CRUD modals |
| **Backend** | FastAPI, Pydantic v2, SQLAlchemy, Uvicorn | High-speed REST API endpoints, input validation, DB ORM |
| **Database** | MySQL 8.0 (InnoDB) / SQLite fallback | Persistent relational storage for notes, timestamps, categories |
| **AI Integration** | OpenRouter API (`meta-llama/llama-3.1-8b-instruct:free`) | Generates concise, single-sentence note summaries |

---

## 📋 REST API Endpoints

| Method | Endpoint | Description | Request Body | Status Code |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/notes` | List all notes (supports `?search=` and `?category=`) | None | `200 OK` |
| `GET` | `/notes/{id}` | Retrieve a single note by ID | None | `200 OK` |
| `POST` | `/notes` | Create a new note in MySQL | `{"title", "content", "category", "ai_summary"}` | `201 Created` |
| `PUT` | `/notes/{id}` | Update an existing note | `{"title", "content", "category", "ai_summary"}` | `200 OK` |
| `DELETE` | `/notes/{id}` | Delete a note from MySQL | None | `204 No Content` |
| `POST` | `/ai/summarize` | Generate 1-sentence AI summary via OpenRouter | `{"text": "...", "model": "..."}` | `200 OK` |
| `GET` | `/health` | Health check & DB connectivity status | None | `200 OK` |

Interactive Swagger documentation is automatically available at `http://localhost:8000/docs`.

---

## 🗄 Database Schema (MySQL)

```sql
CREATE DATABASE IF NOT EXISTS notes_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE notes_db;

CREATE TABLE notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'General',
    ai_summary TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_created_at (created_at DESC),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## ⚙️ Local Setup Guide

### 1. Prerequisites
- **Python 3.11+**
- **Node.js (v18+) & npm**
- **Git**
- **MySQL Server 8.0+** *(Optional — the backend includes an automated SQLite fallback if you don't have MySQL installed!)*
- Free **OpenRouter** API key from [openrouter.ai/keys](https://openrouter.ai/keys)

---

### 2. Database Setup (Choose Option A or B)

#### Option A: Zero-Setup SQLite (Recommended if you don't have MySQL)
You don't need to install or configure anything!
- The backend automatically detects that MySQL is absent and creates a local `notes.db` SQLite database file.
- Or set `USE_SQLITE_FALLBACK=true` in `backend/.env`.
- All CRUD endpoints and ORM models work identically.

#### Option B: Real MySQL Server (Optional)
1. Start your local MySQL service (via MySQL Workbench, terminal, or Docker).
2. Open terminal and run the schema setup:
```bash
mysql -u root -p < backend/schema.sql
```
*(Enter your MySQL root password when prompted)*.

---

### 3. Backend Setup (FastAPI)
1. Navigate to the backend directory:
```bash
cd backend
```
2. Create and activate a Python virtual environment:
```bash
# macOS/Linux:
python3 -m venv venv
source venv/bin/activate

# Windows:
python -m venv venv
venv\Scripts\activate
```
3. Install required Python packages:
```bash
pip install -r requirements.txt
```
4. Configure environment variables:
```bash
cp .env.example .env
```
Edit `.env` (leave `USE_SQLITE_FALLBACK=true` if using SQLite, or fill in your MySQL password).
5. Launch the FastAPI server:
```bash
uvicorn main:app --reload --port 8000
```
API will run at `http://localhost:8000` with interactive docs at `http://localhost:8000/docs`.

---

### 4. Frontend Setup (React)
1. Open a new terminal tab and install dependencies:
```bash
npm install
```
2. Launch the Vite development server:
```bash
npm run dev
```
Open `http://localhost:3000` (or `http://localhost:5173`) in your browser.

---

## 🛡 How CORS & Routing Were Resolved

1. **CORS Headers in FastAPI:**  
   In `backend/main.py`, FastAPI's `CORSMiddleware` was added with explicit support for frontend origins:
   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```
2. **Proxy Routing in Vite:**  
   In `vite.config.ts`, requests to `/api` are routed seamlessly to `http://localhost:8000`, bypassing browser preflight issues and keeping frontend code clean without hardcoded localhost URLs.

---

## 🤖 OpenRouter AI Summarization Workflow

1. In the frontend note editor or note card, the user clicks **"AI Summarize"**.
2. A request is sent to `POST /ai/summarize` with `{ "text": note.content }`.
3. FastAPI invokes OpenRouter's OpenAI-compatible API endpoint using model `meta-llama/llama-3.1-8b-instruct:free`.
4. Prompt engineering enforces a strict one-line constraint:
   > *"Summarize the following note into exactly ONE concise, clear, factual sentence (under 25 words). Do not include quotes, greetings, or prefixes."*
5. The summary is returned to the React UI, displayed in an amber banner, and automatically saved into MySQL with the note.

---

## 📦 Git & GitHub Submission Steps

To submit the repository to GitHub as required in Week 4:

```bash
# 1. Initialize git repository
git init

# 2. Ensure sensitive files (.env, venv, node_modules) are ignored
cat << 'EOF' > .gitignore
.env
*.env
__pycache__/
*.pyc
venv/
node_modules/
dist/
.DS_Store
EOF

# 3. Stage all project files
git add .

# 4. Commit initial project
git commit -m "feat: complete Full-Stack Notes App with FastAPI, MySQL, React, and OpenRouter AI"

# 5. Link to your GitHub repository and push
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/notes-ai-fastapi-react.git
git push -u origin main
```

---

## 🎓 Internship Checklist Verification

- [x] **FastAPI CRUD Endpoints:** All 4 endpoints (`GET`, `POST`, `PUT`, `DELETE`) fully working.
- [x] **MySQL Persistence:** Notes, categories, timestamps, and AI summaries persisted relationally.
- [x] **OpenRouter AI Endpoint:** Free LLM integration with reliable one-sentence summarization.
- [x] **API Key Security:** Key kept strictly in `.env` and excluded from Git commits via `.gitignore`.
- [x] **React Frontend:** Clean, responsive UI with zero-pill typography, instant search, and real-time state sync.
- [x] **README.md:** Full setup instructions, architectural diagram, and submission workflow.
