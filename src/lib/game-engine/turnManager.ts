import { GameState } from './types';

export function getNextPlayerIndex(state: GameState): number {
  const numPlayers = state.playerOrder.length;
  if (numPlayers === 0) return -1;

  let nextIndex = (state.currentPlayerIndex + 1) % numPlayers;
  let loops = 0;

  // Find next player who is not eliminated
  while (state.players[state.playerOrder[nextIndex]].isEliminated) {
    nextIndex = (nextIndex + 1) % numPlayers;
    loops++;
    if (loops >= numPlayers) {
      // Everyone is eliminated
      return -1;
    }
  }

  return nextIndex;
}

export function eliminatePlayer(state: GameState, playerId: string): GameState {
  const newState = { ...state, players: { ...state.players } };
  const player = { ...newState.players[playerId] };
  
  player.isEliminated = true;
  player.lives = 0;
  newState.players[playerId] = player;

  return newState;
}

export function loseLife(state: GameState, playerId: string): GameState {
  const newState = { ...state, players: { ...state.players } };
  const player = { ...newState.players[playerId] };
  
  if (!player.isEliminated) {
    player.lives -= 1;
    if (player.lives <= 0) {
      player.isEliminated = true;
      player.lives = 0;
    }
  }
  
  newState.players[playerId] = player;
  return newState;
}
