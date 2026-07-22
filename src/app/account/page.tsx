'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { AuthBadge } from '@/components/auth/AuthBadge';
import { updateProfileName } from '@/lib/firebase/userProfile';
import { sanitizePlayerName, isValidPlayerName } from '@/lib/sanitize';
import { useToast } from '@/components/ui/Toast';

export default function AccountPage() {
  const { user, userProfile, isGuest, isAuthenticated, setShowAuthModal, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const { addToast } = useToast();

  useEffect(() => {
    if (userProfile?.displayName) {
      setDisplayName(userProfile.displayName);
    }
  }, [userProfile]);

  const handleSave = async () => {
    if (!user || isGuest) return;
    
    const sanitized = sanitizePlayerName(displayName);
    if (!isValidPlayerName(sanitized)) {
      addToast('Invalid name. Must be 1-20 letters/numbers.', 'danger');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfileName(user.uid, sanitized);
      await refreshProfile();
      addToast('Profile updated successfully!', 'success');
    } catch (err) {
      console.error('Failed to update profile', err);
      addToast('Failed to update profile', 'danger');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-primary">
        <h1 className="font-display text-4xl animate-pulse">LOADING PROFILE...</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 flex flex-col items-center relative">
      <div className="absolute top-4 right-4 md:top-8 md:right-8 z-40">
        <AuthBadge />
      </div>

      <header className="w-full max-w-4xl flex justify-between items-center mb-12">
        <h1 className="font-display text-5xl md:text-6xl text-primary drop-shadow-[4px_4px_0_#000]">ACCOUNT</h1>
        <Link href="/">
          <Button variant="secondary">HOME</Button>
        </Link>
      </header>

      {isGuest ? (
        <Card className="w-full max-w-md p-8 text-center bg-card flex flex-col gap-6 items-center">
          <div className="w-24 h-24 rounded-full bg-warning border-4 border-black flex items-center justify-center shadow-[4px_4px_0_#000]">
            <span className="text-4xl">👤</span>
          </div>
          <h2 className="font-display text-3xl text-black">GUEST PROFILE</h2>
          <p className="font-bold text-gray-800 text-lg">
            You are currently playing as a guest. Sign in to customize your profile, save your stats, and appear on leaderboards!
          </p>
          <Button 
            variant="primary" 
            className="w-full mt-4 text-xl" 
            onClick={() => setShowAuthModal(true)}
          >
            SIGN IN WITH GOOGLE
          </Button>
        </Card>
      ) : (
        <Card className="w-full max-w-2xl p-6 md:p-8 flex flex-col gap-8">
          <div className="flex flex-col md:flex-row gap-8 items-center border-b-4 border-black pb-8">
            <div className="flex flex-col items-center gap-4">
              <div className="w-32 h-32 rounded-full border-4 border-black bg-success overflow-hidden shadow-[4px_4px_0_#000] flex items-center justify-center relative group">
                {userProfile?.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={userProfile.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span className="font-display text-6xl text-black">{userProfile?.displayName?.slice(0, 2).toUpperCase() || 'P'}</span>
                )}
                {/* Placeholder for future picture changing feature */}
                <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-white font-bold text-sm cursor-not-allowed">
                  SOON
                </div>
              </div>
            </div>
            
            <div className="flex-1 w-full space-y-6">
              <div className="space-y-2">
                <label className="font-display text-2xl text-black">DISPLAY NAME</label>
                <Input 
                  value={displayName} 
                  onChange={(e) => setDisplayName(e.target.value)} 
                  maxLength={20}
                  placeholder="YOUR NAME"
                  className="text-2xl py-4"
                />
                <p className="font-bold text-sm text-gray-600">This name will be shown in multiplayer matches and leaderboards.</p>
              </div>

              <div className="space-y-2">
                <label className="font-display text-2xl text-black">EMAIL</label>
                <div className="bg-black/10 border-4 border-black/20 rounded-brutal p-4">
                  <p className="font-bold text-gray-700 text-lg">{user?.email || 'No email attached'}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-4">
            <h3 className="font-display text-2xl text-black opacity-50">SKINS & CUSTOMIZATION</h3>
            <div className="bg-black/10 border-4 border-black/20 border-dashed rounded-xl p-8 text-center">
              <p className="font-bold text-gray-600 text-lg">Custom avatars and skins are coming soon!</p>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-4">
            <Button 
              variant="secondary" 
              onClick={() => {
                setDisplayName(userProfile?.displayName || '');
                router.push('/');
              }}
            >
              CANCEL
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSave}
              disabled={isSaving || displayName === userProfile?.displayName || !isValidPlayerName(sanitizePlayerName(displayName))}
            >
              {isSaving ? 'SAVING...' : 'SAVE CHANGES'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
