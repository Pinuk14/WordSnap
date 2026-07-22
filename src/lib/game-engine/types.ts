export type GameMode = 'classic' | 'speed' | 'category';

export type PowerUpType = 'shield' | 'extra_time' | 'double_score' | 'life_restore' | 'letter_switch' | 'attack';
export type BonusEventType = 'rapid_fire' | 'double_points' | 'long_word_bonus' | 'reverse_chain' | 'vowel_frenzy';
export type HintType = 'first_letter' | 'length' | 'suggestions' | 'common_continuation';

export interface PlayerStats {
  longestStreak: number;
  hintsUsed: number;
  powerUpsUsed: number;
  perfectRounds: number;
  deadlocksSurvived: number;
}

export interface Player {
  id: string;
  name: string;
  score: number;
  lives: number;
  isEliminated: boolean;
  avatarUrl?: string;
  hints: number;
  powerUps: PowerUpType[];
  streak: number;
  activePowerUp: PowerUpType | null;
  shieldTurnsLeft?: number;
  stats: PlayerStats;
}

export interface WordSubmission {
  word: string;
  playerId: string;
  timestamp: number;
  points: number;
  pointBreakdown?: string[];
}

export interface GameState {
  roomId: string;
  mode: GameMode;
  status: 'waiting' | 'playing' | 'finished';
  players: Record<string, Player>;
  playerOrder: string[];
  currentPlayerIndex: number;
  wordHistory: WordSubmission[];
  currentTurnStartTime: number;
  winnerId: string | null;
  roundsCompleted?: number;
  
  // Events & Mechanics
  currentEvent: BonusEventType | null;
  turnsSinceLastEvent: number;
  deadlockCounter: number;
  deadlockLetterOverride: string | null;
  extraTimeAdded?: number;
  
  // Category mode specifics
  currentCategory?: string;
  categoryRound?: number;
}
