'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { sanitizePlayerName, isValidPlayerName } from '@/lib/sanitize';
import { AuthBadge } from '@/components/auth/AuthBadge';
import { useAuth } from '@/contexts/AuthContext';

export default function CreateRoomPage() {
  const { isGuest, userProfile } = useAuth();
  const [playerName, setPlayerName] = useState(
    !isGuest && userProfile?.displayName ? userProfile.displayName : ''
  );
  const router = useRouter();

  const handleCreate = () => {
    const sanitized = sanitizePlayerName(playerName);
    if (!isValidPlayerName(sanitized)) return;
    const newRoomId = Math.random().toString(36).substring(2, 6).toUpperCase();
    router.push(`/room/${newRoomId}?name=${encodeURIComponent(sanitized)}&action=create`);
  };

  return (
    <div className="flex h-screen items-center justify-center bg-background p-4 relative">
      <div className="absolute top-4 right-4 md:top-8 md:right-8 z-40">
        <AuthBadge />
      </div>

      <Card className="w-full max-w-md p-8 flex flex-col gap-8">
        <h2 className="font-display text-4xl text-center text-primary drop-shadow-[2px_2px_0_#000]">CREATE ROOM</h2>
        <Input 
          placeholder="YOUR NAME" 
          value={playerName} 
          onChange={e => setPlayerName(e.target.value)}
          maxLength={20}
          autoFocus
        />
        <Button 
          variant="primary" 
          disabled={!isValidPlayerName(sanitizePlayerName(playerName))}
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
