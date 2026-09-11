import React, { useEffect, useRef } from 'react';
import { Volume2, Sparkles, User } from 'lucide-react';

export function Conversation({ messages = [] }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const playVoice = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const inVoice = voices.find(v => v.lang.includes('en-IN') || v.lang.includes('hi-IN'));
    if (inVoice) utterance.voice = inVoice;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="w-full flex-1 min-h-[220px] max-h-[360px] overflow-y-auto pr-1 flex flex-col gap-3.5 my-2">
      {messages.map((msg, idx) => {
        const isUser = msg.sender === 'user';
        return (
          <div
            key={idx}
            className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} gap-1`}
          >
            <div className="flex items-center gap-1.5 px-1 text-[11px] font-semibold text-slate-400">
              {isUser ? (
                <>
                  <span>You</span>
                  <User className="w-3 h-3 text-cyan-400" />
                </>
              ) : (
                <>
                  <span className="text-pink-400 font-bold">🤡 MANDI</span>
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                </>
              )}
              <span className="text-[10px] text-slate-500">• {msg.timestamp}</span>
            </div>

            <div
              className={`max-w-[88%] p-3.5 rounded-2xl relative text-sm leading-relaxed ${
                isUser
                  ? 'bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-tr-none shadow-lg shadow-cyan-500/10'
                  : 'bg-slate-900/90 border border-cyan-500/20 text-slate-100 rounded-tl-none backdrop-blur-md shadow-xl'
              }`}
            >
              <p>{msg.text}</p>

              {!isUser && (
                <div className="mt-2.5 pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-bold">
                      Useless: {msg.uselessness || 85}%
                    </span>
                    {msg.meme && (
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 font-semibold">
                        🎭 {msg.meme}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => playVoice(msg.text)}
                    className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-cyan-300 transition-colors"
                    title="Replay Voice"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
