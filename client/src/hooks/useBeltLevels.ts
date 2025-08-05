import { useQuery } from '@tanstack/react-query';

export interface BeltLevel {
  id: number;
  name: string;
  levelKey: string;
  colorCode: string;
  category: 'adult' | 'child';
  order: number;
  active: boolean;
}

export interface BeltOption {
  value: string;
  label: string;
  color: string;
  category: 'adult' | 'child';
  order: number;
}

export function useBeltLevels() {
  const { data: beltsData, isLoading, error } = useQuery({
    queryKey: ['/api/admin/belts'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const belts = beltsData?.belts || [];

  // Convert to belt options for dropdowns/selects
  const beltOptions: BeltOption[] = belts
    .filter((belt: BeltLevel) => belt.active)
    .sort((a: BeltLevel, b: BeltLevel) => a.order - b.order)
    .map((belt: BeltLevel) => ({
      value: belt.levelKey,
      label: belt.name,
      color: belt.colorCode,
      category: belt.category,
      order: belt.order
    }));

  // Get belt options by category
  const adultBeltOptions = beltOptions.filter(belt => belt.category === 'adult');
  const childBeltOptions = beltOptions.filter(belt => belt.category === 'child');

  // Helper functions
  const getBeltByKey = (levelKey: string): BeltLevel | undefined => {
    return belts.find((belt: BeltLevel) => belt.levelKey === levelKey);
  };

  const getBeltName = (levelKey: string): string => {
    const belt = getBeltByKey(levelKey);
    return belt?.name || 'Faixa não encontrada';
  };

  const getBeltColor = (levelKey: string): string => {
    const belt = getBeltByKey(levelKey);
    return belt?.colorCode || '#808080';
  };

  const getBeltCategory = (levelKey: string): 'adult' | 'child' | undefined => {
    const belt = getBeltByKey(levelKey);
    return belt?.category;
  };

  // Get next belt in progression
  const getNextBelt = (currentLevelKey: string): BeltLevel | undefined => {
    const currentBelt = getBeltByKey(currentLevelKey);
    if (!currentBelt) return undefined;

    const sameCategoryBelts = belts
      .filter((belt: BeltLevel) => 
        belt.category === currentBelt.category && 
        belt.active &&
        belt.order > currentBelt.order
      )
      .sort((a: BeltLevel, b: BeltLevel) => a.order - b.order);

    return sameCategoryBelts[0];
  };

  // Get previous belt in progression
  const getPreviousBelt = (currentLevelKey: string): BeltLevel | undefined => {
    const currentBelt = getBeltByKey(currentLevelKey);
    if (!currentBelt) return undefined;

    const sameCategoryBelts = belts
      .filter((belt: BeltLevel) => 
        belt.category === currentBelt.category && 
        belt.active &&
        belt.order < currentBelt.order
      )
      .sort((a: BeltLevel, b: BeltLevel) => b.order - a.order);

    return sameCategoryBelts[0];
  };

  return {
    belts,
    beltOptions,
    adultBeltOptions,
    childBeltOptions,
    isLoading,
    error,
    getBeltByKey,
    getBeltName,
    getBeltColor,
    getBeltCategory,
    getNextBelt,
    getPreviousBelt
  };
}