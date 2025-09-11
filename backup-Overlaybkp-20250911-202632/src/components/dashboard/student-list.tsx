import React from 'react';
import { useTranslations } from '@/hooks/use-translations';
import { formatDate } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Student } from '@/types';
import { Link } from 'wouter';
import BeltIcon from '../ui/belt-icon';

interface StudentListProps {
  students: Student[];
  title: string;
  showViewAll?: boolean;
  viewAllLink?: string;
}

export const StudentList = ({ 
  students, 
  title, 
  showViewAll = true, 
  viewAllLink = '/students' 
}: StudentListProps) => {
  const { t, locale } = useTranslations();

  return (
    <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-700">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium text-white">{title}</h2>
          {showViewAll && (
            <Link href={viewAllLink}>
              <a className="text-sm font-medium text-primary hover:text-blue-400">
                {t('dashboard.viewAll')}
              </a>
            </Link>
          )}
        </div>
      </div>
      <ul className="divide-y divide-gray-700">
        {students.map((student) => (
          <li key={student.id} className="px-6 py-4 flex items-center">
            <Avatar>
              <AvatarFallback>
                {student.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="ml-4 flex-1">
              <div className="flex justify-between">
                <p className="text-sm font-medium text-white">{student.name}</p>
                <p className="text-sm text-gray-400">
                  {formatDate(student.joinDate, locale)}
                </p>
              </div>
              <div className="flex justify-between mt-1">
                <p className="text-sm text-gray-400 flex items-center">
                  <BeltIcon belt={student.currentBelt} className="mr-1" />
                  {t(`student.${student.currentBelt}Belt`)}
                </p>
                <p className={`text-sm ${student.isActive ? 'text-green-500' : 'text-red-500'}`}>
                  {student.isActive ? t('student.active') : t('student.inactive')}
                </p>
              </div>
            </div>
          </li>
        ))}
        {students.length === 0 && (
          <li className="px-6 py-4 text-center text-gray-400">
            No students found
          </li>
        )}
      </ul>
    </div>
  );
};

export default StudentList;
