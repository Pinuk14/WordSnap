import React from 'react';
import { PowerUpType } from '@/lib/game-engine/types';

interface PowerUpDockProps {
  powerUps: PowerUpType[];
  onActivate: (pu: PowerUpType) => void;
  disabled: boolean;
}

const POWERUP_CONFIG: Record<PowerUpType, { icon: string, label: string }> = {
  shield: { icon: '🛡️', label: 'Shield' },
  extra_time: { icon: '+T', label: 'Extra Time' },
  double_score: { icon: 'x2', label: 'Double Score' },
  letter_switch: { icon: '🔤', label: 'Peek' },
  life_restore: { icon: '❤️', label: 'Life Restore' },
  attack: { icon: '⚔️', label: 'Attack' }
};

export function PowerUpDock({ powerUps, onActivate, disabled }: PowerUpDockProps) {
  const renderedPowerUps = powerUps && powerUps.length > 0 ? powerUps : [];

  return (
    <div className="flex flex-col items-center justify-center mt-8 gap-2">
      <div className="text-xs font-bold text-gray-400 tracking-widest uppercase">Power-Ups</div>
      <div className="flex gap-4 items-center justify-center">
        {renderedPowerUps.map((pu, idx) => (
          <button
            key={idx}
            disabled={disabled}
            onClick={() => onActivate(pu)}
            className="
              group relative flex flex-col items-center justify-center 
              w-12 h-12 md:w-14 md:h-14 bg-gray-900 border-2 border-gray-600 rounded-brutal
              hover:-translate-y-1 hover:border-foreground hover:shadow-[4px_4px_0_#FF2E93] transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:border-gray-600 disabled:hover:shadow-none
            "
            aria-label={`Activate ${POWERUP_CONFIG[pu]?.label || pu}`}
          >
            <span className="text-2xl font-bold text-foreground drop-shadow-md">
              {POWERUP_CONFIG[pu]?.icon || '⚡'}
            </span>
            
            {/* Tooltip on hover */}
            <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <span className="bg-black text-white text-xs font-bold px-2 py-1 rounded whitespace-nowrap">
                {POWERUP_CONFIG[pu]?.label || pu}
              </span>
            </div>
          </button>
        ))}
        {renderedPowerUps.length === 0 && (
          <div className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 border-2 border-dashed border-gray-300 rounded-brutal text-gray-400">
            <span className="text-xl opacity-50">⚡</span>
          </div>
        )}
      </div>
    </div>
  );
}
