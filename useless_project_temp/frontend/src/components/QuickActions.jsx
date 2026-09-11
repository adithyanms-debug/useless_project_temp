import React from 'react';
import { HelpCircle, AlertCircle, Shuffle, Heart } from 'lucide-react';

export function QuickActions({
  onWhy,
  onSure,
  onRandom,
  onRelationship,
  whyCount = 0,
  isDisabled = false
}) {
  return (
    <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 my-2.5">
      <button
        onClick={onSure}
        disabled={isDisabled}
        className="simple-btn simple-btn-pink justify-center text-xs"
        title="Challenge Mandi's confidence!"
      >
        <AlertCircle className="w-4 h-4 text-pink-400" />
        <span>ARE YOU SURE?</span>
      </button>

      <button
        onClick={onWhy}
        disabled={isDisabled}
        className="simple-btn justify-center text-xs relative"
        title="Ask WHY repeatedly"
      >
        <HelpCircle className="w-4 h-4 text-purple-400" />
        <span>WHY?</span>
        {whyCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full bg-pink-500 text-white text-[10px] font-bold flex items-center justify-center">
            {whyCount}
          </span>
        )}
      </button>

      <button
        onClick={onRandom}
        disabled={isDisabled}
        className="simple-btn justify-center text-xs"
        title="Get random wisdom"
      >
        <Shuffle className="w-4 h-4 text-indigo-400" />
        <span>Random Advice</span>
      </button>

      <button
        onClick={onRelationship}
        disabled={isDisabled}
        className="simple-btn justify-center text-xs"
        title="Should I text her?"
      >
        <Heart className="w-4 h-4 text-rose-400" />
        <span>Text Crush?</span>
      </button>
    </div>
  );
}
