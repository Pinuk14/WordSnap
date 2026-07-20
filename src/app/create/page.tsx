'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

export default function CreateRoomPage() {
  const [playerName, setPlayerName] = useState('');
  const router = useRouter();

  const handleCreate = () => {
    if (!playerName.trim()) return;
    // We navigate to /room/new?name=xxx, and the RoomClient will handle actual creation
    // Alternatively, we can just redirect to a random string and pass the name via sessionStorage or URL.
    const newRoomId = Math.random().toString(36).substring(2, 6).toUpperCase();
    router.push(`/room/${newRoomId}?name=${encodeURIComponent(playerName)}&action=create`);
  };

  return (
    <div className="flex h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8 flex flex-col gap-8">
        <h2 className="font-display text-4xl text-center text-primary drop-shadow-[2px_2px_0_#000]">CREATE ROOM</h2>
        <Input 
          placeholder="YOUR NAME" 
          value={playerName} 
          onChange={e => setPlayerName(e.target.value)}
          autoFocus
        />
        <Button 
          variant="primary" 
          disabled={!playerName.trim()}
          onClick={handleCreate}
        >
          GENERATE CODE
        </Button>
        <Button 
          variant="secondary" 
          onClick={() => router.push('/')}
        >
          BACK
        </Button>
      </Card>
    </div>
  );
}
