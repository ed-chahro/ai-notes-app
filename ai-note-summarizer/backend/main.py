import os
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from openai import OpenAI

from database import engine, Base, get_db, DB_TYPE, DB_LOCATION, SessionLocal
import models
import schemas

# Load environment variables
load_dotenv()

# Ensure tables are created on startup (in MySQL or SQLite)
Base.metadata.create_all(bind=engine)

# Seed initial notes if newly created and empty
def seed_initial_data_if_empty():
    db = SessionLocal()
    try:
        count = db.query(models.Note).count()
        if count == 0:
            initial_notes = [
                models.Note(
                    title="Internship Project Plan: Notes App",
                    content="Goal is to wire a React frontend with a FastAPI backend and MySQL/SQLite database. Include full CRUD operations (Create, Read, Update, Delete) and an AI Summarize button using free LLM on OpenRouter.",
                    category="Work",
                    ai_summary="Full-stack React, FastAPI, and MySQL notes app with OpenRouter AI summarization."
                ),
                models.Note(
                    title="OpenRouter Free Models & API Setup",
                    content="Sign up on OpenRouter, generate an API key, store it in .env without committing to Git. Use meta-llama/llama-3.1-8b-instruct:free or similar free model for 1-line note summarization.",
                    category="Study",
                    ai_summary="Securely configure OpenRouter API in .env using free LLM models for concise summaries."
                ),
                models.Note(
                    title="Grocery List for Weekend Hackathon",
                    content="Need to pick up cold brew coffee, oat milk, sparkling water, dark chocolate, avocados, and protein snack bars for the study group coding session.",
                    category="Personal",
                    ai_summary="Essential groceries and snacks for weekend hackathon study group."
                )
            ]
            db.add_all(initial_notes)
            db.commit()
    except Exception as e:
        db.rollback()
    finally:
        db.close()

seed_initial_data_if_empty()

app = FastAPI(
    title="Notes App API",
    description="Backend for Intern Project #2: React + FastAPI + MySQL + OpenRouter AI Summarization",
    version="1.0.0"
)

# Configure CORS so frontend can communicate with backend seamlessly
ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000,*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OpenRouter Client Setup (using the OpenAI compatible client as taught in the internship manual)
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")

def get_openrouter_client():
    if not OPENROUTER_API_KEY or OPENROUTER_API_KEY == "your_openrouter_api_key_here":
        return None
    return OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=OPENROUTER_API_KEY,
    )

# -------------------------------------------------------------
# Root & Health Endpoints
# -------------------------------------------------------------
@app.get("/", tags=["Health"])
def root():
    return {
        "status": "online",
        "service": "Notes App Backend API",
        "docs_url": "/docs",
        "intern_project": "Week 4 Final Submission"
    }

@app.get("/health", tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    try:
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    
    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "database": db_status,
        "database_type": DB_TYPE,
        "database_location": DB_LOCATION,
        "openrouter_configured": bool(OPENROUTER_API_KEY and OPENROUTER_API_KEY != "your_openrouter_api_key_here")
    }

# -------------------------------------------------------------
# CRUD Endpoint 1: READ (Get all notes with optional search & filter)
# -------------------------------------------------------------
@app.get("/notes", response_model=List[schemas.NoteResponse], tags=["Notes CRUD"])
def get_notes(
    search: Optional[str] = Query(None, description="Search keyword in title or content"),
    category: Optional[str] = Query(None, description="Filter by category"),
    db: Session = Depends(get_db)
):
    query = db.query(models.Note)
    if category and category.lower() != "all":
        query = query.filter(models.Note.category == category)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (models.Note.title.ilike(search_filter)) | 
            (models.Note.content.ilike(search_filter))
        )
    notes = query.order_by(models.Note.created_at.desc()).all()
    return notes

# -------------------------------------------------------------
# CRUD Endpoint 2: READ (Get single note by ID)
# -------------------------------------------------------------
@app.get("/notes/{note_id}", response_model=schemas.NoteResponse, tags=["Notes CRUD"])
def get_note(note_id: int, db: Session = Depends(get_db)):
    note = db.query(models.Note).filter(models.Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Note with ID {note_id} not found")
    return note

# -------------------------------------------------------------
# CRUD Endpoint 3: CREATE (Add a new note to MySQL)
# -------------------------------------------------------------
@app.post("/notes", response_model=schemas.NoteResponse, status_code=status.HTTP_201_CREATED, tags=["Notes CRUD"])
def create_note(note_data: schemas.NoteCreate, db: Session = Depends(get_db)):
    new_note = models.Note(
        title=note_data.title.strip(),
        content=note_data.content.strip(),
        category=note_data.category or "General",
        ai_summary=note_data.ai_summary
    )
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    return new_note

# -------------------------------------------------------------
# CRUD Endpoint 4: UPDATE (Edit an existing note in MySQL)
# -------------------------------------------------------------
@app.put("/notes/{note_id}", response_model=schemas.NoteResponse, tags=["Notes CRUD"])
def update_note(note_id: int, note_data: schemas.NoteUpdate, db: Session = Depends(get_db)):
    note = db.query(models.Note).filter(models.Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Note with ID {note_id} not found")
    
    if note_data.title is not None:
        note.title = note_data.title.strip()
    if note_data.content is not None:
        note.content = note_data.content.strip()
    if note_data.category is not None:
        note.category = note_data.category
    if note_data.ai_summary is not None:
        note.ai_summary = note_data.ai_summary

    db.commit()
    db.refresh(note)
    return note

# -------------------------------------------------------------
# CRUD Endpoint 5: DELETE (Remove a note from MySQL)
# -------------------------------------------------------------
@app.delete("/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Notes CRUD"])
def delete_note(note_id: int, db: Session = Depends(get_db)):
    note = db.query(models.Note).filter(models.Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Note with ID {note_id} not found")
    
    db.delete(note)
    db.commit()
    return None

# -------------------------------------------------------------
# AI Endpoint: OpenRouter 1-Line Summarize
# -------------------------------------------------------------
@app.post("/ai/summarize", response_model=schemas.SummarizeResponse, tags=["AI Features"])
def summarize_note(request: schemas.SummarizeRequest):
    client = get_openrouter_client()
    if not client:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OPENROUTER_API_KEY is not configured in backend/.env. Please add your free OpenRouter key."
        )
    
    try:
        model = request.model or "meta-llama/llama-3.1-8b-instruct:free"
        prompt = (
            "You are an executive assistant. Summarize the following note into exactly ONE concise, "
            "clear, factual sentence (under 25 words). Do not include quotes, greetings, or prefixes like 'Here is a summary:'.\n\n"
            f"Note text:\n{request.text}"
        )

        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a concise summarizer. You always respond in a single sentence."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=60,
        )

        summary_text = response.choices[0].message.content.strip()
        tokens = getattr(response.usage, "total_tokens", None) if hasattr(response, "usage") else None

        return schemas.SummarizeResponse(
            summary=summary_text,
            model_used=model,
            tokens_used=tokens
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"OpenRouter API error: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
