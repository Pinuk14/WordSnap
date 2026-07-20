import React from 'react';

export type InputState = 'default' | 'valid' | 'invalid';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  state?: InputState;
  errorText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, state = 'default', errorText, className = '', disabled, ...props }, ref) => {
    
    const baseInputStyles = `
      w-full px-4 py-3
      border-4 border-black
      rounded-brutal
      shadow-brutal
      font-sans text-lg text-black
      focus:outline-none focus:ring-4 focus:ring-primary focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
      transition-colors duration-150
    `;

    const stateStyles: Record<InputState, string> = {
      default: 'bg-card',
      valid: 'bg-green-100 border-success',
      invalid: 'bg-red-100 border-danger animate-shake text-danger',
    };

    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        {label && (
          <label className="font-display text-xs uppercase tracking-wider text-foreground">
            {label}
          </label>
        )}
        <input
          ref={ref}
          disabled={disabled}
          className={`${baseInputStyles} ${stateStyles[state]}`}
          {...props}
        />
        {state === 'invalid' && errorText && (
          <span className="text-danger font-display text-[10px] uppercase mt-1">
            {errorText}
          </span>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
