import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBeltLevels } from '@/hooks/useBeltLevels';

interface BeltFilterProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  includeAll?: boolean;
  category?: 'adult' | 'child' | 'all';
  className?: string;
}

export const BeltFilter: React.FC<BeltFilterProps> = ({
  value,
  onValueChange,
  placeholder = "Selecione uma faixa",
  includeAll = true,
  category = 'all',
  className = ""
}) => {
  const { beltOptions, adultBeltOptions, childBeltOptions, isLoading } = useBeltLevels();

  const getFilteredOptions = () => {
    switch (category) {
      case 'adult':
        return adultBeltOptions;
      case 'child':
        return childBeltOptions;
      default:
        return beltOptions;
    }
  };

  const filteredOptions = getFilteredOptions();

  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger className={className}>
          <SelectValue placeholder="Carregando faixas..." />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {includeAll && (
          <SelectItem value="all">Todas as faixas</SelectItem>
        )}
        {filteredOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-2 rounded-sm border border-gray-300"
                style={{ backgroundColor: option.color }}
              />
              {option.label}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default BeltFilter;