import React from 'react';
import { Smile } from 'lucide-react';

export function MoodDisplay({ mood = 'Overconfident 😎' }) {
  return (
    <div className="clean-card flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        <Smile className="w-4 h-4 text-pink-400" />
        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Mandi Mood
        </span>
      </div>

      <div className="px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-xs font-bold text-purple-300">
        {mood}
      </div>
    </div>
  );
}
