import React from 'react';

export type BadgeVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'default';

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', children, className = '' }) => {
  const variantStyles: Record<BadgeVariant, string> = {
    primary: 'bg-primary text-foreground',
    secondary: 'bg-secondary text-foreground',
    danger: 'bg-danger text-foreground',
    success: 'bg-success text-foreground',
    warning: 'bg-warning text-black',
    default: 'bg-white text-black'
  };

  return (
    <span 
      className={`
        inline-flex items-center justify-center px-2 py-1 
        border-2 border-black rounded-brutal shadow-[2px_2px_0_#000]
        font-display text-[10px] uppercase tracking-wider
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
};
