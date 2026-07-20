import { normalizeWord } from './helpers';

// Cache of loaded categories: CategoryName -> Set of valid words
const categoryCache = new Map<string, Set<string>>();

/**
 * Lazily load a category's JSON array into the cache.
 * The host environment is responsible for fetching/reading the JSON
 * and passing the array of strings here.
 */
export function loadCategoryDictionary(category: string, words: string[]) {
  const normalizedCategory = category.toLowerCase();
  const normalizedWords = words.map(w => normalizeWord(w)).filter(w => w.length > 0);
  categoryCache.set(normalizedCategory, new Set(normalizedWords));
}

/**
 * Check if a word is in a specific category.
 * If the category hasn't been loaded, it returns false.
 */
export function isInCategory(word: string, category: string): boolean {
  const normalizedCategory = category.toLowerCase();
  const categorySet = categoryCache.get(normalizedCategory);
  
  if (!categorySet) {
    return false;
  }

  return categorySet.has(normalizeWord(word));
}

/**
 * Returns a list of all currently loaded categories.
 */
export function getAvailableCategories(): string[] {
  return Array.from(categoryCache.keys());
}

/**
 * Clears the category cache (useful for tests).
 */
export function clearCategoryDictionary() {
  categoryCache.clear();
}
