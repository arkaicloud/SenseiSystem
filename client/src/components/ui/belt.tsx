import React from "react";
import { cn } from "@/lib/utils";

interface BeltProps {
  level: 'white' | 'blue' | 'purple' | 'brown' | 'black';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const beltColors = {
  white: 'white-belt',
  blue: 'blue-belt',
  purple: 'purple-belt',
  brown: 'brown-belt',
  black: 'black-belt'
};

const beltSizes = {
  sm: 'w-10 h-1.5',
  md: 'w-16 h-2',
  lg: 'w-20 h-2.5'
};

export const Belt: React.FC<BeltProps> = ({ 
  level, 
  className,
  size = 'md'
}) => {
  return (
    <div 
      className={cn(
        'belt', 
        beltColors[level], 
        beltSizes[size],
        className
      )}
    />
  );
};

export const BeltWithLabel: React.FC<BeltProps & { showLabel?: boolean }> = ({
  level,
  className,
  size = 'md',
  showLabel = true
}) => {
  return (
    <div className="flex items-center">
      <Belt level={level} size={size} className={className} />
      {showLabel && <span className="text-sm capitalize">{level}</span>}
    </div>
  );
};
