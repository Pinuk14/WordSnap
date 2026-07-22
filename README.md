# WordSnap 💥

Welcome to **WordSnap**, the fast-paced, multi-player word chaining game that tests your vocabulary and speed! Battle it out against friends or practice locally in an adrenaline-pumping test of words.

## 🎮 How to Play

The rules are simple but the game gets intense fast:
1. **Chain Words**: You must play a word that starts with the **last letter** of the previous word. (e.g., Appl**e** -> **E**lephan**t** -> **T**iger).
2. **Beat the Clock**: You only have a few seconds to answer! If time runs out, or if you submit an invalid/duplicate word, you lose a life.
3. **Survive**: Last player standing wins!

## ✨ Features

- **Real-Time Multiplayer**: Join a room using a 4-character code and play instantly with friends.
- **Dynamic Game Engine**: Built with a robust engine that validates words against a 100k+ word dictionary in <1ms.
- **Power-Ups**: 
  - 🛡️ **Shield**: Blocks one life loss.
  - ⏱️ **Extra Time**: Gives you more time to think.
  - 🔀 **Letter Switch**: Instantly changes the required starting letter if you are stuck.
  - ⚔️ **Attack**: Sabotage an opponent's turn.
- **Crazy Events**: Watch out for random events like *Vowel Frenzy*, *Reverse Chain*, or *Double Points* that flip the game on its head every few turns!
- **Game Modes**:
  - **Classic**: The standard 3-life survival mode.
  - **Speed**: Sudden death. 1 life, shorter turns.
  - **Category**: Words must match a specific category (e.g., Animals, Food).
- **Guest & Auth Support**: Play instantly as a guest, or sign in with Google to save your stats and customize your profile.
- **Stats Tracking**: Tracks your total wins, highest score, longest win streak, and more!

## 🚀 Tech Stack

WordSnap is built with a modern, scalable web stack:
- **Framework**: [Next.js 14](https://nextjs.org/) (React 18) with App Router.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) for that sleek, brutalist UI.
- **Backend & State**: [Firebase Realtime Database](https://firebase.google.com/) for lightning-fast multi-player sync.
- **Authentication**: Firebase Auth (Google Sign-In).
- **Testing**: [Vitest](https://vitest.dev/) for unit and integration testing.

## 🛠️ Getting Started

First, install the dependencies:
```bash
npm install
```

Set up your Firebase configuration in `.env.local` (see `src/lib/firebase/config.ts` for required keys).

Then, run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to start playing!

## 🧪 Testing

The game engine is heavily tested to ensure edge cases, timeouts, and validations work perfectly.

To run the test suite:
```bash
npm run test
```
