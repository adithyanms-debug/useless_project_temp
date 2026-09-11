import React, { useState, useRef, useEffect } from 'react';
import { useVoice } from './hooks/useVoice';
import './styles/index.css';

/* ——— Inline SVG Icons (no dependency needed) ——— */
const Icon = ({ d, size = 18, color = 'currentColor', fill = 'none', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>{d}</svg>
);

const MicIcon = (p) => <Icon {...p} d={<><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></>} />;
const StopIcon = (p) => <Icon {...p} d={<rect width="14" height="14" x="5" y="5" rx="2"/>} fill="currentColor" />;
const SendIcon = (p) => <Icon {...p} d={<><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>} />;
const VolumeIcon = (p) => <Icon {...p} d={<><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></>} />;
const SparkleIcon = (p) => <Icon size={14} {...p} d={<><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></>} />;

const EMOJIS = { IDLE: '🤡', LISTENING: '👂', THINKING: '🤔', SPEAKING: '🗣️', ERROR: '💀' };
const STATUS_TEXT = {
  IDLE: 'Tap mic & ask me anything!',
  LISTENING: 'Listening to you...',
  THINKING: 'Mandi is thinking...',
  SPEAKING: 'Mandi is speaking...',
  ERROR: 'Oops! Something broke'
};

const CHIPS = [
  { emoji: '💬', text: 'Should I text her?', prompt: 'Bro, should I text her right now?' },
  { emoji: '📚', text: 'Exam help', prompt: 'Bro I have an exam tomorrow and I studied nothing!' },
  { emoji: '🍕', text: 'What to eat?', prompt: 'What should I eat for dinner today?' },
  { emoji: '💡', text: 'Life wisdom', prompt: 'Mandi, give me your best life wisdom.' },
  { emoji: '😴', text: "I'm tired", prompt: "Bro I am so tired what should I do?" }
];

export default function App() {
  const {
    appState, messages, uselessness, mood, whyCount, transcript, audioLevel,
    startListening, stopListening, processUserPrompt,
    triggerWhyAction, triggerSureAction, triggerRandomAdvice, triggerRelationshipMode
  } = useVoice();

  const [text, setText] = useState('');
  const convoEnd = useRef(null);
  const isListening = appState === 'LISTENING';
  const isBusy = appState === 'THINKING' || appState === 'SPEAKING';

  useEffect(() => {
    convoEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    processUserPrompt(text);
    setText('');
  };

  const playVoice = (t) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t);
    u.rate = 1;
    const v = window.speechSynthesis.getVoices().find(v => v.lang.includes('en-IN') || v.lang.includes('hi-IN'));
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
  };

  return (
    <div className="app-shell">
      <div className="main-card">

        {/* ——— HEADER ——— */}
        <div className="header">
          <div className="header-brand">
            <div className="header-logo">🤡</div>
            <div>
              <div className="header-title">MANDI</div>
              <div className="header-sub">Your Useless AI Voice Friend</div>
            </div>
          </div>
          <div className="status-dot" title="Connected"></div>
        </div>

        {/* ——— AVATAR ——— */}
        <div className="hero-section">
          <div className={`avatar-ring ${appState.toLowerCase()}`}>
            <div className="avatar-inner">{EMOJIS[appState] || '🤡'}</div>
          </div>
          <div className="avatar-status">
            <span className="dot"></span>
            {STATUS_TEXT[appState]}
          </div>
        </div>

        {/* ——— VISUALIZER ——— */}
        <div className="visualizer-wrap">
          <MiniVisualizer active={isListening || appState === 'SPEAKING'} level={audioLevel} />
        </div>

        {/* ——— TRANSCRIPT ——— */}
        {isListening && transcript && (
          <div className="transcript-bar">"{transcript}"</div>
        )}

        {/* ——— MIC BUTTON ——— */}
        <div className="mic-section">
          <button
            className={`mic-btn ${isListening ? 'active' : ''}`}
            disabled={isBusy}
            onClick={isListening ? stopListening : startListening}
          >
            <div className="mic-btn-inner">
              {isListening
                ? <StopIcon size={22} color="#f472b6" />
                : <MicIcon size={22} color={isBusy ? '#475569' : '#c4b5fd'} />}
            </div>
          </button>
          <span className="mic-label">
            {isListening ? '🎙️ Tap to send' : isBusy ? '⏳ Processing...' : 'Tap to speak'}
          </span>
        </div>

        {/* ——— ACTION BUTTONS ——— */}
        <div className="actions-grid">
          <button className="action-btn" disabled={isBusy} onClick={triggerSureAction}>
            ⚡ ARE YOU SURE?
          </button>
          <button className="action-btn" disabled={isBusy} onClick={triggerWhyAction} style={{position:'relative'}}>
            ❓ WHY?
            {whyCount > 0 && <span className="action-badge">{whyCount}</span>}
          </button>
          <button className="action-btn" disabled={isBusy} onClick={triggerRandomAdvice}>
            🎲 Random Advice
          </button>
          <button className="action-btn" disabled={isBusy} onClick={triggerRelationshipMode}>
            ❤️ Text Crush?
          </button>
        </div>

        {/* ——— DASHBOARDS ——— */}
        <div className="dashboards">
          <div className="dash-card">
            <div className="dash-header">
              <span className="dash-label">Uselessness</span>
              <span className="dash-value">{uselessness}%</span>
            </div>
            <div className="meter-track">
              <div className="meter-fill" style={{ width: `${Math.min(100, uselessness)}%` }}></div>
            </div>
          </div>
          <div className="dash-card">
            <div className="dash-header">
              <span className="dash-label">Mood</span>
            </div>
            <span className="mood-pill">{mood}</span>
          </div>
        </div>

        {/* ——— CONVERSATION ——— */}
        <div className="convo-section">
          {messages.map((m, i) => (
            <div key={i} className={`msg-row ${m.sender === 'user' ? 'user' : 'mandi'}`}>
              <span className="msg-meta">
                {m.sender === 'user' ? 'You' : '🤡 Mandi'} · {m.timestamp}
              </span>
              <div className="msg-bubble">{m.text}</div>
              {m.sender === 'mandi' && (
                <div className="msg-footer">
                  <span className="msg-tag useless">🎯 {m.uselessness || 85}%</span>
                  {m.meme && <span className="msg-tag meme">🎭 {m.meme}</span>}
                  <button className="msg-replay" onClick={() => playVoice(m.text)} title="Replay voice">
                    <VolumeIcon size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
          <div ref={convoEnd} />
        </div>

        {/* ——— QUICK CHIPS ——— */}
        <div className="chips-section hide-scrollbar">
          {CHIPS.map((c, i) => (
            <button key={i} className="chip" disabled={isBusy} onClick={() => processUserPrompt(c.prompt)}>
              {c.emoji} {c.text}
            </button>
          ))}
        </div>

        {/* ——— INPUT BAR ——— */}
        <form className="input-bar" onSubmit={send}>
          <input
            className="input-field"
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Type a message..."
            disabled={isBusy}
          />
          <button className="send-btn" type="submit" disabled={!text.trim() || isBusy}>
            <SendIcon size={16} /> Send
          </button>
        </form>

        {/* ——— FOOTER ——— */}
        <div className="app-footer">
          TinkerHub Useless Projects 3.0 · ₹499 Consultation Guarantee
        </div>
      </div>
    </div>
  );
}

/* ——— Mini Canvas Visualizer ——— */
function MiniVisualizer({ active, level }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf, phase = 0;
    const bars = 20;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width / bars - 2;
      phase += 0.12;
      for (let i = 0; i < bars; i++) {
        const h = active
          ? Math.max(4, (level * 0.5 + Math.abs(Math.sin(phase + i * 0.5)) * 16 + Math.random() * 6))
          : 3 + Math.sin(phase * 0.4 + i * 0.35) * 1.5;
        const x = i * (w + 2);
        const y = (canvas.height - h) / 2;
        const g = ctx.createLinearGradient(0, y, 0, y + h);
        g.addColorStop(0, '#a78bfa');
        g.addColorStop(1, '#f472b6');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [active, level]);

  return <canvas ref={ref} width={220} height={32} style={{ borderRadius: 8, opacity: 0.8 }} />;
}
