import React from 'react';
import { useTranslations } from '@/hooks/use-translations';
import { calculateTotalPercentage } from '@/lib/utils';
import { BeltIcon } from '@/components/ui/belt-icon';

interface BeltDistributionProps {
  distribution: {
    white: number;
    blue: number;
    purple: number;
    brown: number;
    black: number;
  };
}

export const BeltDistribution = ({ distribution }: BeltDistributionProps) => {
  const { t } = useTranslations();
  const percentages = calculateTotalPercentage(distribution);
  
  const belts = [
    { key: 'white', label: t('student.whiteBelt'), color: 'white' },
    { key: 'blue', label: t('student.blueBelt'), color: 'blue' },
    { key: 'purple', label: t('student.purpleBelt'), color: 'purple' },
    { key: 'brown', label: t('student.brownBelt'), color: 'brown' },
    { key: 'black', label: t('student.blackBelt'), color: 'black' }
  ];

  return (
    <div className="bg-gray-800 rounded-xl shadow-md p-6 xl:col-span-1">
      <h2 className="text-lg font-medium text-white mb-4">{t('dashboard.beltDistribution')}</h2>
      <div className="space-y-4">
        {belts.map((belt) => (
          <div key={belt.key} className="flex items-center">
            <BeltIcon belt={belt.color} className="mr-2" />
            <span className="text-sm text-gray-300 mr-2">{belt.label}</span>
            <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full ${belt.color === 'white' ? 'bg-white' : belt.color === 'black' ? 'bg-black' : `bg-${belt.color}-500`}`} 
                style={{ width: `${percentages[belt.key]}%` }}
              ></div>
            </div>
            <span className="ml-2 text-sm text-gray-300">{percentages[belt.key]}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BeltDistribution;
