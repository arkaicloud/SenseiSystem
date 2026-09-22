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
      case 'info': return 'bg-accent dark:bg-accent/40 text-accent-foreground dark:text-accent-foreground';
      default: return 'bg-muted dark:bg-muted text-foreground dark:text-foreground';
    }
  };

  return (
    <div className="bg-card dark:bg-card rounded-lg shadow overflow-x-auto">
      <table className="min-w-full divide-y divide-border dark:divide-border">
        <thead className="bg-background dark:bg-muted">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
              Student
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
              Belt
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
              Attendance
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
              Last Seen
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-card dark:bg-card divide-y divide-border dark:divide-border">
          {students.map((student) => (
            <tr key={student.id} className="hover:bg-background dark:hover:bg-muted">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-muted dark:bg-muted flex items-center justify-center">
                    <span className="font-medium text-sm text-secondary-foreground dark:text-foreground">{student.initials}</span>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-foreground dark:text-foreground">{student.name}</div>
                    <div className="text-sm text-muted-foreground dark:text-muted-foreground">{student.email}</div>
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
                  <div className="w-24 bg-muted dark:bg-muted rounded-full h-2 mr-2">
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
                  <span className="text-sm text-secondary-foreground dark:text-secondary-foreground">{student.attendance}%</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground dark:text-muted-foreground">
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
                    className="text-muted-foreground dark:text-muted-foreground hover:text-secondary-foreground dark:hover:text-foreground"
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
