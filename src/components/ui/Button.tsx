import React from 'react';
import { cn } from '../../lib/utils.js';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'accent';
}

export const Button = ({ 
  children, 
  className, 
  variant = 'primary', 
  ...props 
}: ButtonProps) => {
  const variants = {
    primary: 'bg-foreground text-background hover:opacity-90',
    secondary: 'bg-muted text-foreground hover:bg-muted/80',
    ghost: 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
    accent: 'bg-accent text-white hover:opacity-90'
  };

  return (
    <button 
      className={cn(
        'h-11 px-6 font-medium text-sm rounded-full transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};
