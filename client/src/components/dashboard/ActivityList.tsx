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
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-montserrat font-bold">Recent Activities</h3>
      </div>

      <div className="divide-y divide-gray-200">
        {activities.map((activity) => (
          <div key={activity.id} className="p-4 flex">
            <div className={`w-10 h-10 rounded-full ${activity.iconBgColor} flex items-center justify-center mr-4`}>
              <span className={`material-icons ${activity.iconColor}`}>{activity.icon}</span>
            </div>
            <div>
              <p>{activity.content}</p>
              <p className="text-gray-500 text-sm">{activity.timestamp}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-200 text-center">
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
