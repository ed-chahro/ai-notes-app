# FastAPI Notes Backend

Backend API for Intern Project #2: React + FastAPI + MySQL (with SQLite Fallback) + OpenRouter AI.

## Quick Start (Zero-Setup Mode with SQLite)
```bash
# 1. Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Create .env
cp .env.example .env

# 4. Run the server! (Automatically creates and uses local notes.db SQLite file)
uvicorn main:app --reload --port 8000
```

- Interactive Swagger Docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health` (shows whether connected to MySQL or SQLite fallback)

If you have a MySQL server running, set `MYSQL_PASSWORD=your_password` in `.env` and it will automatically connect to MySQL instead.
