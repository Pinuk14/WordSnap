import React from 'react';

interface MinimalTimerProps {
  seconds: number;
  percentage: number; // 0 to 100
}

export function MinimalTimer({ seconds, percentage }: MinimalTimerProps) {
  const isCritical = seconds <= 3 && seconds > 0;
  
  return (
    <div className="flex flex-col items-center justify-center w-full mt-4">
      <div className={`
        font-display transition-all duration-300
        ${isCritical ? 'text-6xl text-danger animate-pulse scale-110' : 'text-3xl text-gray-400'}
        ${seconds <= 0 ? 'text-danger' : ''}
      `}>
        {Math.ceil(seconds)}
      </div>
      
      {/* Super thin progress line spanning the width of the container */}
      <div className="w-full max-w-xs h-0.5 bg-gray-200 mt-2 overflow-hidden rounded-full">
        <div 
          className={`h-full transition-all duration-100 ease-linear ${isCritical ? 'bg-danger' : 'bg-primary'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
