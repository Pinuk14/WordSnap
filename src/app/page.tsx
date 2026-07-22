'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { AuthBadge } from '@/components/auth/AuthBadge';
import { SoundToggle } from '@/components/ui/SoundToggle';

export default function Home() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4 md:p-8 text-center gap-8 md:gap-12 relative">
      {/* Header Controls */}
      <header className="absolute top-4 right-4 md:top-8 md:right-8 z-40 flex items-center gap-3">
        <SoundToggle />
        <AuthBadge />
      </header>

      <div className="space-y-4 mt-12 md:mt-0">
        <h1 className="font-display text-5xl sm:text-7xl md:text-9xl text-primary drop-shadow-[6px_6px_0_#000] md:drop-shadow-[8px_8px_0_#000] tracking-wider uppercase transform -rotate-2">
          WordSnap
        </h1>
        <p className="font-sans text-lg sm:text-2xl md:text-3xl text-gray-300 font-bold max-w-2xl mx-auto px-4">
          The fast-paced word chaining game.
        </p>
      </div>

      <nav aria-label="Main Menu" className="flex flex-col gap-4 sm:gap-6 w-full max-w-md px-4">
        <Link href="/create" aria-label="Create a new multiplayer room">
          <Button variant="danger" className="w-full text-xl sm:text-2xl py-5 sm:py-6 hover:scale-105 transition-transform">
            CREATE ROOM
          </Button>
        </Link>
        <Link href="/join" aria-label="Join an existing room with code">
          <Button variant="primary" className="w-full text-xl sm:text-2xl py-5 sm:py-6 hover:scale-105 transition-transform">
            JOIN ROOM
          </Button>
        </Link>
        <Link href="/local" aria-label="Play local pass and play mode">
          <Button variant="secondary" className="w-full text-lg sm:text-xl py-4">
            PLAY LOCAL
          </Button>
        </Link>
        <div className="flex gap-4 w-full">
          {/* Hiding leaderboard for now
          <Link href="/leaderboard" className="flex-1" aria-label="View global leaderboards">
            <Button variant="primary" className="w-full text-base sm:text-lg py-4">
              LEADERBOARD
            </Button>
          </Link>
          */}
          <Link href="/stats" className="w-full" aria-label="View your personal stats">
            <Button variant="secondary" className="w-full text-base sm:text-lg py-4">
              MY STATS
            </Button>
          </Link>
        </div>
        <Link href="/account" aria-label="Manage your account">
          <Button variant="danger" className="w-full text-base sm:text-lg py-4">
            ACCOUNT SETTINGS
          </Button>
        </Link>
      </nav>
    </main>
  );
}
