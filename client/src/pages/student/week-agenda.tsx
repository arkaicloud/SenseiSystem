import { WeekAgenda } from '@/components/student/WeekAgenda';
import { useAuth } from '@/hooks/use-auth';
import MainLayout from '@/components/layouts/MainLayout';
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
    <MainLayout>
      <div className="p-6">
        <WeekAgenda 
          studentId={studentData?.id || 0}
          primaryColor={primaryColor}
          showHeader={true}
        />
      </div>
    </MainLayout>
  );
}