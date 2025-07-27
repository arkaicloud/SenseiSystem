import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslations } from '@/hooks/use-translations';
import { useAuth } from '@/hooks/use-auth';
import { StudentDashboardResponse, ClassSession } from '@/types';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';
import { api } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import BeltIcon from '@/components/ui/belt-icon';
import { useToast } from '@/hooks/use-toast';

export default function StudentDashboard() {
  const { t, locale } = useTranslations();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Get student dashboard data
  const { data, isLoading } = useQuery<StudentDashboardResponse>({
    queryKey: ['/api/dash/student'],
  });
  
  // Check-in mutation
  const checkinMutation = useMutation({
    mutationFn: (classId: number) => {
      if (!user?.student?.id) throw new Error('Student ID not found');
      return api.classes.checkin(classId, user.student.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dash/student'] });
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
  const handleCheckin = (classId: number) => {
    checkinMutation.mutate(classId);
  };
  
  if (isLoading || !data) {
    return <div className="text-center p-8">{t('common.loading')}</div>;
  }
  
  const { attendanceStats, classes, currentPlan } = data;
  
  // Filter upcoming classes (today and future)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const upcomingClasses = classes
    .filter(cls => new Date(cls.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);
  
  // Prepare attendance data for pie chart
  const attendanceData = [
    { name: 'Present', value: attendanceStats.present, color: '#10B981' },
    { name: 'Absent', value: attendanceStats.absent, color: '#EF4444' }
  ];
  
  // Calculate attendance percentage
  const totalClasses = attendanceStats.present + attendanceStats.absent;
  const attendancePercentage = totalClasses > 0 
    ? Math.round((attendanceStats.present / totalClasses) * 100) 
    : 0;
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Student Info & Plan */}
        <div className="w-full xl:w-1/3 space-y-6">
          {/* Student Card */}
          <Card className="bg-gray-800 border-gray-700 text-white">
            <CardHeader>
              <CardTitle>{t('student.studentInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {user?.student && (
                <>
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-xl font-bold">
                      {user.student.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{user.student.name}</h3>
                      <p className="text-gray-400">{user.email}</p>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span>{t('student.belt')}</span>
                      <div className="flex items-center">
                        <BeltIcon belt={user.student.currentBelt} className="mr-2" />
                        <span>{t(`student.${user.student.currentBelt}Belt`)} {user.student.currentGrade > 0 && `(${user.student.currentGrade}°)`}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-sm mb-1">
                      <span>{t('student.status')}</span>
                      <span className={user.student.isActive ? 'text-green-500' : 'text-red-500'}>
                        {user.student.isActive ? t('student.active') : t('student.inactive')}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span>{t('student.joinDate')}</span>
                      <span>{formatDate(user.student.joinDate, locale)}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          {/* Subscription Plan */}
          <Card className="bg-gray-800 border-gray-700 text-white">
            <CardHeader>
              <CardTitle>{t('common.plans')}</CardTitle>
            </CardHeader>
            <CardContent>
              {currentPlan ? (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-700 rounded-lg">
                    <h3 className="text-lg font-bold mb-1">{currentPlan.plan.name}</h3>
                    <p className="text-2xl font-bold text-primary mb-2">
                      {formatCurrency(currentPlan.plan.price, locale)} <span className="text-sm text-gray-400">/month</span>
                    </p>
                    <div className="text-sm text-gray-300">
                      <div className="flex justify-between mb-1">
                        <span>{t('plan.startDate')}</span>
                        <span>{formatDate(currentPlan.startDate, locale)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t('plan.endDate')}</span>
                        <span>{formatDate(currentPlan.endDate, locale)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400">
                  <p>No active subscription plan</p>
                  <Button variant="outline" className="mt-4">
                    {t('plan.assignPlan')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Attendance & Upcoming Classes */}
        <div className="w-full xl:w-2/3 space-y-6">
          {/* Attendance Stats */}
          <Card className="bg-gray-800 border-gray-700 text-white">
            <CardHeader>
              <CardTitle>{t('common.attendance')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row">
                <div className="w-full md:w-1/2 h-64 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={attendanceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        labelLine={false}
                      >
                        {attendanceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full md:w-1/2 flex flex-col justify-center space-y-4 mt-4 md:mt-0">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Attendance Rate</span>
                      <span className="text-sm font-medium">{attendancePercentage}%</span>
                    </div>
                    <Progress value={attendancePercentage} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="bg-gray-700 p-3 rounded-lg text-center">
                      <p className="text-sm text-gray-400">Present</p>
                      <p className="text-2xl font-bold text-green-500">{attendanceStats.present}</p>
                    </div>
                    <div className="bg-gray-700 p-3 rounded-lg text-center">
                      <p className="text-sm text-gray-400">Absent</p>
                      <p className="text-2xl font-bold text-red-500">{attendanceStats.absent}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Upcoming Classes */}
          <Card className="bg-gray-800 border-gray-700 text-white">
            <CardHeader>
              <CardTitle>Upcoming Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-400">{t('class.title')}</TableHead>
                    <TableHead className="text-gray-400">{t('class.date')}</TableHead>
                    <TableHead className="text-gray-400">{t('class.startTime')}</TableHead>
                    <TableHead className="text-gray-400 hidden md:table-cell">{t('class.beltLevel')}</TableHead>
                    <TableHead className="text-right">{t('class.checkin')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingClasses.map((cls) => (
                    <TableRow key={cls.id} className="border-gray-700">
                      <TableCell className="font-medium">{cls.title}</TableCell>
                      <TableCell>{formatDate(cls.date, locale)}</TableCell>
                      <TableCell>{formatTime(cls.startTime)} - {formatTime(cls.endTime)}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-white text-black">
                          {cls.beltLevel || t('class.allLevels')}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleCheckin(cls.id)}
                          disabled={checkinMutation.isPending}
                        >
                          {checkinMutation.isPending ? t('common.loading') : t('class.checkin')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {upcomingClasses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-gray-400">
                        No upcoming classes
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
