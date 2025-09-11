import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  trend?: {
    value: string | number;
    isPositive: boolean;
  };
  iconBgColor?: string;
  iconColor?: string;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  iconBgColor = "bg-blue-100 dark:bg-blue-900",
  iconColor = "text-blue-600 dark:text-blue-300",
  subtitle,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-all duration-200 hover:shadow-md min-h-[120px] flex flex-col justify-between">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-gray-700 dark:text-gray-300 text-sm font-medium leading-tight pr-2 flex-1">{title}</h3>
        <div className={`w-8 h-8 rounded-full ${iconBgColor} flex items-center justify-center flex-shrink-0`}>
          <span className={`material-icons text-lg ${iconColor}`}>{icon}</span>
        </div>
      </div>
      <div className="flex items-end justify-between mb-2">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">{value}</span>
        {trend && (
          <span
            className={`${
              trend.isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            } text-sm flex items-center font-medium flex-shrink-0`}
          >
            <span className="material-icons text-xs mr-1">
              {trend.isPositive ? "arrow_upward" : "arrow_downward"}
            </span>
            {trend.value}
          </span>
        )}
      </div>
      <p className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed">{subtitle || "comparado ao mês anterior"}</p>
    </div>
  );
};

export default StatCard;
