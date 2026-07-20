'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

export default function JoinRoomPage() {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const router = useRouter();

  const handleJoin = () => {
    if (!playerName.trim() || !roomCode.trim()) return;
    router.push(`/room/${roomCode.toUpperCase()}?name=${encodeURIComponent(playerName)}&action=join`);
  };

  return (
    <div className="flex h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8 flex flex-col gap-8">
        <h2 className="font-display text-4xl text-center text-primary drop-shadow-[2px_2px_0_#000]">JOIN ROOM</h2>
        <Input 
          placeholder="ROOM CODE" 
          value={roomCode} 
          onChange={e => setRoomCode(e.target.value.toUpperCase())}
          className="uppercase"
          autoFocus
        />
        <Input 
          placeholder="YOUR NAME" 
          value={playerName} 
          onChange={e => setPlayerName(e.target.value)}
        />
        <Button 
          variant="secondary" 
          disabled={!playerName.trim() || !roomCode.trim()}
          onClick={handleJoin}
        >
          ENTER LOBBY
        </Button>
        <Button 
          variant="primary" 
          onClick={() => router.push('/')}
        >
          BACK
        </Button>
      </Card>
    </div>
  );
}
