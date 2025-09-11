import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  iconBgColor: string;
  iconColor: string;
  changeValue?: string;
  changeDirection?: 'up' | 'down' | 'none';
  changeText?: string;
}

export const StatsCard = ({
  title,
  value,
  icon,
  iconBgColor,
  iconColor,
  changeValue,
  changeDirection = 'none',
  changeText
}: StatsCardProps) => {
  const getChangeColor = () => {
    if (changeDirection === 'up') return 'text-green-500';
    if (changeDirection === 'down') return 'text-red-500';
    return 'text-gray-400';
  };
  
  const getChangeIcon = () => {
    if (changeDirection === 'up') return 'fas fa-arrow-up';
    if (changeDirection === 'down') return 'fas fa-arrow-down';
    return '';
  };

  return (
    <div className="bg-gray-800 rounded-xl shadow-md p-6">
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-md ${iconBgColor}`}>
          <i className={`${icon} ${iconColor}`}></i>
        </div>
        <div className="ml-4">
          <h2 className="text-sm font-medium text-gray-400">{title}</h2>
          <p className="text-2xl font-semibold text-white">{value}</p>
        </div>
      </div>
      {(changeValue || changeText) && (
        <div className="mt-3">
          <div className="flex items-center text-sm">
            {changeValue && (
              <span className={getChangeColor()}>
                {getChangeIcon() && <i className={`${getChangeIcon()} mr-1`}></i>}
                {changeValue}
              </span>
            )}
            {changeText && <span className="text-gray-400 ml-2">{changeText}</span>}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsCard;
