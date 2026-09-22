import { useEffect } from 'react';
import { WeekAgenda } from '@/components/student/WeekAgenda';
import { useAuth } from '@/hooks/use-auth';
import { useGuardian } from '@/contexts/guardian-context';
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
  const { isGuardianMode, activeStudent } = useGuardian();
  const isViewingManagedStudent = isGuardianMode && !!activeStudent;

  const profileQueryKey = isViewingManagedStudent
    ? [`/api/student/profile/${activeStudent.userId}`]
    : ['/api/student/profile'];

  const { data: profileRaw } = useQuery<StudentProfile | { student: StudentProfile }>({
    queryKey: profileQueryKey,
    enabled: isViewingManagedStudent ? !!activeStudent?.userId : !!user?.id,
  });

  const studentData = isViewingManagedStudent
    ? (profileRaw as { student?: StudentProfile } | undefined)?.student
    : profileRaw as StudentProfile | undefined;

  const { data: schoolConfigData } = useQuery<{ config: SchoolConfig }>({
    queryKey: ['/api/school-config'],
    enabled: !!user?.id,
  });

  const { data: weekData, isLoading, error } = useQuery<WeekDataResponse>({
    queryKey: [`/api/students/${studentData?.id}/classes/week`],
    enabled: !!studentData?.id,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 1,
  });

  useEffect(() => {
    if (studentData?.id) {
      console.log('Buscando agenda semanal para studentId:', studentData.id);
    }
    if (error) {
      console.error('Erro ao carregar agenda semanal:', error);
    }
  }, [studentData?.id, error, weekData]);

  if (!studentData?.id) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="text-center py-8">
          <div className="animate-pulse flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/20"></div>
            <div className="h-4 w-48 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-muted/20 font-inter -mx-3 -mt-3 px-3 pb-32 pt-3 md:mx-0 md:mt-0 md:px-0 md:pb-8 md:pt-0">
      <div className="mx-auto max-w-2xl">
        <WeekAgenda
          weekData={weekData?.weekData || []}
          studentId={studentData.id}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
