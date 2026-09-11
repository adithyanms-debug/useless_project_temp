import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import Response
from app.models.session import ChatRequest, ChatResponse
from app.services.gemini import gemini_service
from app.services.tts import sarvam_tts

logger = logging.getLogger("mandi.voice")
router = APIRouter()

@router.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    HTTP endpoint for sending voice transcripts or text prompts to MANDI.
    Automatically generates Sarvam AI TTS audio if available.
    """
    try:
        response_data = await gemini_service.generate_mandi_response(
            message=request.message,
            mode=request.mode,
            why_count=request.why_count
        )

        # Generate natural voice audio via Sarvam Bulbul TTS (prefer native Malayalam script tts_text for authentic accent)
        tts_input = response_data.get("tts_text") or response_data["reply_text"]
        audio_b64 = await sarvam_tts.generate_speech_base64(tts_input)
        if audio_b64:
            response_data["audio_base64"] = audio_b64

        return ChatResponse(**response_data)
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail="Mandi had a brain short-circuit da!")

@router.post("/api/tts")
async def tts_endpoint(text: str = "", language_code: str = "ml-IN"):
    """
    Standalone TTS endpoint — returns WAV audio bytes directly.
    """
    if not text.strip():
        raise HTTPException(status_code=400, detail="No text provided da!")

    audio_bytes = await sarvam_tts.generate_speech(text, language_code=language_code)
    if audio_bytes:
        return Response(content=audio_bytes, media_type="audio/wav")
    else:
        raise HTTPException(status_code=503, detail="TTS service unavailable. Check SARVAM_API_KEY.")

@router.websocket("/ws/voice")
async def voice_websocket(websocket: WebSocket):
    """
    Real-time WebSocket endpoint for streaming voice/text interaction with MANDI.
    """
    await websocket.accept()
    logger.info("WebSocket voice connection established.")
    try:
        while True:
            raw_data = await websocket.receive_text()
            try:
                data = json.loads(raw_data)
                user_msg = data.get("message", "")
                mode = data.get("mode", "normal")
                why_count = data.get("why_count", 0)

                # Send THINKING status update
                await websocket.send_text(json.dumps({
                    "type": "status",
                    "status": "THINKING"
                }))

                # Generate Mandi's sarcastic answer
                mandi_res = await gemini_service.generate_mandi_response(
                    message=user_msg,
                    mode=mode,
                    why_count=why_count
                )

                # Generate Sarvam TTS audio (prefer native Malayalam script tts_text for authentic accent)
                tts_input = mandi_res.get("tts_text") or mandi_res["reply_text"]
                audio_b64 = await sarvam_tts.generate_speech_base64(tts_input)
                if audio_b64:
                    mandi_res["audio_base64"] = audio_b64

                # Send SPEAKING status and payload
                await websocket.send_text(json.dumps({
                    "type": "response",
                    "status": "SPEAKING",
                    "payload": mandi_res
                }))

            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "Invalid JSON payload da!"
                }))
    except WebSocketDisconnect:
        logger.info("WebSocket voice client disconnected.")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
