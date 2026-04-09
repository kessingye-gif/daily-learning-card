import React from 'react';
import { cn } from '../../lib/utils.js';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card = ({ children, className, onClick }: CardProps) => (
  <div 
    onClick={onClick}
    className={cn(
      'bg-background-alt border border-border p-4 rounded-2xl transition-all duration-300 card-shadow',
      onClick && 'cursor-pointer active:scale-[0.98]',
      className
    )}
  >
    {children}
  </div>
);
