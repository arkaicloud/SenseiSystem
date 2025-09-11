import React from 'react';
import { cn, getBeltColor } from '@/lib/utils';

interface BeltIconProps {
  belt: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const BeltIcon = ({ belt, size = 'md', className }: BeltIconProps) => {
  const beltColor = getBeltColor(belt);
  
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };
  
  return (
    <div 
      className={cn(
        'rounded-full',
        beltColor,
        sizeClasses[size],
        className
      )}
    />
  );
};

export default BeltIcon;
