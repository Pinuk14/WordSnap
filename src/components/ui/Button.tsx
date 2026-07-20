import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  className = '', 
  children, 
  ...props 
}) => {
  const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-primary text-foreground',
    secondary: 'bg-secondary text-foreground',
    danger: 'bg-danger text-foreground',
    success: 'bg-success text-foreground'
  };

  return (
    <button
      className={`
        px-6 py-3
        border-4 border-black
        rounded-brutal
        shadow-brutal
        uppercase
        font-display
        text-sm
        transition-all duration-150 ease-brutal
        active:translate-y-1 active:translate-x-1 active:shadow-brutal-pressed
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};
