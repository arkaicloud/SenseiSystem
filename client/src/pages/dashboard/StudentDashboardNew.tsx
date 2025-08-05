import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { formatDate, getBeltColor } from '@/lib/utils';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { StudentGreeting } from '@/components/student/StudentGreeting';
import { SchoolNotices } from '@/components/student/SchoolNotices';
import { TodayClasses } from '@/components/student/TodayClasses';
import { MonthlyAttendance } from '@/components/student/MonthlyAttendance';
import { FinancialStatus } from '@/components/student/FinancialStatus';
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
      const response = await fetch(`/api/classes/${classId}/confirm-attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to confirm attendance');
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
          {/* Greeting Section */}
          <StudentGreeting 
            studentName={student.name}
            currentBelt={student.currentBelt}
            primaryColor={primaryColor}
          />

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <TodayClasses 
                classes={classes}
                onCheckIn={handleCheckIn}
                primaryColor={primaryColor}
                isLoading={isClassesLoading}
              />
              
              <SchoolNotices 
                notices={notices} 
                primaryColor={primaryColor}
                isLoading={isEventsLoading}
              />
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              <MonthlyAttendance 
                attendedClasses={attendance.attendedClasses}
                totalClasses={attendance.totalClasses}
                currentMonth={attendance.currentMonth}
                primaryColor={primaryColor}
                isLoading={isAttendanceLoading}
              />

              <FinancialStatus 
                invoices={invoices}
                isFinancialResponsible={student.isFinancialResponsible}
                primaryColor={primaryColor}
                isLoading={isFinancialLoading}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}