'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLocalGame } from '@/hooks/useLocalGame';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { CircularTimer } from '@/components/ui/CircularTimer';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { SoundToggle } from '@/components/ui/SoundToggle';
import { AuthBadge } from '@/components/auth/AuthBadge';
import { useSound } from '@/contexts/SoundContext';
import { GameMode } from '@/lib/game-engine/types';
import { getTurnDuration } from '@/lib/game-engine/gameModes';
import { useToast } from '@/components/ui/Toast';

import { WordChain } from './ui/WordChain';
import { MinimalInput } from './ui/MinimalInput';
import { MinimalTimer } from './ui/MinimalTimer';
import { PlayerStrip } from './ui/PlayerStrip';
import { PowerUpDock } from './ui/PowerUpDock';
import { HintButton } from './ui/HintButton';
import { GameEventOverlay } from './ui/GameEventOverlay';

export function GameClient() {
  const router = useRouter();
  const { isLoaded, gameState, timeRemaining, currentHint, startGame, submit, activatePowerUp, activateHint, activateAttack } = useLocalGame();
  const { 
    playValidWord, playInvalidWord, playWinner, 
    playTypeLetter, playDeleteLetter, playCountdown, 
    playHeartLoss, playPowerup1, playAchievement 
  } = useSound();
  const [inputValue, setInputValue] = useState('');
  const [isInvalid, setIsInvalid] = useState(false);
  const { addToast } = useToast();
  
  const [floatingScores, setFloatingScores] = useState<{id: string, text: string, breakdown?: string[], color: string}[]>([]);
  const prevLives = useRef<Record<string, number>>({});
  const prevStreaks = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!gameState || gameState.status !== 'playing') return;
    for (const p of Object.values(gameState.players)) {
      const pPrevLives = prevLives.current[p.id];
      if (pPrevLives !== undefined && p.lives < pPrevLives && p.lives >= 0) {
        playHeartLoss();
      }
      prevLives.current[p.id] = p.lives;

      const pPrevStreak = prevStreaks.current[p.id] || 0;
      if (p.streak > pPrevStreak && p.streak >= 3) {
        playAchievement();
      }
      prevStreaks.current[p.id] = p.streak;
    }
  }, [gameState, playHeartLoss, playAchievement]);
  const [showEventInfo, setShowEventInfo] = useState(false);
  const [hideGameOverModal, setHideGameOverModal] = useState(false);
  const [countdownText, setCountdownText] = useState<string | null>(null);
  const [attackModal, setAttackModal] = useState<{ isOpen: boolean, attackerId: string } | null>(null);
  
  // Achievement Trackers
  const [unlockedAchievements, setUnlockedAchievements] = useState<Set<string>>(new Set());

  // Setup modal for start game
  const [isStartModalOpen, setIsStartModalOpen] = useState(true);

  // Sound effect trigger for winner
  const hasPlayedWinnerSound = React.useRef(false);
  React.useEffect(() => {
    if (gameState?.status === 'finished' && !hasPlayedWinnerSound.current) {
      playWinner();
      hasPlayedWinnerSound.current = true;
    }
    if (gameState?.status === 'playing') {
      hasPlayedWinnerSound.current = false;
    }
  }, [gameState?.status, playWinner]);

  // Achievements Check
  React.useEffect(() => {
    if (!gameState) return;
    const newAchievements = new Set(unlockedAchievements);
    
    gameState.playerOrder.forEach(pid => {
      const pState = gameState.players[pid];
      if (!pState) return;
      
      const pWords = (gameState.wordHistory || []).filter(w => w.playerId === pid);
      if (pWords.length === 1 && !newAchievements.has(`${pid}_first_word`)) {
        newAchievements.add(`${pid}_first_word`);
        addToast(`🏆 ${pState.name} Unlocked: First Word!`, 'success');
      }
      if (pWords.length >= 10 && !newAchievements.has(`${pid}_10_words`)) {
        newAchievements.add(`${pid}_10_words`);
        addToast(`🏆 ${pState.name} Unlocked: Word Master (10 Words)!`, 'success');
      }
      if (pState.score >= 50 && !newAchievements.has(`${pid}_50_points`)) {
        newAchievements.add(`${pid}_50_points`);
        addToast(`🏆 ${pState.name} Unlocked: 50 Points!`, 'success');
      }
      if (pState.streak >= 5 && !newAchievements.has(`${pid}_streak_5`)) {
        newAchievements.add(`${pid}_streak_5`);
        addToast(`🏆 ${pState.name} Unlocked: Speed Demon (5 Streak)!`, 'success');
      }
    });

    if (newAchievements.size !== unlockedAchievements.size) {
      setUnlockedAchievements(newAchievements);
    }
  }, [gameState?.wordHistory?.length, gameState, unlockedAchievements, addToast]);

  const prevHistoryLength = React.useRef(0);
  React.useEffect(() => {
    if (!gameState) return;
    const history = gameState.wordHistory || [];
    if (history.length > prevHistoryLength.current && history.length > 0) {
      const newWord = history[history.length - 1];
      const id = Math.random().toString(36);
      
      const text = `+${newWord.points}`;
      let color = 'text-success';
      if (gameState.currentEvent === 'double_points' || gameState.players[newWord.playerId]?.activePowerUp === 'double_score') {
        color = 'text-secondary';
      }
      
      setFloatingScores(prev => [...prev, { id, text, breakdown: newWord.pointBreakdown, color }]);
      setTimeout(() => {
        setFloatingScores(prev => prev.filter(s => s.id !== id));
      }, 2500);
    }
    prevHistoryLength.current = history.length;
  }, [gameState?.wordHistory?.length, gameState?.currentEvent]);

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-primary" role="status" aria-live="polite">
        <h1 className="font-display text-4xl animate-pulse">LOADING ENGINE...</h1>
      </div>
    );
  }

  const handleStart = (mode: GameMode) => {
    setIsStartModalOpen(false);
    playCountdown();
    setCountdownText('3');
    
    let counter = 3;
    const interval = setInterval(() => {
      counter--;
      if (counter > 0) {
        setCountdownText(counter.toString());
      } else if (counter === 0) {
        setCountdownText('GO!');
      } else {
        clearInterval(interval);
        setCountdownText(null);
        startGame(mode, [
          { id: 'p1', name: 'Player 1' },
          { id: 'p2', name: 'Player 2' },
        ]);
      }
    }, 1000);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim()) return;
    
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

  if (!gameState || isStartModalOpen) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Modal isOpen={isStartModalOpen} onClose={() => router.push('/')} title="START LOCAL GAME">
          <div className="flex flex-col gap-4">
            <Button onClick={() => handleStart('classic')} aria-label="Start Classic Mode">Classic Mode</Button>
            <Button onClick={() => handleStart('speed')} variant="danger" aria-label="Start Speed Mode">Speed Mode</Button>
            <Button onClick={() => handleStart('category')} variant="secondary" aria-label="Start Category Mode">Category Mode</Button>
          </div>
        </Modal>

        {countdownText && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
            <div className="font-display text-8xl md:text-9xl text-primary">
              {countdownText}
            </div>
          </div>
        )}
      </div>
    );
  }

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
  } else if (gameState.currentEvent === 'vowel_frenzy') {
    stateRequiredLetter = 'VOWEL';
  } else if (wordHistory.length > 0) {
    stateRequiredLetter = gameState.currentEvent === 'reverse_chain'
      ? lastWord.charAt(0).toUpperCase()
      : lastWord.charAt(lastWord.length - 1).toUpperCase();
  }
  
  const requiredLetter = stateRequiredLetter;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden font-sans">
      <GameEventOverlay currentEvent={gameState.currentEvent} deadlockLetter={gameState.deadlockLetterOverride} />

      {/* Header Area (Minimal) */}
      <header className="w-full flex justify-between items-center p-4 absolute top-0 left-0 right-0 z-40">
        <div className="flex gap-4 items-center">
           <SoundToggle />
           <AuthBadge />
        </div>
        <HintButton 
          hintsRemaining={gameState.players[currentPlayerId]?.hints || 0} 
          onActivate={() => activateHint('common_continuation')} 
          disabled={gameState.status === 'finished'}
        />
      </header>

      {/* Top Player Strip */}
      <div className="w-full mt-20 md:mt-16">
        <PlayerStrip 
          players={gameState.players} 
          playerOrder={gameState.playerOrder} 
          currentPlayerId={currentPlayerId} 
          onAttackClick={(id) => setAttackModal({ isOpen: true, attackerId: id })}
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
      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl mx-auto px-4 z-10 relative pb-20">
        <WordChain history={wordHistory} currentEvent={gameState.currentEvent} />
        


        <div className="w-full max-w-md my-4">
          <MinimalTimer percentage={timePercentage} seconds={timeRemaining} />
        </div>

        <div className="w-full mt-4">
          <MinimalInput 
            value={inputValue} 
            onChange={(val) => {
              if (val.length > inputValue.length) playTypeLetter();
              if (val.length < inputValue.length) playDeleteLetter();
              setInputValue(val);
            }} 
            onSubmit={handleSubmit} 
            isInvalid={isInvalid} 
            disabled={gameState.status === 'finished'} 
            currentHint={currentHint}
          />
        </div>

        <div className="mt-8 opacity-70">
          <span className="font-display text-2xl md:text-4xl text-gray-400">
            {gameState.players[currentPlayerId].name.toUpperCase()}'S TURN..
          </span>
        </div>
      </main>

      {/* Bottom PowerUps Area */}
      <footer className="absolute bottom-4 left-4 md:bottom-8 md:left-8 z-40">
        {gameState.status === 'playing' && (
          <PowerUpDock 
            powerUps={gameState.players[currentPlayerId]?.powerUps || []} 
            onActivate={(pu) => {
              if (pu === 'attack') {
                setAttackModal({ isOpen: true, attackerId: currentPlayerId });
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
        <div className="flex flex-col items-center gap-6 text-center" role="region" aria-live="polite">
          <h3 className="font-display text-4xl text-secondary drop-shadow-[2px_2px_0_#000]">
            {gameState.winnerId ? `${gameState.players[gameState.winnerId].name} WINS!` : 'DRAW!'}
          </h3>
          {gameState.winnerId && (
            <p className="text-2xl font-bold">
              Final Score: <span className="text-primary font-display">{gameState.players[gameState.winnerId].score}</span>
            </p>
          )}
          <Button onClick={() => setIsStartModalOpen(true)} variant="primary" className="w-full mt-4 text-xl" aria-label="Play local game again">
            PLAY AGAIN
          </Button>
          
          <Button variant="secondary" onClick={() => setHideGameOverModal(true)} className="w-full text-lg">
            VIEW BOARD
          </Button>
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
    </div>
  );
}
