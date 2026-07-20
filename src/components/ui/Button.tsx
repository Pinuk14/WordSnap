import React from 'react';

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
  ...props 
}) => {
  const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-primary text-foreground',
    secondary: 'bg-secondary text-foreground',
    danger: 'bg-danger text-foreground',
    success: 'bg-success text-foreground'
  };

  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
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
