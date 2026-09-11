import os
import logging
import httpx
from typing import Dict, Any
from app.config import settings

logger = logging.getLogger("mandi.translation")

# Preset fallback dictionary for common expressions
PRESET_TRANSLATIONS = {
    "how are you": "സുഖമാണോ? (Sukhamano?)",
    "what are you doing": "നീ എന്ത് ചെയ്യുകയാണ്? (Nee enthu cheyyukayanu?)",
    "i love you": "എനിക്ക് നിന്നെ ഇഷ്ടമാണ് (Enikku ninne ishtamanu)",
    "should i text her": "അവൾക്ക് മെസ്സേജ് അയക്കണോ? (Avalkku message ayakkano?)",
    "hello": "നമസ്കാരം (Namaskaram)",
    "good morning": "സുപ്രഭാതം (Suprabhatham)",
    "goodbye": "പോയി വരാം (Poyi varam)"
}

class TranslationService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY or settings.GOOGLE_TRANSLATION_API_KEY
        self.client = None
        self.candidate_models = [
            "gemini-1.5-flash",
            "gemini-2.0-flash",
            "gemini-1.5-pro",
            "gemini-2.0-flash-lite",
            "gemini-flash-latest"
        ]
        self._init_gemini()

    def _init_gemini(self):
        if settings.GEMINI_API_KEY:
            try:
                import google.generativeai as genai
                genai.configure(api_key=settings.GEMINI_API_KEY)
                self.client = genai
                logger.info("Gemini translation engine initialized.")
            except Exception as e:
                logger.warning(f"Could not initialize Gemini for translation: {e}")
                self.client = None

    async def translate_text(self, text: str, target_lang: str = "ml") -> Dict[str, Any]:
        """
        Translate text using Gemini AI models with real-time model fallbacks.
        """
        text_clean = text.strip().lower()

        # 1. Try Gemini API Translation with model fallbacks
        if self.client:
            lang_names = {
                "ml": "Malayalam",
                "hi": "Hindi",
                "en": "English",
                "ta": "Tamil",
                "te": "Telugu"
            }
            target_name = lang_names.get(target_lang, target_lang)
            prompt = (
                f"Translate the following text accurately into {target_name}.\n"
                f"Text: \"{text}\"\n"
                f"Provide ONLY the translated text without extra explanation."
            )
            for m_name in self.candidate_models:
                try:
                    model = self.client.GenerativeModel(model_name=m_name)
                    response = model.generate_content(prompt)
                    if response and response.text:
                        translated = response.text.strip()
                        return {
                            "original_text": text,
                            "translated_text": translated,
                            "target_language": target_lang,
                            "provider": f"Gemini ({m_name}) Translation API"
                        }
                except Exception as e:
                    logger.warning(f"Gemini translation failed on model '{m_name}': {e}. Trying next...")
                    continue
                logger.error(f"Gemini translation error: {e}")

        # 2. Try Google Cloud Translation API if key available
        if settings.GOOGLE_TRANSLATION_API_KEY:
            try:
                url = f"https://translation.googleapis.com/language/translate/v2?key={settings.GOOGLE_TRANSLATION_API_KEY}"
                async with httpx.AsyncClient() as client:
                    resp = await client.post(url, json={"q": text, "target": target_lang})
                    if resp.status_code == 200:
                        data = resp.json()
                        translated = data["data"]["translations"][0]["translatedText"]
                        return {
                            "original_text": text,
                            "translated_text": translated,
                            "target_language": target_lang,
                            "provider": "Google Cloud Translation API"
                        }
            except Exception as e:
                logger.error(f"Google Translation API error: {e}")

        # 3. Preset dictionary fallback
        if text_clean in PRESET_TRANSLATIONS and target_lang == "ml":
            return {
                "original_text": text,
                "translated_text": PRESET_TRANSLATIONS[text_clean],
                "target_language": target_lang,
                "provider": "Mandi Preset Dictionary"
            }

        # 4. General fallback response
        return {
            "original_text": text,
            "translated_text": f"[{target_lang.upper()}] Bro, translation for '{text}' in {target_lang}!",
            "target_language": target_lang,
            "provider": "Mandi Fallback"
        }

translation_service = TranslationService()
