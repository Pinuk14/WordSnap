import {
  signInAnonymously,
  signInWithPopup,
  GoogleAuthProvider,
  linkWithPopup,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  User,
  AuthError,
} from 'firebase/auth';
import { auth } from './config';

const googleProvider = new GoogleAuthProvider();

/**
 * Sign in anonymously (Guest mode).
 * Creates a temporary Firebase account with no credentials.
 */
export function signInAnonymouslyToFirebase(): Promise<User> {
  return signInAnonymously(auth).then((cred) => cred.user);
}

/**
 * Sign in with Google.
 * Opens a Google sign-in popup and returns the authenticated user.
 */
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/**
 * Link an anonymous account to Google.
 * Preserves the anonymous UID so in-game references remain valid.
 * If linking fails due to credential-already-in-use, falls back to
 * a fresh Google sign-in (the anonymous account is abandoned).
 */
export async function linkAnonymousToGoogle(): Promise<User> {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.isAnonymous) {
    // Not anonymous — just do a regular Google sign-in
    return signInWithGoogle();
  }

  try {
    const result = await linkWithPopup(currentUser, googleProvider);
    return result.user;
  } catch (err) {
    const authError = err as AuthError;
    // If the Google account is already linked to another Firebase account,
    // fall back to a regular sign-in (abandons the anonymous account).
    if (authError.code === 'auth/credential-already-in-use') {
      return signInWithGoogle();
    }
    throw err;
  }
}

/**
 * Sign out the current user.
 */
export function signOutUser(): Promise<void> {
  return firebaseSignOut(auth);
}

/**
 * Subscribe to authentication state changes.
 */
export function subscribeToAuthChanges(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Get the current user's ID token for API calls (future use).
 */
export async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}
