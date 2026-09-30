from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class NoteBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Title of the note")
    content: str = Field(..., min_length=1, description="Main body content of the note")
    category: Optional[str] = Field("General", max_length=50, description="Category or tag")
    ai_summary: Optional[str] = Field(None, description="One-line AI generated summary")

class NoteCreate(NoteBase):
    pass

class NoteUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    content: Optional[str] = Field(None, min_length=1)
    category: Optional[str] = Field(None, max_length=50)
    ai_summary: Optional[str] = Field(None)

class NoteResponse(NoteBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SummarizeRequest(BaseModel):
    text: str = Field(..., min_length=5, description="The note content to summarize in one line")
    model: Optional[str] = Field(
        "meta-llama/llama-3.1-8b-instruct:free",
        description="OpenRouter model identifier"
    )

class SummarizeResponse(BaseModel):
    summary: str
    model_used: str
    tokens_used: Optional[int] = None
