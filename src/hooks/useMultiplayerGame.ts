import { useState, useEffect, useCallback, useRef } from 'react';
import { ref, onValue, set, runTransaction, get, update, remove } from 'firebase/database';
import { db } from '@/lib/firebase/config';
import { signInAnonymouslyToFirebase, subscribeToAuthChanges } from '@/lib/firebase/auth';
import { setupPresence } from '@/lib/firebase/presence';
import { GameState, GameMode, PowerUpType, HintType } from '@/lib/game-engine/types';
import { recordGameStats } from '@/lib/firebase/stats';
import { 
  initializeGame, 
  submitWord as engineSubmitWord,
  loseLife as engineLoseLife,
  usePowerUp as engineUsePowerUp,
  useHint as engineUseHint,
  useAttackPowerup,
  getRequiredLetter
} from '@/lib/game-engine/gameEngine';
import { getTurnDuration } from '@/lib/game-engine/gameModes';
import { loadDictionary, getDictionarySize, generateHint } from '@/lib/game-engine/dictionary';
import { loadCategoryDictionary, getAvailableCategories } from '@/lib/game-engine/categoryDictionary';
import { useToast } from '@/components/ui/Toast';
import { sanitizePlayerName, sanitizeWord, sanitizeRoomCode } from '@/lib/sanitize';

export interface RoomState {
  status: 'lobby' | 'playing';
  mode: GameMode;
  hostId: string;
  players: Record<string, { name: string }>;
  gameState: GameState | null;
  presence?: Record<string, { state: string, lastChanged: number }>;
}

