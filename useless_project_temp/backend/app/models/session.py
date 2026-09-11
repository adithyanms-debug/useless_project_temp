from pydantic import BaseModel, Field
from typing import List, Optional

class ChatRequest(BaseModel):
    message: str = Field(..., description="User voice or text prompt")
    session_id: Optional[str] = Field(default="default_session", description="Session identifier")
    mode: Optional[str] = Field(default="normal", description="Mode: normal, relationship, why, sure, random")
    why_count: Optional[int] = Field(default=0, description="Counter for consecutive WHY? clicks")

class ChatResponse(BaseModel):
    reply_text: str = Field(..., description="MANDI sarcastic code-switching reply")
    uselessness_pct: int = Field(..., description="Uselessness score percentage 0-100")
    mood: str = Field(..., description="Current Mandi mood")
    meme_reference: Optional[str] = Field(default=None, description="Meme phrase if applicable")
    audio_base64: Optional[str] = Field(default=None, description="Optional audio response data")

class TranslationRequest(BaseModel):
    text: str = Field(..., description="Text to translate")
    target_language: str = Field(default="ml", description="Language code e.g. ml, hi, en")

class TranslationResponse(BaseModel):
    original_text: str
    translated_text: str
    target_language: str
    provider: str
