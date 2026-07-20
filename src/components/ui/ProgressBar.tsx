import React from 'react';

export interface ProgressBarProps {
  percentage: number;
  label?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  percentage, 
  label, 
  variant = 'primary', 
  className = '' 
}) => {
  const clampedPercentage = Math.max(0, Math.min(100, percentage));

  const variantStyles = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    danger: 'bg-danger',
    success: 'bg-success',
    warning: 'bg-warning',
  };

  return (
    <div className={`w-full flex flex-col gap-2 ${className}`}>
      {label && (
        <span className="font-display text-xs uppercase text-foreground drop-shadow-[1px_1px_0_#000]">
          {label}
        </span>
      )}
      <div className="w-full h-6 border-4 border-black bg-card rounded-brutal overflow-hidden relative shadow-[2px_2px_0_#000]">
        <div 
          className={`h-full border-r-4 border-black transition-all duration-300 ease-linear ${variantStyles[variant]}`}
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>
    </div>
  );
};
