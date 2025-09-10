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
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: primaryColor }}
                >
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900">SenseiSystem</h1>
              </div>
              <div className="text-sm text-gray-500">
                Agenda da Semana
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="space-y-6">
            <WeekAgenda 
              studentId={studentData?.id || 0}
              primaryColor={primaryColor}
              showHeader={true}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}