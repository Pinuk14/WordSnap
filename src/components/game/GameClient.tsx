'use client';
import React, { useState } from 'react';
import { useLocalGame } from '@/hooks/useLocalGame';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { CircularTimer } from '@/components/ui/CircularTimer';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { GameMode } from '@/lib/game-engine/types';
import { getTurnDuration } from '@/lib/game-engine/gameModes';

import { useToast } from '@/components/ui/Toast';

export function GameClient() {
  const { isLoaded, gameState, timeRemaining, startGame, submit, activatePowerUp, activateHint } = useLocalGame();
  const [inputValue, setInputValue] = useState('');
  const [isInvalid, setIsInvalid] = useState(false);
  const { addToast } = useToast();
  
  // Achievement Trackers
  const [unlockedAchievements, setUnlockedAchievements] = useState<Set<string>>(new Set());

  // Setup modal for start game
  const [isStartModalOpen, setIsStartModalOpen] = useState(true);

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

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-primary">
        <h1 className="font-display text-4xl animate-pulse">LOADING ENGINE...</h1>
      </div>
    );
  }

  const handleStart = (mode: GameMode) => {
    startGame(mode, [
      { id: 'p1', name: 'Player 1' },
      { id: 'p2', name: 'Player 2' },
    ]);
    setIsStartModalOpen(false);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim()) return;
    
    const success = submit(inputValue);
    if (success) {
      setInputValue('');
      setIsInvalid(false);
    } else {
      setIsInvalid(true);
      setTimeout(() => setIsInvalid(false), 500); // clear animation
    }
  };

  if (!gameState || isStartModalOpen) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Modal isOpen={isStartModalOpen} onClose={() => {}} title="START LOCAL GAME">
          <div className="flex flex-col gap-4">
            <Button onClick={() => handleStart('classic')}>Classic Mode</Button>
            <Button onClick={() => handleStart('speed')} variant="danger">Speed Mode</Button>
            <Button onClick={() => handleStart('category')} variant="secondary">Category Mode</Button>
          </div>
        </Modal>
      </div>
    );
  }

  const currentPlayerId = gameState.playerOrder[gameState.currentPlayerIndex];
  const turnDuration = getTurnDuration(gameState.mode);
  const timePercentage = Math.max(0, (timeRemaining / turnDuration) * 100);

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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col p-4 md:p-8">
      {/* Header: Scoreboard */}
      <header className="flex flex-wrap gap-4 justify-between items-center mb-8">
        <div className="flex gap-4">
          {gameState.playerOrder.map(pid => {
            const p = gameState.players[pid];
            const isCurrent = pid === currentPlayerId;
            return (
              <Card key={pid} className={`p-4 flex items-center gap-4 transition-all duration-300 ${isCurrent ? 'ring-4 ring-primary scale-105' : 'opacity-70'} ${p.isEliminated ? 'grayscale opacity-30 scale-95' : ''}`}>
                <Avatar alt={p.name} fallbackInitials={p.name.slice(0, 2).toUpperCase()} size="sm" />
                <div className="flex flex-col">
                  <span className="font-bold text-lg leading-tight text-black flex items-center gap-1">
                    {p.name}
                    {p.streak >= 3 && <span className="text-xl ml-1" title={`${p.streak} Streak!`}>🔥</span>}
                  </span>
                  <span className="text-sm font-display text-primary">{p.score} PTS</span>
                  <div className="flex gap-1 mt-1">
                    {Array.from({ length: Math.max(0, p.lives) }).map((_, i) => (
                      <div key={i} className="w-3 h-3 bg-danger border-2 border-black rotate-45" />
                    ))}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {gameState.mode === 'category' && gameState.currentCategory && (
          <Badge variant="secondary" className="text-xl px-4 py-2 animate-bounce">
            CATEGORY: {gameState.currentCategory.toUpperCase()}
          </Badge>
        )}
      </header>

      {gameState.currentEvent && (
        <div className="w-full bg-danger text-white border-y-4 border-black text-center py-2 animate-pulse shadow-[0px_4px_0_#000] z-10 mb-4">
          <h3 className="font-display text-2xl tracking-widest uppercase">
            EVENT: {gameState.currentEvent.replace('_', ' ')}
          </h3>
        </div>
      )}

      {gameState.deadlockLetterOverride && (
        <div className="w-full bg-warning text-black border-y-4 border-black text-center py-1 mb-4">
          <h3 className="font-bold text-lg uppercase">
            Deadlock! Letter changed to {gameState.deadlockLetterOverride}
          </h3>
        </div>
      )}

      {/* Main Game Area */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full gap-12">
        <div className="flex flex-col items-center gap-6">
          <Badge variant="primary">LAST WORD</Badge>
          <h2 className="font-display text-6xl md:text-8xl text-white uppercase tracking-widest drop-shadow-[4px_4px_0_#FF2E93] text-center break-all">
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
          label={`${Math.ceil(timeRemaining)}s`} 
        />

        <form onSubmit={handleSubmit} className="w-full flex gap-4">
          <Input 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`${gameState.players[currentPlayerId].name}'S TURN...`}
            state={isInvalid ? 'invalid' : 'default'}
            className="text-2xl uppercase h-16 w-full"
            autoFocus
            disabled={gameState.status === 'finished'}
          />
          <Button type="submit" variant="primary" className="h-16 px-8 text-xl" disabled={gameState.status === 'finished' || !inputValue.trim()}>
            SUBMIT
          </Button>
        </form>

        {/* Action Bar (Power-Ups & Hints) */}
        {gameState.status === 'playing' && (
          <div className="w-full flex flex-wrap justify-between items-center bg-card p-4 rounded-xl border-4 border-black shadow-[4px_4px_0_#000]">
            <div className="flex gap-2 items-center flex-wrap">
              <span className="font-display text-xl mr-2">POWER-UPS ({gameState.players[currentPlayerId].name}):</span>
              {gameState.players[currentPlayerId]?.powerUps?.map((pu, idx) => (
                <Button 
                  key={idx} 
                  variant="secondary" 
                  className="px-3 py-1 text-sm md:text-base animate-pulse"
                  onClick={() => activatePowerUp(pu)}
                >
                  {pu.replace('_', ' ').toUpperCase()}
                </Button>
              ))}
              {(!gameState.players[currentPlayerId]?.powerUps || gameState.players[currentPlayerId].powerUps.length === 0) && (
                <span className="text-sm text-gray-500 italic">None</span>
              )}
            </div>
            
            <div className="flex gap-4 items-center mt-4 md:mt-0">
               <span className="font-display text-xl">HINTS ({gameState.players[currentPlayerId]?.hints || 0}):</span>
               <Button 
                  variant="primary" 
                  disabled={gameState.players[currentPlayerId]?.hints <= 0}
                  onClick={() => activateHint('common_continuation')}
                  className="px-3 py-1 text-sm"
               >
                 USE HINT
               </Button>
            </div>
          </div>
        )}

        {/* Word History */}
        <div className="w-full mt-4 bg-black/20 p-4 rounded-xl h-48 overflow-y-auto border-2 border-black flex flex-col gap-2">
          <h3 className="font-display text-xl text-secondary drop-shadow-[2px_2px_0_#000]">WORD HISTORY</h3>
          {[...gameState.wordHistory].reverse().map((sub, idx) => (
            <div key={idx} className="flex justify-between items-center bg-background p-2 rounded border border-gray-800">
              <span className="font-bold text-lg">{sub.word.toUpperCase()}</span>
              <span className="text-sm text-gray-400">
                {gameState.players[sub.playerId].name} (+{sub.points} pts)
              </span>
            </div>
          ))}
          {gameState.wordHistory.length === 0 && (
            <span className="text-gray-500 italic">No words played yet.</span>
          )}
        </div>
      </main>

      {/* Winner Modal */}
      <Modal 
        isOpen={gameState.status === 'finished'} 
        onClose={() => {}} 
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
          <Button onClick={() => setIsStartModalOpen(true)} variant="primary" className="w-full mt-4 text-xl">
            PLAY AGAIN
          </Button>
        </div>
      </Modal>
    </div>
  );
}
