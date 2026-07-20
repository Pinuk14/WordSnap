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
