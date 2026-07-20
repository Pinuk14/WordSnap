# WordSnap — Security Documentation

## Table of Contents
1. [Authentication Flow](#authentication-flow)
2. [Guest Account Lifecycle](#guest-account-lifecycle)
3. [Google Account Lifecycle](#google-account-lifecycle)
4. [Firebase Security Rules](#firebase-security-rules)
5. [Input Sanitization](#input-sanitization)
6. [Leaderboard Protection](#leaderboard-protection)
7. [Future: Server-Side Validation](#future-server-side-validation)

---

## Authentication Flow

WordSnap uses **Firebase Authentication** with two sign-in methods:

### Flow Diagram

```
User visits app
       │
       ▼
┌──────────────────┐
│  AuthProvider     │
│  (React Context)  │
│                    │
│  Check for         │
│  existing session  │
└────────┬──────────┘
         │
         ├─── Session exists ──► Restore user (Guest or Google)
         │
         └─── No session ──► Auto sign-in anonymously (Guest)
                                    │
                                    ▼
                            User can play immediately
                                    │
                                    ▼
                        ┌──── Clicks "Sign In" ────┐
                        │                           │
                        ▼                           ▼
                  Google Popup               Stay as Guest
                        │
                        ▼
              Link anonymous account
              to Google identity
              (preserves game UID)
                        │
                        ▼
              Create/update profile
              in players/{userId}
```

### Why auto-anonymous?
- Players can start playing instantly without friction
- The anonymous UID is used as the player ID in rooms/games
- If they later sign in with Google, the `linkWithPopup` API preserves the same UID

---

## Guest Account Lifecycle

| Phase | What happens |
|-------|-------------|
| **Entry** | User visits the app → `signInAnonymously()` creates a temporary Firebase account |
| **Play** | Guest can create rooms, join rooms, play games, appear on in-game scoreboards |
| **Stats** | Game stats are recorded under `stats/users/{uid}` for session viewing |
| **Leaderboard** | Guest stats are **NOT** written to permanent leaderboards (`leaderboards/`) |
| **Session End** | If the browser clears cookies or the user signs out, the anonymous account is abandoned |
| **Data** | Orphaned anonymous accounts are cleaned up by Firebase automatically |

### Why temporary?
- Anonymous accounts have no recoverable credentials
- If a user clears their browser data, their UID is lost forever
- We don't want the leaderboard filled with one-time throwaway accounts

---

## Google Account Lifecycle

| Phase | What happens |
|-------|-------------|
| **Sign In** | User clicks "Continue with Google" → Google popup → Firebase creates a persistent account |
| **Profile** | A profile is created at `players/{userId}` with `displayName`, `photoURL`, `createdAt` |
| **Returning** | On next visit, Firebase restores the session automatically → profile is loaded from DB |
| **Stats** | All stats persist permanently under `stats/users/{uid}` |
| **Leaderboard** | Game scores are written to all leaderboard timeframes (`daily`, `weekly`, `monthly`, `allTime`) |
| **Sign Out** | User signs out → reverts to a new anonymous account → Google data remains in DB |
| **Re-login** | Signing in again restores everything (same UID, same profile, same stats) |

### Why Google?
- Provides a stable, recoverable identity
- Enables cross-device access (future)
- Prevents leaderboard spam (one Google account = one identity)

---

## Firebase Security Rules

Each rule in `database.rules.json` is explained below:

### Rooms (`rooms/$roomId`)

| Rule | Purpose |
|------|---------|
| `.read: auth != null` | Only authenticated users can see room data |
| `.write: auth != null && !data.exists()` | Anyone authenticated can create a new room, but not overwrite existing ones |
| `status/.write: hostId match` | Only the room host can change lobby/playing status |
| `mode/.write: hostId match` | Only the host can change game mode |
| `hostId/.write: !data.exists()` | Host ID is immutable after room creation |
| `players/$userId/.write: uid match` | Players can only add/edit their own player entry |
| `players/$userId/.validate` | Player name must exist, be a string, 1-20 chars |
| `gameState/.write: room participant` | Only players who are in the room can modify game state |
| `presence/$userId/.write: uid match` | Players can only update their own online/offline status |

### Player Profiles (`players/$userId`)

| Rule | Purpose |
|------|---------|
| `.read: uid match` | Users can only read their own profile |
| `.write: uid match` | Users can only write their own profile |
| `.validate: uid match + displayName required` | Profile must contain the correct UID and a display name |

### Stats (`stats/users/$userId`)

| Rule | Purpose |
|------|---------|
| `.read: uid match` | Users can only read their own stats |
| `.write: uid match` | Users can only update their own stats |

### Leaderboards (`leaderboards/`)

| Rule | Purpose |
|------|---------|
| `.read: auth != null` | Anyone authenticated can view leaderboards |
| `$userId/.write: uid match + not anonymous` | Only non-anonymous (Google) users can write leaderboard entries |
| `$userId/.validate` | Entry must contain score (number), playerName (string), and matching userId |

### Why these specific rules?
- **No global write access**: Prevents any user from modifying another user's data
- **Anonymous exclusion from leaderboards**: Enforced at both the client level (stats.ts) and the database level (security rules)
- **Game state access**: Currently writable by room participants because we don't have Cloud Functions. This is the weakest point and should be migrated to server-only writes when Cloud Functions become available.

---

## Input Sanitization

All user inputs are sanitized before use via `src/lib/sanitize.ts`:

| Function | What it does |
|----------|-------------|
| `sanitizePlayerName()` | Strips HTML tags, `<script>` patterns, control characters. Max 20 chars. |
| `sanitizeRoomCode()` | Uppercase alphanumeric only. Max 10 chars. |
| `sanitizeWord()` | Lowercase, alpha-only. Max 45 chars. |
| `isValidInput()` | General-purpose check: non-empty, within length limit, no dangerous chars. |
| `isValidPlayerName()` | Checks sanitized name is 1-20 chars. |

### Where sanitization is applied
- **Create Room page** — player name
- **Join Room page** — player name, room code
- **useMultiplayerGame** — `createRoom()`, `joinRoom()`, `submit()`
- **Firebase Security Rules** — `players/$userId/.validate` enforces name length server-side

### What is prevented
- HTML injection (`<b>`, `<script>`, etc.)
- JavaScript injection (`javascript:`, `onclick=`, etc.)
- Unicode control characters (`\x00`–`\x1F`)
- Empty inputs
- Excessively long inputs

---

## Leaderboard Protection

Permanent leaderboards are protected at **two layers**:

### Layer 1: Client-Side (stats.ts)
```typescript
const isGuestUser = auth.currentUser?.isAnonymous ?? true;
if (isGuestUser) {
  // Skip leaderboard writes entirely
  return;
}
```

### Layer 2: Firebase Security Rules
```json
"$userId": {
  ".write": "auth != null && auth.uid === $userId && auth.token.firebase.sign_in_provider !== 'anonymous'"
}
```

This means even if a malicious client bypasses the client-side check, the database itself will reject the write.

### What guests CAN do
- ✅ View leaderboards
- ✅ Play games and see in-game scores
- ✅ Record session stats under their temporary UID

### What guests CANNOT do
- ❌ Appear on permanent leaderboards
- ❌ Persist stats across sessions (if session is lost)

---

## Future: Server-Side Validation

> **Current limitation**: Game state is validated client-side and written via Firebase transactions. A technically sophisticated user could bypass client validation by writing directly to the Realtime Database.

### Mitigation plan (when Blaze plan is available)
1. Create Firebase Cloud Functions that trigger on `rooms/$roomId/gameState` writes
2. The Cloud Function validates:
   - Turn ownership
   - Word validity (dictionary check)
   - Score calculation
   - Life deductions
   - Win conditions
   - Power-up/hint usage
   - Timer expiry
3. Invalid writes are rolled back by the Cloud Function
4. Security rules are tightened to server-only writes for `gameState`

### Current protections
- Firebase Security Rules ensure only authenticated room participants can write game state
- Client-side validation runs the full game engine before writing
- Firebase transactions prevent race conditions
- Input sanitization prevents injection attacks
