import React from 'react';
import { Sparkles, Radio } from 'lucide-react';

export function Header({ isLive = true }) {
  return (
    <header className="w-full flex items-center justify-between pb-4 border-b border-white/10 mb-4 gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-xl shadow-lg shadow-purple-500/20">
          🤡
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight title-gradient">
              MANDI
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              v1.0
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-0.5">
            <Sparkles className="w-3 h-3 text-purple-400" />
            The Useless AI Voice Friend
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-slate-300">
        <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`}></span>
        <Radio className="w-3.5 h-3.5 text-purple-400" />
        <span className="hidden sm:inline">Gemini AI Ready</span>
      </div>
    </header>
  );
}
