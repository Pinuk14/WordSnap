import { describe, it, expect, beforeEach } from 'vitest';
import { 
  loadCategoryDictionary, 
  isInCategory, 
  getAvailableCategories, 
  clearCategoryDictionary 
} from '../categoryDictionary';
import { loadDictionary, isValidWord } from '../dictionary';
import { initializeGame, submitWord } from '../gameEngine';

describe('Category Dictionary', () => {
  beforeEach(() => {
    clearCategoryDictionary();
    loadCategoryDictionary('animals', ['cat', 'Dog', 'ELEPHANT']);
    loadCategoryDictionary('fruits', ['apple', 'BANANA']);
    
    // Also load main dictionary so we can test the full flow
    loadDictionary('cat\ndog\nelephant\napple\nbanana\ncomputer\n');
  });

  it('detects word in category', () => {
    expect(isInCategory('cat', 'animals')).toBe(true);
    expect(isInCategory('apple', 'fruits')).toBe(true);
  });

  it('detects word not in category', () => {
    expect(isInCategory('apple', 'animals')).toBe(false);
    expect(isInCategory('dog', 'fruits')).toBe(false);
  });

  it('is case insensitive for both words and category names', () => {
    // word is uppercase in category load, lowercase query
    expect(isInCategory('elephant', 'Animals')).toBe(true);
    
    // word is lowercase in category load, uppercase query
    expect(isInCategory('CAT', 'ANIMALS')).toBe(true);
    
    // category name is passed weirdly
    expect(isInCategory('doG', 'aNiMaLs')).toBe(true);
  });

  it('returns false for word valid in main dictionary but not in category', () => {
    // 'computer' is in main dictionary, but not in any category
    expect(isValidWord('computer')).toBe(true);
    expect(isInCategory('computer', 'animals')).toBe(false);
  });

  it('returns false for unknown category name', () => {
    expect(isInCategory('cat', 'vehicles')).toBe(false);
  });

  it('lists available categories', () => {
    const available = getAvailableCategories();
    expect(available).toContain('animals');
    expect(available).toContain('fruits');
    expect(available.length).toBe(2);
  });

  describe('Integration with GameEngine', () => {
    it('rejects word if mode is category and word is not in category', () => {
      const state = initializeGame('room1', 'category', [{ id: 'p1', name: 'P1' }]);
      state.currentCategory = 'animals';

      // 'computer' is in main dictionary, but not in 'animals'
      const result = submitWord(state, 'p1', 'computer');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Word does not belong to category: animals');
    });

    it('accepts word if mode is category and word is in category', () => {
      const state = initializeGame('room1', 'category', [{ id: 'p1', name: 'P1' }]);
      state.currentCategory = 'animals';

      // 'cat' is in both main dictionary and 'animals' category
      const result = submitWord(state, 'p1', 'cat');
      expect(result.isValid).toBe(true);
    });
  });
});
