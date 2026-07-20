import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`
        bg-card text-foreground
        border-4 border-black
        rounded-brutal
        shadow-brutal
        p-6
        ${className}
      `}
    >
      {children}
    </div>
  );
};
