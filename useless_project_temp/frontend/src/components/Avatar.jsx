import React from 'react';

export function Avatar({ state = 'IDLE' }) {
  const getConfig = () => {
    switch (state) {
      case 'LISTENING':
        return {
          emoji: '👂',
          text: 'Listening to you...',
          border: 'border-pink-500',
          glow: 'shadow-[0_0_30px_rgba(236,72,153,0.4)]',
          badgeBg: 'bg-pink-500/20 text-pink-300 border-pink-500/30'
        };
      case 'THINKING':
        return {
          emoji: '🤔',
          text: 'Mandi is thinking...',
          border: 'border-purple-500',
          glow: 'shadow-[0_0_30px_rgba(139,92,246,0.4)]',
          badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
        };
      case 'SPEAKING':
        return {
          emoji: '🗣️',
          text: 'Mandi is speaking...',
          border: 'border-indigo-400',
          glow: 'shadow-[0_0_35px_rgba(99,102,241,0.5)]',
          badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
        };
      case 'ERROR':
        return {
          emoji: '💀',
          text: 'Something went wrong',
          border: 'border-rose-500',
          glow: 'shadow-[0_0_20px_rgba(244,63,94,0.4)]',
          badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
        };
      case 'IDLE':
      default:
        return {
          emoji: '🤡',
          text: 'Tap mic & ask me anything!',
          border: 'border-purple-500/40',
          glow: 'shadow-[0_0_25px_rgba(139,92,246,0.25)]',
          badgeBg: 'bg-purple-500/10 text-purple-300 border-purple-500/20'
        };
    }
  };

  const current = getConfig();

  return (
    <div className="flex flex-col items-center justify-center my-3 relative">
      {/* Friendly Avatar Circle */}
      <div className={`w-36 h-36 rounded-full border-2 ${current.border} p-2 ${current.glow} avatar-gentle transition-all duration-300`}>
        <div className="w-full h-full rounded-full bg-slate-900/90 flex items-center justify-center border border-white/10 shadow-inner">
          <span className="text-6xl select-none filter drop-shadow-md">
            {current.emoji}
          </span>
        </div>
      </div>

      {/* Status Pill */}
      <div className={`mt-3 px-3.5 py-1 rounded-full border backdrop-blur-md text-xs font-semibold flex items-center gap-2 ${current.badgeBg}`}>
        <span className="w-2 h-2 rounded-full bg-current animate-ping"></span>
        <span>{current.text}</span>
      </div>
    </div>
  );
}
