import React from 'react';

interface HintButtonProps {
  hintsRemaining: number;
  onActivate: () => void;
  disabled: boolean;
}

export function HintButton({ hintsRemaining, onActivate, disabled }: HintButtonProps) {
  if (hintsRemaining <= 0) return null;

  return (
    <div className="absolute top-4 right-4 md:top-8 md:right-8">
      <button
        onClick={onActivate}
        disabled={disabled || hintsRemaining <= 0}
        className="
          group relative flex items-center justify-center w-10 h-10 md:w-12 md:h-12 
          bg-transparent border-2 border-gray-600 text-gray-500 rounded-full
          hover:border-foreground hover:text-foreground hover:bg-foreground/10 transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-foreground
          disabled:opacity-30 disabled:cursor-not-allowed
        "
        aria-label="Use Hint"
      >
        <span className="font-display text-xl md:text-2xl">?</span>
        
        {/* Tooltip */}
        <div className="absolute -left-20 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <span className="bg-black text-white text-xs font-bold px-2 py-1 rounded whitespace-nowrap">
            Hint ({hintsRemaining})
          </span>
        </div>
      </button>
    </div>
  );
}
