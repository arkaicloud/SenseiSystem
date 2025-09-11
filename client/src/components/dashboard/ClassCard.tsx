import React from "react";
import { Button } from "@/components/ui/button";

interface Attendee {
  initials: string;
  name: string;
}

interface ClassCardProps {
  time: string;
  period: string;
  name: string;
  instructor: string;
  duration: number;
  attendees: Attendee[];
  onTakeAttendance: () => void;
  bgColor?: string;
  textColor?: string;
}

const ClassCard: React.FC<ClassCardProps> = ({
  time,
  period,
  name,
  instructor,
  duration,
  attendees,
  onTakeAttendance,
  bgColor = "bg-blue-100",
  textColor = "text-blue-800",
}) => {
  return (
    <div className="p-4 flex flex-col md:flex-row md:items-center md:justify-between">
      <div className="flex items-center mb-3 md:mb-0">
        <div
          className={`${bgColor} ${textColor} p-3 rounded-lg mr-4 flex flex-col items-center justify-center`}
        >
          <span className="text-xs font-medium">{time}</span>
          <span className="text-xs">{period}</span>
        </div>
        <div>
          <h4 className="font-medium">{name}</h4>
          <p className="text-gray-500 text-sm">
            {instructor} • {duration} min
          </p>
        </div>
      </div>

      <div className="flex items-center">
        <div className="flex -space-x-2 mr-4">
          {attendees.slice(0, 3).map((attendee, index) => (
            <div
              key={index}
              className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center"
              title={attendee.name}
            >
              <span className="text-xs font-medium">{attendee.initials}</span>
            </div>
          ))}
          {attendees.length > 3 && (
            <div
              className="w-8 h-8 rounded-full bg-primary border-2 border-white flex items-center justify-center text-white"
              title={`${attendees.length - 3} more`}
            >
              <span className="text-xs font-medium">
                +{attendees.length - 3}
              </span>
            </div>
          )}
        </div>

        <Button
          onClick={onTakeAttendance}
          className="bg-secondary hover:bg-secondary-dark text-white text-sm"
        >
          Take Attendance
        </Button>
      </div>
    </div>
  );
};

export default ClassCard;
