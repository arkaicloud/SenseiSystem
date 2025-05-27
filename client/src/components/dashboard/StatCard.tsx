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
  iconBgColor = "bg-blue-100",
  iconColor = "text-blue-500",
  subtitle,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-700 dark:text-gray-300 text-sm font-medium">{title}</h3>
        <div className={`w-8 h-8 rounded-full ${iconBgColor} flex items-center justify-center`}>
          <span className={`material-icons ${iconColor}`}>{icon}</span>
        </div>
      </div>
      <div className="flex items-end">
        <span className="text-2xl font-bold mr-2 text-gray-900 dark:text-white">{value}</span>
        {trend && (
          <span
            className={`${
              trend.isPositive ? "text-green-500" : "text-red-500"
            } text-sm flex items-center`}
          >
            <span className="material-icons text-xs mr-1">
              {trend.isPositive ? "arrow_upward" : "arrow_downward"}
            </span>
            {trend.value}
          </span>
        )}
      </div>
      <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">{subtitle || "comparado ao mês anterior"}</p>
    </div>
  );
};

export default StatCard;
