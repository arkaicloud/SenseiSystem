import { useEffect } from 'react';
import { WeekAgenda } from '@/components/student/WeekAgenda';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import type { SchoolConfig } from '@shared/schema';
import bannerImg from '@assets/two-judo-wrestlers-showing-their-technical-skills-fight-club_1773070189916.jpg';

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

  const primaryColor = '#2B54FF';

  if (!studentData?.id) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="text-center py-8">
          <div className="animate-pulse flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#2B54FF]/20"></div>
            <div className="h-4 w-48 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="font-inter -mx-3 -mt-3 md:mx-0 md:mt-0">
      <div className="vyta-hero h-[180px] md:rounded-2xl">
        <img
          src={bannerImg}
          alt="Jiu-Jitsu Training"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="vyta-hero-gradient" />
        <div className="vyta-hero-content flex flex-col justify-end h-full p-5 pb-5">
          <span className="vyta-pill mb-2 w-fit">Sua Semana</span>
          <h1 className="text-[26px] font-bold text-white leading-[32px] font-inter">
            Agenda Semanal
          </h1>
          <p className="text-[14px] text-white/70 font-inter mt-1">
            Confirme sua presenca nas aulas
          </p>
        </div>
      </div>

      <div className="px-4 pt-6 pb-24 md:px-6">
        <WeekAgenda
          weekData={weekData?.weekData || []}
          studentId={studentData.id}
          primaryColor={primaryColor}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
