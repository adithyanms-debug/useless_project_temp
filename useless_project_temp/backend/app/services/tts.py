import logging
import httpx
import base64
from app.config import settings

logger = logging.getLogger("mandi.tts")

class SarvamTTSService:
    """
    Sarvam AI Bulbul v3 Text-to-Speech service.
    Generates natural-sounding Indian language voice audio.
    """

    def __init__(self):
        self.api_key = settings.SARVAM_API_KEY
        self.endpoint = "https://api.sarvam.ai/text-to-speech"
        self.model = "bulbul:v3"
        # Malayalam speaker for MANDI (bulbul:v3 voice)
        self.default_speaker = "kavya"
        self.default_lang = "ml-IN"

    async def generate_speech(
        self,
        text: str,
        language_code: str = None,
        speaker: str = None,
        pace: float = 1.05
    ) -> bytes | None:
        """
        Convert text to natural-sounding audio using Sarvam Bulbul v3.
        Returns raw WAV audio bytes, or None on failure.
        """
        if not self.api_key:
            logger.warning("Sarvam API key not configured — TTS disabled.")
            return None

        lang = language_code or self._detect_language(text)
        spkr = speaker or self._pick_speaker(lang)

        payload = {
            "text": text[:2400],  # Bulbul v3 limit is 2500 chars
            "language_code": lang,
            "speaker": spkr,
            "model": self.model,
            "pace": pace,
            "sample_rate": 24000
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(
                    self.endpoint,
                    json=payload,
                    headers={
                        "api-subscription-key": self.api_key,
                        "Content-Type": "application/json"
                    }
                )

                if resp.status_code == 200:
                    data = resp.json()
                    audio_b64 = data.get("audios", [None])[0]
                    if audio_b64:
                        audio_bytes = base64.b64decode(audio_b64)
                        logger.info(f"Sarvam TTS generated {len(audio_bytes)} bytes for lang={lang}, speaker={spkr}")
                        return audio_bytes
                else:
                    logger.error(f"Sarvam TTS error {resp.status_code}: {resp.text}")

        except Exception as e:
            logger.error(f"Sarvam TTS request failed: {e}")

        return None

    async def generate_speech_base64(self, text: str, **kwargs) -> str | None:
        """
        Same as generate_speech but returns base64-encoded string
        ready for JSON transport to the frontend.
        """
        audio_bytes = await self.generate_speech(text, **kwargs)
        if audio_bytes:
            return base64.b64encode(audio_bytes).decode("utf-8")
        return None

    def _detect_language(self, text: str) -> str:
        """Simple heuristic to detect dominant language in mixed text."""
        # Malayalam Unicode block: U+0D00–U+0D7F
        ml_chars = sum(1 for c in text if '\u0D00' <= c <= '\u0D7F')
        # Hindi/Devanagari block: U+0900–U+097F
        hi_chars = sum(1 for c in text if '\u0900' <= c <= '\u097F')

        if ml_chars > hi_chars and ml_chars > 3:
            return "ml-IN"
        elif hi_chars > 3:
            return "hi-IN"
        else:
            # Default: Malayalam for MANDI's character
            return "ml-IN"

    def _pick_speaker(self, lang: str) -> str:
        """Pick a valid speaker for Sarvam bulbul:v3 model."""
        speakers = {
            "ml-IN": "kavya",     # Malayalam female (or 'gokul' for male)
            "hi-IN": "shreya",    # Hindi female
            "en-IN": "kavya",     # English with Indian accent
            "ta-IN": "kavitha",   # Tamil female
            "te-IN": "kavya",     # Telugu female
            "kn-IN": "kavya",     # Kannada female
        }
        return speakers.get(lang, "kavya")


sarvam_tts = SarvamTTSService()
