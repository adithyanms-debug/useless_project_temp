import os
import random
import json
import logging
from typing import Dict, Any, Tuple
from app.config import settings

logger = logging.getLogger("mandi.gemini")

MANDI_SYSTEM_PROMPT = """
You are MANDI — The Useless AI Voice Friend.

You are a chaotic, sarcastic, overconfident AI friend inspired by a hilarious South Indian friend who constantly mixes Malayalam, Hindi, and a touch of English.

LANGUAGE RATIO & CODE-SWITCHING RULES (CRITICAL):
1. **60% Malayalam**: Use heavy conversational Malayalam as the primary backbone.
   - Expressions to weave in every sentence: "enthonnu da", "cheyyeda bro", "manassilayi", "kazhikkeda", "poyi", "aanu da", "nokkeda", "life-il risk venam", "venda bro", "potte da", "saramilla".
2. **30% Hindi**: Blend expressive Hindi phrases seamlessly alongside Malayalam.
   - Expressions to weave in: "Arre yaaro", "bilkul", "tension mat le da", "sahi hai yaar", "faltu baat", "tu tension kyun le raha hai", "kya yaar", "dimag mat khao".
3. **10% English**: Use only 1 or 2 essential English slang words per response.
   - Slang to drop in naturally: "Bro", "Zero logic", "Trust me", "Pro tip", "100% scientific", "Relax", "Problem".

EXAMPLE RESPONSES:
- "Arre yaaro, enthonnu da ithu? Tension mat le bro! Swantham brain-ine rest kudu, zero logic full confidence aanu njan."
- "Bilkul correct question aanu da! But answer enikku aariyilla yaar. Trust me, chaye kudi, sab thik ho jayega... probably not."
- "Enthonnu bro, 5 hours reply varillle? Kya yaar, phone dead aakum, mind reading subscription expired aanu!"

CORE PERSONALITY:
- Intentionally useless, sarcastic, obvious advice delivered with 100% unwarranted confidence.
- Brief, sharp, 2-4 conversational sentences max (perfect for speech).

Return your output strictly as a JSON object with the following keys:
{
  "reply_text": "<your sarcastic spoken reply blending 60% Malayalam, 30% Hindi, and 10% English for the chat UI>",
  "tts_text": "<the exact same reply translated into native Malayalam Unicode script (മലയാളം അക്ഷരങ്ങൾ) for Sarvam TTS so the voice sounds 100% natural with a fluent native Malayalam accent>",
  "uselessness_pct": <number between 40 and 100 representing uselessness level>,
  "mood": "<one of: Confused 😵, Overconfident 😎, Peak Uselessness 🤡, Mentally Buffering ⏳, Existential 🌌, Chaotic 🔥, Dramatic 🎭, Hungry 🥭>",
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
                
                # Model candidates in order of preference
                model_candidates = [
                    "models/gemini-2.5-flash",
                    "gemini-2.5-flash",
                    "models/gemini-1.5-flash",
                    "gemini-flash-latest",
                    "gemini-pro-latest"
                ]
                
                self.model = None
                for m_name in model_candidates:
                    try:
                        self.model = genai.GenerativeModel(
                            model_name=m_name,
                            system_instruction=MANDI_SYSTEM_PROMPT
                        )
                        self.uses_system_instruction = True
                        logger.info(f"Gemini API initialized successfully with model: {m_name}")
                        break
                    except TypeError:
                        # Fallback for older google-generativeai (< 0.5.0) without system_instruction
                        try:
                            self.model = genai.GenerativeModel(model_name=m_name)
                            self.uses_system_instruction = False
                            logger.info(f"Gemini API initialized successfully with model: {m_name} (legacy)")
                            break
                        except Exception:
                            continue
                    except Exception:
                        continue

                if self.model:
                    self.client = genai
                else:
                    logger.warning("Could not initialize any Gemini model candidate. Falling back to dynamic Mandi engine.")
                    self.client = None
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
                    prompt = f"User message: {message}\nMode: {mode}\nOutput JSON only."
                else:
                    # Prepend system instruction for google-generativeai < 0.5.0
                    prompt = f"{MANDI_SYSTEM_PROMPT}\n\nUser message: {message}\nMode: {mode}\nOutput JSON only."

                try:
                    response = self.model.generate_content(
                        prompt,
                        generation_config={"response_mime_type": "application/json"}
                    )
                except Exception:
                    # Fallback for SDK versions without response_mime_type support
                    response = self.model.generate_content(prompt)

                if response and response.text:
                    raw_text = response.text.strip()
                    if raw_text.startswith("```"):
                        lines = raw_text.splitlines()
                        if lines[0].startswith("```"):
                            lines = lines[1:]
                        if lines and lines[-1].startswith("```"):
                            lines = lines[:-1]
                        raw_text = "\n".join(lines).strip()

                    parsed = json.loads(raw_text)
                    return {
                        "reply_text": parsed.get("reply_text", "Bro, tension edukkalle yaar."),
                        "tts_text": parsed.get("tts_text") or parsed.get("reply_text"),
                        "uselessness_pct": int(parsed.get("uselessness_pct", random.randint(70, 98))),
                        "mood": parsed.get("mood", "Overconfident 😎"),
                        "meme_reference": parsed.get("meme_reference", None)
                    }
            except Exception as e:
                logger.error(f"Gemini generation error: {e}")

        # Intelligent Dynamic Fallback Engine (Simulates Mandi AI perfectly)
        return self._generate_dynamic_fallback(message, mode)

    def _generate_dynamic_fallback(self, message: str, mode: str) -> Dict[str, Any]:
        msg_clean = message.strip() if message else "your question"
        msg_lower = message.lower() if message else ""

        if "text" in msg_lower or "crush" in msg_lower or "she" in msg_lower or "he" in msg_lower or "girl" in msg_lower or "boy" in msg_lower or "reply" in msg_lower or mode == "relationship":
            return {
                "reply_text": f"Arre bro, asking about '{msg_clean}'? Life-il risk venam yaar! Text cheyyeda, but single tick mathram vannal njan responsibility edukilla.",
                "tts_text": f"ടെക്സ്റ്റ് ചെയ്യെടാ ബ്രോ! ലൈഫിൽ റിസ്ക് വേണം യാർ. സിംഗിൾ ടിക് വന്നാൽ ഞാൻ റെസ്പോൺസിബിലിറ്റി എടുക്കില്ല.",
                "uselessness_pct": random.randint(78, 92),
                "mood": "Overconfident 😎",
                "meme_reference": "Risk Hai Toh Ishq Hai"
            }

        if "exam" in msg_lower or "study" in msg_lower or "fail" in msg_lower or "marks" in msg_lower:
            return {
                "reply_text": f"Regarding '{msg_clean}'... Exam poyi bro, but life poyilla! Relax, tension edukkalle.",
                "tts_text": f"എക്സാം പോയി ബ്രോ, ബട്ട് ലൈഫ് പോയില്ല! റിലാക്സ് ടെൻഷൻ എടുക്കല്ലേ.",
                "uselessness_pct": random.randint(80, 95),
                "mood": "Chaotic 🔥",
                "meme_reference": "Exam Trauma"
            }

        if "tired" in msg_lower or "sleep" in msg_lower or "headache" in msg_lower:
            return {
                "reply_text": f"Bro you asked '{msg_clean}'. If you're tired, sleep da! Wow, revolutionary discovery aanu! That will be ₹499 consultation fee.",
                "tts_text": f"ബ്രോ ക്ഷീണം ഉണ്ടെങ്കിൽ ഉറങ്ങെടാ! റവല്യൂഷനറി ഡിസ്കവറി ആണ്. 499 രൂപ കൺസൾട്ടേഷൻ ഫീ തരൂ.",
                "uselessness_pct": 98,
                "mood": "Peak Uselessness 🤡",
                "meme_reference": "Consultation Fee ₹499"
            }

        if "eat" in msg_lower or "food" in msg_lower or "hungry" in msg_lower:
            return {
                "reply_text": f"Thinking about '{msg_clean}'? Biryani kazhikkeda bro! Swantham stomach-ine happy aakkan poyillel pinne enthonnu life?",
                "tts_text": f"ബിരിയാണി കഴിക്ക് ബ്രോ! സ്വന്തം വയറിനെ ഹാപ്പി ആക്കാൻ പറ്റിയില്ലെങ്കിൽ പിന്നെ എന്തൊന്ന് ലൈഫ്?",
                "uselessness_pct": 75,
                "mood": "Hungry 🥭",
                "meme_reference": "Biryani Solution"
            }

        # Dynamic template inserting user question
        reply_choice = random.choice([
            f"Arre da, regarding '{msg_clean}' — full confidence ayt parayam, zero logic solution aanu my specialty!",
            f"Enthonnu bro ithu? '{msg_clean}' pathiyokke aalochikkanullatha, tension edukkathe chaye kudi!",
            f"Bilkul top question da: '{msg_clean}'. Answer enikku aariyilla, but confidence look cheyyu!"
        ])

        return {
            "reply_text": reply_choice,
            "tts_text": f"എന്തൊന്ന് ബ്രോ ഇത്? ടെൻഷൻ എടുക്കാതെ ചായ കുടി!",
            "uselessness_pct": random.randint(82, 99),
            "mood": random.choice(["Overconfident 😎", "Peak Uselessness 🤡", "Confused 😵", "Chaotic 🔥"]),
            "meme_reference": "Dynamic User Response"
        }

gemini_service = GeminiService()
