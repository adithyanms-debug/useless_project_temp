import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Mic, 
  MicOff, 
  Sparkles, 
  Trash2, 
  Volume2, 
  VolumeX, 
  Send, 
  Flame, 
  Activity, 
  Wifi, 
  WifiOff, 
  ShieldCheck, 
  HeartCrack, 
  Zap, 
  Coffee, 
  AlertCircle,
  RefreshCw,
  Square,
  HelpCircle,
  Gauge,
  Smile,
  HelpCircle as QuestionIcon
} from 'lucide-react';
import { downsampleTo16kHz, StreamAudioPlayer } from './audioUtils';
import './styles/index.css';

const MANDI_MOODS = [
  "Chaotic",
  "Overconfident",
  "Mentally buffering",
  "Dramatic",
  "Emotionally unavailable",
  "Peak uselessness",
  "Confused",
  "Sleepy",
  "Hungry",
  "Existential"
];

const QUICK_PROMPTS = [
  { label: "💔 Crush is ignoring me", prompt: "Mandi, my crush is taking 6 hours to reply. What should I do?", icon: HeartCrack, mode: "relationship" },
  { label: "🔥 Roast my life choices", prompt: "Mandi, roast my life choices and daily routine.", icon: Flame, mode: "normal" },
  { label: "💡 Useless hackathon idea", prompt: "Mandi, give me an intentionally useless hackathon idea.", icon: Zap, mode: "random" },
  { label: "😴 How to avoid work", prompt: "Mandi, tell me a high-IQ excuse to avoid working today.", icon: Coffee, mode: "normal" }
];

