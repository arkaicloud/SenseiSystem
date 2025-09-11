import React from 'react';
import { useTranslations } from '@/hooks/use-translations';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { formatDate, formatTime } from '@/lib/utils';
import { ClassSession } from '@/types';
import { Link } from 'wouter';

interface ClassTableProps {
  classes: ClassSession[];
  title: string;
  showViewAll?: boolean;
  viewAllLink?: string;
  onViewClass?: (id: number) => void;
  onEditClass?: (id: number) => void;
}

export const ClassTable = ({ 
  classes, 
  title, 
  showViewAll = true, 
  viewAllLink = '/classes',
  onViewClass,
  onEditClass
}: ClassTableProps) => {
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
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-900">
              <TableHead className="text-gray-400">{t('class.title')}</TableHead>
              <TableHead className="text-gray-400">{t('class.date')}</TableHead>
              <TableHead className="text-gray-400">{t('class.startTime')}</TableHead>
              <TableHead className="text-gray-400">{t('class.beltLevel')}</TableHead>
              <TableHead className="text-gray-400">{t('class.attendees')}</TableHead>
              <TableHead className="text-gray-400">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classes.map((classSession) => (
              <TableRow key={classSession.id} className="border-gray-700">
                <TableCell className="text-gray-300">{classSession.title}</TableCell>
                <TableCell className="text-gray-300">
                  {formatDate(classSession.date, locale)}
                </TableCell>
                <TableCell className="text-gray-300">
                  {formatTime(classSession.startTime)} - {formatTime(classSession.endTime)}
                </TableCell>
                <TableCell>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-white text-black">
                    {classSession.beltLevel || t('class.allLevels')}
                  </span>
                </TableCell>
                <TableCell className="text-gray-300">0/{classSession.capacity}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="p-0 h-auto text-primary hover:text-blue-400"
                      onClick={() => onViewClass && onViewClass(classSession.id)}
                    >
                      <i className="fas fa-eye"></i>
                    </Button>
                    {onEditClass && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-0 h-auto text-gray-400 hover:text-gray-300"
                        onClick={() => onEditClass(classSession.id)}
                      >
                        <i className="fas fa-edit"></i>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {classes.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-gray-400">
                  No classes found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ClassTable;
