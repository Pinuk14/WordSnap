import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { initializeGame, submitWord, loseLife, eliminatePlayer } from '../gameEngine';
import { loadDictionary, isValidWord } from '../dictionary';

describe('Game Engine', () => {
  beforeEach(() => {
    // Load a mock dictionary for fast, predictable tests
    loadDictionary('apple\nelephant\ntiger\nrat\ntomato\norange\nzygote\n');
  });

  describe('Validation Rules', () => {
    it('rejects duplicate words', () => {
      let state = initializeGame('room1', 'classic', [{ id: 'p1', name: 'P1' }, { id: 'p2', name: 'P2' }]);
      let result = submitWord(state, 'p1', 'apple');
      expect(result.isValid).toBe(true);
      state = result.state;
      
      // P2 tries to use 'apple' again
      result = submitWord(state, 'p2', 'apple');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Word already used');
    });

    it('rejects invalid words', () => {
      const state = initializeGame('room1', 'classic', [{ id: 'p1', name: 'P1' }]);
      const result = submitWord(state, 'p1', 'invalidword');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Word not in dictionary');
    });

    it('rejects empty strings', () => {
      const state = initializeGame('room1', 'classic', [{ id: 'p1', name: 'P1' }]);
      const result = submitWord(state, 'p1', '');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Empty string');
    });

    it('trims whitespace and is case insensitive', () => {
      const state = initializeGame('room1', 'classic', [{ id: 'p1', name: 'P1' }, { id: 'p2', name: 'P2' }]);
      const result = submitWord(state, 'p1', '  ApPlE  ');
      expect(result.isValid).toBe(true);
      expect(result.state.wordHistory[0].word).toBe('apple');
    });

    it('enforces starting with the last letter of the previous word', () => {
      let state = initializeGame('room1', 'classic', [{ id: 'p1', name: 'P1' }, { id: 'p2', name: 'P2' }]);
      state = submitWord(state, 'p1', 'apple').state;
      
      // Next word should start with 'e'. 'tiger' starts with 't'.
      let result = submitWord(state, 'p2', 'tiger');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Word must start with 'E'");
      
      // Valid word starting with 'e'
      result = submitWord(state, 'p2', 'elephant');
      expect(result.isValid).toBe(true);
    });
  });

  describe('Game Flow & Mechanics', () => {
    it('handles turn rotation', () => {
      let state = initializeGame('room1', 'classic', [{ id: 'p1', name: 'P1' }, { id: 'p2', name: 'P2' }]);
      expect(state.playerOrder[state.currentPlayerIndex]).toBe('p1');
      
      state = submitWord(state, 'p1', 'apple').state;
      expect(state.playerOrder[state.currentPlayerIndex]).toBe('p2');
    });

    it('handles elimination and skips eliminated players', () => {
      let state = initializeGame('room1', 'classic', [
        { id: 'p1', name: 'P1' }, 
        { id: 'p2', name: 'P2' },
        { id: 'p3', name: 'P3' }
      ]);
      
      // p2 gets eliminated
      state = eliminatePlayer(state, 'p2');
      expect(state.players['p2'].isEliminated).toBe(true);

      // p1 submits word, turn should skip p2 and go to p3
      state = submitWord(state, 'p1', 'apple').state;
      expect(state.playerOrder[state.currentPlayerIndex]).toBe('p3');
    });

    it('detects last player standing', () => {
      let state = initializeGame('room1', 'classic', [{ id: 'p1', name: 'P1' }, { id: 'p2', name: 'P2' }]);
      state = eliminatePlayer(state, 'p1');
      
      expect(state.status).toBe('finished');
      expect(state.winnerId).toBe('p2');
    });

    it('handles timeouts (losing life)', () => {
      let state = initializeGame('room1', 'classic', [{ id: 'p1', name: 'P1' }, { id: 'p2', name: 'P2' }]);
      
      // p1 times out
      state = loseLife(state, 'p1');
      expect(state.players['p1'].lives).toBe(2);
      // turn should pass to p2
      expect(state.playerOrder[state.currentPlayerIndex]).toBe('p2');
    });
  });

  describe('Game Modes', () => {
    it('sets correct lives for speed mode (sudden death)', () => {
      const state = initializeGame('room1', 'speed', [{ id: 'p1', name: 'P1' }]);
      expect(state.players['p1'].lives).toBe(1);
    });

    it('applies speed mode multiplier to scoring', () => {
      const state = initializeGame('room1', 'speed', [{ id: 'p1', name: 'P1' }]);
      const result = submitWord(state, 'p1', 'apple'); // 5 letters = 50 * 1.5 = 75
      expect(result.state.players['p1'].score).toBe(75);
    });

    it('handles category mode initialization', () => {
      const state = initializeGame('room1', 'category', [{ id: 'p1', name: 'P1' }]);
      expect(state.players['p1'].lives).toBe(3);
      expect(state.mode).toBe('category');
    });
  });

  describe('Real Dictionary', () => {
    it('loads the full dictionary successfully', () => {
      const dictPath = path.resolve(process.cwd(), 'public/dictionary/words-filtered.txt');
      const dictContent = fs.readFileSync(dictPath, 'utf8');
      loadDictionary(dictContent);
      // 'zygote' might be in the mocked list, so test 'xylophone' which is in real dict
      expect(isValidWord('xylophone')).toBe(true);
      expect(isValidWord('notarealwordzyx')).toBe(false);
    });
  });
});
