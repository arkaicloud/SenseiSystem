import React from 'react';
import { WeekAgenda } from '@/components/student/WeekAgenda';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { SchoolConfig } from '@shared/schema';

export default function WeekAgendaPage() {
  const { user } = useAuth();

  const { data: studentData } = useQuery({
    queryKey: ['/api/student/profile'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/student/profile');
      if (!response.ok) {
        throw new Error('Erro ao carregar perfil do aluno');
      }
      return response.json();
    },
    enabled: !!user?.id && user?.role === 'student',
  });

  const { data: schoolConfigData } = useQuery<{ config: SchoolConfig }>({
    queryKey: ['/api/school-config'],
    enabled: !!user?.id,
  });

  const primaryColor = schoolConfigData?.config?.primaryColor || '#B85C38';

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">Agenda da Semana</h1>
      </div>
      
      <WeekAgenda 
        studentId={studentData?.id || 0}
        primaryColor={primaryColor}
        showHeader={false}
      />
    </div>
  );
}