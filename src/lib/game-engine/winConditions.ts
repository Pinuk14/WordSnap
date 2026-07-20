import { GameState } from './types';

export function checkWinCondition(state: GameState): string | null {
  const alivePlayers = state.playerOrder.filter(
    (playerId) => !state.players[playerId].isEliminated
  );

  // If there's only one player left, they win
  if (alivePlayers.length === 1) {
    return alivePlayers[0];
  }

  return null;
}
