import React from 'react';
import { WeekAgenda } from '@/components/student/WeekAgenda';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import type { SchoolConfig } from '@shared/schema';

interface StudentProfile {
  id: number;
  beltLevel: string;
  stripes: number;
}

interface WeekDataResponse {
  weekData: Array<{
    date: string;
    dayOfWeek: number;
    dayName: string;
    classes: Array<{
      id: number;
      name: string;
      startTime: string;
      endTime?: string;
      instructorName?: string;
      location?: string;
      attendanceConfirmed: boolean;
      bookingStatus?: 'CONFIRMED' | 'CANCELLED' | null;
      dateISO?: string;
      canConfirm?: boolean;
      canCancel?: boolean;
    }>;
  }>;
}

export default function WeekAgendaPage() {
  const { user } = useAuth();

  const { data: studentData } = useQuery<StudentProfile>({
    queryKey: ['/api/student/profile'],
    enabled: !!user?.id && user?.role === 'student',
  });

  const { data: schoolConfigData } = useQuery<{ config: SchoolConfig }>({
    queryKey: ['/api/school-config'],
    enabled: !!user?.id,
  });

  const { data: weekData, isLoading, error } = useQuery<WeekDataResponse>({
    queryKey: ['/api/students', studentData?.id, 'classes/week'],
    enabled: !!studentData?.id,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Debug para acompanhar o carregamento
  React.useEffect(() => {
    if (studentData?.id) {
      console.log('🔍 Buscando agenda semanal para studentId:', studentData.id);
    }
    if (error) {
      console.error('❌ Erro ao carregar agenda semanal:', error);
    }
    if (weekData) {
      console.log('✅ Dados da agenda carregados:', weekData);
    }
  }, [studentData?.id, error, weekData]);

  const primaryColor = schoolConfigData?.config?.primaryColor || '#B85C38';

  if (!studentData?.id) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Carregando perfil do estudante...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">Agenda da Semana</h1>
      </div>
      
      <WeekAgenda 
        weekData={weekData?.weekData || []}
        studentId={studentData.id}
        primaryColor={primaryColor}
        isLoading={isLoading}
      />
    </div>
  );
}