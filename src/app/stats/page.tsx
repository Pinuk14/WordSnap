'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getPersonalStats, UserStats } from '@/lib/firebase/stats';
import { subscribeToAuthChanges, signInAnonymouslyToFirebase } from '@/lib/firebase/auth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function StatsPage() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubAuth: () => void;
    
    const loadStats = async (uid: string) => {
      try {
        const data = await getPersonalStats(uid);
        setStats(data);
      } catch (err) {
        console.error('Failed to load stats', err);
      } finally {
        setLoading(false);
      }
    };

    const init = async () => {
      await signInAnonymouslyToFirebase();
      unsubAuth = subscribeToAuthChanges((user) => {
        if (user) {
          loadStats(user.uid);
        } else {
          setLoading(false);
        }
      });
    };
    init();

    return () => {
      if (unsubAuth) unsubAuth();
    };
  }, []);

  if (loading) {
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
    <div className="min-h-screen bg-background p-4 md:p-8 flex flex-col items-center">
      <header className="w-full max-w-4xl flex justify-between items-center mb-12">
        <h1 className="font-display text-5xl md:text-6xl text-primary drop-shadow-[4px_4px_0_#000]">MY STATS</h1>
        <Link href="/">
          <Button variant="secondary">HOME</Button>
        </Link>
      </header>

      {!stats ? (
        <Card className="w-full max-w-md p-8 text-center bg-card flex flex-col gap-4">
          <h2 className="font-display text-3xl text-danger">NO DATA YET</h2>
          <p className="font-bold text-gray-800">Play your first game to start tracking your statistics!</p>
          <Link href="/">
            <Button variant="primary" className="w-full mt-4">PLAY NOW</Button>
          </Link>
        </Card>
      ) : (
        <div className="w-full max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <div className="col-span-2 md:col-span-4 bg-secondary text-black border-4 border-black p-6 rounded-brutal shadow-[8px_8px_0_#000] mb-4">
            <h2 className="font-display text-4xl mb-2">{stats.playerName.toUpperCase()}</h2>
            <p className="font-bold text-lg opacity-80">WordSnap Anonymous Profile</p>
          </div>

          <StatBox label="Games Played" value={stats.gamesPlayed} />
          <StatBox label="Wins" value={stats.wins} textColor="text-success" />
          <StatBox label="Losses" value={stats.losses} textColor="text-danger" />
          <StatBox label="Win Rate" value={`${Math.round((stats.wins / Math.max(1, stats.gamesPlayed)) * 100)}%`} />

          <StatBox label="Avg Score" value={Math.round(stats.totalScore / Math.max(1, stats.gamesPlayed))} bg="bg-primary/20" textColor="text-primary" />
          <StatBox label="Avg Words" value={Math.round(stats.totalWords / Math.max(1, stats.gamesPlayed))} bg="bg-primary/20" textColor="text-primary" />
          <StatBox label="Highest Score" value={stats.highestScore} textColor="text-secondary" />
          <StatBox label="Longest Streak" value={stats.longestWinStreak} textColor="text-success" />

          {stats.topWord && (
            <div className="col-span-2 md:col-span-4 mt-4 bg-primary text-foreground border-4 border-black p-6 md:p-8 rounded-brutal flex flex-col md:flex-row items-center justify-between shadow-[8px_8px_0_#000]">
              <div className="flex flex-col text-center md:text-left mb-4 md:mb-0">
                <span className="font-bold text-xl opacity-90 mb-2">TOP WORD PLAYED</span>
                <span className="font-display text-5xl md:text-7xl tracking-widest break-all">
                  {stats.topWord.word.toUpperCase()}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-display text-6xl text-secondary drop-shadow-[2px_2px_0_#000]">{stats.topWord.points}</span>
                <span className="font-bold">POINTS</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
