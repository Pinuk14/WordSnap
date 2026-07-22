'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  subscribeToAuthChanges,
  signInAnonymouslyToFirebase,
  signInWithGoogle,
  linkAnonymousToGoogle,
  signOutUser,
} from '@/lib/firebase/auth';
import { createOrUpdateProfile, UserProfile, getProfile } from '@/lib/firebase/userProfile';

interface AuthContextType {
  /** The current Firebase user (null while loading) */
  user: User | null;
  /** The persistent user profile (Google users only) */
  userProfile: UserProfile | null;
  /** True if the user is signed in anonymously (Guest) */
  isGuest: boolean;
  /** True while auth state is being determined */
  isLoading: boolean;
  /** True if a user is authenticated (guest or Google) */
  isAuthenticated: boolean;
  /** Sign in with Google (or link an anonymous account) */
  signInGoogle: (rememberMe?: boolean) => Promise<void>;
  /** Sign out and revert to guest */
  signOut: () => Promise<void>;
  /** Show/hide the auth modal */
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  /** Force refresh the user profile */
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  isGuest: true,
  isLoading: true,
  isAuthenticated: false,
  signInGoogle: async () => {},
  signOut: async () => {},
  showAuthModal: false,
  setShowAuthModal: () => {},
  refreshProfile: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // A user is a guest if they have no authentication providers linked (anonymous)
  const isGuest = user ? user.providerData.length === 0 : true;
  const isAuthenticated = !!user;

  // Subscribe to auth state
  useEffect(() => {
    const unsub = subscribeToAuthChanges(async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser && firebaseUser.providerData.length > 0) {
        // Google user — create/update profile and load it
        await createOrUpdateProfile(firebaseUser);
        const profile = await getProfile(firebaseUser.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }

      setIsLoading(false);
    });

    return () => unsub();
  }, []);

  // Auto sign-in anonymously if no user after initial load
  useEffect(() => {
    if (!isLoading && !user) {
      signInAnonymouslyToFirebase().catch(console.error);
    }
  }, [isLoading, user]);

  const signInGoogle = useCallback(async (rememberMe: boolean = true) => {
    try {
      if (user && user.providerData.length === 0) {
        // Try to link the anonymous account to preserve in-game references
        const linkedUser = await linkAnonymousToGoogle(rememberMe);
        
        // Force state update since onAuthStateChanged might not fire when linking
        // Create a new object reference to trigger React re-render
        const updatedUser = Object.assign(Object.create(Object.getPrototypeOf(linkedUser)), linkedUser);
        setUser(updatedUser);
        
        await createOrUpdateProfile(updatedUser);
        const profile = await getProfile(updatedUser.uid);
        setUserProfile(profile);
      } else {
        await signInWithGoogle(rememberMe);
      }
      setShowAuthModal(false);
    } catch (err) {
      console.error('Google sign-in failed:', err);
    }
  }, [user]);

  const signOut = useCallback(async () => {
    try {
      await signOutUser();
      setUserProfile(null);
      // After sign-out, the auth listener will fire with null,
      // and the auto-anon effect will re-create a guest account
    } catch (err) {
      console.error('Sign-out failed:', err);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.uid) {
      const profile = await getProfile(user.uid);
      setUserProfile(profile);
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        isGuest,
        isLoading,
        isAuthenticated,
        signInGoogle,
        signOut,
        showAuthModal,
        setShowAuthModal,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
