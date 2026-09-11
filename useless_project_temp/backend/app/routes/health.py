from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "mandi-backend",
        "version": "1.0.0",
        "character": "🤡 MANDI — The Useless AI Voice Friend"
    }
