'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { sanitizePlayerName, sanitizeRoomCode, isValidPlayerName } from '@/lib/sanitize';
import { AuthBadge } from '@/components/auth/AuthBadge';
import { useAuth } from '@/contexts/AuthContext';

export default function JoinRoomPage() {
  const { userProfile, isGuest } = useAuth();
  const [playerName, setPlayerName] = useState(
    !isGuest && userProfile?.displayName ? userProfile.displayName : ''
  );
  const [roomCode, setRoomCode] = useState('');
  const router = useRouter();

  const handleJoin = () => {
    const sanitizedName = sanitizePlayerName(playerName);
    const sanitizedCode = sanitizeRoomCode(roomCode);
    if (!isValidPlayerName(sanitizedName) || !sanitizedCode) return;
    router.push(`/room/${sanitizedCode}?name=${encodeURIComponent(sanitizedName)}&action=join`);
  };

  return (
    <div className="flex h-screen items-center justify-center bg-background p-4 relative">
      <div className="absolute top-4 right-4 md:top-8 md:right-8 z-40">
        <AuthBadge />
      </div>

      <Card className="w-full max-w-md p-8 flex flex-col gap-8">
        <h2 className="font-display text-4xl text-center text-primary drop-shadow-[2px_2px_0_#000]">JOIN ROOM</h2>
        <Input 
          placeholder="ROOM CODE" 
          value={roomCode} 
          onChange={e => setRoomCode(e.target.value.toUpperCase())}
          className="uppercase"
          maxLength={10}
          autoFocus
        />
        <Input 
          placeholder="YOUR NAME" 
          value={playerName} 
          onChange={e => setPlayerName(e.target.value)}
          maxLength={20}
        />
        <Button 
          variant="secondary" 
          disabled={!isValidPlayerName(sanitizePlayerName(playerName)) || !sanitizeRoomCode(roomCode)}
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
