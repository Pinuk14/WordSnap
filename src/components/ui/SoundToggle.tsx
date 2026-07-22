'use client';

import React from 'react';
import { useSound } from '@/contexts/SoundContext';

export function SoundToggle({ className = '' }: { className?: string }) {
  const { isMuted, toggleMute } = useSound();

  return (
    <button
      onClick={toggleMute}
      aria-label={isMuted ? 'Unmute sound effects' : 'Mute sound effects'}
      aria-pressed={!isMuted}
      title={isMuted ? 'Unmute sound effects' : 'Mute sound effects'}
      className={`
        flex items-center justify-center gap-1.5 px-3 py-2
        bg-card text-foreground
        border-2 border-black rounded-brutal
        shadow-[2px_2px_0_#000]
        hover:translate-y-[1px] hover:shadow-[1px_1px_0_#000]
        focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-2
        transition-all font-bold text-sm select-none
        ${className}
      `}
    >
      <span className="text-base leading-none" aria-hidden="true">
        {isMuted ? '🔇' : '🔊'}
      </span>
      <span className="hidden sm:inline font-display text-xs uppercase">
        {isMuted ? 'MUTED' : 'SOUND'}
      </span>
    </button>
  );
}
