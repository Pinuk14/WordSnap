'use client';

import React from 'react';
import { useSound } from '@/contexts/SoundContext';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  loading = false,
  className = '', 
  children, 
  disabled,
  onClick,
  onMouseEnter,
  ...props 
}) => {
  const { playHover, playClick } = useSound();

  const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-primary text-foreground',
    secondary: 'bg-secondary text-foreground',
    danger: 'bg-danger text-foreground',
    success: 'bg-success text-foreground'
  };

  const isDisabled = disabled || loading;

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isDisabled) playHover();
    onMouseEnter?.(e);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isDisabled) playClick();
    onClick?.(e);
  };

  return (
    <button
      disabled={isDisabled}
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
      className={`
        px-6 py-3
        border-4 border-black
        rounded-brutal
        shadow-brutal
        uppercase
        font-display
        text-sm
        transition-all duration-150 ease-brutal
        hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[8px_8px_0_#000]
        active:translate-y-1 active:translate-x-1 active:shadow-brutal-pressed
        focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:translate-x-0 disabled:hover:shadow-brutal
        ${variantStyles[variant]}
        ${className}
      `}
      {...props}
    >
      {loading ? 'LOADING...' : children}
    </button>
  );
};
