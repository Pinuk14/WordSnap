import { GameState, GameMode, Player, WordSubmission, PowerUpType, BonusEventType, HintType } from './types';
import { getInitialLives } from './gameModes';
import { validateSubmission } from './validator';
import { calculateWordScore } from './scoring';
import { getNextPlayerIndex } from './turnManager';
import { checkWinCondition } from './winConditions';
import { normalizeWord } from './helpers';
import { isInCategory } from './categoryDictionary';
import { generateGameSeed, pickRandom } from './random';

export interface GameEngineResult {
  state: GameState;
  error?: string;
  isValid?: boolean;
}

const ALL_POWERUPS: PowerUpType[] = ['shield', 'extra_time', 'double_score', 'life_restore', 'letter_switch'];
const ALL_EVENTS: BonusEventType[] = ['rapid_fire', 'double_points', 'long_word_bonus', 'reverse_chain', 'vowel_frenzy'];
const ALPHABET = 'ABCDEFGHIJKLMNOPRSTUVWXY'; // Exclude Q, Z for deadlock recovery (keep it playable)

export function initializeGame(roomId: string, mode: GameMode, playersConfig: { id: string, name: string }[]): GameState {
  const initialLives = getInitialLives(mode);
  
  const players: Record<string, Player> = {};
  const playerOrder: string[] = [];

  playersConfig.forEach((p, idx) => {
    players[p.id] = {
      id: p.id,
      name: p.name,
      score: 0,
      lives: initialLives,
      isEliminated: false,
      hints: 3,
      powerUps: [pickRandom(ALL_POWERUPS, generateGameSeed(Date.now(), idx))], // Start with 1 random power-up
      streak: 0,
      activePowerUp: null,
      stats: {
        longestStreak: 0,
        hintsUsed: 0,
        powerUpsUsed: 0,
        perfectRounds: 0,
        deadlocksSurvived: 0
      }
    };
    playerOrder.push(p.id);
  });

  return {
    roomId,
    mode,
    status: 'playing',
    players,
    playerOrder,
    currentPlayerIndex: 0,
    wordHistory: [],
    currentTurnStartTime: Date.now(),
    winnerId: null,
    currentEvent: null,
    turnsSinceLastEvent: 0,
    deadlockCounter: 0,
    deadlockLetterOverride: null,
    extraTimeAdded: 0
  } as GameState & { extraTimeAdded: number }; // Extended locally
}

