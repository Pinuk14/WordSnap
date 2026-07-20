import React from 'react';

export interface CircularTimerProps {
  percentage: number; // 0 to 100
  size?: number;
  label?: string;
  className?: string;
}

export const CircularTimer: React.FC<CircularTimerProps> = ({ 
  percentage, 
  size = 64, 
  label,
  className = '' 
}) => {
  const clampedPercentage = Math.max(0, Math.min(100, Math.round(percentage)));
  
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (clampedPercentage / 100) * circumference;

  let colorClass = 'text-success';
  if (clampedPercentage <= 25) {
    colorClass = 'text-danger animate-pulse';
  } else if (clampedPercentage <= 50) {
    colorClass = 'text-warning';
  }

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full drop-shadow-[4px_4px_0_rgba(0,0,0,1)]" viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="black"
          strokeWidth={strokeWidth}
          fill="#fff"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="butt"
          className={`transition-all duration-300 ease-linear ${colorClass}`}
        />
      </svg>
      {label && (
        <span className="absolute font-display text-[12px] drop-shadow-[2px_2px_0_#000] text-white">
          {label}
        </span>
      )}
    </div>
  );
};
