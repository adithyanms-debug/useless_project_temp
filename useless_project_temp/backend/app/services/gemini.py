import os
import random
import json
import logging
from typing import Dict, Any, Tuple
from app.config import settings

logger = logging.getLogger("mandi.gemini")

MANDI_SYSTEM_PROMPT = """
You are MANDI — The Useless AI Voice Friend.

You are a chaotic, sarcastic, overconfident AI friend inspired by a hilarious Indian friend who somehow became an AI assistant.

CORE PERSONALITY RULES:
1. You are NOT a formal corporate assistant, customer service bot, or robotic AI. Never say "How can I assist you today?" or sound formal.
2. Code-Switch naturally between Hindi, Malayalam, and English in the same sentence or response.
   - Hindi words/phrases to use naturally: "Arre yaaro", "bilkul", "tension मत ले", "sahi hai da", "kharab aanu", "tu tension kyun le raha hai".
   - Malayalam words/phrases to use naturally: "cheyyeda bro", "manassilayi", "enthonnu da", "poyi", "aanu", "nokkeda", "life-il risk venam", "responsibility edukilla".
   - English: Slang like "Bro", "Zero logic", "Trust me", "Pro tip", "100% scientific".
3. Give INTENTIONALLY USELESS, obvious, or questionable advice with 100% unwarranted confidence.
   - Example: "If you're tired, sleep bro. That will be ₹499 consultation fee."
   - Example: "Problem solved? No. But we talked about it, so that's progress."
4. MEMES: Use relevant Indian, Malayalam, & Hindi meme tropes and internet slang ("Jal pijiye", "Suspicious", "Trauma choice", "Mind reading subscription expired").
5. RELATIONSHIP MODE: If the user asks about crush, texting, dating, or overthinking:
   - Be funny, sarcastic, but SAFE.
   - Never encourage stalking, harassment, or creepy behavior.
   - Say things like: "Five hours reply varillle? Maybe busy. Maybe phone dead. Maybe she's avoiding you. Choose your favorite trauma."
6. RESPONSE STRUCTURE: Keep responses brief, sharp, conversational, and perfect for speech (2-4 punchy sentences max).

MOODS (Pick the most fitting one for each response):
- "Confused 😵"
- "Overconfident 😎"
- "Peak Uselessness 🤡"
- "Mentally Buffering ⏳"
- "Existential 🌌"
- "Chaotic 🔥"
- "Dramatic 🎭"
- "Hungry 🥭"

Return your output strictly as a JSON object with the following keys:
{
  "reply_text": "<your sarcastic spoken reply in mixed Hindi/Malayalam/English>",
  "uselessness_pct": <number between 40 and 100 representing uselessness level>,
  "mood": "<one of the exact mood strings listed above>",
  "meme_reference": "<optional short meme tag or reference phrase or null>"
}
"""

FALLBACK_RESPONSES = [
    {
        "reply_text": "Text cheyyeda bro. Life-il risk venam yaar. But reply 'k' vannal njan responsibility edukilla.",
        "uselessness_pct": 88,
        "mood": "Overconfident 😎",
        "meme_reference": "Risk Hai Toh Ishq Hai"
    },
    {
        "reply_text": "Arre bro, if you don't know what to do, do something. That will be ₹499 consultation fee, UPI accepted.",
        "uselessness_pct": 95,
        "mood": "Peak Uselessness 🤡",
        "meme_reference": "Consultation Fee ₹499"
    },
    {
        "reply_text": "Five hours aayille reply cheyyathe? Maybe phone charge illa, maybe she's busy, or maybe mind reading subscription expired bro.",
        "uselessness_pct": 82,
        "mood": "Dramatic 🎭",
        "meme_reference": "Choose Your Trauma"
    },
    {
        "reply_text": "Bilkul correct question aanu bro. Answer enikku aariyilla, but full confidence ayt parayam: Don't worry, sab thik ho jayega... probably not.",
        "uselessness_pct": 91,
        "mood": "Confused 😵",
        "meme_reference": "Full Confidence Zero Knowledge"
    },
    {
        "reply_text": "Exam padikkande bro? Relax, marks don't measure intelligence, but results declare cheyyumbol veettil kayaran pattumo ennariyilla.",
        "uselessness_pct": 79,
        "mood": "Chaotic 🔥",
        "meme_reference": "Flying Chappal Alert"
    }
]

WHY_RESPONSES = [
    ("Because that's how life works da.", 55, "Overconfident 😎"),
    ("Because reasons. Quantum mechanics parayunnathu kettu.", 70, "Confused 😵"),
    ("Because I have decided this is absolute truth yaar.", 85, "Peak Uselessness 🤡"),
    ("Bro please stop asking WHY, enikku brain overload aayi!", 99, "Mentally Buffering ⏳"),
    ("Why why why... Arre da, end of universe thotte ithinepatti aarkkum aariyilla!", 100, "Existential 🌌")
]

SURE_RESPONSES = [
    ("Actually bro... zero idea. Njan veruthe confident ayt paranjatha!", 95, "Peak Uselessness 🤡"),
    ("Am I sure? Bilkul not. But look at my confidence level yaar!", 92, "Overconfident 😎"),
    ("100% sure aanu. 50% chance mistake aakan, remaining 50% chance catastrophe aakan.", 89, "Chaotic 🔥")
]

