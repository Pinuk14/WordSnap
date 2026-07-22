'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export function AuthModal() {
  const { showAuthModal, setShowAuthModal, signInGoogle, isLoading } = useAuth();
  const [rememberMe, setRememberMe] = useState(true);

  const handleGuest = () => {
    // Already signed in anonymously by the AuthProvider
    setShowAuthModal(false);
  };

  const handleGoogle = async () => {
    await signInGoogle(rememberMe);
  };

  return (
    <Modal
      isOpen={showAuthModal}
      onClose={() => setShowAuthModal(false)}
      title="SIGN IN"
    >
      <div className="flex flex-col gap-6 p-2">
        <p className="font-bold text-center text-black text-lg">
          How would you like to play?
        </p>

        {/* Google Sign-In */}
        <button
          onClick={handleGoogle}
          disabled={isLoading}
          aria-label="Continue with Google"
          className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold text-lg py-4 px-6 border-4 border-black rounded-brutal shadow-[4px_4px_0_#000] hover:translate-y-1 hover:shadow-[0px_0px_0_#000] active:translate-y-1 active:shadow-[0px_0px_0_#000] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" className="flex-shrink-0">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          CONTINUE WITH GOOGLE
        </button>

        {/* Keep Me Signed In Checkbox */}
        <label className="flex items-center gap-3 cursor-pointer select-none group" htmlFor="remember-me-checkbox">
          <div className="relative">
            <input
              id="remember-me-checkbox"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-6 h-6 border-4 border-black rounded bg-white peer-checked:bg-primary peer-focus-visible:ring-4 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 transition-colors flex items-center justify-center">
              {rememberMe && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              )}
            </div>
          </div>
          <span className="font-bold text-sm text-black group-hover:text-primary transition-colors">
            Keep me signed in
          </span>
        </label>

        <div className="flex items-center gap-4">
          <div className="flex-1 h-1 bg-black/20 rounded" />
          <span className="font-display text-sm text-gray-500">OR</span>
          <div className="flex-1 h-1 bg-black/20 rounded" />
        </div>

        {/* Guest Mode */}
        <Button
          onClick={handleGuest}
          variant="secondary"
          className="w-full text-lg py-4"
          disabled={isLoading}
          aria-label="Continue as guest"
        >
          👤 CONTINUE AS GUEST
        </Button>

        <p className="text-sm text-gray-500 text-center font-bold mt-2">
          Guest progress is temporary. Sign in with Google to save your stats and appear on leaderboards.
        </p>
      </div>
    </Modal>
  );
}
