import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslations } from '@/hooks/use-translations';
import { Layout } from '@/components/layout/layout';
import { useRoute, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { ClassSession } from '@/types';
import { queryClient } from '@/lib/queryClient';
import { api } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/utils';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export default function ClassDetailPage() {
  const { t, locale } = useTranslations();
  const { user } = useAuth();
  const { toast } = useToast();
  const [_, params] = useRoute('/classes/:id');
  const [__, navigate] = useLocation();
  const classId = params ? parseInt(params.id) : null;
  
  if (!classId) {
    navigate('/classes');
    return null;
  }
  
  // Get class data
  const { data: classSession, isLoading: isClassLoading } = useQuery<ClassSession>({
    queryKey: [`/api/classes/${classId}`],
  });
  
  // Get class attendance
  const { data: attendance, isLoading: isAttendanceLoading } = useQuery({
    queryKey: [`/api/classes/${classId}/attendance`],
  });
  
  // Check-in mutation
  const checkinMutation = useMutation({
    mutationFn: () => {
      if (!user?.student?.id) throw new Error('Student ID not found');
      return api.classes.checkin(classId, user.student.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/classes/${classId}/attendance`] });
      toast({
        title: 'Success',
        description: 'Checked in to class successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to check in: ${error}`,
        variant: 'destructive',
      });
    }
  });
  
  // Handle check-in
  const handleCheckin = () => {
    checkinMutation.mutate();
  };
  
  if (isClassLoading || !classSession) {
    return (
      <Layout title={t('common.classes')}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 flex items-center justify-center py-12">
          <p className="text-white">{t('common.loading')}</p>
        </div>
      </Layout>
    );
  }
  
  // Check if user can manage this class
  const canManageClass = user && ['admin', 'manager', 'instructor'].includes(user.role);
  
  // Check if user is a student
  const isStudent = user?.role === 'student';
  
  return (
    <Layout title={classSession.title}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{classSession.title}</h1>
            <p className="text-gray-400">{formatDate(classSession.date, locale)}</p>
          </div>
          
          <div className="mt-4 md:mt-0 flex space-x-3">
            {canManageClass && (
              <Button variant="outline" onClick={() => navigate(`/classes/${classSession.id}/edit`)}>
                <i className="fas fa-edit mr-2"></i> {t('common.edit')}
              </Button>
            )}
            
            {isStudent && (
              <Button 
                variant="default" 
                onClick={handleCheckin}
                disabled={checkinMutation.isPending}
              >
                <i className="fas fa-check-circle mr-2"></i> 
                {checkinMutation.isPending ? t('common.loading') : t('class.checkin')}
              </Button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700 text-white">
            <CardHeader>
              <CardTitle>{t('class.date')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg">{formatDate(classSession.date, locale)}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700 text-white">
            <CardHeader>
              <CardTitle>{t('class.startTime')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg">{formatTime(classSession.startTime)} - {formatTime(classSession.endTime)}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700 text-white">
            <CardHeader>
              <CardTitle>{t('class.beltLevel')}</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="px-3 py-1 text-sm font-medium rounded-full bg-white text-black">
                {classSession.beltLevel || t('class.allLevels')}
              </span>
            </CardContent>
          </Card>
        </div>
        
        <Card className="bg-gray-800 border-gray-700 text-white">
          <CardHeader>
            <CardTitle>{t('class.attendees')}</CardTitle>
            <CardDescription className="text-gray-400">
              {attendance ? `${attendance.length} / ${classSession.capacity}` : '0 / ' + classSession.capacity} students
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isAttendanceLoading ? (
              <p className="text-center py-4">{t('common.loading')}</p>
            ) : attendance && attendance.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-400">{t('student.fullName')}</TableHead>
                    <TableHead className="text-gray-400">Time</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.map((record: any) => (
                    <TableRow key={record.id} className="border-gray-700">
                      <TableCell>{record.student?.name || 'Unknown'}</TableCell>
                      <TableCell>{formatTime(record.timestamp.split('T')[1].substring(0, 5))}</TableCell>
                      <TableCell>
                        <Badge variant={record.status === 'present' ? 'default' : 'destructive'}>
                          {record.status === 'present' ? 'Present' : 'Absent'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center py-4 text-gray-400">No attendance records found</p>
            )}
          </CardContent>
          {canManageClass && (
            <CardFooter>
              <Button>
                <i className="fas fa-plus mr-2"></i> Add Attendee
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </Layout>
  );
}
