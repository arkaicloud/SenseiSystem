import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { Bell, CalendarDays, Award, CheckCircle2 } from "lucide-react";

interface Notification {
  id: number;
  type: "event" | "attendance" | "belt" | "general";
  title: string;
  message: string;
  date: string;
  isRead: boolean;
}

interface StudentNotificationsProps {
  notifications: Notification[];
}

const StudentNotifications: React.FC<StudentNotificationsProps> = ({ 
  notifications = [] 
}) => {
  const { t } = useTranslation();
  
  const getIcon = (type: string) => {
    switch (type) {
      case "event":
        return <CalendarDays className="h-5 w-5 text-blue-500" />;
      case "attendance":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "belt":
        return <Award className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <Card className="shadow-sm mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="h-5 w-5" />
          {t('notifications')}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {notifications.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            {t('no_notifications')}
          </div>
        ) : (
          <ul className="divide-y">
            {notifications.map((notification) => (
              <li key={notification.id} className={`py-3 flex gap-3 ${notification.isRead ? 'opacity-70' : ''}`}>
                <div className="flex-shrink-0 mt-1">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-grow">
                  <h4 className="font-medium text-sm">{notification.title}</h4>
                  <p className="text-sm text-gray-600">{notification.message}</p>
                  <div className="text-xs text-gray-500 mt-1">{notification.date}</div>
                </div>
                {!notification.isRead && (
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentNotifications;