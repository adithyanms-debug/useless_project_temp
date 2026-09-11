import React from 'react';
import { Gauge } from 'lucide-react';

export function UselessnessMeter({ percentage = 85 }) {
  const getLevel = (val) => {
    if (val < 40) return { text: 'Helpful ⚠️', color: 'from-emerald-400 to-teal-500' };
    if (val < 70) return { text: 'Slightly Obvious 🤓', color: 'from-amber-400 to-orange-500' };
    if (val < 88) return { text: 'Chaotic 🔥', color: 'from-purple-500 to-pink-500' };
    return { text: 'PEAK USELESSNESS 🤡', color: 'from-pink-500 to-purple-600' };
  };

  const lvl = getLevel(percentage);

  return (
    <div className="clean-card flex flex-col gap-2 w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Uselessness Meter
          </span>
        </div>
        <span className="text-sm font-black text-purple-300">
          {percentage}%
        </span>
      </div>

      <div className="w-full bg-slate-950/80 h-3 rounded-full overflow-hidden p-0.5 border border-white/10">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${lvl.color} meter-smooth`}
          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
        ></div>
      </div>

      <div className="flex justify-between items-center text-[11px] font-medium text-slate-400">
        <span>Level: <strong className="text-pink-400">{lvl.text}</strong></span>
        <span className="italic">₹499 Consultation</span>
      </div>
    </div>
  );
}
