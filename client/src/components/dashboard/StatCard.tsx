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
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        <div className={`w-8 h-8 rounded-full ${iconBgColor} flex items-center justify-center`}>
          <span className={`material-icons ${iconColor}`}>{icon}</span>
        </div>
      </div>
      <div className="flex items-end">
        <span className="text-2xl font-bold mr-2">{value}</span>
        {trend && (
          <span
            className={`${
              trend.isPositive ? "text-status-success" : "text-status-danger"
            } text-sm flex items-center`}
          >
            <span className="material-icons text-xs mr-1">
              {trend.isPositive ? "arrow_upward" : "arrow_downward"}
            </span>
            {trend.value}
          </span>
        )}
      </div>
      <p className="text-gray-500 text-xs mt-1">{subtitle || "vs último mês"}</p>
    </div>
  );
};

export default StatCard;
