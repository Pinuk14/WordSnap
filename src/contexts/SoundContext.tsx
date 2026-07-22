'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  playValidWordSound,
  playInvalidWordSound,
  playWinnerSound,
  playHoverSound as rawPlayHover,
  playClickSound as rawPlayClick,
  playTypeLetterSound,
  playDeleteLetterSound,
  playCountdownSound,
  playHeartLossSound,
  playPowerup1Sound,
  playPowerup2Sound,
  playPowerup3Sound,
  playAchievementSound,
} from '@/lib/audio';

interface SoundContextType {
  isMuted: boolean;
  toggleMute: () => void;
  playValidWord: () => void;
  playInvalidWord: () => void;
  playWinner: () => void;
  playHover: () => void;
  playClick: () => void;
  playTypeLetter: () => void;
  playDeleteLetter: () => void;
  playCountdown: () => void;
  playHeartLoss: () => void;
  playPowerup1: () => void;
  playPowerup2: () => void;
  playPowerup3: () => void;
  playAchievement: () => void;
}

const SoundContext = createContext<SoundContextType>({
  isMuted: true,
  toggleMute: () => {},
  playValidWord: () => {},
  playInvalidWord: () => {},
  playWinner: () => {},
  playHover: () => {},
  playClick: () => {},
  playTypeLetter: () => {},
  playDeleteLetter: () => {},
  playCountdown: () => {},
  playHeartLoss: () => {},
  playPowerup1: () => {},
  playPowerup2: () => {},
  playPowerup3: () => {},
  playAchievement: () => {},
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

  const playTypeLetter = useCallback(() => {
    if (!isMuted) playTypeLetterSound();
  }, [isMuted]);

  const playDeleteLetter = useCallback(() => {
    if (!isMuted) playDeleteLetterSound();
  }, [isMuted]);

  const playCountdown = useCallback(() => {
    if (!isMuted) playCountdownSound();
  }, [isMuted]);

  const playHeartLoss = useCallback(() => {
    if (!isMuted) playHeartLossSound();
  }, [isMuted]);

  const playPowerup1 = useCallback(() => {
    if (!isMuted) playPowerup1Sound();
  }, [isMuted]);

  const playPowerup2 = useCallback(() => {
    if (!isMuted) playPowerup2Sound();
  }, [isMuted]);

  const playPowerup3 = useCallback(() => {
    if (!isMuted) playPowerup3Sound();
  }, [isMuted]);

  const playAchievement = useCallback(() => {
    if (!isMuted) playAchievementSound();
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
        playTypeLetter,
        playDeleteLetter,
        playCountdown,
        playHeartLoss,
        playPowerup1,
        playPowerup2,
        playPowerup3,
        playAchievement,
      }}
    >
      {children}
    </SoundContext.Provider>
  );
};

export function useSound() {
  return useContext(SoundContext);
}