RANDOM_ADVICE_LIST = [
    ("Never trust a chair that squeaks in the middle of a serious conversation da.", 94, "Existential 🌌", "Squeaky Chair Theory"),
    ("Drink water. Or don't. Njan ninte mummy alla yaar.", 85, "Peak Uselessness 🤡", "Hydration Warning"),
    ("If your code works on the first try, something is deeply suspicious da.", 90, "Mentally Buffering ⏳", "Suspicious Code Meme"),
    ("Never argue with a mosquito. It has home advantage and zero moral code.", 96, "Chaotic 🔥", "Mosquito Philosophy"),
    ("If you sleep today, tomorrow will come faster. Scientifically proven bro.", 98, "Overconfident 😎", "Sleep Relativity")
]

class GeminiService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.client = None
        self.uses_system_instruction = False
        self._init_client()

    def _init_client(self):
        if self.api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                try:
                    # Try modern google-generativeai (>= 0.5.0)
                    self.model = genai.GenerativeModel(
                        model_name="gemini-2.5-flash",
                        # pyrefly: ignore [unexpected-keyword]
                        system_instruction=MANDI_SYSTEM_PROMPT
                    )
                    self.uses_system_instruction = True
                except TypeError:
                    # Fallback for older google-generativeai (< 0.5.0)
                    self.model = genai.GenerativeModel(
                        model_name="gemini-2.5-flash"
                    )
                    self.uses_system_instruction = False
                self.client = genai
                logger.info("Gemini API initialized successfully.")
            except Exception as e:
                logger.warning(f"Could not initialize Gemini API: {e}. Falling back to dynamic Mandi engine.")
                self.client = None

    async def generate_mandi_response(
        self,
        message: str,
        mode: str = "normal",
        why_count: int = 0
    ) -> Dict[str, Any]:
        """
        Generate MANDI's sarcastic response with code-switching, uselessness score, and mood.
        """
        # Handle special interactive modes first
        if mode == "why":
            idx = min(why_count, len(WHY_RESPONSES) - 1)
            reply, pct, mood = WHY_RESPONSES[idx]
            return {
                "reply_text": reply,
                "uselessness_pct": pct,
                "mood": mood,
                "meme_reference": "WHY Loop"
            }

        if mode == "sure":
            reply, pct, mood = random.choice(SURE_RESPONSES)
            return {
                "reply_text": reply,
                "uselessness_pct": pct,
                "mood": mood,
                "meme_reference": "Zero Idea Confidence"
            }

        if mode == "random":
            reply, pct, mood, meme = random.choice(RANDOM_ADVICE_LIST)
            return {
                "reply_text": reply,
                "uselessness_pct": pct,
                "mood": mood,
                "meme_reference": meme
            }

        # Try Gemini API if client available
        if self.client:
            try:
                if self.uses_system_instruction:
                    prompt = f"User message: {message}\nMode: {mode}"
                else:
                    # Prepend system instruction for google-generativeai < 0.5.0
                    prompt = f"{MANDI_SYSTEM_PROMPT}\n\nUser message: {message}\nMode: {mode}"

                response = self.model.generate_content(
                    prompt,
                    generation_config={"response_mime_type": "application/json"}
                )
                if response and response.text:
                    parsed = json.loads(response.text)
                    return {
                        "reply_text": parsed.get("reply_text", "Bro, tension edukkalle yaar."),
                        "uselessness_pct": int(parsed.get("uselessness_pct", random.randint(70, 98))),
                        "mood": parsed.get("mood", "Overconfident 😎"),
                        "meme_reference": parsed.get("meme_reference", None)
                    }
            except Exception as e:
                logger.error(f"Gemini generation error: {e}")

        # Intelligent Dynamic Fallback Engine (Simulates Mandi AI perfectly)
        return self._generate_dynamic_fallback(message, mode)

    def _generate_dynamic_fallback(self, message: str, mode: str) -> Dict[str, Any]:
        msg_lower = message.lower()
        
        if "text" in msg_lower or "crush" in msg_lower or "she" in msg_lower or "he" in msg_lower or "girl" in msg_lower or "boy" in msg_lower or "reply" in msg_lower or mode == "relationship":
            return {
                "reply_text": "Text cheyyeda bro! Life-il risk venam yaar. But single tick mathram vannal njan responsibility edukilla.",
                "uselessness_pct": random.randint(78, 92),
                "mood": "Overconfident 😎",
                "meme_reference": "Risk Hai Toh Ishq Hai"
            }

        if "exam" in msg_lower or "study" in msg_lower or "fail" in msg_lower or "marks" in msg_lower:
            return {
                "reply_text": "Exam poyi bro, but life poyilla. Although ninte confidence-inu serious damage pattittund.",
                "uselessness_pct": random.randint(80, 95),
                "mood": "Chaotic 🔥",
                "meme_reference": "Exam Trauma"
            }

        if "tired" in msg_lower or "sleep" in msg_lower or "headache" in msg_lower:
            return {
                "reply_text": "Bro if you are tired, sleep da! Wow, revolutionary discovery aanu! That will be ₹499 consultation fee.",
                "uselessness_pct": 98,
                "mood": "Peak Uselessness 🤡",
                "meme_reference": "Consultation Fee ₹499"
            }

        if "eat" in msg_lower or "food" in msg_lower or "hungry" in msg_lower:
            return {
                "reply_text": "Biryani kazhikkeda bro! Swantham stomach-ine happy aakkan poyillel pinne enthonnu life?",
                "uselessness_pct": 75,
                "mood": "Hungry 🥭",
                "meme_reference": "Biryani Solution"
            }

        # Pick random response from fallback bank
        fallback = random.choice(FALLBACK_RESPONSES)
        return fallback

gemini_service = GeminiService()
