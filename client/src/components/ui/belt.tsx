import React from "react";
import { cn } from "@/lib/utils";

const BELT_HEX: Record<string, string> = {
  white:        '',
  blue:         '#2563EB',
  purple:       '#7C3AED',
  brown:        '#92400E',
  black:        '#1E293B',
  coral:        '#FF6B6B',
  red_white:    '#EF4444',
  red:          '#DC2626',
  grey_white:   '#D1D5DB',
  grey:         '#6B7280',
  grey_black:   '#374151',
  yellow_white: '#FCD34D',
  yellow:       '#F59E0B',
  yellow_black: '#B45309',
  orange_white: '#FED7AA',
  orange:       '#F97316',
  orange_black: '#EA580C',
  green_white:  '#BBF7D0',
  green:        '#22C55E',
  green_black:  '#15803D',
};

const BELT_NAMES: Record<string, string> = {
  white:        'Faixa Branca',
  blue:         'Faixa Azul',
  purple:       'Faixa Roxa',
  brown:        'Faixa Marrom',
  black:        'Faixa Preta',
  coral:        'Faixa Coral',
  red_white:    'Faixa Vermelha/Branca',
  red:          'Faixa Vermelha',
  grey_white:   'Faixa Cinza/Branca',
  grey:         'Faixa Cinza',
  grey_black:   'Faixa Cinza/Preta',
  yellow_white: 'Faixa Amarela/Branca',
  yellow:       'Faixa Amarela',
  yellow_black: 'Faixa Amarela/Preta',
  orange_white: 'Faixa Laranja/Branca',
  orange:       'Faixa Laranja',
  orange_black: 'Faixa Laranja/Preta',
  green_white:  'Faixa Verde/Branca',
  green:        'Faixa Verde',
  green_black:  'Faixa Verde/Preta',
};

const beltSizes = {
  sm: 'w-10 h-1.5',
  md: 'w-16 h-2',
  lg: 'w-20 h-2.5',
};

interface BeltProps {
  level: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Belt: React.FC<BeltProps> = ({ level, className, size = 'md' }) => {
  const hex = BELT_HEX[level];
  const isWhite = !hex || level === 'white';
  return (
    <div
      className={cn(beltSizes[size], 'rounded-sm flex-shrink-0', className)}
      style={
        isWhite
          ? { backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1' }
          : { backgroundColor: hex }
      }
    />
  );
};

export const BeltWithLabel: React.FC<BeltProps & { showLabel?: boolean; stripes?: number }> = ({
  level,
  className,
  size = 'md',
  showLabel = true,
  stripes,
}) => {
  return (
    <div className="flex items-center gap-2">
      <Belt level={level} size={size} className={className} />
      {showLabel && (
        <span className="text-sm text-slate-600 dark:text-slate-300">
          {BELT_NAMES[level] || level}
          {stripes && stripes > 0 ? ` (${stripes}°)` : ''}
        </span>
      )}
    </div>
  );
};

export { BELT_HEX, BELT_NAMES };
