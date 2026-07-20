import { GameMode } from './types';
import { normalizeWord } from './helpers';
import { SPEED_MODE_MULTIPLIER } from './constants';

export function calculateWordScore(word: string, mode: GameMode, streak: number = 0): number {
  const normalized = normalizeWord(word);
  
  // Base score: 10 points per letter
  let score = normalized.length * 10;
  
  // Length bonuses
  if (normalized.length >= 6) score += 20;
  if (normalized.length >= 8) score += 30;

  // Streak multiplier (e.g., 1.0, 1.1, 1.2...)
  const streakMultiplier = 1 + (streak * 0.1);
  score = Math.floor(score * streakMultiplier);

  // Mode multipliers
  if (mode === 'speed') {
    score = Math.floor(score * SPEED_MODE_MULTIPLIER);
  }

  return score;
}
