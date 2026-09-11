from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routes import health, voice, translation

app = FastAPI(
    title="MANDI — The Useless AI Voice Friend Backend",
    description="Sarcastic, chaotic, multilingual AI voice companion server",
    version="1.0.0"
)

# CORS Middleware
origins = [
    settings.FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(health.router)
app.include_router(voice.router)
app.include_router(translation.router)

@app.get("/")
def root():
    return {
        "message": "Welcome to MANDI — The Useless AI Voice Friend Backend! 🤡",
        "health_check": "/health",
        "voice_ws": "/ws/voice",
        "chat_api": "/api/chat",
        "translate_api": "/api/translate"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
