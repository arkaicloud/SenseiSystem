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
    <div className="bg-secondary rounded-xl shadow-md overflow-hidden">
      <div className="px-6 py-5 border-b border-border">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium text-white">{title}</h2>
          {showViewAll && (
            <Link href={viewAllLink}>
              <a className="text-sm font-medium text-primary hover:text-accent-foreground">
                {t('dashboard.viewAll')}
              </a>
            </Link>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-background">
              <TableHead className="text-muted-foreground">{t('class.title')}</TableHead>
              <TableHead className="text-muted-foreground">{t('class.date')}</TableHead>
              <TableHead className="text-muted-foreground">{t('class.startTime')}</TableHead>
              <TableHead className="text-muted-foreground">{t('class.beltLevel')}</TableHead>
              <TableHead className="text-muted-foreground">{t('class.attendees')}</TableHead>
              <TableHead className="text-muted-foreground">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classes.map((classSession) => (
              <TableRow key={classSession.id} className="border-border">
                <TableCell className="text-muted-foreground">{classSession.title}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(classSession.date, locale)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatTime(classSession.startTime)} - {formatTime(classSession.endTime)}
                </TableCell>
                <TableCell>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-card text-black">
                    {classSession.beltLevel || t('class.allLevels')}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">0/{classSession.capacity}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="p-0 h-auto text-primary hover:text-accent-foreground"
                      onClick={() => onViewClass && onViewClass(classSession.id)}
                    >
                      <i className="fas fa-eye"></i>
                    </Button>
                    {onEditClass && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-0 h-auto text-muted-foreground hover:text-muted-foreground"
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
                <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
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
