'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getLeaderboard, LeaderboardEntry } from '@/lib/firebase/stats';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { signInAnonymouslyToFirebase } from '@/lib/firebase/auth';

type Timeframe = 'daily' | 'weekly' | 'monthly' | 'allTime';

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<Timeframe>('daily');

  useEffect(() => {
    let mounted = true;
    
    const fetchBoard = async () => {
      setLoading(true);
      try {
        await signInAnonymouslyToFirebase();
        const data = await getLeaderboard(timeframe);
        if (mounted) setEntries(data);
      } catch (err) {
        console.error('Failed to load leaderboard', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    
    fetchBoard();
    return () => { mounted = false; };
  }, [timeframe]);

  const tabs: { id: Timeframe, label: string }[] = [
    { id: 'daily', label: 'DAILY' },
    { id: 'weekly', label: 'WEEKLY' },
    { id: 'monthly', label: 'MONTHLY' },
    { id: 'allTime', label: 'ALL TIME' }
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 flex flex-col items-center">
      <header className="w-full max-w-4xl flex justify-between items-center mb-8">
        <h1 className="font-display text-4xl md:text-6xl text-secondary drop-shadow-[4px_4px_0_#000]">LEADERBOARD</h1>
        <Link href="/">
          <Button variant="primary">HOME</Button>
        </Link>
      </header>

      <div className="w-full max-w-4xl mb-8 flex flex-wrap gap-2 md:gap-4 bg-black/20 p-2 md:p-4 rounded-xl border-2 border-black">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setTimeframe(tab.id)}
            className={`flex-1 min-w-[100px] py-3 px-4 font-display text-xl transition-all border-4 border-black rounded-brutal shadow-[4px_4px_0_#000] focus:outline-none focus:translate-y-1 focus:shadow-[0px_0px_0_#000] active:translate-y-1 active:shadow-[0px_0px_0_#000] ${
              timeframe === tab.id 
                ? 'bg-secondary text-black translate-y-1 shadow-[0px_0px_0_#000]' 
                : 'bg-card text-black hover:bg-[#E5E0D8]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="w-full max-w-4xl bg-card border-4 border-black rounded-brutal shadow-[12px_12px_0_#000] overflow-hidden">
        <div className="bg-primary p-4 border-b-4 border-black flex items-center justify-between text-foreground">
          <div className="flex gap-4 w-1/2 md:w-1/3">
            <span className="font-display text-xl w-12 text-center">#</span>
            <span className="font-display text-xl">PLAYER</span>
          </div>
          <span className="font-display text-xl text-right w-1/3">HIGH SCORE</span>
        </div>
        
        <div className="flex flex-col min-h-[400px]">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <span className="font-display text-2xl text-black animate-pulse">LOADING...</span>
            </div>
          ) : entries.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-gray-500 font-bold italic">
              No scores recorded yet. Be the first!
            </div>
          ) : (
            entries.map((entry, idx) => (
              <div 
                key={entry.userId + idx} 
                className={`flex items-center justify-between p-4 border-b-2 border-black/10 text-black hover:bg-black/5 transition-colors ${idx < 3 ? 'bg-secondary/10' : ''}`}
              >
                <div className="flex gap-4 items-center w-1/2 md:w-1/3">
                  <span className={`font-display text-2xl w-12 text-center ${idx === 0 ? 'text-primary' : idx === 1 ? 'text-secondary' : idx === 2 ? 'text-danger' : 'text-gray-400'}`}>
                    {idx + 1}
                  </span>
                  <span className="font-bold text-lg md:text-xl truncate">{entry.playerName.toUpperCase()}</span>
                </div>
                <div className="w-1/3 text-right">
                  <Badge variant={idx === 0 ? 'primary' : 'secondary'} className="text-xl px-4 py-2">
                    {entry.score}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