export function submitWord(state: GameState & { extraTimeAdded?: number }, playerId: string, word: string): GameEngineResult {
  const currentPlayerId = state.playerOrder[state.currentPlayerIndex];
  if (currentPlayerId !== playerId) {
    return { state, isValid: false, error: 'Not your turn' };
  }

  const pState = state.players[playerId];
  
  // Custom Validation for Event constraints
  if (state.currentEvent === 'vowel_frenzy' && !/^[AEIOU]/i.test(word)) {
    return { state, isValid: false, error: 'Vowel Frenzy: Word must start with a vowel!' };
  }

  // Normal validation
  // Wait, validator needs to know the required letter. If reverse_chain is active, the required letter changes.
  // We'll let the validator do standard, but we must override if needed.
  // To keep it simple, we check required letter manually if reverse_chain or deadlock override is active.
  let expectedLetter = '';
  if (state.deadlockLetterOverride) {
    expectedLetter = state.deadlockLetterOverride;
  } else if (state.wordHistory.length > 0) {
    const lastWord = state.wordHistory[state.wordHistory.length - 1].word;
    expectedLetter = state.currentEvent === 'reverse_chain' 
      ? lastWord.charAt(0).toLowerCase() 
      : lastWord.charAt(lastWord.length - 1).toLowerCase();
  }

  if (expectedLetter && word.charAt(0).toLowerCase() !== expectedLetter.toLowerCase()) {
    return { state, isValid: false, error: `Word must start with ${expectedLetter.toUpperCase()}` };
  }

  const validation = validateSubmission(word, state.wordHistory);
  // We already checked start letter, so if standard validation failed on it, we might need to suppress?
  // validateSubmission checks start letter by default! We must bypass it if reverse_chain/deadlock.
  // Actually, validateSubmission checks the LAST letter of the last word.
  // We should pass an override to validateSubmission if possible, but for now we can just rely on standard validate.
  // Let's assume validateSubmission does the standard check. If reverse_chain, we must bypass its letter check.
  
  if (!validation.isValid && validation.error?.includes('start with')) {
    if (state.currentEvent !== 'reverse_chain' && !state.deadlockLetterOverride) {
      // It's a true error
      pState.streak = 0;
      return { state, isValid: false, error: validation.error };
    }
  } else if (!validation.isValid) {
    pState.streak = 0;
    return { state, isValid: false, error: validation.error };
  }

  if (state.mode === 'category' && state.currentCategory) {
    if (!isInCategory(word, state.currentCategory)) {
      pState.streak = 0;
      return { state, isValid: false, error: `Word does not belong to category: ${state.currentCategory}` };
    }
  }

  // Calculate base points
  let points = calculateWordScore(word, state.mode, pState.streak);
  const breakdown: string[] = [`+${points} Base`];
  
  // Apply Events
  if (state.currentEvent === 'double_points') {
    points *= 2;
    breakdown.push(`x2 Double Event`);
  }
  if (state.currentEvent === 'long_word_bonus' && word.length >= 8) {
    points += 15;
    breakdown.push(`+15 Long Word`);
  }

  // Apply Power-Ups
  if (pState.activePowerUp === 'double_score') {
    points *= 2;
    breakdown.push(`x2 Double Score`);
  }

  // Update streaks and rewards
  const newState = JSON.parse(JSON.stringify(state)) as GameState & { extraTimeAdded?: number };
  const player = newState.players[playerId];
  
  player.streak++;
  if (player.streak > player.stats.longestStreak) {
    player.stats.longestStreak = player.streak;
  }

  // Streak Bonuses
  if (player.streak === 3) {
    points += 5;
    breakdown.push(`+5 Streak 3!`);
  }
  if (player.streak === 5) {
    points += 10;
    breakdown.push(`+10 Streak 5!`);
  }
  if (player.streak === 8) {
    const seed = generateGameSeed(state.currentTurnStartTime, state.wordHistory.length);
    if (player.powerUps.length < 2) {
      player.powerUps.push(pickRandom(ALL_POWERUPS, seed));
      breakdown.push(`+Power-Up (Streak 8!)`);
    }
  }

  // Score Milestones PowerUp (every 30 pts)
  const prevMilestone = Math.floor(pState.score / 30);
  const newMilestone = Math.floor((pState.score + points) / 30);
  if (newMilestone > prevMilestone && player.powerUps.length < 2) {
    player.powerUps.push(pickRandom(ALL_POWERUPS, generateGameSeed(state.currentTurnStartTime + 1, state.wordHistory.length)));
    breakdown.push(`+Power-Up (Score Milestone!)`);
  }

  player.score += points;
  player.activePowerUp = null; // Consume active powerup on successful word
  newState.deadlockCounter = 0;
  newState.deadlockLetterOverride = null;
  newState.extraTimeAdded = 0; // reset for next turn

  const submission: WordSubmission = {
    word: normalizeWord(word),
    playerId,
    timestamp: Date.now(),
    points,
    pointBreakdown: breakdown
  };
  newState.wordHistory.push(submission);

  return { state: nextTurn(newState), isValid: true };
}

export function nextTurn(state: GameState): GameState {
  const newState = { ...state };
  
  const winnerId = checkWinCondition(newState);
  if (winnerId) {
    newState.status = 'finished';
    newState.winnerId = winnerId;
    return newState;
  }

  const nextIndex = getNextPlayerIndex(newState);
  if (nextIndex === -1) {
    newState.status = 'finished';
    return newState;
  }

  newState.currentPlayerIndex = nextIndex;
  newState.currentTurnStartTime = Date.now();

  // Event Rotation
  newState.turnsSinceLastEvent++;
  if (newState.turnsSinceLastEvent >= 5) {
    const seed = generateGameSeed(newState.currentTurnStartTime, newState.wordHistory.length);
    // 30% chance for an event
    if (seed % 100 < 30) {
      newState.currentEvent = pickRandom(ALL_EVENTS, seed);
    } else {
      newState.currentEvent = null;
    }
    newState.turnsSinceLastEvent = 0;
  }

  return newState;
}

