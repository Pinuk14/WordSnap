'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { AuthBadge } from '@/components/auth/AuthBadge';

export default function Home() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center gap-12 relative">
      {/* Auth Badge — top right */}
      <div className="absolute top-4 right-4 md:top-8 md:right-8 z-40">
        <AuthBadge />
      </div>

      <div className="space-y-4">
        <h1 className="font-display text-7xl md:text-9xl text-primary drop-shadow-[8px_8px_0_#000] tracking-wider uppercase transform -rotate-2">
          WordSnap
        </h1>
        <p className="font-sans text-2xl md:text-3xl text-gray-300 font-bold max-w-2xl mx-auto">
          The fast-paced word chaining game.
        </p>
      </div>

      <div className="flex flex-col gap-6 w-full max-w-md">
        <Link href="/create" className="w-full">
          <Button variant="danger" className="w-full text-2xl py-6 hover:scale-105 transition-transform">
            CREATE ROOM
          </Button>
        </Link>
        <Link href="/join" className="w-full">
          <Button variant="primary" className="w-full text-2xl py-6 hover:scale-105 transition-transform">
            JOIN ROOM
          </Button>
        </Link>
        <Link href="/local" className="w-full">
          <Button variant="secondary" className="w-full text-xl py-4">
            PLAY LOCAL
          </Button>
        </Link>
        <div className="flex gap-4 w-full">
          <Link href="/leaderboard" className="flex-1">
            <Button variant="primary" className="w-full text-lg py-4">
              LEADERBOARD
            </Button>
          </Link>
          <Link href="/stats" className="flex-1">
            <Button variant="secondary" className="w-full text-lg py-4">
              MY STATS
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