export function useMultiplayerGame() {
  const [isEngineLoaded, setIsEngineLoaded] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [currentHint, setCurrentHint] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  
  const { addToast } = useToast();
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const presenceCleanup = useRef<(() => void) | null>(null);

  // 1. Load Engine Dictionaries
  useEffect(() => {
    async function load() {
      if (getDictionarySize() > 0) {
        setIsEngineLoaded(true);
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
        setIsEngineLoaded(true);
      } catch (err) {
        console.error('Failed to load dictionaries', err);
        addToast('Failed to load game data', 'danger');
      }
    }
    load();
  }, [addToast]);

  // 2. Auth
  useEffect(() => {
    const unsub = subscribeToAuthChanges((user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        signInAnonymouslyToFirebase().catch(e => {
          console.error("Auth error", e);
          addToast("Failed to authenticate", "danger");
        });
      }
    });
    return () => unsub();
  }, [addToast]);

  // 3. Listen to Room State
  useEffect(() => {
    if (!roomId || !userId) return;

    const roomRef = ref(db, `rooms/${roomId}`);
    const unsub = onValue(roomRef, (snap) => {
      const data = snap.val();
      if (data) {
        if (data.gameState && !data.gameState.wordHistory) {
          data.gameState.wordHistory = [];
        }
        
        // Record stats if finished
        if (data.gameState?.status === 'finished' && userId && data.players[userId]) {
          recordGameStats(userId, roomId, data.gameState, data.players[userId].name).catch(console.error);
        }
        
        setRoomState(data as RoomState);
      } else {
        addToast("Room not found or closed", "danger");
        setRoomId(null);
      }
    });

    presenceCleanup.current = setupPresence(roomId, userId);

    const connectedRef = ref(db, '.info/connected');
    const unsubConnected = onValue(connectedRef, (snap) => {
      setIsOffline(snap.val() === false);
    });

    return () => {
      unsub();
      unsubConnected();
      if (presenceCleanup.current) {
        presenceCleanup.current();
      }
    };
  }, [roomId, userId, addToast]);

  // 4. Timer & Host Duties
  useEffect(() => {
    if (!roomState || roomState.status !== 'playing' || !roomState.gameState) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const gs = roomState.gameState!;
    const turnDuration = (getTurnDuration(gs.mode) * 1000) + (gs.extraTimeAdded || 0);
    const isHost = roomState.hostId === userId;

    timerRef.current = setInterval(() => {
      // Local timer update for UI
      const elapsed = Date.now() - gs.currentTurnStartTime;
      const remaining = Math.max(0, (turnDuration / 1000) - (elapsed / 1000));
      setTimeRemaining(remaining);

      if (isHost && remaining <= 0) {
        // Time out handling by Host
        const currentPlayerId = gs.playerOrder[gs.currentPlayerIndex];
        
        // Timeout normally happens at elapsed >= turnDuration. 
        // If they are online, trigger at 0. If offline, wait for offlineGracePassed.
        const playerPresence = roomState.presence?.[currentPlayerId];
        const isOffline = playerPresence?.state === 'offline';
        const offlineGracePassed = isOffline && (Date.now() - (playerPresence.lastChanged || 0)) > 15000;
        const shouldTimeout = !isOffline || offlineGracePassed;

        if (shouldTimeout) {
          // Transaction to safely update state
          runTransaction(ref(db, `rooms/${roomId}/gameState`), (currentGs: GameState | null) => {
            if (!currentGs || currentGs.currentTurnStartTime !== gs.currentTurnStartTime) {
              return; // abort, already advanced
            }
            if (!currentGs.wordHistory) currentGs.wordHistory = [];
            return engineLoseLife(currentGs, currentPlayerId);
          });
        }
      }
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [roomState, roomId, userId]);

  // Actions
  const createRoom = useCallback(async (playerName: string, forcedRoomId?: string) => {
    if (!userId) return;
    const safeName = sanitizePlayerName(playerName);
    const newRoomId = forcedRoomId ? sanitizeRoomCode(forcedRoomId) : Math.random().toString(36).substring(2, 6).toUpperCase();
    
    try {
      await set(ref(db, `rooms/${newRoomId}`), {
        status: 'lobby',
        mode: 'classic',
        hostId: userId,
        players: {
          [userId]: { name: safeName }
        },
        gameState: null
      });
      setRoomId(newRoomId);
    } catch (err: any) {
      console.error('Failed to create room', err);
      addToast(err.message || 'Failed to create room. Permission denied.', 'danger');
    }
  }, [userId, addToast]);

  const joinRoom = useCallback(async (joinCode: string, playerName: string) => {
    if (!userId) return;
    const code = sanitizeRoomCode(joinCode);
    const safeName = sanitizePlayerName(playerName);
    const roomRef = ref(db, `rooms/${code}`);
    const snap = await get(roomRef);
    if (!snap.exists()) {
      addToast("Room not found", "danger");
      return;
    }
    
    // Use set on the specific user node to avoid parent-level permission denial
    try {
      await set(ref(db, `rooms/${code}/players/${userId}`), { name: safeName });
      setRoomId(code);
    } catch (err: any) {
      console.error('Failed to join room', err);
      addToast(err.message || 'Failed to join room. Room might be full or closed.', 'danger');
    }
  }, [userId, addToast]);

  const leaveRoom = useCallback(async () => {
    if (!roomId || !userId || !roomState) return;
    
    try {
      if (roomState.hostId === userId) {
        // Host leaves: delete the entire room
        await remove(ref(db, `rooms/${roomId}`));
      } else {
        // Guest leaves: remove themselves from players list
        await remove(ref(db, `rooms/${roomId}/players/${userId}`));
      }
    } catch (err) {
      console.error('Failed to leave room cleanly', err);
    }
    
    setRoomId(null);
    setRoomState(null);
  }, [roomId, userId, roomState]);

  const startGame = useCallback((mode: GameMode) => {
    if (!roomId || !roomState || roomState.hostId !== userId) return;
    
    // Prepare player config
    const playersConfig = Object.entries(roomState.players).map(([id, p]) => ({ id, name: p.name }));
    const initialState = initializeGame(roomId, mode, playersConfig);
    
    if (mode === 'category') {
        const cats = getAvailableCategories();
        initialState.currentCategory = cats[Math.floor(Math.random() * cats.length)];
    }

    // Update room fields directly to pass security rules
    try {
      update(ref(db, `rooms/${roomId}`), {
        status: 'playing',
        mode: mode,
        gameState: initialState
      });
    } catch (err: any) {
      console.error('Failed to start game', err);
      addToast(err.message || 'Failed to start game.', 'danger');
    }

  }, [roomId, roomState, userId, addToast]);

  const submit = useCallback((word: string) => {
    if (!roomId || !roomState || !roomState.gameState || !userId) return false;

    const safeWord = sanitizeWord(word);
    if (!safeWord) {
      addToast('Invalid input', 'danger');
      return false;
    }

    const gs = roomState.gameState;
    const currentPlayerId = gs.playerOrder[gs.currentPlayerIndex];
    
    // Optimistic check
    const result = engineSubmitWord(gs, currentPlayerId, safeWord);
    const nextState = result.state;

    // Apply category mode changes if valid
    if (result.isValid && nextState.mode === 'category' && nextState.wordHistory.length % 5 === 0) {
        const cats = getAvailableCategories();
        nextState.currentCategory = cats[Math.floor(Math.random() * cats.length)];
    }

    // Optimistic Update Local State
    setRoomState({ ...roomState, gameState: nextState });
    
    if (result.isValid) {
      setCurrentHint(null);
    } else {
      addToast(result.error || 'Invalid word', 'danger');
    }

    // Send to Firebase atomically
    runTransaction(ref(db, `rooms/${roomId}/gameState`), (currentGs: GameState | null) => {
      // If server state moved on (e.g., someone else played or timed out), abort
      if (!currentGs || currentGs.currentTurnStartTime !== gs.currentTurnStartTime) {
        return; // transaction aborted, onValue listener will rollback UI
      }
      if (!currentGs.wordHistory) currentGs.wordHistory = [];
      const res = engineSubmitWord(currentGs, currentPlayerId, safeWord);
      
      const serverNextState = res.state;
      if (res.isValid && serverNextState.mode === 'category' && serverNextState.wordHistory.length % 5 === 0) {
          const cats = getAvailableCategories();
          serverNextState.currentCategory = cats[Math.floor(Math.random() * cats.length)];
      }
      return serverNextState;
    }).then(res => {
      if (!res.committed) {
         addToast("Submission rejected by server", "warning");
      }
    });

    return result.isValid;
  }, [roomId, roomState, userId, addToast]);

  const activatePowerUp = useCallback((powerUp: PowerUpType) => {
    if (!roomId || !userId || !roomState?.gameState) return;
    const currentGs = roomState.gameState;
    
    // Optimistic
    const result = engineUsePowerUp(currentGs, userId, powerUp);
    if (!result.isValid) {
      addToast(result.error || "Can't use powerup", "warning");
      return;
    }
    
    setRoomState({ ...roomState, gameState: result.state });
    
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
    
    // Transaction
    runTransaction(ref(db, `rooms/${roomId}/gameState`), (serverGs: GameState | null) => {
      if (!serverGs) return;
      return engineUsePowerUp(serverGs, userId, powerUp).state;
    });
  }, [roomId, userId, roomState, addToast]);

  const activateHint = useCallback((hintType: HintType) => {
    if (!roomId || !userId || !roomState?.gameState) return;
    const currentGs = roomState.gameState;
    
    const result = engineUseHint(currentGs, userId, hintType);
    if (result.error) {
      addToast(result.error, "warning");
      return;
    }
    
    // Generate the actual hint payload
    const requiredLetter = getRequiredLetter(currentGs);
    if (requiredLetter) {
       const usedWords = currentGs.wordHistory.map(w => w.word);
       const hintWord = generateHint(requiredLetter, usedWords);
       if (hintWord) {
         const masked = hintWord.toUpperCase().split('').map((char, i) => {
           if (i === 0 || i === Math.floor(hintWord.length / 2) || i === hintWord.length - 1) return char;
           return '_';
         }).join('');
         setCurrentHint(masked);
         addToast(`Hint activated!`, 'success');
       } else {
         addToast(`No hints available!`, 'warning');
       }
    } else {
       addToast(`HINT: You can play any word right now!`, 'success');
    }
    
    setRoomState({ ...roomState, gameState: result.state });
    
    runTransaction(ref(db, `rooms/${roomId}/gameState`), (serverGs: GameState | null) => {
      if (!serverGs) return;
      return engineUseHint(serverGs, userId, hintType).state;
    });
  }, [roomId, userId, roomState, addToast]);

  const activateAttack = useCallback((attackerId: string, targetId: string) => {
    if (!roomId || !userId || !roomState?.gameState) return;
    const currentGs = roomState.gameState;
    
    // Optimistic
    const result = useAttackPowerup(currentGs, attackerId, targetId);
    if (!result.isValid) {
      addToast(result.error || "Attack failed", "warning");
      return;
    }
    
    setRoomState({ ...roomState, gameState: result.state });
    addToast(`⚔️ Attack launched against target!`, 'success');
    
    // Transaction
    runTransaction(ref(db, `rooms/${roomId}/gameState`), (serverGs: GameState | null) => {
      if (!serverGs) return;
      return useAttackPowerup(serverGs, attackerId, targetId).state;
    });
  }, [roomId, userId, roomState, addToast]);

  return {
    isEngineLoaded,
    userId,
    roomId,
    roomState,
    timeRemaining,
    currentHint,
    isOffline,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    submit,
    activatePowerUp,
    activateHint,
    activateAttack
  };
}
