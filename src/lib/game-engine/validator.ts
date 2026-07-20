import { isValidWord } from './dictionary';
import { normalizeWord, getFirstLetter, getLastLetter } from './helpers';
import { WordSubmission } from './types';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateSubmission(word: string, history: WordSubmission[]): ValidationResult {
  const normalized = normalizeWord(word);

  if (!normalized) {
    return { isValid: false, error: 'Empty string' };
  }

  if (!/^[a-z]+$/.test(normalized)) {
    return { isValid: false, error: 'Invalid characters' };
  }

  if (!isValidWord(normalized)) {
    return { isValid: false, error: 'Word not in dictionary' };
  }

  const isDuplicate = history.some(h => normalizeWord(h.word) === normalized);
  if (isDuplicate) {
    return { isValid: false, error: 'Word already used' };
  }

  if (history.length > 0) {
    const lastWord = history[history.length - 1].word;
    const requiredFirstLetter = getLastLetter(lastWord);
    if (getFirstLetter(normalized) !== requiredFirstLetter) {
      return { isValid: false, error: `Word must start with '${requiredFirstLetter.toUpperCase()}'` };
    }
  }

  return { isValid: true };
}
