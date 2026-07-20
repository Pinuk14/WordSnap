export function normalizeWord(word: string): string {
  return word.trim().toLowerCase();
}

export function getLastLetter(word: string): string {
  const normalized = normalizeWord(word);
  if (!normalized) return '';
  return normalized.charAt(normalized.length - 1);
}

export function getFirstLetter(word: string): string {
  const normalized = normalizeWord(word);
  if (!normalized) return '';
  return normalized.charAt(0);
}
