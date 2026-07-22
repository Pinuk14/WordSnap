import React, { useEffect, useState } from 'react';

interface GameEventOverlayProps {
  currentEvent: string | null;
  deadlockLetter: string | null;
}

export function GameEventOverlay({ currentEvent, deadlockLetter }: GameEventOverlayProps) {
  const [visibleEvent, setVisibleEvent] = useState<string | null>(null);
  const [visibleDeadlock, setVisibleDeadlock] = useState<string | null>(null);

  // Briefly show event/deadlock overlays when they change
  useEffect(() => {
    if (currentEvent) {
      setVisibleEvent(currentEvent);
      const t = setTimeout(() => setVisibleEvent(null), 3000);
      return () => clearTimeout(t);
    }
  }, [currentEvent]);

  useEffect(() => {
    if (deadlockLetter) {
      setVisibleDeadlock(deadlockLetter);
      const t = setTimeout(() => setVisibleDeadlock(null), 3000);
      return () => clearTimeout(t);
    }
  }, [deadlockLetter]);

  if (!visibleEvent && !visibleDeadlock) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      {/* Semi-transparent flash background */}
      <div className="absolute inset-0 bg-background/90 animate-[fadeOut_3s_ease-in-out_forwards]" />
      
      <div className="relative z-10 flex flex-col items-center animate-[popIn_0.5s_ease-out]">
        {visibleDeadlock && (
          <div className="text-center">
            <h2 className="font-display text-4xl md:text-6xl text-foreground drop-shadow-[4px_4px_0_#FF2E93]">
              LETTER CHANGED!
            </h2>
            <p className="font-sans text-xl mt-4 font-bold tracking-widest text-black bg-card px-4 py-2 border-4 border-foreground rotate-[-2deg]">
              NEW LETTER: <span className="text-primary font-display text-3xl">{visibleDeadlock}</span>
            </p>
          </div>
        )}

        {visibleEvent && !visibleDeadlock && (
          <div className="text-center">
            <h2 className="font-display text-5xl md:text-7xl text-white drop-shadow-[6px_6px_0_#000] uppercase tracking-widest px-4 py-2 border-y-8 border-black bg-danger rotate-2">
              {visibleEvent.replace('_', ' ')}
            </h2>
          </div>
        )}
      </div>
    </div>
  );
}
