import React from 'react';

export interface AvatarProps {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  fallbackInitials?: string;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ 
  src, 
  alt, 
  size = 'md', 
  fallbackInitials,
  className = '' 
}) => {
  const sizeStyles = {
    sm: 'w-8 h-8 text-[10px]',
    md: 'w-12 h-12 text-xs',
    lg: 'w-16 h-16 text-sm'
  };

  const baseStyles = 'inline-flex items-center justify-center rounded-brutal border-4 border-black bg-secondary text-black font-display font-bold shadow-[2px_2px_0_#000] overflow-hidden';

  return (
    <div className={`${baseStyles} ${sizeStyles[size]} ${className}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <span>{fallbackInitials || alt.charAt(0).toUpperCase()}</span>
      )}
    </div>
  );
};
