import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, GameMode, PowerUpType, HintType } from '@/lib/game-engine/types';
import { 
  initializeGame, 
  submitWord as engineSubmitWord,
  loseLife as engineLoseLife,
  usePowerUp as engineUsePowerUp,
  useHint as engineUseHint,
  getRequiredLetter
} from '@/lib/game-engine/gameEngine';
import { getTurnDuration } from '@/lib/game-engine/gameModes';
import { loadDictionary, getDictionarySize, generateHint } from '@/lib/game-engine/dictionary';
import { loadCategoryDictionary, getAvailableCategories } from '@/lib/game-engine/categoryDictionary';
import { useToast } from '@/components/ui/Toast';

export function useLocalGame() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const { addToast } = useToast();
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load dictionaries
  useEffect(() => {
    async function load() {
      if (getDictionarySize() > 0) {
        setIsLoaded(true);
        return;
      }
      try {
        const res = await fetch('/dictionary/words-filtered.txt');
        const text = await res.text();
        loadDictionary(text);

        const categories = ['animals', 'fruits', 'vegetables'];
        for (const cat of categories) {
          const catRes = await fetch(`/dictionary/categories/${cat}.json`);
          const catWords = await catRes.json();
          loadCategoryDictionary(cat, catWords);
        }
        setIsLoaded(true);
      } catch (err) {
        console.error('Failed to load dictionaries', err);
        addToast('Failed to load game data', 'danger');
      }
    }
    load();
  }, [addToast]);

  // Handle timer
  useEffect(() => {
    if (!gameState || gameState.status !== 'playing') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const turnDuration = (getTurnDuration(gameState.mode) * 1000) + (gameState.extraTimeAdded || 0);
    
    // We update UI every 100ms for smooth progress bar
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - gameState.currentTurnStartTime;
      const remaining = Math.max(0, (turnDuration / 1000) - (elapsed / 1000));
      setTimeRemaining(remaining);
      
      if (remaining <= 0) {
        // Time out
        const currentPlayerId = gameState.playerOrder[gameState.currentPlayerIndex];
        const playerBefore = gameState.players[currentPlayerId];
        const wasShieldActive = playerBefore?.activePowerUp === 'shield';
        const newState = engineLoseLife(gameState, currentPlayerId);
        setGameState(newState);
        if (wasShieldActive) {
          addToast(`🛡️ ${playerBefore.name}'s Shield blocked the life loss!`, 'info');
        } else {
          addToast(`Time is up! ${playerBefore?.name || 'Player'} lost a life.`, 'danger');
        }
      }
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, addToast]);

  const startGame = useCallback((mode: GameMode, players: { id: string, name: string }[]) => {
    const initialState = initializeGame('local-room', mode, players);
    // In category mode, select a random category for the first turn
    if (mode === 'category') {
        const cats = getAvailableCategories();
        initialState.currentCategory = cats[Math.floor(Math.random() * cats.length)];
    }
    setGameState(initialState);
  }, []);

  const submit = useCallback((word: string) => {
    if (!gameState || gameState.status !== 'playing') return false;

    const currentPlayerId = gameState.playerOrder[gameState.currentPlayerIndex];
    const result = engineSubmitWord(gameState, currentPlayerId, word);

    if (result.isValid) {
      const nextState = result.state;
      // If category mode, change category every 5 turns
      if (nextState.mode === 'category' && nextState.wordHistory.length % 5 === 0) {
          const cats = getAvailableCategories();
          nextState.currentCategory = cats[Math.floor(Math.random() * cats.length)];
          addToast(`Category changed to ${nextState.currentCategory.toUpperCase()}!`, 'success');
      }

      setGameState(nextState);
      return true;
    } else {
      addToast(result.error || 'Invalid word', 'danger');
      return false;
    }
  }, [gameState, addToast]);

  const activatePowerUp = useCallback((powerUp: PowerUpType) => {
    if (!gameState) return;
    const currentPlayerId = gameState.playerOrder[gameState.currentPlayerIndex];
    const result = engineUsePowerUp(gameState, currentPlayerId, powerUp);
    
    if (result.isValid) {
      setGameState(result.state);
      // Give feedback toast based on activated power-up
      switch (powerUp) {
        case 'shield':
          addToast('🛡️ Shield activated! Protected against next time-out.', 'success');
          break;
        case 'extra_time':
          addToast('⏱️ +5 Seconds added to turn timer!', 'success');
          break;
        case 'double_score':
          addToast('🔥 Double Score activated for your next valid word!', 'success');
          break;
        case 'life_restore':
          addToast('❤️ +1 Life restored!', 'success');
          break;
        case 'letter_switch':
          addToast(`🔤 Required letter switched to ${result.state.deadlockLetterOverride || 'new letter'}!`, 'success');
          break;
      }
    } else {
      addToast(result.error || "Can't use powerup", 'warning');
    }
  }, [gameState, addToast]);

  const activateHint = useCallback((hintType: HintType) => {
    if (!gameState) return;
    const currentPlayerId = gameState.playerOrder[gameState.currentPlayerIndex];
    const result = engineUseHint(gameState, currentPlayerId, hintType);
    
    if (result.error) {
      addToast(result.error, 'warning');
    } else {
       // Generate the actual hint payload
       const requiredLetter = getRequiredLetter(gameState);
       if (requiredLetter) {
          const usedWords = gameState.wordHistory.map(w => w.word);
          const hintWord = generateHint(requiredLetter, usedWords);
          if (hintWord) {
            addToast(`HINT: Try a word starting with ${hintWord.slice(0, 2).toUpperCase()}... (Length: ${hintWord.length})`, 'success');
          } else {
            addToast(`No hints available!`, 'warning');
          }
       } else {
          addToast(`HINT: You can play any word right now!`, 'success');
       }
      setGameState(result.state);
    }
  }, [gameState, addToast]);

  return {
    isLoaded,
    gameState,
    timeRemaining,
    startGame,
    submit,
    activatePowerUp,
    activateHint
  };
}
