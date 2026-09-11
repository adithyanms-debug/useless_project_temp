import { useState, useEffect, useRef, useCallback } from 'react';
import { sendChatMessage } from '../services/api';

export function useVoice() {
  const [appState, setAppState] = useState('IDLE'); // IDLE, LISTENING, THINKING, SPEAKING, ERROR
  const [messages, setMessages] = useState([
    {
      sender: 'mandi',
      text: "Namaskaram bro! Njan MANDI — ninte official useless AI friend. Anything ask, zero logic return. What's on your mind?",
      uselessness: 85,
      mood: 'Overconfident 😎',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [uselessness, setUselessness] = useState(85);
  const [mood, setMood] = useState('Overconfident 😎');
  const [whyCount, setWhyCount] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);

  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';

      recognition.onstart = () => {
        setAppState('LISTENING');
        setTranscript('');
      };

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (err) => {
        console.warn('Speech recognition error:', err.error);
        setAppState('ERROR');
        setTimeout(() => setAppState('IDLE'), 2000);
      };

      recognition.onend = () => {};

      recognitionRef.current = recognition;
    }
  }, []);

  // Audio Visualizer Level loop
  const startAudioAnalysis = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      const analyser = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(stream);
      analyser.fftSize = 64;
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setAudioLevel(Math.min(100, Math.round((avg / 255) * 100 * 2.5)));
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();
    } catch (e) {
      console.warn('Microphone access for visualizer failed:', e);
    }
  };

  const stopAudioAnalysis = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  };

  /**
   * Play Sarvam AI Bulbul TTS audio (base64 WAV) if available,
   * otherwise fallback to browser Web Speech API TTS.
   */
  const playAudio = useCallback((audioBase64, text) => {
    if (audioBase64) {
      // Decode base64 WAV from Sarvam AI and play it
      try {
        const binaryStr = atob(audioBase64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);

        audio.onplay = () => setAppState('SPEAKING');
        audio.onended = () => {
          setAppState('IDLE');
          URL.revokeObjectURL(audioUrl);
        };
        audio.onerror = () => {
          console.warn('Sarvam audio playback failed, falling back to browser TTS');
          URL.revokeObjectURL(audioUrl);
          speakWithBrowserTTS(text);
        };

        audio.play().catch(() => speakWithBrowserTTS(text));
        return;
      } catch (e) {
        console.warn('Failed to decode Sarvam audio:', e);
      }
    }

    // Fallback: use browser Web Speech API TTS
    speakWithBrowserTTS(text);
  }, []);

  const speakWithBrowserTTS = useCallback((text) => {
    if (!('speechSynthesis' in window)) {
      setAppState('IDLE');
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.05;

    const voices = window.speechSynthesis.getVoices();
    const inVoice = voices.find(v => v.lang.includes('en-IN') || v.lang.includes('hi-IN') || v.name.includes('India'));
    if (inVoice) utterance.voice = inVoice;

    utterance.onstart = () => setAppState('SPEAKING');
    utterance.onend = () => setAppState('IDLE');
    utterance.onerror = () => setAppState('IDLE');

    window.speechSynthesis.speak(utterance);
  }, []);

  // Send message to MANDI
  const processUserPrompt = async (userText, mode = 'normal', overrideWhyCount = null) => {
    if (!userText.trim() && mode === 'normal') return;

    const currentWhy = overrideWhyCount !== null ? overrideWhyCount : whyCount;

    if (userText.trim()) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'user',
          text: userText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }

    setAppState('THINKING');

    try {
      const mandiRes = await sendChatMessage(userText, mode, currentWhy);

      setUselessness(mandiRes.uselessness_pct);
      setMood(mandiRes.mood);

      const mandiMsg = {
        sender: 'mandi',
        text: mandiRes.reply_text,
        uselessness: mandiRes.uselessness_pct,
        mood: mandiRes.mood,
        meme: mandiRes.meme_reference,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, mandiMsg]);

      // Play Sarvam AI audio if available, else browser TTS
      playAudio(mandiRes.audio_base64, mandiRes.reply_text);

    } catch (e) {
      console.error('Failed to get Mandi response:', e);
      setAppState('ERROR');
      setTimeout(() => setAppState('IDLE'), 2000);
    }
  };

  // Mic Toggle logic
  const startListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        startAudioAnalysis();
      } catch (e) {
        console.warn('Recognition start issue:', e);
      }
    } else {
      setAppState('LISTENING');
      setTimeout(() => {
        const simInput = "Bro, should I text her?";
        setTranscript(simInput);
        setAppState('THINKING');
        processUserPrompt(simInput);
      }, 2500);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      stopAudioAnalysis();
    }
    setAppState('THINKING');

    if (transcript.trim()) {
      processUserPrompt(transcript);
    } else {
      setAppState('IDLE');
    }
  };

  const triggerWhyAction = () => {
    const nextWhy = whyCount + 1;
    setWhyCount(nextWhy);
    processUserPrompt("WHY?", "why", nextWhy);
  };

  const triggerSureAction = () => {
    processUserPrompt("ARE YOU SURE?", "sure");
  };

  const triggerRandomAdvice = () => {
    processUserPrompt("Give me random advice", "random");
  };

  const triggerRelationshipMode = () => {
    processUserPrompt("Bro, I need relationship advice!", "relationship");
  };

  return {
    appState, messages, uselessness, mood, whyCount, transcript, audioLevel,
    startListening, stopListening, processUserPrompt,
    triggerWhyAction, triggerSureAction, triggerRandomAdvice, triggerRelationshipMode
  };
}
