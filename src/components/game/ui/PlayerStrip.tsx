import React from 'react';
import { Player } from '@/lib/game-engine/types';

interface PlayerStripProps {
  players: Record<string, Player>;
  playerOrder: string[];
  currentPlayerId: string;
  onAttackClick?: (attackerId: string) => void;
}

export function PlayerStrip({ players, playerOrder, currentPlayerId, onAttackClick }: PlayerStripProps) {
  return (
    <div className="w-full flex flex-wrap justify-center items-center gap-6 md:gap-12 py-4 px-2">
      {playerOrder.map((pid) => {
        const p = players[pid];
        const isCurrent = pid === currentPlayerId;
        const isEliminated = p.isEliminated;

        return (
          <div
            key={pid}
            className={`
              flex flex-col items-center transition-all duration-300 relative
              ${isCurrent ? 'scale-110 opacity-100' : 'opacity-70 hover:opacity-100'}
              ${isEliminated ? 'grayscale opacity-20 scale-90 pointer-events-none' : ''}
            `}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${isCurrent && !isEliminated ? 'bg-primary animate-pulse' : 'bg-transparent'}`} />
              <span className="font-sans font-bold text-sm md:text-base uppercase tracking-wider text-foreground">
                {p.name}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-display text-lg md:text-xl text-foreground">
                {p.score}
              </span>

              <div className="flex gap-0.5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rotate-45 border border-foreground ${i < p.lives ? 'bg-danger' : 'bg-transparent'}`}
                  />
                ))}
              </div>
            </div>

            {/* Small indicators for powers/streaks */}
            <div className="h-6 flex items-center justify-center gap-1 mt-1">
              {p.streak >= 3 && <span className="text-[10px] font-bold text-danger">🔥 {p.streak}</span>}
              {p.activePowerUp === 'shield' && <span className="text-[10px] font-bold text-secondary" title={`Shield Active (${p.shieldTurnsLeft || 0} turns left)`}>🛡️</span>}
              {p.activePowerUp === 'double_score' && <span className="text-[10px] font-bold text-primary">×2</span>}
              
              {p.powerUps.includes('attack') && onAttackClick && !isEliminated && (
                 <button 
                   onClick={() => onAttackClick(pid)}
                   className="ml-1 text-[10px] font-bold bg-danger text-black px-1 border border-black cursor-pointer hover:scale-110 transition-transform rotate-2"
                   title="Use Attack Powerup"
                 >
                   ⚔️ ATTACK
                 </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