export default function App() {
  const backendUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/voice';

  // Orb UI State: 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING' | 'ERROR'
  const [orbState, setOrbState] = useState('IDLE');
  const [statusText, setStatusText] = useState("Chilling out... tap the orb or mic to speak");

  // Character Elements from Backend
  const [uselessness, setUselessness] = useState(94);
  const [currentMood, setCurrentMood] = useState("Chaotic");
  const [whyCount, setWhyCount] = useState(0);

  // Audio energy level [0.0 - 1.0] for audio-reactive animation
  const [audioEnergy, setAudioEnergy] = useState(0);

  // Conversation history
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'mandi',
      text: "Namaskaram bro! Njan MANDI — ninte official useless AI voice friend. Natural Hindi-Malayalam chaotic companion. Anything ask, zero logic return. What's on your mind?",
      time: 'Ready'
    }
  ]);
  const [inputVal, setInputVal] = useState('');

  // Diagnostics & Status
  const [healthStatus, setHealthStatus] = useState(null);
  const [wsStatus, setWsStatus] = useState('connecting');
  const [isMicRecording, setIsMicRecording] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [micError, setMicError] = useState(null);
  const [liveSpeechTranscript, setLiveSpeechTranscript] = useState('');

  // References
  const chatEndRef = useRef(null);
  const wsRef = useRef(null);
  const audioPlayerRef = useRef(null);
  const activeAudioElementRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const inputAudioCtxRef = useRef(null);
  const inputAnalyserRef = useRef(null);
  const scriptProcessorRef = useRef(null);
  const animFrameRef = useRef(null);
  const smoothedEnergyRef = useRef(0);
  const isSpeakingSpeechRef = useRef(false);
  const speechSynthesisUtteranceRef = useRef(null);
  const recognitionRef = useRef(null);
  const speechTranscriptRef = useRef('');

  // Preload browser speech voices
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  // Cancel any ongoing speech synthesis or audio playback
  const cancelAllSpeech = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      isSpeakingSpeechRef.current = false;
    }
    if (activeAudioElementRef.current) {
      try {
        activeAudioElementRef.current.pause();
        activeAudioElementRef.current.currentTime = 0;
      } catch {}
      activeAudioElementRef.current = null;
    }
    if (audioPlayerRef.current) {
      audioPlayerRef.current.interrupt();
    }
  }, []);

  // Speak text aloud using natural browser speech synthesis
  const speakText = useCallback((text) => {
    if (!('speechSynthesis' in window) || isAudioMuted) return;

    cancelAllSpeech();

    const cleanText = text
      .replace(/[*_#`~]/g, '')
      .replace(/[\u{1F600}-\u{1F6FF}]/gu, '')
      .trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    speechSynthesisUtteranceRef.current = utterance;

    // Pick best available voice (prefer Indian English or Hindi for character)
    const voices = window.speechSynthesis.getVoices();
    const selectedVoice = voices.find(v => 
      v.lang === 'en-IN' || 
      v.lang === 'hi-IN' || 
      v.name.toLowerCase().includes('india') ||
      v.name.toLowerCase().includes('hindi')
    ) || voices.find(v => v.lang.startsWith('en')) || voices[0];

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.rate = 1.0;
    utterance.pitch = 1.05;

    utterance.onstart = () => {
      isSpeakingSpeechRef.current = true;
      setOrbState('SPEAKING');
    };

    utterance.onend = () => {
      isSpeakingSpeechRef.current = false;
      setOrbState('IDLE');
    };

    utterance.onerror = () => {
      isSpeakingSpeechRef.current = false;
      setOrbState('IDLE');
    };

    if (audioPlayerRef.current) {
      audioPlayerRef.current.init();
    }

    window.speechSynthesis.speak(utterance);
  }, [isAudioMuted, cancelAllSpeech]);

  // Play Sarvam AI / Backend Audio (Base64 WAV) if present, else fallback to browser TTS
  const playBackendAudio = useCallback((audioBase64, fallbackText) => {
    if (isAudioMuted) return;

    if (audioBase64) {
      try {
        cancelAllSpeech();
        const binaryStr = atob(audioBase64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        activeAudioElementRef.current = audio;

        audio.onplay = () => {
          isSpeakingSpeechRef.current = true;
          setOrbState('SPEAKING');
        };

        audio.onended = () => {
          isSpeakingSpeechRef.current = false;
          setOrbState('IDLE');
          URL.revokeObjectURL(audioUrl);
          activeAudioElementRef.current = null;
        };

        audio.onerror = () => {
          console.warn("Base64 audio playback failed, falling back to speech synthesis");
          URL.revokeObjectURL(audioUrl);
          activeAudioElementRef.current = null;
          speakText(fallbackText);
        };

        audio.play().catch(() => speakText(fallbackText));
        return;
      } catch (err) {
        console.warn("Error decoding audio_base64:", err);
      }
    }

    // Fallback if no audio_base64 was sent
    speakText(fallbackText);
  }, [isAudioMuted, cancelAllSpeech, speakText]);

  // Reconnection backoff ref
  const reconnectAttemptRef = useRef(0);
  const reconnectTimeoutRef = useRef(null);
  const maxReconnectAttempts = 5;

  // Initialize output audio player
  useEffect(() => {
    audioPlayerRef.current = new StreamAudioPlayer(
      () => setOrbState('SPEAKING'),
      () => setOrbState('IDLE')
    );

    return () => {
      if (audioPlayerRef.current) audioPlayerRef.current.close();
      cancelAllSpeech();
      stopMicrophone();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [cancelAllSpeech]);

  // Real-time Audio Reactive Animation Loop
  useEffect(() => {
    const updateAudioEnergy = () => {
      let targetEnergy = 0;

      if (orbState === 'SPEAKING') {
        if (isSpeakingSpeechRef.current) {
          // Dynamic conversational cadence animation
          const now = performance.now() / 110;
          targetEnergy = 0.38 + 0.38 * Math.abs(Math.sin(now)) + 0.14 * Math.sin(now * 2.2);
        } else if (audioPlayerRef.current) {
          targetEnergy = audioPlayerRef.current.getAudioEnergy();
        }
      } else if (isMicRecording && inputAnalyserRef.current) {
        const data = new Uint8Array(inputAnalyserRef.current.frequencyBinCount);
        inputAnalyserRef.current.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        const avg = sum / data.length;
        targetEnergy = Math.min(1.0, avg / 85.0);
      } else if (orbState === 'THINKING') {
        targetEnergy = 0.08;
      }

      smoothedEnergyRef.current += (targetEnergy - smoothedEnergyRef.current) * 0.22;
      setAudioEnergy(smoothedEnergyRef.current);

      animFrameRef.current = requestAnimationFrame(updateAudioEnergy);
    };

    animFrameRef.current = requestAnimationFrame(updateAudioEnergy);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [orbState, isMicRecording]);

  // Update status message
  useEffect(() => {
    switch (orbState) {
      case 'IDLE':
        setStatusText(isMicRecording ? "Listening to your voice... speak freely" : "Chilling out... tap the orb or mic to speak");
        break;
      case 'LISTENING':
        setStatusText("Listening... listening to your voice");
        break;
      case 'THINKING':
        setStatusText("Mandi is cooking up some chaotic Hinglish-Manglish logic...");
        break;
      case 'SPEAKING':
        setStatusText("Mandi is speaking... tap orb to interrupt");
        break;
      case 'ERROR':
        setStatusText("Aiyo, something broke! But honestly, not my problem.");
        break;
      default:
        setStatusText("Mandi is standing by");
    }
  }, [orbState, isMicRecording]);

  // Dynamic Mood & Uselessness updates on turns
  const randomizeCharacterDynamics = () => {
    const nextMood = MANDI_MOODS[Math.floor(Math.random() * MANDI_MOODS.length)];
    setCurrentMood(nextMood);
    const nextUselessness = Math.min(99, Math.max(88, Math.floor(88 + Math.random() * 12)));
    setUselessness(nextUselessness);
  };

  // Connect WebSocket to Mandi2.0 Backend (/ws/voice) with controlled exponential backoff
  const connectWebSocket = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    try {
      setWsStatus(reconnectAttemptRef.current > 0 ? 'reconnecting' : 'connecting');
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        setWsStatus('connected');
        reconnectAttemptRef.current = 0;
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'status') {
            if (data.status) setOrbState(data.status);
          } else if (data.type === 'response') {
            const payload = data.payload || {};
            const replyText = payload.reply_text || payload.message || '';

            if (payload.uselessness_pct !== undefined) {
              setUselessness(payload.uselessness_pct);
            }
            if (payload.mood) {
              setCurrentMood(payload.mood);
            }

            if (replyText) {
              setMessages((prev) => [
                ...prev,
                {
                  id: Date.now(),
                  sender: 'mandi',
                  text: replyText,
                  meme: payload.meme_reference || null,
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
              ]);

              // Play Sarvam audio or speak with browser TTS
              playBackendAudio(payload.audio_base64, replyText);
            } else {
              setOrbState('IDLE');
            }
          } else if (data.type === 'error') {
            console.warn("Mandi2.0 notice:", data.message);
            setOrbState('ERROR');
            setTimeout(() => setOrbState('IDLE'), 2500);
          }
        } catch (err) {
          console.error("Failed to parse WebSocket message:", err);
        }
      };

      socket.onclose = () => {
        setWsStatus('disconnected');
        if (reconnectAttemptRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(1.8, reconnectAttemptRef.current), 10000) + Math.random() * 400;
          reconnectAttemptRef.current += 1;
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, delay);
        }
      };

      socket.onerror = () => {
        setWsStatus('disconnected');
      };
    } catch {
      setWsStatus('disconnected');
    }
  };

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch(`${backendUrl}/health`);
        if (res.ok) {
          const data = await res.json();
          setHealthStatus(data);
        }
      } catch {
        setHealthStatus(null);
      }
    };
    fetchHealth();
    connectWebSocket();

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [backendUrl, wsUrl]);

  // Scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, orbState]);

  // Start microphone capture & real-time speech recognition
  const startMicrophone = async () => {
    setMicError(null);

    if (orbState === 'SPEAKING') {
      triggerUserInterrupt();
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      mediaStreamRef.current = stream;

      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtxClass();
      inputAudioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.7;
      inputAnalyserRef.current = analyser;
      source.connect(analyser);

      // Start browser speech recognition to transcribe spoken question
      const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionClass) {
        try {
          const rec = new SpeechRecognitionClass();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = 'en-IN';
          speechTranscriptRef.current = '';

          rec.onresult = (e) => {
            let transcript = '';
            for (let i = 0; i < e.results.length; i++) {
              transcript += e.results[i][0].transcript + ' ';
            }
            const clean = transcript.trim();
            speechTranscriptRef.current = clean;
            setLiveSpeechTranscript(clean);
          };

          rec.onerror = (e) => {
            console.warn("Speech recognition notice:", e.error);
          };

          rec.start();
          recognitionRef.current = rec;
        } catch (e) {
          console.warn("Speech recognition init error:", e);
        }
      }

      setIsMicRecording(true);
      setOrbState('LISTENING');
    } catch (err) {
      console.error("Microphone access failed:", err);
      setMicError("Microphone permission denied. Please allow microphone in browser.");
      setIsMicRecording(false);
      setOrbState('IDLE');
    }
  };

  // Stop microphone capture
  const stopMicrophone = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    if (scriptProcessorRef.current) {
      try {
        scriptProcessorRef.current.disconnect();
      } catch {}
      scriptProcessorRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      try {
        inputAudioCtxRef.current.close();
      } catch {}
      inputAudioCtxRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    inputAnalyserRef.current = null;
    setIsMicRecording(false);
  };

  // Barge-in: Interrupt Mandi immediately
  const triggerUserInterrupt = () => {
    cancelAllSpeech();
    setOrbState('IDLE');
  };

  // Toggle Mic / Orb Interaction
  const handleInteractionToggle = async () => {
    if (isMicRecording) {
      const captured = speechTranscriptRef.current.trim();
      stopMicrophone();
      setOrbState('THINKING');
      randomizeCharacterDynamics();

      setTimeout(() => {
        const textToSend = captured || speechTranscriptRef.current.trim();
        speechTranscriptRef.current = '';
        setLiveSpeechTranscript('');

        if (textToSend) {
          handleSendPrompt(textToSend);
        } else {
          setOrbState('IDLE');
          setStatusText("Didn't catch any words. Tap orb to try speaking again, or type below.");
        }
      }, 400);
    } else {
      cancelAllSpeech();
      speechTranscriptRef.current = '';
      setLiveSpeechTranscript('');
      if (audioPlayerRef.current) audioPlayerRef.current.init();
      await startMicrophone();
    }
  };

  // Submit Text/Voice Prompt to Mandi2.0 Backend
  const handleSendPrompt = async (promptText, mode = 'normal', customWhy = null) => {
    if (!promptText.trim()) return;

    triggerUserInterrupt();
    randomizeCharacterDynamics();

    if (audioPlayerRef.current) audioPlayerRef.current.init();

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: 'user',
        text: promptText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setInputVal('');
    setOrbState('THINKING');

    const activeWhy = customWhy !== null ? customWhy : whyCount;
    const payload = {
      message: promptText,
      mode: mode,
      why_count: activeWhy
    };

    // 1. Try WebSocket first
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
      return;
    }

    // 2. HTTP Fallback (/api/chat) if WebSocket is unavailable
    try {
      const res = await fetch(`${backendUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        const replyText = data.reply_text || '';

        if (data.uselessness_pct !== undefined) setUselessness(data.uselessness_pct);
        if (data.mood) setCurrentMood(data.mood);

        if (replyText) {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              sender: 'mandi',
              text: replyText,
              meme: data.meme_reference || null,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
          playBackendAudio(data.audio_base64, replyText);
        } else {
          setOrbState('IDLE');
        }
      } else {
        setOrbState('ERROR');
        setTimeout(() => setOrbState('IDLE'), 2000);
      }
    } catch (err) {
      console.error("HTTP chat fallback error:", err);
      setOrbState('ERROR');
      setTimeout(() => setOrbState('IDLE'), 2000);
    }
  };

  // Special Character Feature Triggers
  const triggerAreYouSure = () => {
    handleSendPrompt("Are you sure about that advice, Mandi?", "sure");
  };

  const triggerWhy = () => {
    const count = whyCount + 1;
    setWhyCount(count);
    handleSendPrompt("Why? Explain the deep logic bro", "why", count);
  };

  const triggerRandomAdvice = () => {
    handleSendPrompt("Give me some completely random, useless life advice.", "random");
  };

  // Dynamic Audio-Reactive Calculations
  const orbScale = 1.0 + audioEnergy * 0.16;
  const glowSpread = 50 + Math.round(audioEnergy * 85);
  const cyanAlpha = Math.min(0.9, 0.35 + audioEnergy * 0.55);
  const eyeBounceY = -(audioEnergy * 8);
  const eyeScaleY = 1.0 + audioEnergy * 0.35;

  return (
    <div className="min-h-screen bg-[#070709] text-zinc-100 flex flex-col justify-between selection:bg-rose-500 selection:text-white relative overflow-hidden font-['Outfit',sans-serif]">
      
      {/* Background Ambient Stars & Gradient Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="star-dust" style={{ top: '15%', left: '20%' }} />
        <div className="star-dust" style={{ top: '35%', left: '80%', animationDelay: '1.2s' }} />
        <div className="star-dust" style={{ top: '65%', left: '10%', animationDelay: '2.4s' }} />
        <div className="star-dust" style={{ top: '80%', left: '75%', animationDelay: '0.7s' }} />
        <div className="star-dust" style={{ top: '25%', left: '50%', animationDelay: '3.1s' }} />

        {/* Ambient Glow Blurs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-purple-900/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-cyan-900/10 rounded-full blur-[100px]" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 px-4 sm:px-6 py-3.5 border-b border-zinc-800/50 bg-[#070709]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-rose-500 to-cyan-400 p-[1.5px] shadow-lg shadow-purple-500/20">
              <div className="w-full h-full bg-[#070709] rounded-2xl flex items-center justify-center">
                <Flame className="w-5 h-5 text-rose-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-rose-300 to-cyan-300">
                  MANDI
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  v2.0
                </span>
              </div>
              <p className="text-xs text-zinc-400">Chaotic Hindi-Malayalam AI Friend</p>
            </div>
          </div>

          {/* Quick Character Badges & Diagnostics */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* MANDI MOOD BADGE */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/40 border border-purple-800/40 text-xs">
              <Smile className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-zinc-400">Mood:</span>
              <span className="text-purple-300 font-semibold">{currentMood}</span>
            </div>

            {/* Audio Mute Toggle */}
            <button
              onClick={() => {
                if (!isAudioMuted) cancelAllSpeech();
                setIsAudioMuted(!isAudioMuted);
              }}
              className="p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition"
              title={isAudioMuted ? "Unmute Voice" : "Mute Voice"}
            >
              {isAudioMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>

            {/* WebSocket Connection Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs">
              {wsStatus === 'connected' ? (
                <Wifi className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              ) : wsStatus === 'reconnecting' ? (
                <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-rose-400" />
              )}
              <span className="capitalize text-zinc-300">
                {wsStatus === 'connected' ? 'Live' : wsStatus === 'reconnecting' ? 'Retrying...' : 'Offline'}
              </span>
            </div>

            {/* Reconnect button if disconnected */}
            {wsStatus === 'disconnected' && (
              <button
                onClick={connectWebSocket}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/20 transition"
              >
                Reconnect
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 flex flex-col items-center justify-between">
        
        {/* CENTER VISUALIZER & ORB SECTION */}
        <section className="w-full flex flex-col items-center justify-center my-auto py-2">
          
          {/* USELESSNESS METER */}
          <div className="w-full max-w-sm mb-4 px-4 py-2 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-md flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-rose-400 animate-pulse" />
              <span className="text-zinc-400 font-mono uppercase tracking-wider text-[10px]">Uselessness:</span>
              <span className="font-bold text-rose-400 font-mono">{uselessness}%</span>
            </div>
            
            {/* Visual Meter Bar */}
            <div className="flex-1 mx-3 h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 via-rose-500 to-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${uselessness}%` }}
              />
            </div>

            <div className="text-[11px] font-semibold text-purple-300 truncate max-w-[120px]">
              {currentMood}
            </div>
          </div>

          {/* Microphone Permission / Error Notice */}
          {micError && (
            <div className="mb-3 max-w-md px-4 py-2 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{micError}</span>
            </div>
          )}

          {/* THE MANDI GLOWING ORB */}
          <div className="relative my-4 flex items-center justify-center">
            
            {/* Outer Cyan Rim Ripple */}
            <div 
              className={`absolute w-72 h-72 rounded-full border border-cyan-400/30 transition-all duration-300 pointer-events-none ${
                orbState === 'LISTENING' || isMicRecording
                  ? 'scale-125 opacity-80 animate-ping'
                  : orbState === 'SPEAKING'
                  ? 'scale-110 opacity-60'
                  : 'scale-95 opacity-0'
              }`}
            />
            
            {/* Ambient Backing Halo with dynamic energy glow */}
            <div 
              className="absolute w-64 h-64 rounded-full blur-2xl transition-all duration-300 pointer-events-none"
              style={{
                backgroundColor: orbState === 'ERROR' ? 'rgba(225, 29, 72, 0.4)' :
                                 orbState === 'LISTENING' || isMicRecording ? `rgba(6, 182, 212, ${cyanAlpha})` :
                                 orbState === 'THINKING' ? 'rgba(219, 39, 119, 0.35)' :
                                 `rgba(147, 51, 234, ${0.3 + audioEnergy * 0.4})`
              }}
            />

            {/* Core Spherical Orb with Real-Time Audio Reactive Scale & Dynamic Shadow */}
            <div 
              onClick={handleInteractionToggle}
              className={`mandi-orb-base cursor-pointer select-none ${
                orbState === 'IDLE' && !isMicRecording
                  ? 'mandi-orb-idle'
                  : orbState === 'LISTENING' || isMicRecording
                  ? 'mandi-orb-listening'
                  : orbState === 'THINKING'
                  ? 'mandi-orb-thinking'
                  : orbState === 'SPEAKING'
                  ? 'mandi-orb-speaking'
                  : 'mandi-orb-error'
              }`}
              style={{
                transform: `scale(${orbScale})`,
                boxShadow: `inset -8px -8px 30px rgba(6, 182, 212, ${cyanAlpha}), inset 8px 8px 30px rgba(236, 72, 153, 0.35), 0 0 ${glowSpread}px rgba(124, 58, 237, ${0.4 + audioEnergy * 0.4}), 0 0 ${glowSpread + 30}px rgba(6, 182, 212, ${cyanAlpha})`
              }}
              title={
                isMicRecording ? "Click orb to finish turn" :
                orbState === 'SPEAKING' ? "Click orb to interrupt Mandi" :
                "Click orb to speak"
              }
            >
              {/* Inner Specular Highlight */}
              <div className="absolute top-4 left-6 w-20 h-10 rounded-full bg-gradient-to-b from-white/20 to-transparent blur-[2px] pointer-events-none -rotate-45" />

              {/* TWO VERTICAL WHITE CAPSULE-SHAPED EYES */}
              <div 
                className="flex items-center gap-7 z-10 transition-transform duration-100"
                style={{
                  transform: `translateY(${orbState === 'SPEAKING' ? eyeBounceY : 0}px)`
                }}
              >
                {/* Left Eye */}
                <div 
                  className={`orb-eye eye-blink ${
                    orbState === 'IDLE' && !isMicRecording
                      ? 'eye-idle'
                      : orbState === 'LISTENING' || isMicRecording
                      ? 'eye-listening'
                      : orbState === 'THINKING'
                      ? 'eye-thinking'
                      : orbState === 'SPEAKING'
                      ? 'eye-speaking'
                      : 'eye-error'
                  }`}
                  style={{
                    transform: `scaleY(${eyeScaleY})`
                  }}
                />
                
                {/* Right Eye */}
                <div 
                  className={`orb-eye eye-blink ${
                    orbState === 'IDLE' && !isMicRecording
                      ? 'eye-idle'
                      : orbState === 'LISTENING' || isMicRecording
                      ? 'eye-listening'
                      : orbState === 'THINKING'
                      ? 'eye-thinking'
                      : orbState === 'SPEAKING'
                      ? 'eye-speaking'
                      : 'eye-error eye-error-right'
                  }`}
                  style={{
                    transform: `scaleY(${eyeScaleY})`
                  }}
                />
              </div>

              {/* Dynamic Audio Wave Bars inside Orb */}
              {(orbState === 'SPEAKING' || isMicRecording) && (
                <div className="absolute bottom-6 flex items-end gap-1.5 h-6">
                  <span 
                    className="w-1 bg-cyan-300/90 rounded-full transition-all duration-75"
                    style={{ height: `${8 + Math.round(audioEnergy * 16)}px` }}
                  />
                  <span 
                    className="w-1 bg-white rounded-full transition-all duration-75"
                    style={{ height: `${12 + Math.round(audioEnergy * 24)}px` }}
                  />
                  <span 
                    className="w-1 bg-purple-300/90 rounded-full transition-all duration-75"
                    style={{ height: `${10 + Math.round(audioEnergy * 18)}px` }}
                  />
                  <span 
                    className="w-1 bg-cyan-300/90 rounded-full transition-all duration-75"
                    style={{ height: `${6 + Math.round(audioEnergy * 14)}px` }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Status Text with Interrupt Indicator */}
          <div className="mt-3 flex flex-col items-center">
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900/70 border border-zinc-800 text-xs font-mono text-zinc-300">
              <span className={`w-2 h-2 rounded-full ${
                orbState === 'ERROR' ? 'bg-rose-500 animate-ping' :
                isMicRecording || orbState === 'LISTENING' ? 'bg-cyan-400 animate-ping' :
                orbState === 'THINKING' ? 'bg-purple-400 animate-spin' :
                orbState === 'SPEAKING' ? 'bg-emerald-400 animate-bounce' : 'bg-zinc-500'
              }`} />
              <span>{statusText}</span>
            </div>

            {/* Live Speech Recognition Feedback */}
            {isMicRecording && (
              <div className="mt-2.5 px-4 py-1.5 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 text-xs flex items-center gap-2 max-w-md text-center animate-pulse shadow-lg shadow-cyan-950/50">
                <Mic className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                <span className="font-sans font-medium">
                  {liveSpeechTranscript ? `"${liveSpeechTranscript}"` : "Listening to your voice... speak now"}
                </span>
              </div>
            )}
          </div>

          {/* Microphone Action Button */}
          <div className="mt-5 flex items-center justify-center gap-4">
            <button
              onClick={handleInteractionToggle}
              className={`relative group flex items-center justify-center h-16 w-16 rounded-full transition-all duration-300 shadow-xl ${
                isMicRecording
                  ? 'bg-cyan-500 text-black shadow-cyan-500/50 scale-110 ring-4 ring-cyan-400/40 animate-pulse'
                  : orbState === 'SPEAKING'
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/40'
                  : 'bg-gradient-to-tr from-purple-600 via-rose-600 to-cyan-500 text-white hover:scale-105 shadow-purple-600/30'
              }`}
            >
              {isMicRecording ? (
                <MicOff className="w-7 h-7" />
              ) : orbState === 'SPEAKING' ? (
                <Square className="w-6 h-6 fill-current" />
              ) : (
                <Mic className="w-7 h-7" />
              )}
            </button>
          </div>
          <p className="mt-2 text-[11px] text-zinc-500 font-mono">
            {isMicRecording ? 'Listening: tap to finish turn' :
             orbState === 'SPEAKING' ? 'Tap button or orb to interrupt Mandi' :
             'Tap orb or mic to start speaking'}
          </p>

          {/* CHARACTER-DRIVEN ACTION BUTTONS: "ARE YOU SURE?", "WHY?", "RANDOM ADVICE" */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <button
              onClick={triggerAreYouSure}
              disabled={orbState === 'THINKING'}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Are you sure?</span>
            </button>

            <button
              onClick={triggerWhy}
              disabled={orbState === 'THINKING'}
              className="px-3.5 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
            >
              <QuestionIcon className="w-3.5 h-3.5" />
              <span>Why? {whyCount > 0 && `(${whyCount})`}</span>
            </button>

            <button
              onClick={triggerRandomAdvice}
              disabled={orbState === 'THINKING'}
              className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Random Useless Advice</span>
            </button>
          </div>
        </section>

        {/* BOTTOM SECTION: CONVERSATION HISTORY & TEXT INPUT */}
        <section className="w-full max-w-3xl mt-4 flex flex-col gap-3">
          
          {/* Quick Starter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {QUICK_PROMPTS.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleSendPrompt(item.prompt, item.mode)}
                  disabled={orbState === 'THINKING'}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 text-zinc-300 text-xs transition active:scale-95 disabled:opacity-40"
                >
                  <IconComp className="w-3.5 h-3.5 text-purple-400" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Chat Message Drawer (Collapsible feed) */}
          <div className="glass-panel rounded-2xl p-4 max-h-48 sm:max-h-56 overflow-y-auto space-y-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 text-xs leading-relaxed ${
                  m.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {m.sender === 'mandi' && (
                  <div className="h-6 w-6 rounded-lg bg-purple-600/30 border border-purple-500/40 flex items-center justify-center flex-shrink-0 text-[11px]">
                    🤡
                  </div>
                )}
                <div
                  className={`px-3.5 py-2 rounded-2xl max-w-[85%] sm:max-w-[75%] ${
                    m.sender === 'user'
                      ? 'bg-gradient-to-r from-purple-600 to-rose-600 text-white rounded-tr-none'
                      : 'bg-zinc-900/90 text-zinc-200 border border-zinc-800 rounded-tl-none'
                  }`}
                >
                  <p>{m.text}</p>
                  {m.meme && (
                    <span className="inline-block mt-1 text-[10px] text-amber-300/80 font-mono">
                      ✨ {m.meme}
                    </span>
                  )}
                  <div className="mt-1 flex items-center justify-end gap-1.5 text-[9px] text-zinc-400 opacity-60">
                    <span>{m.time}</span>
                  </div>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Text Input Prompt Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendPrompt(inputVal, 'normal');
            }}
            className="relative flex items-center gap-2"
          >
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Ask Mandi anything in Hindi, Malayalam, or English..."
              className="flex-1 bg-zinc-900/90 border border-zinc-800 focus:border-purple-500 rounded-2xl px-4 py-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition backdrop-blur-md shadow-inner"
            />
            <button
              type="submit"
              disabled={!inputVal.trim() || orbState === 'THINKING'}
              className="h-11 px-5 rounded-2xl bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 disabled:opacity-40 disabled:hover:from-purple-600 disabled:hover:to-rose-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-lg shadow-purple-600/20"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

        </section>

      </main>

      {/* Footer */}
      <footer className="relative z-10 py-3 text-center text-[11px] text-zinc-600 border-t border-zinc-900/60 bg-[#070709]/60 backdrop-blur-md">
        Mandi • The Useless AI Voice Friend • TinkerHub Useless Projects 2026
      </footer>

    </div>
  );
}
