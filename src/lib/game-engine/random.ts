// A simple pseudo-random number generator (PRNG) using a seed.
// This guarantees deterministic random values across all clients based on the GameState.

export function createSeededRandom(seed: number) {
  const m = 0x80000000; // 2**31
  const a = 1103515245;
  const c = 12345;
  let state = seed ? seed : Math.floor(Math.random() * (m - 1));

  return function() {
    state = (a * state + c) % m;
    return state / (m - 1);
  };
}

// Generate a seed based on the current state.
// We use a combination of currentTurnStartTime and wordHistory length
// to ensure the seed changes every turn, but remains identical across clients.
export function generateGameSeed(turnStartTime: number, historyLength: number): number {
  return (turnStartTime + historyLength * 10000) % 0x80000000;
}

export function pickRandom<T>(items: T[], seed: number): T {
  const rng = createSeededRandom(seed);
  const index = Math.floor(rng() * items.length);
  return items[index];
}
