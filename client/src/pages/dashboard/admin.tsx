import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslations } from '@/hooks/use-translations';
import { formatCurrency } from '@/lib/utils';
import { DashboardStatsResponse } from '@/types';
import { queryClient } from '@/lib/queryClient';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import StatsCard from '@/components/dashboard/stats-card';
import BeltDistribution from '@/components/dashboard/belt-distribution';
import AttendanceChart from '@/components/dashboard/attendance-chart';
import ClassTable from '@/components/dashboard/class-table';
import StudentList from '@/components/dashboard/student-list';
import PromotionList from '@/components/dashboard/promotion-list';
import AddStudentModal from '@/components/modals/add-student-modal';
import AddClassModal from '@/components/modals/add-class-modal';
import { useToast } from '@/hooks/use-toast';

// Mock data for attendance chart (would come from API in production)
const generateAttendanceData = (days: number) => {
  return Array.from({ length: days }).map((_, index) => ({
    day: (index + 1).toString(),
    value: Math.floor(Math.random() * 30) + 10
  }));
};

// Mock data for upcoming promotions (would come from API in production)
const mockPromotions = [
  {
    id: 1,
    userId: 101,
    name: 'Carlos Mendes',
    cpf: '123.456.789-00',
    currentBelt: 'white',
    currentGrade: 4,
    isActive: true,
    nextBelt: 'blue',
    promotionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    joinDate: new Date().toISOString()
  },
  {
    id: 2,
    userId: 102,
    name: 'Bruno Soares',
    cpf: '234.567.890-11',
    currentBelt: 'blue',
    currentGrade: 4,
    isActive: true,
    nextBelt: 'purple',
    promotionDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    joinDate: new Date().toISOString()
  },
  {
    id: 3,
    userId: 103,
    name: 'Amanda Duarte',
    cpf: '345.678.901-22',
    currentBelt: 'white',
    currentGrade: 4,
    isActive: true,
    nextBelt: 'blue',
    promotionDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    joinDate: new Date().toISOString()
  }
];

export default function AdminDashboard() {
  const { t, locale } = useTranslations();
  const { toast } = useToast();
  const [chartPeriod, setChartPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  
  // Get dashboard stats
  const { data: stats, isLoading: isStatsLoading } = useQuery<DashboardStatsResponse>({
    queryKey: ['/api/dash/admin'],
  });
  
  // Get recent classes
  const { data: classes, isLoading: isClassesLoading } = useQuery<ClassSession[]>({
    queryKey: ['/api/classes'],
  });
  
  // Get active students
  const { data: students, isLoading: isStudentsLoading } = useQuery({
    queryKey: ['/api/students'],
  });
  
  // Create student mutation
  const createStudentMutation = useMutation({
    mutationFn: (data: any) => api.students.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dash/admin'] });
      toast({
        title: t('student.addStudent'),
        description: 'Student created successfully',
      });
      setIsAddStudentModalOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create student: ${error}`,
        variant: 'destructive',
      });
    }
  });
  
  // Create class mutation
  const createClassMutation = useMutation({
    mutationFn: (data: any) => api.classes.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dash/admin'] });
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
  
  // Handle chart period change
  const handlePeriodChange = (period: 'week' | 'month' | 'year') => {
    setChartPeriod(period);
  };
  
  // Generate attendance data based on period
  const getAttendanceData = () => {
    switch (chartPeriod) {
      case 'week':
        return generateAttendanceData(7);
      case 'month':
        return generateAttendanceData(30);
      case 'year':
        return generateAttendanceData(12);
      default:
        return generateAttendanceData(30);
    }
  };
  
  // Handle adding a new student
  const handleAddStudent = (data: any) => {
    createStudentMutation.mutate(data);
  };
  
  // Handle adding a new class
  const handleAddClass = (data: any) => {
    createClassMutation.mutate(data);
  };
  
  if (isStatsLoading || !stats) {
    return <div className="text-center p-8">{t('common.loading')}</div>;
  }
  
  const recentClasses = (classes && Array.isArray(classes)) ? classes.slice(0, 5) : [];
  const recentStudents = (students && Array.isArray(students)) ? students.slice(0, 5) : [];
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div className="flex space-x-2">
          <Button 
            className="px-4 py-2"
            onClick={() => setIsAddStudentModalOpen(true)}
          >
            <i className="fas fa-plus mr-2"></i> {t('dashboard.newStudent')}
          </Button>
          <Button 
            variant="outline" 
            className="px-4 py-2"
            onClick={() => setIsAddClassModalOpen(true)}
          >
            <i className="fas fa-calendar-plus mr-2"></i> {t('dashboard.scheduleClass')}
          </Button>
        </div>
      </div>
      
      <div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard 
            title={t('dashboard.totalStudents')} 
            value={stats.totalStudents.toString()} 
            icon="fas fa-users" 
            iconBgColor="bg-primary bg-opacity-20" 
            iconColor="text-primary"
            changeValue="12%"
            changeDirection="up"
            changeText={t('dashboard.fromLastMonth')}
          />
          
          <StatsCard 
            title={t('dashboard.activeStudents')} 
            value={stats.activeStudents.toString()} 
            icon="fas fa-user-check" 
            iconBgColor="bg-green-500 bg-opacity-20" 
            iconColor="text-green-500"
            changeValue="5%"
            changeDirection="up"
            changeText={t('dashboard.fromLastMonth')}
          />
          
          <StatsCard 
            title={t('dashboard.classesThisMonth')} 
            value={stats.classesThisMonth.toString()} 
            icon="fas fa-calendar-check" 
            iconBgColor="bg-yellow-500 bg-opacity-20" 
            iconColor="text-yellow-500"
            changeValue="8%"
            changeDirection="up"
            changeText={t('dashboard.fromLastMonth')}
          />
          
          <StatsCard 
            title={t('dashboard.monthlyRevenue')} 
            value={formatCurrency(stats.monthlyRevenue)} 
            icon="fas fa-dollar-sign" 
            iconBgColor="bg-purple-500 bg-opacity-20" 
            iconColor="text-purple-500"
            changeValue="10%"
            changeDirection="up"
            changeText={t('dashboard.fromLastMonth')}
          />
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Belt Distribution Chart */}
          <BeltDistribution distribution={stats.beltDistribution} />
          
          {/* Attendance Chart */}
          <AttendanceChart 
            data={getAttendanceData()} 
            period={chartPeriod} 
            onPeriodChange={handlePeriodChange}
          />
        </div>
        
        {/* Recent Classes */}
        <div className="mt-8">
          <ClassTable 
            classes={recentClasses} 
            title={t('dashboard.recentClasses')}
            onViewClass={(id) => console.log('View class', id)}
            onEditClass={(id) => console.log('Edit class', id)}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* Recent Students */}
          <StudentList 
            students={recentStudents} 
            title={t('dashboard.recentStudents')}
          />
          
          {/* Upcoming Promotions */}
          <PromotionList 
            promotions={[]} 
            title={t('dashboard.upcomingPromotions')}
          />
        </div>
        
        {/* Add Student Modal */}
        <AddStudentModal 
          isOpen={isAddStudentModalOpen} 
          onClose={() => setIsAddStudentModalOpen(false)}
          onSubmit={handleAddStudent}
        />
        
        {/* Add Class Modal */}
        <AddClassModal 
          isOpen={isAddClassModalOpen} 
          onClose={() => setIsAddClassModalOpen(false)}
          onSubmit={handleAddClass}
        />
      </div>
    </div>
  );
}
