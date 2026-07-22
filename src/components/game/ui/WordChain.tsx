import React from 'react';
import { BonusEventType } from '@/lib/game-engine/types';

interface WordChainProps {
  history: { word: string; points: number }[];
  currentEvent?: BonusEventType | null;
}

export function WordChain({ history, currentEvent }: WordChainProps) {
  if (history.length === 0) return null;

  // Show up to the last 4 words, INCLUDING the most recently submitted word
  const visibleHistory = history.slice(Math.max(0, history.length - 4), history.length);
  
  if (visibleHistory.length === 0) return null;

  return (
    <div className="flex flex-wrap justify-center items-center gap-3 mt-4 mb-12 px-4">
      {visibleHistory.map((item, idx) => {
        const isLastWordInChain = idx === visibleHistory.length - 1;
        const word = item.word.toUpperCase();
        
        let displayWord = <span className="font-display text-lg md:text-2xl text-gray-500 opacity-60">{word}</span>;
        
        if (isLastWordInChain && currentEvent !== 'vowel_frenzy') {
          // Highlight the required letter (first letter if reverse_chain, else last letter)
          if (currentEvent === 'reverse_chain') {
            displayWord = (
              <span className="font-display text-2xl md:text-3xl text-gray-400 flex items-center">
                <span className="text-4xl md:text-5xl text-primary font-bold drop-shadow-[2px_2px_0_#FFF] -mt-1 md:-mt-2 mr-1">{word.charAt(0)}</span>
                {word.slice(1)}
              </span>
            );
          } else {
            displayWord = (
              <span className="font-display text-2xl md:text-3xl text-gray-400 flex items-center">
                {word.slice(0, -1)}
                <span className="text-4xl md:text-5xl text-primary font-bold drop-shadow-[2px_2px_0_#FFF] -mt-1 md:-mt-2 ml-1">{word.charAt(word.length - 1)}</span>
              </span>
            );
          }
        } else if (isLastWordInChain) {
           displayWord = <span className="font-display text-2xl md:text-3xl text-foreground font-bold">{word}</span>;
        }

        return (
          <React.Fragment key={idx}>
            {displayWord}
            {idx < visibleHistory.length - 1 && (
              <span className="text-gray-600 mx-1 opacity-50">→</span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
