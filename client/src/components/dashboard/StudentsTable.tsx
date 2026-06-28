import React from "react";
import { BeltWithLabel } from "@/components/ui/belt";

interface StudentStatus {
  label: string;
  type: 'danger' | 'warning' | 'success' | 'info';
}

interface Student {
  id: number;
  initials: string;
  name: string;
  email: string;
  status: StudentStatus;
  beltLevel: 'white' | 'blue' | 'purple' | 'brown' | 'black';
  attendance: number;
  lastSeen: string;
}

interface StudentsTableProps {
  students: Student[];
  onEmail: (student: Student) => void;
  onCall: (student: Student) => void;
  onMore: (student: Student) => void;
}

const StudentsTable: React.FC<StudentsTableProps> = ({
  students,
  onEmail,
  onCall,
  onMore,
}) => {
  const getStatusClass = (type: string) => {
    switch (type) {
      case 'danger': return 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300';
      case 'warning': return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300';
      case 'success': return 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300';
      case 'info': return 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Student
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Belt
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Attendance
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Last Seen
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {students.map((student) => (
            <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                    <span className="font-medium text-sm text-gray-700 dark:text-gray-200">{student.initials}</span>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{student.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{student.email}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(student.status.type)}`}>
                  {student.status.label}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <BeltWithLabel level={student.beltLevel} size="sm" />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mr-2">
                    <div 
                      className={`${
                        student.attendance >= 70 
                          ? 'bg-status-success' 
                          : student.attendance >= 40 
                            ? 'bg-status-warning' 
                            : 'bg-status-danger'
                      } h-2 rounded-full`} 
                      style={{ width: `${student.attendance}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{student.attendance}%</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {student.lastSeen}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
                  <button 
                    onClick={() => onEmail(student)}
                    className="text-secondary hover:text-secondary-dark"
                    aria-label={`Email ${student.name}`}
                  >
                    <span className="material-icons">mail</span>
                  </button>
                  <button 
                    onClick={() => onCall(student)}
                    className="text-primary hover:text-primary-dark"
                    aria-label={`Call ${student.name}`}
                  >
                    <span className="material-icons">phone</span>
                  </button>
                  <button 
                    onClick={() => onMore(student)}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    aria-label="More options"
                  >
                    <span className="material-icons">more_vert</span>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StudentsTable;
