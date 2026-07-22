
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMultiplayerGame } from '@/hooks/useMultiplayerGame';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { SoundToggle } from '@/components/ui/SoundToggle';
import { AuthBadge } from '@/components/auth/AuthBadge';
import { useSound } from '@/contexts/SoundContext';
import { useToast } from '@/components/ui/Toast';
import { getTurnDuration } from '@/lib/game-engine/gameModes';

import { WordChain } from './ui/WordChain';
import { MinimalInput } from './ui/MinimalInput';
import { MinimalTimer } from './ui/MinimalTimer';
import { PlayerStrip } from './ui/PlayerStrip';
import { PowerUpDock } from './ui/PowerUpDock';
import { HintButton } from './ui/HintButton';
import { GameEventOverlay } from './ui/GameEventOverlay';

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
  } = useMultiplayerGame();

  const { 
    playValidWord, playInvalidWord, playWinner, 
    playTypeLetter, playDeleteLetter, playPowerup1 
  } = useSound();

  const [hasAttemptedJoin, setHasAttemptedJoin] = useState(false);
  const [directJoinName, setDirectJoinName] = useState('');
  const [showDirectJoinModal, setShowDirectJoinModal] = useState(false);
  
  const [floatingScores, setFloatingScores] = useState<{id: string, text: string, breakdown?: string[], color: string}[]>([]);
  const [showEventInfo, setShowEventInfo] = useState(false);
  const [hideGameOverModal, setHideGameOverModal] = useState(false);
  const [attackModal, setAttackModal] = useState<{ isOpen: boolean, attackerId: string } | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const [inputValue, setInputValue] = useState('');
  const [isInvalid, setIsInvalid] = useState(false);
  const { addToast } = useToast();
  
  // Winner sound trigger
  const hasPlayedWinnerSound = useRef(false);
  useEffect(() => {
    if (roomState?.gameState?.status === 'finished' && !hasPlayedWinnerSound.current) {
      playWinner();
      hasPlayedWinnerSound.current = true;
    }
    if (roomState?.gameState?.status === 'playing') {
      hasPlayedWinnerSound.current = false;
    }
  }, [roomState?.gameState?.status, playWinner]);
  
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

  const handleLeaveRoom = async () => {
    setConfirmLeave(false);
    await leaveRoom();
    router.push('/');
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

  const ReconnectBanner = () => {
    if (!isOffline) return null;
    return (
      <div className="fixed top-0 left-0 w-full z-50 bg-danger text-foreground font-bold p-2 text-center animate-pulse border-b-4 border-black">
        ⚠️ YOU ARE OFFLINE. ATTEMPTING TO RECONNECT...
      </div>
    );
  };

  if (!isEngineLoaded || (!hasAttemptedJoin && !showDirectJoinModal) || (!roomState && hasAttemptedJoin && !showDirectJoinModal)) {
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

  if (roomState?.status === 'lobby' || !roomState?.gameState) {
    const isHost = roomState?.hostId === userId;
    const playersCount = roomState ? Object.keys(roomState.players).length : 0;
    
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-background p-4 relative">
        <ReconnectBanner />
        
        <Button 
          variant="danger" 
          className="absolute top-4 right-4 z-40" 
          onClick={() => setConfirmLeave(true)}
        >
          LEAVE ROOM
        </Button>

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

        <Modal isOpen={confirmLeave} onClose={() => setConfirmLeave(false)} title="LEAVE ROOM?">
          <div className="flex flex-col gap-4 text-center">
            <p className="font-bold text-lg text-white">Are you sure you want to leave this room? You might not be able to rejoin if the game has started.</p>
            {isHost && <p className="font-bold text-danger">You are the host! Leaving will destroy the room for everyone.</p>}
            <div className="flex gap-4">
              <Button onClick={() => setConfirmLeave(false)} className="flex-1">CANCEL</Button>
              <Button onClick={handleLeaveRoom} variant="danger" className="flex-1">LEAVE</Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  // Active Game State
  const gameState = roomState.gameState;
  const currentPlayerId = gameState.playerOrder[gameState.currentPlayerIndex];
  const turnDuration = getTurnDuration(gameState.mode) + ((gameState.extraTimeAdded || 0) / 1000);
  const timePercentage = Math.min(100, Math.max(0, (timeRemaining / turnDuration) * 100));

  const wordHistory = gameState.wordHistory || [];
  
  const isMyTurn = currentPlayerId === userId;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || !isMyTurn) return;
    
    const success = submit(inputValue);
    if (success) {
      playValidWord();
      setInputValue('');
      setIsInvalid(false);
    } else {
      playInvalidWord();
      setIsInvalid(true);
      setTimeout(() => setIsInvalid(false), 500); // clear animation
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden font-sans">
      <ReconnectBanner />
      <GameEventOverlay currentEvent={gameState.currentEvent} deadlockLetter={gameState.deadlockLetterOverride} />

      {/* Header Area (Minimal) */}
      <header className="w-full flex justify-between items-center p-4 absolute top-0 left-0 right-0 z-40">
        <div className="flex gap-4 items-center">
           <SoundToggle />
           <AuthBadge />
           <Button variant="danger" className="text-xs px-3 py-1 font-bold h-8" onClick={() => setConfirmLeave(true)}>LEAVE</Button>
        </div>
        {userId && gameState.players[userId]?.hints !== undefined && (
          <HintButton 
            hintsRemaining={gameState.players[userId].hints || 0} 
            onActivate={() => activateHint('common_continuation')} 
            disabled={!isMyTurn || gameState.status === 'finished'}
          />
        )}
      </header>

      {/* Top Player Strip */}
      <div className="w-full mt-20 md:mt-16">
        <PlayerStrip 
          players={gameState.players} 
          playerOrder={gameState.playerOrder} 
          currentPlayerId={currentPlayerId} 
          onAttackClick={(id) => {
            if (id === userId) {
               setAttackModal({ isOpen: true, attackerId: id });
            } else {
               addToast("You can only use your own attack power-up!", "warning");
            }
          }}
        />
      </div>

      {/* Floating Scores Container */}
      <div className="absolute top-1/4 right-10 md:right-20 xl:right-32 pointer-events-none z-50 flex flex-col items-end gap-1" aria-live="polite">
          {floatingScores.map(score => (
            <div key={score.id} className="animate-floatUp flex flex-col items-end">
              <span className={`font-display text-4xl md:text-5xl ${score.color} drop-shadow-[2px_2px_0_#000] whitespace-nowrap`}>
                {score.text}
              </span>
              {score.breakdown && score.breakdown.length > 0 && (
                <div className="flex flex-col gap-1 mt-1 items-end opacity-80">
                  {score.breakdown.map((line, i) => (
                    <span key={i} className="text-xs md:text-sm font-bold bg-card text-black px-1 border border-black rotate-[2deg] whitespace-nowrap">
                      {line}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
      </div>

      {/* Main Canvas */}
      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl mx-auto px-4 z-10 relative pb-20 mt-4 md:mt-0">
        <WordChain history={wordHistory} currentEvent={gameState.currentEvent} />

        <div className="w-full max-w-md my-4">
          <MinimalTimer percentage={timePercentage} seconds={timeRemaining} />
        </div>

        <div className="w-full mt-4 relative">
          <MinimalInput 
            value={inputValue} 
            onChange={(val) => {
              if (val.length > inputValue.length) playTypeLetter();
              if (val.length < inputValue.length) playDeleteLetter();
              setInputValue(val);
            }} 
            onSubmit={handleSubmit} 
            isInvalid={isInvalid} 
            disabled={!isMyTurn || gameState.status === 'finished'} 
            currentHint={currentHint}
          />
        </div>

        <div className="mt-8 opacity-70 flex flex-col items-center">
          <span className="font-display text-2xl md:text-4xl text-gray-400 text-center">
            {gameState.players[currentPlayerId]?.name.toUpperCase()}'S TURN..
          </span>
          {!isMyTurn && gameState.status === 'playing' && (
             <span className="font-sans text-sm md:text-base font-bold tracking-widest text-gray-500 mt-2">WAITING FOR THEM TO PLAY...</span>
          )}
        </div>
      </main>

      {/* Bottom PowerUps Area (Only show for the local user) */}
      <footer className="absolute bottom-4 left-4 md:bottom-8 md:left-8 z-40">
        {gameState.status === 'playing' && userId && (
          <PowerUpDock 
            powerUps={gameState.players[userId]?.powerUps || []} 
            onActivate={(pu) => {
              if (pu === 'attack') {
                setAttackModal({ isOpen: true, attackerId: userId });
              } else {
                playPowerup1();
                activatePowerUp(pu);
              }
            }} 
            disabled={false} 
          />
        )}
      </footer>

      {/* Winner Modal */}
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
          
          <div className="flex gap-4 w-full mt-2">
            <Button variant="secondary" onClick={() => setHideGameOverModal(true)} className="flex-1 text-lg">
              VIEW BOARD
            </Button>
            <Button onClick={() => setConfirmLeave(true)} variant="danger" className="flex-1 text-lg">
              LEAVE
            </Button>
          </div>
        </div>
      </Modal>

      {/* Attack Selection Modal */}
      {attackModal && attackModal.isOpen && (
        <Modal 
          isOpen={true} 
          onClose={() => setAttackModal(null)} 
          title="SELECT TARGET"
        >
          <div className="flex flex-col gap-4">
            {gameState.playerOrder.map(pid => {
              const p = gameState.players[pid];
              if (p.isEliminated || pid === attackModal.attackerId) return null;
              return (
                <Button 
                  key={pid}
                  onClick={() => {
                    activateAttack(attackModal.attackerId, pid);
                    setAttackModal(null);
                  }}
                  className="w-full text-lg flex justify-between px-6"
                  variant="danger"
                >
                  <span className="font-bold">{p.name}</span>
                  <span>{p.score} pts</span>
                </Button>
              );
            })}
          </div>
        </Modal>
      )}

      {/* Leave Confirmation Modal */}
      <Modal isOpen={confirmLeave} onClose={() => setConfirmLeave(false)} title="LEAVE ROOM?">
        <div className="flex flex-col gap-4 text-center">
          <p className="font-bold text-lg text-white">Are you sure you want to leave this room? You might not be able to rejoin if the game has started.</p>
          {roomState?.hostId === userId && <p className="font-bold text-danger">You are the host! Leaving will destroy the room for everyone.</p>}
          <div className="flex gap-4">
            <Button onClick={() => setConfirmLeave(false)} className="flex-1">CANCEL</Button>
            <Button onClick={handleLeaveRoom} variant="danger" className="flex-1">LEAVE</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
