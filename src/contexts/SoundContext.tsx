'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  playValidWordSound,
  playInvalidWordSound,
  playWinnerSound,
  playHoverSound as rawPlayHover,
  playClickSound as rawPlayClick,
} from '@/lib/audio';

interface SoundContextType {
  isMuted: boolean;
  toggleMute: () => void;
  playValidWord: () => void;
  playInvalidWord: () => void;
  playWinner: () => void;
  playHover: () => void;
  playClick: () => void;
}

const SoundContext = createContext<SoundContextType>({
  isMuted: true,
  toggleMute: () => {},
  playValidWord: () => {},
  playInvalidWord: () => {},
  playWinner: () => {},
  playHover: () => {},
  playClick: () => {},
});

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default sound state is Muted as per Phase 8 specification
  const [isMuted, setIsMuted] = useState<boolean>(true);

  // Initialize from localStorage on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('wordsnap_sound_muted');
      if (stored !== null) {
        setIsMuted(stored === 'true');
      } else {
        // Default to muted
        setIsMuted(true);
      }
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('wordsnap_sound_muted', String(next));
      }
      return next;
    });
  }, []);

  const playValidWord = useCallback(() => {
    if (!isMuted) playValidWordSound();
  }, [isMuted]);

  const playInvalidWord = useCallback(() => {
    if (!isMuted) playInvalidWordSound();
  }, [isMuted]);

  const playWinner = useCallback(() => {
    if (!isMuted) playWinnerSound();
  }, [isMuted]);

  const playHover = useCallback(() => {
    if (!isMuted) rawPlayHover();
  }, [isMuted]);

  const playClick = useCallback(() => {
    if (!isMuted) rawPlayClick();
  }, [isMuted]);

  return (
    <SoundContext.Provider
      value={{
        isMuted,
        toggleMute,
        playValidWord,
        playInvalidWord,
        playWinner,
        playHover,
        playClick,
      }}
    >
      {children}
    </SoundContext.Provider>
  );
};

export function useSound() {
  return useContext(SoundContext);
}
