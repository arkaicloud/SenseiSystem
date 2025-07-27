import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslations } from '@/hooks/use-translations';
import { Layout } from '@/components/layout/layout';
import { useRoute, useLocation } from 'wouter';
import { Student, ClassSession, StudentPlan, Plan } from '@/types';
import { queryClient } from '@/lib/queryClient';
import { api } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import BeltIcon from '@/components/ui/belt-icon';
import { useToast } from '@/hooks/use-toast';

export default function StudentDetailPage() {
  const { t, locale } = useTranslations();
  const { toast } = useToast();
  const [_, params] = useRoute('/students/:id');
  const [__, navigate] = useLocation();
  const studentId = params ? parseInt(params.id) : null;
  
  if (!studentId) {
    navigate('/students');
    return null;
  }
  
  // Get student data
  const { data: student, isLoading: isStudentLoading } = useQuery<Student>({
    queryKey: [`/api/students/${studentId}`],
  });
  
  // Get student attendance
  const { data: attendance, isLoading: isAttendanceLoading } = useQuery({
    queryKey: [`/api/students/${studentId}/attendance`],
  });
  
  // Get student plans
  const { data: studentPlans, isLoading: isPlansLoading } = useQuery<(StudentPlan & { plan: Plan })[]>({
    queryKey: [`/api/students/${studentId}/plans`],
  });
  
  // Student mutations
  const activateStudentMutation = useMutation({
    mutationFn: (id: number) => api.students.activate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/students/${studentId}`] });
      toast({
        title: 'Success',
        description: 'Student activated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to activate student: ${error}`,
        variant: 'destructive',
      });
    }
  });
  
  const deactivateStudentMutation = useMutation({
    mutationFn: (id: number) => api.students.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/students/${studentId}`] });
      toast({
        title: 'Success',
        description: 'Student deactivated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to deactivate student: ${error}`,
        variant: 'destructive',
      });
    }
  });
  
  if (isStudentLoading || !student) {
    return (
      <Layout title={t('common.students')}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 flex items-center justify-center py-12">
          <p className="text-white">{t('common.loading')}</p>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout title={student.name}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{student.name}</h1>
            <p className="text-gray-400">{student.cpf}</p>
          </div>
          
          <div className="mt-4 md:mt-0 flex space-x-3">
            <Button variant="outline" onClick={() => navigate(`/students/${student.id}/edit`)}>
              <i className="fas fa-edit mr-2"></i> {t('common.edit')}
            </Button>
            
            {student.isActive ? (
              <Button 
                variant="destructive" 
                onClick={() => deactivateStudentMutation.mutate(student.id)}
              >
                <i className="fas fa-user-minus mr-2"></i> {t('student.deactivate')}
              </Button>
            ) : (
              <Button 
                variant="default" 
                onClick={() => activateStudentMutation.mutate(student.id)}
              >
                <i className="fas fa-user-plus mr-2"></i> {t('student.activate')}
              </Button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700 text-white">
            <CardHeader>
              <CardTitle>{t('student.status')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${student.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-lg font-medium">
                  {student.isActive ? t('student.active') : t('student.inactive')}
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700 text-white">
            <CardHeader>
              <CardTitle>{t('student.belt')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                <BeltIcon belt={student.currentBelt} size="lg" />
                <div>
                  <p className="text-lg font-medium">{t(`student.${student.currentBelt}Belt`)}</p>
                  {student.currentGrade > 0 && (
                    <p className="text-sm text-gray-400">Grade: {student.currentGrade}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700 text-white">
            <CardHeader>
              <CardTitle>{t('student.joinDate')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg">{formatDate(student.joinDate, locale)}</p>
              <p className="text-sm text-gray-400">
                Member for {Math.floor((new Date().getTime() - new Date(student.joinDate).getTime()) / (1000 * 60 * 60 * 24 * 30))} months
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="mb-6 bg-gray-900">
            <TabsTrigger value="info">{t('student.studentInfo')}</TabsTrigger>
            <TabsTrigger value="attendance">{t('common.attendance')}</TabsTrigger>
            <TabsTrigger value="plans">{t('common.plans')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="info">
            <Card className="bg-gray-800 border-gray-700 text-white">
              <CardHeader>
                <CardTitle>{t('student.studentInfo')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">{t('student.address')}</h3>
                    <div className="space-y-2">
                      <p><span className="text-gray-400">{t('student.street')}:</span> {student.street || 'N/A'}</p>
                      <p><span className="text-gray-400">{t('student.city')}:</span> {student.city || 'N/A'}</p>
                      <p><span className="text-gray-400">{t('student.state')}:</span> {student.state || 'N/A'}</p>
                      <p><span className="text-gray-400">{t('student.zip')}:</span> {student.zip || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Personal Information</h3>
                    <div className="space-y-2">
                      <p><span className="text-gray-400">{t('student.fullName')}:</span> {student.name}</p>
                      <p><span className="text-gray-400">{t('student.cpf')}:</span> {student.cpf}</p>
                      <p>
                        <span className="text-gray-400">{t('student.birthDate')}:</span> 
                        {student.birthDate ? formatDate(student.birthDate, locale) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="attendance">
            <Card className="bg-gray-800 border-gray-700 text-white">
              <CardHeader>
                <CardTitle>{t('common.attendance')}</CardTitle>
              </CardHeader>
              <CardContent>
                {isAttendanceLoading ? (
                  <p className="text-center py-4">{t('common.loading')}</p>
                ) : attendance && attendance.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700">
                        <TableHead className="text-gray-400">Date</TableHead>
                        <TableHead className="text-gray-400">Class</TableHead>
                        <TableHead className="text-gray-400">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendance.map((record: any) => (
                        <TableRow key={record.id} className="border-gray-700">
                          <TableCell>{formatDate(record.timestamp, locale)}</TableCell>
                          <TableCell>{record.classSession?.title || 'N/A'}</TableCell>
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
            </Card>
          </TabsContent>
          
          <TabsContent value="plans">
            <Card className="bg-gray-800 border-gray-700 text-white">
              <CardHeader>
                <CardTitle>{t('common.plans')}</CardTitle>
              </CardHeader>
              <CardContent>
                {isPlansLoading ? (
                  <p className="text-center py-4">{t('common.loading')}</p>
                ) : studentPlans && studentPlans.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700">
                        <TableHead className="text-gray-400">{t('plan.name')}</TableHead>
                        <TableHead className="text-gray-400">{t('plan.price')}</TableHead>
                        <TableHead className="text-gray-400">{t('plan.startDate')}</TableHead>
                        <TableHead className="text-gray-400">{t('plan.endDate')}</TableHead>
                        <TableHead className="text-gray-400">{t('student.status')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentPlans.map((studentPlan) => (
                        <TableRow key={studentPlan.id} className="border-gray-700">
                          <TableCell>{studentPlan.plan.name}</TableCell>
                          <TableCell>{formatCurrency(studentPlan.plan.price, locale)}</TableCell>
                          <TableCell>{formatDate(studentPlan.startDate, locale)}</TableCell>
                          <TableCell>{formatDate(studentPlan.endDate, locale)}</TableCell>
                          <TableCell>
                            <Badge variant={studentPlan.isActive ? 'default' : 'secondary'}>
                              {studentPlan.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center py-4 text-gray-400">No plans found</p>
                )}
              </CardContent>
              <CardFooter>
                <Button>
                  <i className="fas fa-plus mr-2"></i> {t('plan.assignPlan')}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
