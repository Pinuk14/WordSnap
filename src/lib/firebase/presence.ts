import { ref, onValue, onDisconnect, set, serverTimestamp } from 'firebase/database';
import { db } from './config';

export function setupPresence(roomId: string, userId: string) {
  const connectedRef = ref(db, '.info/connected');
  const userStatusRef = ref(db, `rooms/${roomId}/presence/${userId}`);

  const unsubscribe = onValue(connectedRef, (snap) => {
    if (snap.val() === true) {
      // When we disconnect, update the user's status
      onDisconnect(userStatusRef).set({
        state: 'offline',
        lastChanged: serverTimestamp(),
      }).then(() => {
        // Once the onDisconnect is queued, set user's status to online
        set(userStatusRef, {
          state: 'online',
          lastChanged: serverTimestamp(),
        });
      });
    }
  });

  return unsubscribe;
}
