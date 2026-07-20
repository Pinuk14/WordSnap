import { useState, useEffect, useCallback, useRef } from 'react';
import { ref, onValue, set, runTransaction, get } from 'firebase/database';
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
  getRequiredLetter
} from '@/lib/game-engine/gameEngine';
import { getTurnDuration } from '@/lib/game-engine/gameModes';
import { loadDictionary, getDictionarySize, generateHint } from '@/lib/game-engine/dictionary';
import { loadCategoryDictionary, getAvailableCategories } from '@/lib/game-engine/categoryDictionary';
import { useToast } from '@/components/ui/Toast';

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
    const newRoomId = forcedRoomId || Math.random().toString(36).substring(2, 6).toUpperCase();
    
    await set(ref(db, `rooms/${newRoomId}`), {
      status: 'lobby',
      mode: 'classic',
      hostId: userId,
      players: {
        [userId]: { name: playerName }
      },
      gameState: null
    });
    
    setRoomId(newRoomId);
  }, [userId]);

  const joinRoom = useCallback(async (joinCode: string, playerName: string) => {
    if (!userId) return;
    const code = joinCode.toUpperCase();
    const roomRef = ref(db, `rooms/${code}`);
    const snap = await get(roomRef);
    if (!snap.exists()) {
      addToast("Room not found", "danger");
      return;
    }
    
    // Use transaction to add player to avoid race conditions
    await runTransaction(ref(db, `rooms/${code}/players`), (players) => {
      if (!players) return players;
      players[userId] = { name: playerName };
      return players;
    });

    setRoomId(code);
  }, [userId, addToast]);

  const startGame = useCallback((mode: GameMode) => {
    if (!roomId || !roomState || roomState.hostId !== userId) return;
    
    // Prepare player config
    const playersConfig = Object.entries(roomState.players).map(([id, p]) => ({ id, name: p.name }));
    const initialState = initializeGame(roomId, mode, playersConfig);
    
    if (mode === 'category') {
        const cats = getAvailableCategories();
        initialState.currentCategory = cats[Math.floor(Math.random() * cats.length)];
    }

    // Update room
    runTransaction(ref(db, `rooms/${roomId}`), (room) => {
      if (!room) return room;
      room.status = 'playing';
      room.mode = mode;
      room.gameState = initialState;
      return room;
    });

  }, [roomId, roomState, userId]);

  const submit = useCallback((word: string) => {
    if (!roomId || !roomState || !roomState.gameState || !userId) return false;

    const gs = roomState.gameState;
    const currentPlayerId = gs.playerOrder[gs.currentPlayerIndex];
    
    // Optimistic check
    const result = engineSubmitWord(gs, currentPlayerId, word);
    if (!result.isValid) {
      addToast(result.error || 'Invalid word', 'danger');
      return false;
    }

    const nextState = result.state;
    if (nextState.mode === 'category' && nextState.wordHistory.length % 5 === 0) {
        const cats = getAvailableCategories();
        nextState.currentCategory = cats[Math.floor(Math.random() * cats.length)];
    }

    // Optimistic Update Local State
    setRoomState({ ...roomState, gameState: nextState });

    // Send to Firebase atomically
    runTransaction(ref(db, `rooms/${roomId}/gameState`), (currentGs: GameState | null) => {
      // If server state moved on (e.g., someone else played or timed out), abort
      if (!currentGs || currentGs.currentTurnStartTime !== gs.currentTurnStartTime) {
        return; // transaction aborted, onValue listener will rollback UI
      }
      if (!currentGs.wordHistory) currentGs.wordHistory = [];
      
      const serverResult = engineSubmitWord(currentGs, currentPlayerId, word);
      if (serverResult.isValid) {
        const serverNext = serverResult.state;
        if (serverNext.mode === 'category' && serverNext.wordHistory.length % 5 === 0) {
            // Keep deterministic category if possible, or just generate
            serverNext.currentCategory = nextState.currentCategory;
        }
        return serverNext;
      }
      return;
    }).then(res => {
      if (!res.committed) {
         addToast("Submission rejected by server", "warning");
      }
    });

    return true;
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
         addToast(`HINT: Try a word starting with ${hintWord.slice(0, 2).toUpperCase()}... (Length: ${hintWord.length})`, 'success');
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

  return {
    isEngineLoaded,
    userId,
    roomId,
    roomState,
    timeRemaining,
    isOffline,
    createRoom,
    joinRoom,
    startGame,
    submit,
    activatePowerUp,
    activateHint
  };
}
