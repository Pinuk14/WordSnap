'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getPersonalStats, UserStats } from '@/lib/firebase/stats';

import { Button } from '@/components/ui/Button';
import { AuthBadge } from '@/components/auth/AuthBadge';
import { useAuth } from '@/contexts/AuthContext';

export default function StatsPage() {
  const { user, userProfile, isGuest, isAuthenticated, setShowAuthModal } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const loadStats = async () => {
      try {
        const data = await getPersonalStats(user.uid);
        setStats(data);
      } catch (err) {
        console.error('Failed to load stats', err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [user]);

  if (!isAuthenticated || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-primary">
        <h1 className="font-display text-4xl animate-pulse">LOADING STATS...</h1>
      </div>
    );
  }

  const StatBox = ({ label, value, bg = 'bg-black/20', textColor = 'text-white' }: { label: string, value: string | number, bg?: string, textColor?: string }) => (
    <div className={`flex flex-col p-4 md:p-6 border-2 border-black rounded-xl ${bg} items-center justify-center text-center shadow-[4px_4px_0_#000]`}>
      <span className="font-sans text-sm md:text-base font-bold text-gray-400 mb-2 uppercase tracking-wider">{label}</span>
      <span className={`font-display text-3xl md:text-5xl drop-shadow-[2px_2px_0_#000] ${textColor}`}>{value}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 flex flex-col items-center relative">
      <div className="absolute top-4 right-4 md:top-8 md:right-8 z-40">
        <AuthBadge />
      </div>

      <header className="w-full max-w-4xl flex justify-between items-center mb-12">
        <h1 className="font-display text-5xl md:text-6xl text-primary drop-shadow-[4px_4px_0_#000]">MY STATS</h1>
        <Link href="/">
          <Button variant="secondary">HOME</Button>
        </Link>
      </header>

      {isGuest && (
        <div className="w-full max-w-4xl mb-6 bg-warning text-black border-4 border-black rounded-brutal p-4 shadow-[4px_4px_0_#000] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-bold text-sm md:text-base text-center md:text-left">
            👤 Guest stats are temporary and will be lost when your session ends.
          </p>
          <Button
            variant="primary"
            className="text-sm whitespace-nowrap"
            onClick={() => setShowAuthModal(true)}
          >
            SIGN IN TO SAVE
          </Button>
        </div>
      )}

      {(() => {
        const displayStats = stats || {
          gamesPlayed: 0, wins: 0, losses: 0, totalScore: 0, totalWords: 0,
          highestScore: 0, longestWinStreak: 0, currentWinStreak: 0, topWord: null,
          playerName: userProfile?.displayName || 'PLAYER',
          hintsUsed: 0, powerUpsUsed: 0, perfectRounds: 0, deadlocksSurvived: 0
        };

        return (
          <div className="w-full max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="col-span-2 md:col-span-4 bg-secondary text-black border-4 border-black p-6 rounded-brutal shadow-[8px_8px_0_#000] mb-4">
              <h2 className="font-display text-4xl mb-2">{displayStats.playerName.toUpperCase()}</h2>
              <p className="font-bold text-lg opacity-80">
                {isGuest ? 'Guest Profile (Temporary)' : 'WordSnap Profile'}
              </p>
            </div>

            <StatBox label="Games Played" value={displayStats.gamesPlayed} />
            <StatBox label="Wins" value={displayStats.wins} textColor="text-success" />
            <StatBox label="Losses" value={displayStats.losses} textColor="text-danger" />
            <StatBox label="Win Rate" value={`${Math.round((displayStats.wins / Math.max(1, displayStats.gamesPlayed)) * 100)}%`} />

            <StatBox label="Avg Score" value={Math.round(displayStats.totalScore / Math.max(1, displayStats.gamesPlayed))} bg="bg-primary/20" textColor="text-primary" />
            <StatBox label="Avg Words" value={Math.round(displayStats.totalWords / Math.max(1, displayStats.gamesPlayed))} bg="bg-primary/20" textColor="text-primary" />
            <StatBox label="Highest Score" value={displayStats.highestScore} textColor="text-secondary" />
            <StatBox label="Longest Streak" value={displayStats.longestWinStreak} textColor="text-success" />

            {displayStats.topWord && (
              <div className="col-span-2 md:col-span-4 mt-4 bg-primary text-foreground border-4 border-black p-6 md:p-8 rounded-brutal flex flex-col md:flex-row items-center justify-between shadow-[8px_8px_0_#000]">
                <div className="flex flex-col text-center md:text-left mb-4 md:mb-0">
                  <span className="font-bold text-xl opacity-90 mb-2">TOP WORD PLAYED</span>
                  <span className="font-display text-5xl md:text-7xl tracking-widest break-all">
                    {displayStats.topWord.word.toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="font-display text-6xl text-secondary drop-shadow-[2px_2px_0_#000]">{displayStats.topWord.points}</span>
                  <span className="font-bold">POINTS</span>
                </div>
              </div>
            )}
            
            {!stats && (
              <div className="col-span-2 md:col-span-4 mt-4 text-center">
                <p className="font-bold text-gray-800 text-lg">Play your first game to start tracking your statistics!</p>
                <Link href="/">
                  <Button variant="primary" className="mt-4 px-8 py-3 text-xl">PLAY NOW</Button>
                </Link>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
