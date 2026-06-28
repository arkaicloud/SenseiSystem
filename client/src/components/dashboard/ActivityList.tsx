import React from "react";

interface Activity {
  id: number;
  icon: string;
  iconBgColor: string;
  iconColor: string;
  content: React.ReactNode;
  timestamp: string;
}

interface ActivityListProps {
  activities: Activity[];
  onViewAll: () => void;
}

const ActivityList: React.FC<ActivityListProps> = ({ activities, onViewAll }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-montserrat font-bold text-gray-900 dark:text-gray-100">Recent Activities</h3>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {activities.map((activity) => (
          <div key={activity.id} className="p-4 flex">
            <div className={`w-10 h-10 rounded-full ${activity.iconBgColor} flex items-center justify-center mr-4`}>
              <span className={`material-icons ${activity.iconColor}`}>{activity.icon}</span>
            </div>
            <div>
              <p className="text-gray-900 dark:text-gray-100">{activity.content}</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{activity.timestamp}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center">
        <button
          onClick={onViewAll}
          className="text-secondary font-medium text-sm"
        >
          View All Activities
        </button>
      </div>
    </div>
  );
};

export default ActivityList;
