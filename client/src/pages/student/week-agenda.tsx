import { WeekAgenda } from '@/components/student/WeekAgenda';
import { useAuth } from '@/hooks/use-auth';
import { MainLayout } from '@/components/layouts/MainLayout';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

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

  const { data: schoolConfig } = useQuery({
    queryKey: ['/api/school-config'],
    enabled: !!user?.id,
  });

  const primaryColor = schoolConfig?.config?.primaryColor || '#B85C38';

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Agenda da Semana
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Visualize suas aulas e compromissos da semana
          </p>
        </div>
        
        <WeekAgenda 
          studentId={studentData?.id || 0}
          primaryColor={primaryColor}
        />
      </div>
    </MainLayout>
  );
}