import React, { useRef, useEffect } from 'react';

interface MinimalInputProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: (e?: React.FormEvent) => void;
  isInvalid: boolean;
  disabled: boolean;
  placeholder?: string;
  currentHint?: string | null;
}

export function MinimalInput({ value, onChange, onSubmit, isInvalid, disabled, placeholder, currentHint }: MinimalInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input automatically, especially useful after re-renders
  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

  const chars = value.split('');

  return (
    <form 
      onSubmit={onSubmit} 
      className="w-full flex flex-col items-center justify-center mt-4 md:mt-8 relative cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      <div className={`relative w-full transition-transform duration-200 ${isInvalid ? 'animate-shake' : ''} flex justify-center items-end gap-2 md:gap-4 flex-wrap min-h-[4rem] md:min-h-[6rem] px-4`}>
        
        {/* Glow effect when active */}
        {!disabled && (
           <div className="absolute inset-0 bg-primary/20 blur-2xl animate-pulse pointer-events-none rounded-[100px]" />
        )}

        {/* Invisible real input for mobile keyboard support */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^A-Za-z]/g, ''))} // only allow letters
          disabled={disabled}
          className="absolute inset-0 opacity-0 cursor-text z-20 w-full h-full text-transparent"
          autoFocus
          autoComplete="off"
          spellCheck="false"
          aria-label={placeholder || "Type a word..."}
        />

        {/* Custom Typewriter Letters and Hints combined */}
        {Array.from({ length: Math.max(chars.length + (!disabled ? 1 : 0), currentHint?.length || 0) }).map((_, i) => {
          const typedChar = chars[i];
          const hintChar = currentHint?.[i];
          const isCursor = !disabled && i === chars.length;
          
          return (
            <div key={i} className="flex flex-col items-center justify-end h-16 md:h-24 min-w-[2rem] md:min-w-[4rem] relative">
              {/* Hint Character Background */}
              {!typedChar && hintChar && (
                 <span className="absolute bottom-2 md:bottom-4 font-display text-5xl md:text-8xl lg:text-[100px] uppercase leading-none opacity-20 text-foreground pointer-events-none">
                   {hintChar}
                 </span>
              )}
              
              {/* Typed Character */}
              {typedChar && (
                <span className={`font-display text-5xl md:text-8xl lg:text-[100px] uppercase mb-1 md:mb-2 leading-none drop-shadow-md animate-[popIn_0.1s_ease-out] relative z-10 ${isInvalid ? 'text-danger' : 'text-foreground'}`}>
                  {typedChar}
                </span>
              )}
              
              {/* Cursor */}
              {isCursor && !typedChar && !hintChar && (
                 <span className="font-display text-5xl md:text-8xl lg:text-[100px] uppercase mb-1 md:mb-2 leading-none opacity-0">_</span>
              )}

              {/* Underline */}
              <div className={`w-full h-1 md:h-2 rounded z-10 ${
                typedChar && isInvalid ? 'bg-danger' : 
                isCursor ? 'bg-foreground/50 animate-pulse' : 
                (typedChar || hintChar) ? 'bg-foreground' : 'bg-transparent'
              }`} />
            </div>
          );
        })}

      </div>
      
      {/* Hidden submit button to allow Enter key to work natively without visual clutter */}
      <button type="submit" className="hidden" disabled={disabled || !value.trim()}>
        Submit
      </button>
    </form>
  );
}
