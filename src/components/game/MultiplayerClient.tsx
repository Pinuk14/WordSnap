'use client';
import React, { useState } from 'react';
import { useMultiplayerGame } from '@/hooks/useMultiplayerGame';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { CircularTimer } from '@/components/ui/CircularTimer';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { getTurnDuration } from '@/lib/game-engine/gameModes';

export function MultiplayerClient() {
  const { 
    isEngineLoaded, 
    userId, 
    roomId, 
    roomState, 
    timeRemaining, 
    createRoom, 
    joinRoom, 
    startGame, 
    submit 
  } = useMultiplayerGame();
  
  const [inputValue, setInputValue] = useState('');
  const [isInvalid, setIsInvalid] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [playerName, setPlayerName] = useState('');

  if (!isEngineLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-primary">
        <h1 className="font-display text-4xl animate-pulse">LOADING ENGINE...</h1>
      </div>
    );
  }

  if (!roomId || !roomState) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md p-8 flex flex-col gap-8">
          <h2 className="font-display text-4xl text-center text-primary drop-shadow-[2px_2px_0_#000]">MULTIPLAYER</h2>
          <Input 
            placeholder="YOUR NAME" 
            value={playerName} 
            onChange={e => setPlayerName(e.target.value)} 
          />
          <div className="flex flex-col gap-4">
            <Button 
              variant="primary" 
              disabled={!playerName}
              onClick={() => createRoom(playerName)}
            >
              CREATE ROOM
            </Button>
            <div className="flex gap-2">
              <Input 
                placeholder="ROOM CODE" 
                value={joinCode} 
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                className="uppercase" 
              />
              <Button 
                variant="secondary" 
                disabled={!playerName || !joinCode}
                onClick={() => joinRoom(joinCode, playerName)}
              >
                JOIN
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (roomState.status === 'lobby' || !roomState.gameState) {
    const isHost = roomState.hostId === userId;
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-lg p-8 flex flex-col gap-8 items-center">
          <Badge variant="primary" className="text-2xl px-6 py-2">ROOM CODE: {roomId}</Badge>
          <div className="w-full">
            <h3 className="font-display text-2xl mb-4 text-secondary drop-shadow-[1px_1px_0_#000]">PLAYERS:</h3>
            <div className="flex flex-col gap-2">
              {Object.entries(roomState.players).map(([id, p]) => (
                <div key={id} className="flex justify-between p-3 bg-black/20 border-2 border-black rounded font-bold">
                  <span>{p.name}</span>
                  {id === roomState.hostId && <Badge variant="secondary">HOST</Badge>}
                </div>
              ))}
            </div>
          </div>
          {isHost ? (
            <div className="flex gap-4 w-full">
              <Button onClick={() => startGame('classic')} variant="primary" className="flex-1">Start Classic</Button>
              <Button onClick={() => startGame('speed')} variant="danger" className="flex-1">Start Speed</Button>
              <Button onClick={() => startGame('category')} variant="secondary" className="flex-1">Start Category</Button>
            </div>
          ) : (
            <p className="font-sans text-gray-400 font-bold italic animate-pulse">Waiting for host to start...</p>
          )}
        </Card>
      </div>
    );
  }

  // Active Game State
  const gameState = roomState.gameState;
  const currentPlayerId = gameState.playerOrder[gameState.currentPlayerIndex];
  const turnDuration = getTurnDuration(gameState.mode);
  const timePercentage = Math.max(0, (timeRemaining / turnDuration) * 100);

  const wordHistory = gameState.wordHistory || [];
  const lastWord = wordHistory.length > 0 
    ? wordHistory[wordHistory.length - 1].word 
    : '???';

  const requiredLetter = wordHistory.length > 0
    ? lastWord.charAt(lastWord.length - 1).toUpperCase()
    : 'ANY';

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
    <div className="min-h-screen bg-background text-foreground flex flex-col p-4 md:p-8">
      {/* Header: Scoreboard */}
      <header className="flex flex-wrap gap-4 justify-between items-center mb-8">
        <div className="flex flex-wrap gap-4">
          {gameState.playerOrder.map(pid => {
            const p = gameState.players[pid];
            const isCurrent = pid === currentPlayerId;
            const presence = roomState.presence?.[pid];
            const isOffline = presence?.state === 'offline';
            return (
              <Card key={pid} className={`p-4 flex items-center gap-4 transition-all duration-300 ${isCurrent ? 'ring-4 ring-primary scale-105' : 'opacity-70'} ${p.isEliminated ? 'grayscale opacity-30 scale-95' : ''}`}>
                <div className="relative">
                  <Avatar alt={p.name} fallbackInitials={p.name.slice(0, 2).toUpperCase()} size="sm" />
                  <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-black ${isOffline ? 'bg-danger' : 'bg-success'}`} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-lg leading-tight text-black flex items-center gap-2">
                    {p.name} {pid === userId && '(YOU)'}
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
            placeholder={isMyTurn ? "TYPE A WORD..." : "WAITING FOR OPPONENT..."}
            state={isInvalid ? 'invalid' : 'default'}
            className="text-2xl uppercase h-16 w-full"
            autoFocus
            disabled={!isMyTurn || gameState.status === 'finished'}
          />
          <Button type="submit" variant="primary" className="h-16 px-8 text-xl" disabled={!isMyTurn || gameState.status === 'finished'}>
            SUBMIT
          </Button>
        </form>

        {/* Word History */}
        <div className="w-full mt-4 bg-black/20 p-4 rounded-xl h-48 overflow-y-auto border-2 border-black flex flex-col gap-2">
          <h3 className="font-display text-xl text-secondary drop-shadow-[2px_2px_0_#000]">WORD HISTORY</h3>
          {[...wordHistory].reverse().map((sub, idx) => (
            <div key={idx} className="flex justify-between items-center bg-background p-2 rounded border border-gray-800">
              <span className="font-bold text-lg">{sub.word.toUpperCase()}</span>
              <span className="text-sm text-gray-400">
                {gameState.players[sub.playerId].name} (+{sub.points} pts)
              </span>
            </div>
          ))}
          {wordHistory.length === 0 && (
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
          {roomState.hostId === userId && (
            <Button onClick={() => startGame('classic')} variant="primary" className="w-full mt-4 text-xl">
              PLAY AGAIN
            </Button>
          )}
        </div>
      </Modal>
    </div>
  );
}
