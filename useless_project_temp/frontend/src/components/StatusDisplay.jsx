import React from 'react';

export function StatusDisplay({ transcript = '', appState = 'IDLE' }) {
  if (appState === 'LISTENING' && transcript) {
    return (
      <div className="w-full px-4 py-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 text-xs font-medium italic animate-pulse my-2 text-center">
        "{transcript}"
      </div>
    );
  }

  return null;
}
