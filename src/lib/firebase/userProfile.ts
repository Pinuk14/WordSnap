import { ref, get, set, serverTimestamp } from 'firebase/database';
import { User } from 'firebase/auth';
import { db } from './config';

export interface UserProfile {
  displayName: string;
  photoURL: string | null;
  createdAt: number | object;
  lastLoginAt: number | object;
  isGuest: boolean;
  uid: string;
}

/**
 * Create or update a user profile in the Realtime Database.
 * Called after Google sign-in to persist identity.
 */
export async function createOrUpdateProfile(user: User): Promise<void> {
  const profileRef = ref(db, `players/${user.uid}`);
  const snap = await get(profileRef);

  if (snap.exists()) {
    // Update last login
    await set(profileRef, {
      ...snap.val(),
      uid: user.uid,
      displayName: user.displayName || snap.val().displayName || 'Player',
      photoURL: user.photoURL || snap.val().photoURL || null,
      lastLoginAt: serverTimestamp(),
      isGuest: user.providerData.length === 0,
    });
  } else {
    // New profile
    await set(profileRef, {
      uid: user.uid,
      displayName: user.displayName || 'Player',
      photoURL: user.photoURL || null,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      isGuest: user.providerData.length === 0,
    });
  }
}

/**
 * Get a user profile from the database.
 */
export async function getProfile(userId: string): Promise<UserProfile | null> {
  const snap = await get(ref(db, `players/${userId}`));
  return snap.exists() ? (snap.val() as UserProfile) : null;
}

/**
 * Update the user's displayName in the database.
 */
export async function updateProfileName(userId: string, newName: string): Promise<void> {
  const profileRef = ref(db, `players/${userId}`);
  const snap = await get(profileRef);
  if (snap.exists()) {
    await set(profileRef, {
      ...snap.val(),
      displayName: newName
    });
  }
}
