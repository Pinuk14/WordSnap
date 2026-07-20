'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="flex h-screen items-center justify-center bg-background p-4 flex-col gap-8 text-center">
      <h1 className="font-display text-8xl md:text-9xl text-danger drop-shadow-[6px_6px_0_#000]">
        404
      </h1>
      <h2 className="font-sans text-3xl font-bold text-white">PAGE NOT FOUND</h2>
      <p className="max-w-md text-gray-400">
        The word you&apos;re looking for isn&apos;t in our dictionary, and neither is this page.
      </p>
      <Link href="/">
        <Button variant="primary" className="mt-8 text-xl">RETURN HOME</Button>
      </Link>
    </div>
  );
}
