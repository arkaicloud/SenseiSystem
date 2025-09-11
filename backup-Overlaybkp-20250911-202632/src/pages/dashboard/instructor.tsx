import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslations } from '@/hooks/use-translations';
import { InstructorDashboardResponse } from '@/types';
import { queryClient } from '@/lib/queryClient';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ClassTable from '@/components/dashboard/class-table';
import StudentList from '@/components/dashboard/student-list';
import AddClassModal from '@/components/modals/add-class-modal';
import { useToast } from '@/hooks/use-toast';

export default function InstructorDashboard() {
  const { t } = useTranslations();
  const { toast } = useToast();
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  
  // Get instructor dashboard data
  const { data, isLoading } = useQuery<InstructorDashboardResponse>({
    queryKey: ['/api/dash/instructor'],
  });
  
  // Create class mutation
  const createClassMutation = useMutation({
    mutationFn: (data: any) => api.classes.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dash/instructor'] });
      toast({
        title: t('class.addClass'),
        description: 'Class created successfully',
      });
      setIsAddClassModalOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create class: ${error}`,
        variant: 'destructive',
      });
    }
  });
  
  // Handle adding a new class
  const handleAddClass = (data: any) => {
    createClassMutation.mutate(data);
  };
  
  if (isLoading || !data) {
    return <div className="text-center p-8">{t('common.loading')}</div>;
  }
  
  const { classes, activeStudents } = data;
  
  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <h1 className="text-2xl font-semibold text-white mb-4 md:mb-0">{t('dashboard.instructorDashboard')}</h1>
          <Button 
            className="px-4 py-2"
            onClick={() => setIsAddClassModalOpen(true)}
          >
            <i className="fas fa-calendar-plus mr-2"></i> {t('dashboard.scheduleClass')}
          </Button>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-gray-800 border-gray-700 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">{t('dashboard.totalStudents')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{activeStudents.length}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">{t('dashboard.classesThisMonth')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{classes.length}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Average Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">68%</p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="classes" className="w-full">
          <TabsList className="mb-6 bg-gray-900">
            <TabsTrigger value="classes">{t('common.classes')}</TabsTrigger>
            <TabsTrigger value="students">{t('common.students')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="classes">
            <ClassTable 
              classes={classes} 
              title={t('dashboard.recentClasses')}
              showViewAll={false}
              onViewClass={(id) => console.log('View class', id)}
            />
          </TabsContent>
          
          <TabsContent value="students">
            <StudentList 
              students={activeStudents} 
              title={t('dashboard.activeStudents')}
              showViewAll={false}
            />
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Add Class Modal */}
      <AddClassModal 
        isOpen={isAddClassModalOpen} 
        onClose={() => setIsAddClassModalOpen(false)}
        onSubmit={handleAddClass}
      />
    </>
  );
}
