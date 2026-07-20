import { normalizeWord } from './helpers';

let validWords = new Set<string>();

export function loadDictionary(wordListText: string) {
  const words = wordListText.split('\n').map(normalizeWord).filter(w => w.length > 0);
  validWords = new Set(words);
}

export function isValidWord(word: string): boolean {
  if (validWords.size === 0) {
    console.warn('Dictionary is not loaded!');
  }
  return validWords.has(normalizeWord(word));
}

export function getDictionarySize(): number {
  return validWords.size;
}

export function clearDictionary() {
  validWords.clear();
}

export function generateHint(requiredLetter: string, usedWords: string[]): string | null {
  if (validWords.size === 0) return null;
  
  const used = new Set(usedWords.map(w => w.toLowerCase()));
  const letter = requiredLetter.toLowerCase();
  
  // Find all words starting with the letter that are not used
  const candidates: string[] = [];
  const wordsArray = Array.from(validWords);
  for (const word of wordsArray) {
    if (word.startsWith(letter) && !used.has(word)) {
      candidates.push(word);
      if (candidates.length > 50) break; // Don't search the whole dictionary if we have enough
    }
  }
  
  if (candidates.length === 0) return null;
  
  // Pick a random one
  return candidates[Math.floor(Math.random() * candidates.length)];
}
