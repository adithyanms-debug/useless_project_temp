from fastapi import APIRouter, HTTPException
from app.models.session import TranslationRequest, TranslationResponse
from app.services.translation import translation_service

router = APIRouter()

@router.post("/api/translate", response_model=TranslationResponse)
async def translate_endpoint(request: TranslationRequest):
    """
    Dedicated translation endpoint using Google Cloud Translation API / Mandi Fallback.
    """
    try:
        result = await translation_service.translate_text(
            text=request.text,
            target_lang=request.target_language
        )
        return TranslationResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation failed da: {str(e)}")
