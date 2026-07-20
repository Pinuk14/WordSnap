import { ref, get, runTransaction, query, orderByChild, limitToLast } from 'firebase/database';
import { db } from './config';
import { auth } from './config';
import { GameState } from '@/lib/game-engine/types';
import { getInitialLives } from '@/lib/game-engine/gameModes';

export interface UserStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  totalScore: number;
  totalWords: number;
  highestScore: number;
  longestWinStreak: number;
  currentWinStreak: number;
  topWord: { word: string; points: number } | null;
  playerName: string;
  hintsUsed: number;
  powerUpsUsed: number;
  perfectRounds: number;
  deadlocksSurvived: number;
}

export interface LeaderboardEntry {
  userId: string;
  playerName: string;
  score: number;
}

const getDailyStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getMonthlyStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const getWeeklyStr = () => {
  const d = new Date();
  const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
  const pastDaysOfYear = (d.getTime() - firstDayOfYear.getTime()) / 86400000;
  const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
};

export async function recordGameStats(userId: string, roomId: string, gameState: GameState, playerName: string) {
  // Prevent double counting using a simple localStorage flag
  const localKey = `stats_recorded_${roomId}`;
  if (typeof window !== 'undefined' && localStorage.getItem(localKey)) {
    return;
  }

  // Find player stats in this game
  const pState = gameState.players[userId];
  if (!pState) return;

  const isWinner = gameState.winnerId === userId;
  const isDraw = !gameState.winnerId && gameState.status === 'finished'; // Technically draw if finished without winner
  const myWords = (gameState.wordHistory || []).filter(w => w.playerId === userId);
  const myHighestWord = myWords.reduce((best, curr) => (!best || curr.points > best.points ? curr : best), null as {word: string, points: number, playerId: string} | null);

  // Update Personal Stats
  const statsRef = ref(db, `stats/users/${userId}`);
  await runTransaction(statsRef, (current: UserStats | null) => {
    const stats: UserStats = current || {
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      totalScore: 0,
      totalWords: 0,
      highestScore: 0,
      longestWinStreak: 0,
      currentWinStreak: 0,
      topWord: null,
      playerName: playerName,
      hintsUsed: 0,
      powerUpsUsed: 0,
      perfectRounds: 0,
      deadlocksSurvived: 0
    };

    stats.gamesPlayed++;
    if (isWinner) {
      stats.wins++;
      stats.currentWinStreak++;
      if (stats.currentWinStreak > stats.longestWinStreak) {
        stats.longestWinStreak = stats.currentWinStreak;
      }
    } else if (!isDraw) {
      stats.losses++;
      stats.currentWinStreak = 0;
    }

    stats.totalScore += pState.score;
    stats.totalWords += myWords.length;
    
    if (pState.score > stats.highestScore) {
      stats.highestScore = pState.score;
    }

    if (myHighestWord) {
      if (!stats.topWord || myHighestWord.points > stats.topWord.points) {
        stats.topWord = { word: myHighestWord.word, points: myHighestWord.points };
      }
    }
    
    // Aggregate new stats from this session
    stats.hintsUsed += pState.stats?.hintsUsed || 0;
    stats.powerUpsUsed += pState.stats?.powerUpsUsed || 0;
    stats.deadlocksSurvived += pState.stats?.deadlocksSurvived || 0;
    // Perfect round: no lives lost
    if (pState.lives === getInitialLives(gameState.mode)) {
      stats.perfectRounds++;
    }

    stats.playerName = playerName; // update to latest name

    return stats;
  });

  // Only write to permanent leaderboards if the user is NOT a guest
  const isGuestUser = auth.currentUser?.isAnonymous ?? true;
  if (isGuestUser) {
    // Guest users still get their stats recorded for session viewing,
    // but they are excluded from permanent leaderboards.
    if (typeof window !== 'undefined') {
      localStorage.setItem(localKey, 'true');
    }
    return;
  }

  // Update Leaderboards (Ranking by Highest Score in a Single Game)
  const score = pState.score;
  const timeframes = [
    { name: 'daily', path: `daily/${getDailyStr()}` },
    { name: 'weekly', path: `weekly/${getWeeklyStr()}` },
    { name: 'monthly', path: `monthly/${getMonthlyStr()}` },
    { name: 'allTime', path: 'allTime' }
  ];

  for (const tf of timeframes) {
    const lbRef = ref(db, `leaderboards/${tf.path}/${userId}`);
    await runTransaction(lbRef, (current: LeaderboardEntry | null) => {
      if (!current || score > current.score) {
        return { score, playerName, userId };
      }
      return; // abort if current score is higher
    });
  }

  // Mark as recorded
  if (typeof window !== 'undefined') {
    localStorage.setItem(localKey, 'true');
  }
}

export async function getPersonalStats(userId: string): Promise<UserStats | null> {
  const snap = await get(ref(db, `stats/users/${userId}`));
  return snap.exists() ? snap.val() : null;
}

export async function getLeaderboard(timeframe: 'daily' | 'weekly' | 'monthly' | 'allTime'): Promise<LeaderboardEntry[]> {
  let path = `leaderboards/${timeframe}`;
  if (timeframe === 'daily') path += `/${getDailyStr()}`;
  else if (timeframe === 'weekly') path += `/${getWeeklyStr()}`;
  else if (timeframe === 'monthly') path += `/${getMonthlyStr()}`;

  const lbQuery = query(ref(db, path), orderByChild('score'), limitToLast(50));
  const snap = await get(lbQuery);
  
  if (!snap.exists()) return [];

  const results: LeaderboardEntry[] = [];
  snap.forEach(child => {
    results.push(child.val());
  });
  
  return results.reverse(); // highest first
}
