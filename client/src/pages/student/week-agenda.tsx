import React from 'react';
import { WeekAgenda } from '@/components/student/WeekAgenda';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import type { SchoolConfig } from '@shared/schema';

export default function WeekAgendaPage() {
  const { user } = useAuth();

  const { data: studentData } = useQuery({
    queryKey: ['/api/student/profile'],
    enabled: !!user?.id && user?.role === 'student',
  });

  const { data: schoolConfigData } = useQuery<{ config: SchoolConfig }>({
    queryKey: ['/api/school-config'],
    enabled: !!user?.id,
  });

  const { data: weekData, isLoading } = useQuery({
    queryKey: ['/api/students', studentData?.id, 'classes/week'],
    enabled: !!studentData?.id,
  });

  const primaryColor = schoolConfigData?.config?.primaryColor || '#B85C38';

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">Agenda da Semana</h1>
      </div>
      
      <WeekAgenda 
        weekData={weekData?.weekData || []}
        studentId={studentData?.id || 0}
        primaryColor={primaryColor}
        isLoading={isLoading}
      />
    </div>
  );
}