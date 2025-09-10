import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { formatDate, getBeltColor } from '@/lib/utils';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { StudentGreeting } from '@/components/student/StudentGreeting';
import { TodayClasses } from '@/components/student/TodayClasses';
import { WeekAgenda } from '@/components/student/WeekAgenda';
import { FrequencyMetrics } from '@/components/student/FrequencyMetrics';
import { NoticesBlock } from '@/components/student/NoticesBlock';
import { useBeltLevels } from '@/hooks/useBeltLevels';

interface StudentDashboardProps {
  student: {
    name: string;
    currentBelt: {
      name: string;
      color: string;
      promotionDate: string;
    };
    isFinancialResponsible: boolean;
  };
  notices: Array<{
    id: string;
    title: string;
    description: string;
    date: string;
    type: "event" | "announcement" | "promotion" | "class";
  }>;
  todayClasses: Array<{
    id: number;
    name: string;
    startTime: string;
    endTime?: string;
    instructorName?: string;
    location?: string;
    attendanceConfirmed: boolean;
  }>;
  attendance: {
    attendedClasses: number;
    totalClasses: number;
    currentMonth: string;
  };
  invoices: Array<{
    id: string;
    amount: number;
    dueDate: string;
    description: string;
    status: "pending" | "overdue" | "paid";
    paymentUrl?: string;
  }>;
}

export default function StudentDashboardNew() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Get belt levels hook at the top to maintain hook order
  const { getBeltName, getBeltColor } = useBeltLevels();
  
  // Get school configuration for colors
  const { data: schoolConfig } = useQuery({
    queryKey: ['/api/school-config'],
  });
  
  // Get student data
  const { data: studentData, isLoading: isStudentLoading } = useQuery({
    queryKey: ['/api/student/profile'],
    enabled: !!user?.id && user?.role === 'student',
  });
  
  // Get today's classes
  const { data: todayClasses, isLoading: isClassesLoading } = useQuery({
    queryKey: ['/api/classes/today'],
    enabled: !!user?.id && user?.role === 'student',
  });
  
  // Get school events
  const { data: schoolEvents, isLoading: isEventsLoading } = useQuery({
    queryKey: ['/api/school-events'],
    enabled: !!user?.id && user?.role === 'student',
  });
  
  // Get attendance count for current month
  const { data: attendanceData, isLoading: isAttendanceLoading } = useQuery({
    queryKey: ['/api/student/attendance-current-month'],
    enabled: !!user?.id && user?.role === 'student',
  });

  // Get financial data
  const { data: financialData, isLoading: isFinancialLoading } = useQuery({
    queryKey: ['/api/student/financial'],
    enabled: !!user?.id && user?.role === 'student',
    retry: false,
  });
  
  // Confirm attendance mutation
  const confirmAttendanceMutation = useMutation({
    mutationFn: async (classId: number) => {
      const response = await apiRequest('POST', '/api/attendance/confirm', {
        classId: classId,
        date: new Date().toISOString().split('T')[0]
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao confirmar presença');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Presença confirmada!",
        description: "Sua presença foi confirmada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/classes/today'] });
      queryClient.invalidateQueries({ queryKey: ['/api/student/attendance-current-month'] });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/by-student', user?.id] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível confirmar a presença.",
        variant: "destructive",
      });
    },
  });
  
  const handleCheckIn = (classId: number) => {
    confirmAttendanceMutation.mutate(classId);
  };
  
  if (isStudentLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gray-50">
        <div className="text-gray-600">Carregando...</div>
      </div>
    );
  }
  
  // Get colors from school config or use defaults
  const primaryColor = schoolConfig?.config?.primaryColor || '#B85C38';
  const secondaryColor = schoolConfig?.config?.secondaryColor || '#D97659';
  
  // Get belt information
  const beltLevel = studentData?.beltLevel || 'white';
  const beltName = getBeltName(beltLevel);
  const beltColorCode = getBeltColor(beltLevel);
  
  const studentName = user ? `${user.firstName} ${user.lastName}` : 'Aluno';
  const currentDate = new Date();
  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const totalAttendances = attendanceData?.attendanceCount || 0;
  const availableClasses = attendanceData?.totalClasses || 16;
  
  // Prepare data for components
  const student = {
    name: studentName,
    currentBelt: {
      name: beltName,
      color: beltLevel,
      promotionDate: formatDate(new Date())
    },
    isFinancialResponsible: financialData?.isFinancialResponsible || false
  };

  const notices = schoolEvents?.events?.map((event: any) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    date: event.date,
    type: "event" as const
  })) || [];

  const classes = todayClasses?.classes || [];

  const attendance = {
    attendedClasses: totalAttendances,
    totalClasses: availableClasses,
    currentMonth: monthName.split(' ')[0]
  };

  // Prepare invoices from financial data
  const invoices = financialData?.localPayments?.map((payment: any) => ({
    id: payment.id.toString(),
    amount: payment.amount,
    dueDate: payment.dueDate ? formatDate(new Date(payment.dueDate)) : '',
    description: payment.description || 'Mensalidade',
    status: payment.status,
    paymentUrl: payment.paymentUrl
  })) || [];

  return (
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
              Painel do Aluno
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Saudação Topo */}
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center gap-4">
              <div className="text-4xl">👋</div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Olá, {user?.firstName}!
                </h1>
                <div className="flex items-center gap-4 mt-1">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: beltColorCode }}
                    />
                    <span className="text-gray-600">{beltName}</span>
                  </div>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600">
                    Desde {studentData?.enrollmentDate ? 
                      new Date(studentData.enrollmentDate).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) :
                      'este mês'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bloco 1: Aulas de Hoje */}
          <TodayClasses 
            classes={classes}
            onCheckIn={handleCheckIn}
            primaryColor={primaryColor}
            isLoading={isClassesLoading}
          />

          {/* Bloco 2: Agenda da Semana - Oculto no mobile e tablet (disponível via bottom nav) */}
          <div className="hidden lg:block">
            <WeekAgenda 
              studentId={studentData?.id || 0}
              primaryColor={primaryColor}
              showHeader={true}
            />
          </div>

          {/* Grid para Frequência e Avisos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bloco 3: Frequência/Métricas */}
            <FrequencyMetrics 
              studentId={studentData?.id || 0}
              primaryColor={primaryColor}
            />

            {/* Bloco 4: Avisos & Eventos */}
            <NoticesBlock 
              studentId={studentData?.id || 0}
            />
          </div>
        </div>
      </div>
    </div>
  );
}