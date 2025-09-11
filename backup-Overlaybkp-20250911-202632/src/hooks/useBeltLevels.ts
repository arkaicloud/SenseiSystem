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

export function useBeltLevels(birthDate?: string | Date, usePublicEndpoint?: boolean) {
  // Use public endpoint for onboarding when not authenticated
  const endpoint = usePublicEndpoint ? '/api/public/belts' : '/api/admin/belts';
  
  const { data: beltsData, isLoading, error } = useQuery({
    queryKey: [endpoint],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const belts = beltsData?.belts || [];

  // Calculate age-based category
  const getAgeBasedCategory = (): 'adult' | 'child' | 'all' => {
    if (!birthDate) return 'all';
    
    const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    // Adjust age if birthday hasn't occurred this year
    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate()) 
      ? age - 1 
      : age;
    
    return actualAge < 18 ? 'child' : 'adult';
  };

  const ageCategory = getAgeBasedCategory();

  // Convert to belt options for dropdowns/selects
  const allBeltOptions: BeltOption[] = belts
    .filter((belt: BeltLevel) => belt.active)
    .sort((a: BeltLevel, b: BeltLevel) => a.order - b.order)
    .map((belt: BeltLevel) => ({
      value: belt.levelKey,
      label: belt.name,
      color: belt.colorCode,
      category: belt.category,
      order: belt.order
    }));

  // Filter belt options based on age if birthDate is provided
  const beltOptions: BeltOption[] = ageCategory === 'all' 
    ? allBeltOptions 
    : allBeltOptions.filter(belt => belt.category === ageCategory);

  // Get belt options by category
  const adultBeltOptions = allBeltOptions.filter(belt => belt.category === 'adult');
  const childBeltOptions = allBeltOptions.filter(belt => belt.category === 'child');

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
    allBeltOptions,
    adultBeltOptions,
    childBeltOptions,
    ageCategory,
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