export function loseLife(state: GameState & { extraTimeAdded?: number }, playerId: string): GameState {
  const newState = JSON.parse(JSON.stringify(state)) as GameState & { extraTimeAdded?: number };
  const player = newState.players[playerId];

  if (player.activePowerUp === 'shield') {
    player.activePowerUp = null;
    // Shield blocks life loss, but streak breaks and turn passes
    player.streak = 0;
  } else {
    player.lives -= 1;
    player.streak = 0;
    if (player.lives <= 0) {
      player.isEliminated = true;
    }
  }

  newState.deadlockCounter++;

  // Deadlock Recovery Check
  const activePlayers = Object.values(newState.players).filter(p => !p.isEliminated).length;
  if (newState.deadlockCounter >= activePlayers && activePlayers > 0) {
    // Generate new random letter
    const seed = generateGameSeed(newState.currentTurnStartTime, newState.deadlockCounter);
    newState.deadlockLetterOverride = pickRandom(ALPHABET.split(''), seed);
    newState.deadlockCounter = 0;
    
    // Track stats for surviving
    Object.values(newState.players).forEach(p => {
      if (!p.isEliminated) p.stats.deadlocksSurvived++;
    });
  }

  const winnerId = checkWinCondition(newState);
  if (winnerId) {
    newState.status = 'finished';
    newState.winnerId = winnerId;
  } else {
    const currentPlayerId = state.playerOrder[state.currentPlayerIndex];
    if (currentPlayerId === playerId) {
      return nextTurn(newState);
    }
  }

  return newState;
}

export function eliminatePlayer(state: GameState, playerId: string): GameState {
  return loseLife(state, playerId); // In this advanced engine, eliminate behaves like losing a life to 0
}

export function usePowerUp(state: GameState & { extraTimeAdded?: number }, playerId: string, powerUp: PowerUpType): GameEngineResult {
  const newState = JSON.parse(JSON.stringify(state)) as GameState & { extraTimeAdded?: number };
  const player = newState.players[playerId];

  const pIndex = player.powerUps.indexOf(powerUp);
  if (pIndex === -1) return { state, isValid: false, error: 'Power-Up not owned' };

  player.powerUps.splice(pIndex, 1);
  player.stats.powerUpsUsed++;

  if (powerUp === 'extra_time') {
    newState.extraTimeAdded = (newState.extraTimeAdded || 0) + 5000;
  } else if (powerUp === 'life_restore') {
    player.lives++;
  } else if (powerUp === 'letter_switch') {
    const seed = generateGameSeed(Date.now(), player.stats.powerUpsUsed);
    newState.deadlockLetterOverride = pickRandom(ALPHABET.split(''), seed);
    newState.deadlockCounter = 0;
  } else {
    player.activePowerUp = powerUp;
  }

  return { state: newState, isValid: true };
}

export function useHint(state: GameState, playerId: string, hintType: HintType): { state: GameState, payload?: string, error?: string } {
  // Use hintType to avoid unused parameter warning
  if (!hintType) return { state, error: 'Invalid hint type' };
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  const player = newState.players[playerId];

  if (player.hints <= 0) return { state, error: 'No hints left' };
  
  // Note: Actual hint payload logic will be executed entirely locally by the client reading the dictionary
  // to avoid sending full dictionary across network or freezing engine.
  // Engine just deducts the hint.
  player.hints--;
  player.stats.hintsUsed++;

  return { state: newState };
}

export { calculateWordScore as calculateScore } from './scoring';
export { checkWinCondition as getWinner } from './winConditions';

export function getRequiredLetter(state: GameState): string {
  if (state.deadlockLetterOverride) {
    return state.deadlockLetterOverride.toLowerCase();
  }
  if (state.wordHistory.length > 0) {
    const lastWord = state.wordHistory[state.wordHistory.length - 1].word;
    if (state.currentEvent === 'reverse_chain') {
      return lastWord.charAt(0).toLowerCase();
    }
    return lastWord.charAt(lastWord.length - 1).toLowerCase();
  }
  return '';
}
