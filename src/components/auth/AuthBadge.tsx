'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export function AuthBadge() {
  const { user, isGuest, isLoading, signOut, setShowAuthModal, userProfile } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (isLoading || !user) {
    return (
      <div className="flex items-center gap-2 bg-black/20 px-3 py-2 rounded-brutal border-2 border-black animate-pulse">
        <div className="w-8 h-8 rounded-full bg-gray-600" />
        <span className="font-bold text-sm text-gray-400">...</span>
      </div>
    );
  }

  if (isGuest) {
    return (
      <button
        onClick={() => setShowAuthModal(true)}
        aria-label="Guest account. Click to sign in with Google."
        className="flex items-center gap-2 bg-warning text-black px-3 py-2 rounded-brutal border-2 border-black shadow-[2px_2px_0_#000] hover:translate-y-[1px] hover:shadow-[0px_0px_0_#000] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all font-bold text-sm"
      >
        👤 GUEST
        <span className="hidden md:inline text-xs opacity-70">· Sign In</span>
      </button>
    );
  }

  // Google user
  const displayName = userProfile?.displayName || user.displayName || 'Player';
  const photoURL = userProfile?.photoURL || user.photoURL || undefined;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 bg-success text-black px-3 py-2 rounded-brutal border-2 border-black shadow-[2px_2px_0_#000]">
        {photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoURL}
            alt={displayName}
            className="w-7 h-7 rounded-full border-2 border-black"
            referrerPolicy="no-referrer"
          />
        ) : (
          <Avatar alt={displayName} fallbackInitials={displayName.slice(0, 2).toUpperCase()} size="sm" />
        )}
        <span className="font-bold text-sm hidden md:block truncate max-w-[120px]">
          {displayName}
        </span>
      </div>
      <button
        onClick={() => setShowLogoutConfirm(true)}
        className="bg-danger text-white px-2 py-2 rounded-brutal border-2 border-black shadow-[2px_2px_0_#000] hover:translate-y-[1px] hover:shadow-[0px_0px_0_#000] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all font-bold text-xs"
        title="Sign Out"
        aria-label="Sign Out"
      >
        ✕
      </button>

      <Modal 
        isOpen={showLogoutConfirm} 
        onClose={() => setShowLogoutConfirm(false)}
        title="SIGN OUT"
        footer={
          <div className="flex gap-4">
            <Button 
              variant="danger" 
              className="flex-1"
              onClick={() => {
                setShowLogoutConfirm(false);
                signOut();
              }}
            >
              YES, SIGN OUT
            </Button>
            <Button 
              variant="secondary" 
              className="flex-1"
              onClick={() => setShowLogoutConfirm(false)}
            >
              CANCEL
            </Button>
          </div>
        }
      >
        <p>Are you sure you want to sign out of your account?</p>
      </Modal>
    </div>
  );
}
