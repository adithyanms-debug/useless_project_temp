import React from 'react';
import { Mic, Square } from 'lucide-react';

export function MicButton({ state = 'IDLE', onStart, onStop }) {
  const isListening = state === 'LISTENING';
  const isBusy = state === 'THINKING' || state === 'SPEAKING';

  const handleClick = () => {
    if (isListening) {
      onStop();
    } else if (!isBusy) {
      onStart();
    }
  };

  return (
    <div className="flex flex-col items-center gap-2.5 my-3">
      <button
        onClick={handleClick}
        disabled={isBusy}
        className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 transform active:scale-95 shadow-xl focus:outline-none ${
          isListening
            ? 'bg-gradient-to-r from-pink-500 to-rose-500 shadow-pink-500/40 animate-pulse'
            : isBusy
            ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            : 'bg-gradient-to-r from-purple-600 to-pink-500 hover:scale-105 shadow-purple-500/30'
        }`}
        title={isListening ? "Click to Stop" : "Click to Speak"}
      >
        <div className="w-[68px] h-[68px] rounded-full bg-slate-950/75 backdrop-blur-md flex items-center justify-center border border-white/15">
          {isListening ? (
            <Square className="w-7 h-7 text-pink-400 fill-pink-400" />
          ) : (
            <Mic className={`w-7 h-7 ${isBusy ? 'text-slate-500' : 'text-purple-200'}`} />
          )}
        </div>
      </button>

      <p className="text-xs font-semibold text-slate-300">
        {isListening ? '🎙️ Listening... Tap to Send' : isBusy ? '⌛ Mandi is replying...' : 'Tap Mic & Speak'}
      </p>
    </div>
  );
}
