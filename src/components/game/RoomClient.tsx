'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMultiplayerGame } from '@/hooks/useMultiplayerGame';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { CircularTimer } from '@/components/ui/CircularTimer';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { getTurnDuration } from '@/lib/game-engine/gameModes';

export function RoomClient({ roomId }: { roomId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nameParam = searchParams.get('name');
  const actionParam = searchParams.get('action');

  const {
    isEngineLoaded,
    userId,
    roomId: activeRoomId,
    roomState,
    timeRemaining,
    isOffline,
    createRoom,
    joinRoom,
    startGame,
    submit,
    activatePowerUp,
    activateHint
  } = useMultiplayerGame();

  const [hasAttemptedJoin, setHasAttemptedJoin] = useState(false);
  const [directJoinName, setDirectJoinName] = useState('');
  const [showDirectJoinModal, setShowDirectJoinModal] = useState(false);
  
  const [floatingScores, setFloatingScores] = useState<{id: string, text: string, breakdown?: string[], color: string}[]>([]);
  const [showEventInfo, setShowEventInfo] = useState(false);
  const [hideGameOverModal, setHideGameOverModal] = useState(false);

  const [inputValue, setInputValue] = useState('');
  const [isInvalid, setIsInvalid] = useState(false);
  const { addToast } = useToast();
  
  // Achievement Trackers
  const [unlockedAchievements, setUnlockedAchievements] = useState<Set<string>>(new Set());

  // Connection logic
  useEffect(() => {
    if (!userId || !isEngineLoaded || hasAttemptedJoin || activeRoomId === roomId) return;

    const connectToRoom = async () => {
      setHasAttemptedJoin(true);
      if (actionParam === 'create' && nameParam) {
        await createRoom(nameParam, roomId);
      } else if (actionParam === 'join' && nameParam) {
        await joinRoom(roomId, nameParam);
      } else {
        // Deep link without name
        setShowDirectJoinModal(true);
      }
    };
    connectToRoom();
  }, [userId, isEngineLoaded, actionParam, nameParam, roomId, createRoom, joinRoom, hasAttemptedJoin, activeRoomId]);

  const handleDirectJoin = async () => {
    if (!directJoinName.trim()) return;
    setShowDirectJoinModal(false);
    await joinRoom(roomId, directJoinName);
  };

  // Achievements & Floating Feedback Check
  useEffect(() => {
    if (!roomState?.gameState || !userId) return;
    const gs = roomState.gameState;
    const myWords = (gs.wordHistory || []).filter(w => w.playerId === userId);
    const pState = gs.players[userId];
    if (!pState) return;

    const newAchievements = new Set(unlockedAchievements);
    
    if (myWords.length === 1 && !newAchievements.has('first_word')) {
      newAchievements.add('first_word');
      addToast('🏆 Achievement Unlocked: First Word!', 'success');
    }
    if (myWords.length >= 10 && !newAchievements.has('10_words')) {
      newAchievements.add('10_words');
      addToast('🏆 Achievement Unlocked: Word Master (10 Words)!', 'success');
    }
    if (pState.score >= 50 && !newAchievements.has('50_points')) {
      newAchievements.add('50_points');
      addToast('🏆 Achievement Unlocked: 50 Points!', 'success');
    }
    if (pState.streak >= 5 && !newAchievements.has('streak_5')) {
      newAchievements.add('streak_5');
      addToast('🏆 Achievement Unlocked: Speed Demon (5 Streak)!', 'success');
    }

    if (newAchievements.size !== unlockedAchievements.size) {
      setUnlockedAchievements(newAchievements);
    }
  }, [roomState?.gameState?.wordHistory?.length, userId, unlockedAchievements, addToast]);

  const prevHistoryLength = React.useRef(0);
  React.useEffect(() => {
    if (!roomState?.gameState) return;
    const history = roomState.gameState.wordHistory || [];
    if (history.length > prevHistoryLength.current && history.length > 0) {
      const newWord = history[history.length - 1];
      const id = Math.random().toString(36);
      
      const text = `+${newWord.points}`;
      let color = 'text-success';
      if (roomState.gameState.currentEvent === 'double_points' || roomState.gameState.players[newWord.playerId]?.activePowerUp === 'double_score') {
        color = 'text-secondary';
      }
      
      setFloatingScores(prev => [...prev, { id, text, breakdown: newWord.pointBreakdown, color }]);
      setTimeout(() => {
        setFloatingScores(prev => prev.filter(s => s.id !== id));
      }, 2500);
    }
    prevHistoryLength.current = history.length;
  }, [roomState?.gameState?.wordHistory?.length, roomState?.gameState?.currentEvent]);

  // Reconnect Banner Component
  const ReconnectBanner = () => {
    if (!isOffline) return null;
    return (
      <div className="fixed top-0 left-0 w-full z-50 bg-danger text-foreground font-bold p-2 text-center animate-pulse border-b-4 border-black">
        ⚠️ YOU ARE OFFLINE. ATTEMPTING TO RECONNECT...
      </div>
    );
  };

  // Loading State
  if (!isEngineLoaded || (!hasAttemptedJoin && !showDirectJoinModal) || (!roomState && hasAttemptedJoin && !showDirectJoinModal)) {
    // If we failed to join...
    if (hasAttemptedJoin && !activeRoomId && !showDirectJoinModal) {
      return (
        <div className="flex h-screen items-center justify-center bg-background p-4 flex-col gap-8 text-center">
          <ReconnectBanner />
          <h1 className="font-display text-6xl text-danger drop-shadow-[4px_4px_0_#000]">ROOM NOT FOUND</h1>
          <p className="font-sans text-xl text-gray-300 font-bold">This room might be closed or the code is incorrect.</p>
          <Button variant="primary" onClick={() => router.push('/')}>GO HOME</Button>
        </div>
      );
    }
    
    return (
      <div className="flex h-screen items-center justify-center bg-background text-primary">
        <ReconnectBanner />
        <h1 className="font-display text-4xl animate-pulse drop-shadow-[2px_2px_0_#000]">LOADING...</h1>
      </div>
    );
  }

  // Direct Join Modal
  if (showDirectJoinModal) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <ReconnectBanner />
        <Modal isOpen={true} onClose={() => router.push('/')} title="JOIN ROOM">
          <div className="flex flex-col gap-4">
            <p className="font-bold">You&apos;ve been invited to room <Badge variant="secondary">{roomId}</Badge></p>
            <Input 
              placeholder="ENTER YOUR NAME" 
              value={directJoinName} 
              onChange={e => setDirectJoinName(e.target.value)} 
              autoFocus
            />
            <Button variant="primary" onClick={handleDirectJoin} disabled={!directJoinName.trim()}>JOIN</Button>
          </div>
        </Modal>
      </div>
    );
  }

  // Lobby State
  if (roomState?.status === 'lobby' || !roomState?.gameState) {
    const isHost = roomState?.hostId === userId;
    const playersCount = roomState ? Object.keys(roomState.players).length : 0;
    
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-background p-4">
        <ReconnectBanner />
        <Card className="w-full max-w-lg p-6 md:p-8 flex flex-col gap-8 items-center">
          <Badge variant="primary" className="text-2xl md:text-4xl px-8 py-4">CODE: {roomId}</Badge>
          <div className="w-full">
            <h3 className="font-display text-2xl mb-4 text-secondary drop-shadow-[1px_1px_0_#000]">
              PLAYERS ({playersCount}/8):
            </h3>
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
              {roomState && Object.entries(roomState.players).map(([id, p]) => (
                <div key={id} className="flex justify-between p-3 bg-black/20 border-2 border-black rounded font-bold">
                  <span>{p.name} {id === userId && '(YOU)'}</span>
                  {id === roomState.hostId && <Badge variant="secondary">HOST</Badge>}
                </div>
              ))}
            </div>
          </div>
          {isHost ? (
            <div className="flex flex-col md:flex-row gap-4 w-full">
              <Button onClick={() => startGame('classic')} variant="primary" className="flex-1">Start Classic</Button>
              <Button onClick={() => startGame('speed')} variant="danger" className="flex-1">Start Speed</Button>
              <Button onClick={() => startGame('category')} variant="secondary" className="flex-1">Start Category</Button>
            </div>
          ) : (
            <p className="font-sans text-gray-400 font-bold italic animate-pulse text-center">Waiting for host to start...</p>
          )}
        </Card>
      </div>
    );
  }

  // Active Game State
  const gameState = roomState.gameState;
  const currentPlayerId = gameState.playerOrder[gameState.currentPlayerIndex];
  const turnDuration = getTurnDuration(gameState.mode) + ((gameState.extraTimeAdded || 0) / 1000);
  const timePercentage = Math.min(100, Math.max(0, (timeRemaining / turnDuration) * 100));

  const wordHistory = gameState.wordHistory || [];
  const lastWord = wordHistory.length > 0 
    ? wordHistory[wordHistory.length - 1].word 
    : '???';

  let stateRequiredLetter = 'ANY';
  if (gameState.deadlockLetterOverride) {
    stateRequiredLetter = gameState.deadlockLetterOverride.toUpperCase();
  } else if (wordHistory.length > 0) {
    stateRequiredLetter = gameState.currentEvent === 'reverse_chain'
      ? lastWord.charAt(0).toUpperCase()
      : lastWord.charAt(lastWord.length - 1).toUpperCase();
  }
  
  const requiredLetter = stateRequiredLetter;

  const isMyTurn = currentPlayerId === userId;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || !isMyTurn) return;
    
    const success = submit(inputValue);
    if (success) {
      setInputValue('');
      setIsInvalid(false);
    } else {
      setIsInvalid(true);
      setTimeout(() => setIsInvalid(false), 500); // clear animation
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pt-12 p-4 md:p-8">
      <ReconnectBanner />
      
      {/* Header: Scoreboard */}
      <header className="flex flex-wrap gap-4 justify-between items-center mb-8">
        <div className="flex flex-wrap gap-2 md:gap-4 w-full justify-center md:justify-start">
          {gameState.playerOrder.map(pid => {
            const p = gameState.players[pid];
            const isCurrent = pid === currentPlayerId;
            const presence = roomState.presence?.[pid];
            const isPlayerOffline = presence?.state === 'offline';
            return (
              <Card key={pid} className={`p-2 md:p-4 flex items-center gap-2 md:gap-4 transition-all duration-300 ${isCurrent ? 'ring-4 ring-primary scale-105' : 'opacity-70'} ${p.isEliminated ? 'grayscale opacity-30 scale-95' : ''}`}>
                <div className="relative hidden md:block">
                  <Avatar alt={p.name} fallbackInitials={p.name.slice(0, 2).toUpperCase()} size="sm" />
                  <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-black ${isPlayerOffline ? 'bg-danger' : 'bg-success'}`} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm md:text-lg leading-tight text-black flex items-center gap-1 md:gap-2 truncate max-w-[100px] md:max-w-[150px]">
                    <div className={`md:hidden block w-3 h-3 rounded-full border border-black ${isPlayerOffline ? 'bg-danger' : 'bg-success'}`} />
                    {p.name}
                    {p.streak >= 3 && <span className="text-base md:text-xl ml-1 font-display text-danger drop-shadow-[1px_1px_0_#000]" title={`${p.streak} Streak!`}>{p.streak}🔥</span>}
                  </span>
                  <span className="text-xs md:text-sm font-display text-primary">{p.score} PTS</span>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {Array.from({ length: Math.max(0, p.lives) }).map((_, i) => (
                      <div key={i} className="w-2 h-2 md:w-3 md:h-3 bg-danger border border-black rotate-45" />
                    ))}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
        
        {gameState.status === 'finished' && hideGameOverModal && (
          <Button variant="secondary" onClick={() => setHideGameOverModal(false)} className="ml-auto mr-4 hidden md:block">
            SHOW RESULTS
          </Button>
        )}
      </header>

      {/* Main Game Area */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full gap-8 md:gap-12 pb-8">
        {gameState.mode === 'category' && gameState.currentCategory && (
          <Badge variant="secondary" className="text-lg md:text-xl px-4 py-2 animate-bounce">
            CATEGORY: {gameState.currentCategory.toUpperCase()}
          </Badge>
        )}

        {gameState.currentEvent && (
          <div className="fixed top-4 right-4 md:top-8 md:right-8 bg-danger text-white border-4 border-black text-center px-4 py-2 shadow-[4px_4px_0_#000] z-50 flex items-center justify-center gap-2 rounded-brutal">
            <h3 className="font-display text-sm md:text-xl tracking-widest uppercase animate-pulse">
              EVENT: {gameState.currentEvent.replace('_', ' ')}
            </h3>
            <button 
              onClick={() => setShowEventInfo(true)}
              className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-white text-danger font-bold text-xs md:text-sm border-2 border-black flex items-center justify-center hover:scale-110 transition-transform"
              title="Event Info"
            >
              i
            </button>
          </div>
        )}

        {gameState.deadlockLetterOverride && (
          <div className="w-full bg-warning text-black border-y-4 border-black text-center py-1">
            <h3 className="font-bold text-lg uppercase">
              Deadlock! Letter changed to {gameState.deadlockLetterOverride}
            </h3>
          </div>
        )}
        
        {/* Desktop Side Panel: Actions */}
        {gameState.status === 'playing' && userId && (
          <div className="hidden xl:flex absolute top-0 -left-[320px] w-72 flex-col gap-4 bg-card p-6 rounded-brutal border-4 border-black shadow-brutal">
            <h3 className="font-display text-xl text-primary drop-shadow-[2px_2px_0_#000] border-b-4 border-black pb-2">POWER-UPS</h3>
            <p className="font-bold text-sm text-gray-700">Your Inventory:</p>
            
            <div className="flex flex-col gap-2">
              {gameState.players[userId]?.powerUps?.map((pu, idx) => (
                <Button 
                  key={idx} 
                  variant="secondary" 
                  className="w-full text-sm hover:animate-shake"
                  onClick={() => activatePowerUp(pu)}
                  disabled={!isMyTurn}
                >
                  {pu.replace('_', ' ').toUpperCase()}
                </Button>
              ))}
              {(!gameState.players[userId]?.powerUps || gameState.players[userId].powerUps.length === 0) && (
                <span className="text-sm text-gray-500 italic">None available.</span>
              )}
            </div>
            
            <h3 className="font-display text-xl text-secondary drop-shadow-[2px_2px_0_#000] border-b-4 border-black pb-2 mt-4">HINTS</h3>
            <div className="flex items-center justify-between">
              <span className="font-bold">Remaining: {gameState.players[userId]?.hints || 0}</span>
              <Button 
                  variant="primary" 
                  disabled={!isMyTurn || gameState.players[userId]?.hints <= 0}
                  onClick={() => activateHint('common_continuation')}
                  className="px-3 py-1 text-sm"
              >
                USE HINT
              </Button>
            </div>
          </div>
        )}

        {/* Floating Scores Container */}
        <div className="absolute top-1/4 right-10 md:right-20 xl:-right-20 pointer-events-none z-50 flex flex-col items-end gap-1">
          {floatingScores.map(score => (
            <div key={score.id} className="animate-floatUp flex flex-col items-end">
              <span className={`font-display text-4xl md:text-6xl ${score.color} drop-shadow-[4px_4px_0_#000] whitespace-nowrap`}>
                {score.text}
              </span>
              {score.breakdown && score.breakdown.length > 0 && (
                <div className="flex flex-col gap-1 mt-1 items-end">
                  {score.breakdown.map((line, i) => (
                    <span key={i} className="text-sm md:text-base font-bold bg-white text-black px-2 border-2 border-black rotate-[2deg] drop-shadow-[2px_2px_0_#FF2E93] whitespace-nowrap">
                      {line}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-4 md:gap-6 w-full">
          <Badge variant="primary">LAST WORD</Badge>
          <h2 className="font-display text-5xl md:text-7xl text-white uppercase tracking-widest drop-shadow-[4px_4px_0_#FF2E93] text-center break-all px-4">
            {lastWord}
          </h2>
          {requiredLetter !== 'ANY' && (
            <p className="font-sans font-bold text-xl text-gray-300">
              Must start with <span className="text-secondary text-4xl font-display ml-2">{requiredLetter}</span>
            </p>
          )}
        </div>

        <CircularTimer 
          percentage={timePercentage} 
          size={160} 
          label={gameState.status === 'playing' ? `${Math.ceil(timeRemaining)}s` : '--'} 
        />

        <form onSubmit={handleSubmit} className="w-full flex flex-col sm:flex-row gap-4">
          <Input 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={isMyTurn ? "TYPE A WORD..." : `${gameState.players[currentPlayerId].name}'S TURN...`}
            state={isInvalid ? 'invalid' : 'default'}
            className="text-2xl uppercase h-16 w-full"
            autoFocus
            disabled={!isMyTurn || gameState.status === 'finished'}
          />
          <Button type="submit" variant="primary" className="h-16 px-8 text-xl" disabled={!isMyTurn || gameState.status === 'finished' || !inputValue.trim()}>
            SUBMIT
          </Button>
        </form>

        {/* Mobile Action Bar */}
        {gameState.status === 'playing' && userId && (
          <div className="flex xl:hidden w-full flex-wrap justify-between items-center bg-card p-4 rounded-brutal border-4 border-black shadow-brutal">
            <div className="flex gap-2 items-center flex-wrap">
              <span className="font-display text-lg mr-2">POWER-UPS:</span>
              {gameState.players[userId]?.powerUps?.map((pu, idx) => (
                <Button 
                  key={idx} 
                  variant="secondary" 
                  className="px-3 py-1 text-sm md:text-base animate-pulse"
                  onClick={() => activatePowerUp(pu)}
                  disabled={!isMyTurn}
                >
                  {pu.replace('_', ' ').toUpperCase()}
                </Button>
              ))}
              {(!gameState.players[userId]?.powerUps || gameState.players[userId].powerUps.length === 0) && (
                <span className="text-sm text-gray-500 italic">None</span>
              )}
            </div>
            
            <div className="flex gap-4 items-center mt-4 md:mt-0">
               <span className="font-display text-lg">HINTS ({gameState.players[userId]?.hints || 0}):</span>
               <Button 
                  variant="primary" 
                  disabled={!isMyTurn || gameState.players[userId]?.hints <= 0}
                  onClick={() => activateHint('common_continuation')}
                  className="px-3 py-1 text-sm"
               >
                 USE HINT
               </Button>
            </div>
          </div>
        )}

        {/* Word History */}
        <div className="w-full mt-4 bg-black/20 p-4 rounded-brutal h-48 overflow-y-auto border-4 border-black flex flex-col gap-2 shadow-brutal">
          <h3 className="font-display text-xl text-secondary drop-shadow-[2px_2px_0_#000] border-b-4 border-black pb-2 sticky top-0 bg-background/90 backdrop-blur">WORD HISTORY</h3>
          {[...gameState.wordHistory].reverse().map((sub, idx) => (
            <div key={idx} className="flex justify-between items-center bg-card p-2 rounded-brutal border-2 border-black">
              <span className="font-bold text-lg text-black">{sub.word.toUpperCase()}</span>
              <span className="text-sm font-bold text-primary">
                {gameState.players[sub.playerId].name} (+{sub.points})
              </span>
            </div>
          ))}
          {gameState.wordHistory.length === 0 && (
            <span className="text-gray-500 italic p-2">No words played yet.</span>
          )}
        </div>
      </main>

      {/* Winner Modal / Results Screen */}
      <Modal 
        isOpen={gameState.status === 'finished' && !hideGameOverModal} 
        onClose={() => setHideGameOverModal(true)} 
        title="GAME OVER"
      >
        <div className="flex flex-col items-center gap-6 text-center">
          <h3 className="font-display text-4xl text-secondary drop-shadow-[2px_2px_0_#000]">
            {gameState.winnerId ? `${gameState.players[gameState.winnerId].name} WINS!` : 'DRAW!'}
          </h3>
          {gameState.winnerId && (
            <p className="text-2xl font-bold">
              Final Score: <span className="text-primary font-display">{gameState.players[gameState.winnerId].score}</span>
            </p>
          )}
          
          {roomState?.hostId === userId ? (
            <Button onClick={() => startGame('classic')} variant="primary" className="w-full mt-4 text-xl">
              PLAY AGAIN (CLASSIC)
            </Button>
          ) : (
            <p className="mt-4 font-bold animate-pulse text-black">Waiting for host to restart...</p>
          )}
          <Button onClick={() => router.push('/')} variant="secondary" className="w-full mt-4">
            LEAVE ROOM
          </Button>
        </div>
      </Modal>

      {/* Event Info Modal */}
      <Modal 
        isOpen={showEventInfo} 
        onClose={() => setShowEventInfo(false)} 
        title="BONUS EVENTS"
      >
        <div className="flex flex-col gap-4 text-left p-2">
          <p className="font-bold mb-2">Every 5 turns, a random event might trigger!</p>
          
          <div className="bg-card p-3 rounded-brutal border-2 border-black">
            <h4 className="font-display text-primary text-xl">DOUBLE POINTS</h4>
            <p className="text-sm">Every valid word earns double its normal score.</p>
          </div>
          
          <div className="bg-card p-3 rounded-brutal border-2 border-black">
            <h4 className="font-display text-secondary text-xl">LONG WORD BONUS</h4>
            <p className="text-sm">Words with 8 or more letters earn an extra +15 points.</p>
          </div>
          
          <div className="bg-card p-3 rounded-brutal border-2 border-black">
            <h4 className="font-display text-success text-xl">REVERSE CHAIN</h4>
            <p className="text-sm">You must start your word with the <strong>FIRST</strong> letter of the previous word (instead of the last).</p>
          </div>
          
          <div className="bg-card p-3 rounded-brutal border-2 border-black">
            <h4 className="font-display text-warning text-xl">VOWEL FRENZY</h4>
            <p className="text-sm">Words must strictly begin with a Vowel (A, E, I, O, U) regardless of the previous word!</p>
          </div>
          
          <div className="bg-card p-3 rounded-brutal border-2 border-black">
            <h4 className="font-display text-purple-400 text-xl">RAPID FIRE</h4>
            <p className="text-sm">You only have 50% of the normal time to submit a word!</p>
          </div>
          
          <Button onClick={() => setShowEventInfo(false)} variant="primary" className="w-full mt-2">
            GOT IT
          </Button>
        </div>
      </Modal>
    </div>
  );
}
