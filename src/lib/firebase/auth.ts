import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './config';

export function signInAnonymouslyToFirebase(): Promise<User> {
  return new Promise((resolve, reject) => {
    signInAnonymously(auth)
      .then((userCredential) => {
        resolve(userCredential.user);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export function subscribeToAuthChanges(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
