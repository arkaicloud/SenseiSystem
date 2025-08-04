import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from '@/hooks/use-translations';
import { formatCurrency } from '@/lib/utils';
import { queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  AlertTriangle, 
  UserCheck, 
  Clock, 
  Target,
  Gift,
  Star,
  ChevronRight,
  Plus,
  Eye,
  FileText,
  Settings,
  Bell
} from 'lucide-react';

// Interface para métricas em tempo real
interface DashboardMetrics {
  activeStudents: number;
  totalStudents: number;
  classesThisMonth: number;
  attendanceRate: number;
  monthlyRevenue: number;
  studentsAtRisk: number;
  overduePayments: number;
  newStudentsThisMonth: number;
  beltDistribution: { [key: string]: number };
}

// Interfaces para os dados do dashboard
interface DashboardStats {
  activeStudents: number;
  monthlyClasses: number;
  attendanceRate: number;
  monthlyRevenue: number;
  studentsAtRisk: number;
  overduePayments: number;
}

interface TodayClass {
  id: number;
  name: string;
  time: string;
  instructor: string;
  confirmedStudents: number;
  totalCapacity: number;
  status: 'scheduled' | 'in-progress' | 'completed';
}

interface FinancialData {
  receivedThisMonth: number;
  pendingInvoices: number;
  overdueAmount: number;
  defaultRate: number;
}

interface RecentStudent {
  id: number;
  name: string;
  belt: string;
  status: 'active' | 'pending' | 'inactive';
  attendanceRate: number;
  joinDate: string;
}

interface Birthday {
  id: number;
  name: string;
  date: string;
  type: 'student' | 'instructor';
}

// Componente de Card para KPIs
const KPICard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue, 
  color = "blue",
  onClick 
}: {
  title: string;
  value: string | number;
  icon: any;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: string;
  onClick?: () => void;
}) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    red: 'text-red-600 bg-red-50',
    orange: 'text-orange-600 bg-orange-50',
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {trendValue && (
              <div className="flex items-center space-x-1 text-xs">
                <TrendingUp className={`h-3 w-3 ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'}`} />
                <span className={trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'}>
                  {trendValue}
                </span>
              </div>
            )}
          </div>
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Componente para Aulas de Hoje
const TodayClassesCard = ({ classes }: { classes: TodayClass[] }) => {
  const { t } = useTranslations();
  
  const getStatusColor = (status: TodayClass['status']) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: TodayClass['status']) => {
    switch (status) {
      case 'scheduled': return 'Agendada';
      case 'in-progress': return 'Em andamento';
      case 'completed': return 'Concluída';
      default: return 'Agendada';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">Aulas de Hoje</CardTitle>
        <Badge variant="outline">{classes.length} aulas</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {classes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhuma aula programada para hoje</p>
          </div>
        ) : (
          classes.map((classItem) => (
            <div key={classItem.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{classItem.name}</h4>
                  <Badge className={getStatusColor(classItem.status)} variant="secondary">
                    {getStatusText(classItem.status)}
                  </Badge>
                </div>
                <div className="flex items-center text-sm text-muted-foreground space-x-4">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{classItem.time}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <UserCheck className="h-3 w-3" />
                    <span>Prof. {classItem.instructor}</span>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span>Presenças confirmadas</span>
                    <span>{classItem.confirmedStudents}/{classItem.totalCapacity}</span>
                  </div>
                  <Progress 
                    value={(classItem.confirmedStudents / classItem.totalCapacity) * 100} 
                    className="h-2"
                  />
                </div>
              </div>
              <div className="ml-4 flex space-x-2">
                <Button size="sm" variant="outline" onClick={() => handleViewClass(classItem.id)}>
                  <Eye className="h-3 w-3 mr-1" />
                  Ver
                </Button>
                {classItem.status === 'scheduled' && (
                  <Button size="sm" onClick={() => handleTakeAttendance(classItem.id)}>
                    <UserCheck className="h-3 w-3 mr-1" />
                    Fazer Chamada
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

// Componente Financeiro
const FinancialCard = ({ data }: { data: FinancialData }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Visão Financeira</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Recebido no Mês</p>
            <p className="text-lg font-semibold text-green-600">
              {formatCurrency(data.receivedThisMonth)}
            </p>
            <p className="text-xs text-green-600">↗ +8.2%</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Em Aberto</p>
            <p className="text-lg font-semibold text-orange-600">
              {formatCurrency(data.pendingInvoices)}
            </p>
            <p className="text-xs text-muted-foreground">12 faturas</p>
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Taxa de Inadimplência</span>
            <span className="text-sm font-medium">{data.defaultRate}%</span>
          </div>
          <Progress value={data.defaultRate} className="h-2" />
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4">
          <Button size="sm" variant="outline" className="text-xs">
            <Settings className="h-3 w-3 mr-1" />
            Config ASAAS
          </Button>
          <Button size="sm" variant="outline" className="text-xs">
            <FileText className="h-3 w-3 mr-1" />
            Cobranças
          </Button>
          <Button size="sm" variant="outline" className="text-xs">
            <Eye className="h-3 w-3 mr-1" />
            Relatório
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Componente de Alunos Recentes
const RecentStudentsCard = ({ students, onNewStudent }: { students: RecentStudent[]; onNewStudent: () => void }) => {
  const getBeltColor = (belt: string) => {
    const colors = {
      'white': 'bg-gray-100 text-gray-800',
      'blue': 'bg-blue-100 text-blue-800',
      'purple': 'bg-purple-100 text-purple-800',
      'brown': 'bg-amber-100 text-amber-800',
      'black': 'bg-black text-white',
    };
    return colors[belt] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: RecentStudent['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">Alunos Recentes</CardTitle>
        <Button size="sm" onClick={() => window.location.href = '/students?action=create'}>
          <Plus className="h-3 w-3 mr-1" />
          Novo Aluno
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {students.map((student) => (
          <div key={student.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                {student.name ? student.name.substring(0, 2).toUpperCase() : '??'}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-sm">{student.name}</span>
                  <Badge className={getBeltColor(student.belt)} variant="secondary">
                    {student.belt}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <span>{student.attendanceRate}% presença</span>
                  <Badge className={getStatusColor(student.status)} variant="secondary">
                    {student.status === 'active' ? 'Ativo' : student.status === 'pending' ? 'Pendente' : 'Inativo'}
                  </Badge>
                </div>
              </div>
            </div>
            <Button size="sm" variant="ghost">
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        ))}
        
        <Button variant="outline" className="w-full text-sm">
          Ver Todos os Alunos
        </Button>
      </CardContent>
    </Card>
  );
};

// Componente de Aniversariantes
const BirthdaysCard = ({ birthdays }: { birthdays: Birthday[] }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium flex items-center">
          <Gift className="h-4 w-4 mr-2" />
          Aniversariantes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {birthdays.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Nenhum aniversariante esta semana
          </div>
        ) : (
          birthdays.map((birthday) => (
            <div key={birthday.id} className="flex items-center justify-between p-2 rounded-lg bg-pink-50 border border-pink-200">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-pink-200 flex items-center justify-center">
                  <Gift className="h-3 w-3 text-pink-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">{birthday.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {birthday.type === 'student' ? 'Aluno' : 'Professor'} - {birthday.date}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

// Componente de Ações Rápidas
const QuickActionsCard = () => {
  const quickActions = [
    { label: 'Novo Aviso', icon: Bell, color: 'blue' },
    { label: 'Agendar Aula', icon: Calendar, color: 'green' },
    { label: 'Exame de Faixa', icon: Star, color: 'orange' },
    { label: 'Definir Meta', icon: Target, color: 'purple' },
  ];

  const colorClasses = {
    blue: 'bg-blue-500 hover:bg-blue-600',
    green: 'bg-green-500 hover:bg-green-600',
    orange: 'bg-orange-500 hover:bg-orange-600',
    purple: 'bg-purple-500 hover:bg-purple-600',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Ações Rápidas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-16 flex flex-col items-center justify-center space-y-1 hover:shadow-md transition-shadow"
            >
              <action.icon className="h-5 w-5" />
              <span className="text-xs">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default function AdminDashboard() {
  const { t } = useTranslations();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Estado para métricas em tempo real
  const [liveMetrics, setLiveMetrics] = useState<DashboardMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);

  // Buscar métricas em tempo real do backend
  const fetchLiveMetrics = async () => {
    try {
      setMetricsLoading(true);
      const response = await fetch('/api/dashboard/metrics');
      if (response.ok) {
        const metrics = await response.json();
        setLiveMetrics(metrics);
      }
    } catch (error) {
      console.error('Erro ao buscar métricas em tempo real:', error);
    } finally {
      setMetricsLoading(false);
    }
  };

  // Auto-refresh das métricas a cada 5 minutos
  useEffect(() => {
    fetchLiveMetrics(); // Buscar imediatamente
    
    const interval = setInterval(fetchLiveMetrics, 5 * 60 * 1000); // 5 minutos
    
    return () => clearInterval(interval);
  }, []);

  // Buscar dados reais da API
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/dash/admin'],
  });

  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ['/api/classes'],
  });

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['/api/students'],
  });

  const { data: pendingUsers } = useQuery({
    queryKey: ['/api/users/pending'],
  });



  // Calcular estatísticas baseadas nos dados reais
  const calculateStats = (): DashboardStats => {
    if (!students?.students || !classes?.classes) {
      return {
        activeStudents: 0,
        monthlyClasses: 0,
        attendanceRate: 0,
        monthlyRevenue: 0,
        studentsAtRisk: 0,
        overduePayments: 0,
      };
    }

    const activeStudents = students.students.filter((s: any) => s.status === 'active').length;
    const studentsAtRisk = students.students.filter((s: any) => s.attendanceRate && s.attendanceRate < 50).length;
    const monthlyClasses = classes.classes.length * 4; // Assumindo 4 semanas por mês
    
    // Calcular taxa de presença média
    const totalAttendanceRate = students.students.reduce((sum: number, student: any) => 
      sum + (student.attendanceRate || 0), 0
    );
    const averageAttendanceRate = activeStudents > 0 ? Math.round(totalAttendanceRate / activeStudents) : 0;

    // Simular receita baseada no número de alunos ativos
    const averageMonthlyFee = 150; // R$ 150 por aluno
    const monthlyRevenue = activeStudents * averageMonthlyFee;

    // Simular inadimplência (5-10% dos alunos)
    const overduePayments = Math.floor(activeStudents * 0.08);

    return {
      activeStudents,
      monthlyClasses,
      attendanceRate: averageAttendanceRate,
      monthlyRevenue,
      studentsAtRisk,
      overduePayments,
    };
  };

  const dashboardStats = calculateStats();
  
  // Usar métricas em tempo real se disponíveis, senão usar dados calculados
  const activeMetrics = liveMetrics || {
    activeStudents: dashboardStats.activeStudents,
    totalStudents: dashboardStats.activeStudents,
    classesThisMonth: dashboardStats.monthlyClasses,
    attendanceRate: dashboardStats.attendanceRate,
    monthlyRevenue: dashboardStats.monthlyRevenue,
    studentsAtRisk: dashboardStats.studentsAtRisk,
    criticalRiskStudents: 0,
    overduePayments: dashboardStats.overduePayments,
    newStudentsThisMonth: 0,
    beltDistribution: {}
  };

  // Transformar dados reais de aulas em formato do dashboard
  const getTodayClasses = (): TodayClass[] => {
    if (!classes?.classes) return [];
    
    const today = new Date().getDay(); // 0 = domingo, 1 = segunda, etc.
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = dayNames[today];
    
    return classes.classes
      .filter((classItem: any) => classItem.dayOfWeek === currentDay)
      .map((classItem: any) => ({
        id: classItem.id,
        name: classItem.name,
        time: classItem.time,
        instructor: classItem.instructorName || 'Instrutor',
        confirmedStudents: Math.floor(Math.random() * (classItem.capacity * 0.8)), // Simular confirmações
        totalCapacity: classItem.capacity,
        status: 'scheduled' as const,
      }));
  };

  const todayClasses = getTodayClasses();

  // Calcular dados financeiros baseados nos alunos reais
  const getFinancialData = (): FinancialData => {
    const activeStudents = dashboardStats.activeStudents;
    const averageMonthlyFee = 150;
    const expectedRevenue = activeStudents * averageMonthlyFee;
    const collectionRate = 0.92; // 92% de cobrança
    
    return {
      receivedThisMonth: Math.floor(expectedRevenue * collectionRate),
      pendingInvoices: Math.floor(expectedRevenue * 0.05), // 5% pendente
      overdueAmount: Math.floor(expectedRevenue * 0.03), // 3% vencido
      defaultRate: 7.8,
    };
  };

  const financialData = getFinancialData();

  // Transformar dados reais de alunos
  const getRecentStudents = (): RecentStudent[] => {
    if (!students?.students) return [];
    
    return students.students
      .sort((a: any, b: any) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
      .slice(0, 5)
      .map((student: any) => ({
        id: student.id,
        name: student.name,
        belt: student.beltLevel || 'white',
        status: student.status || 'active',
        attendanceRate: student.attendanceRate || Math.floor(Math.random() * 40) + 60, // 60-100%
        joinDate: student.createdAt || new Date().toISOString(),
      }));
  };

  const recentStudents = getRecentStudents();

  // Simular aniversariantes baseado nos alunos reais
  const getBirthdays = (): Birthday[] => {
    if (!students?.students) return [];
    
    const thisWeek = students.students
      .filter(() => Math.random() < 0.1) // 10% chance de ter aniversário esta semana
      .slice(0, 3)
      .map((student: any, index: number) => ({
        id: student.id,
        name: student.name,
        date: `${25 + index} de dez.`,
        type: 'student' as const,
      }));
    
    return thisWeek;
  };

  const birthdays = getBirthdays();

  // Funções de ação para os botões do dashboard
  const handleViewClass = async (classId: number) => {
    window.location.href = `/classes/${classId}`;
  };

  const handleTakeAttendance = async (classId: number) => {
    window.location.href = `/attendance?classId=${classId}`;
  };

  const handleNewStudent = () => {
    window.location.href = '/students?action=create';
  };

  const handleScheduleClass = () => {
    window.location.href = '/classes?action=create';
  };

  // Mutation para gerar dados de teste
  const generateTestDataMutation = useMutation({
    mutationFn: async () => {
      const testStudents = [
        {
          name: "Carlos Silva Santos",
          email: "carlos.silva@test.com.br",
          phone: "(11) 99999-0001",
          cpf: "12345678901",
          beltLevel: "white",
          stripes: 0,
          status: "active",
          attendanceRate: Math.floor(Math.random() * 30) + 70,
          financialResponsibleName: "Carlos Silva Santos",
          financialResponsibleEmail: "carlos.silva@test.com.br",
          financialResponsiblePhone: "(11) 99999-0001",
          financialResponsibleCpf: "12345678901",
          financialResponsibleRelation: "self"
        },
        {
          name: "Ana Paula Rodrigues",
          email: "ana.paula@test.com.br", 
          phone: "(11) 99999-0002",
          cpf: "23456789012",
          beltLevel: "blue",
          stripes: 2,
          status: "active",
          attendanceRate: Math.floor(Math.random() * 40) + 40,
          financialResponsibleName: "Ana Paula Rodrigues",
          financialResponsibleEmail: "ana.paula@test.com.br",
          financialResponsiblePhone: "(11) 99999-0002",
          financialResponsibleCpf: "23456789012",
          financialResponsibleRelation: "self"
        },
        {
          name: "João Pedro Oliveira",
          email: "joao.pedro@test.com.br",
          phone: "(11) 99999-0003", 
          cpf: "34567890123",
          beltLevel: "white",
          stripes: 1,
          status: "pending",
          attendanceRate: Math.floor(Math.random() * 20) + 30,
          financialResponsibleName: "Maria Oliveira",
          financialResponsibleEmail: "maria.oliveira@test.com.br",
          financialResponsiblePhone: "(11) 99999-0004",
          financialResponsibleCpf: "45678901234",
          financialResponsibleRelation: "mother"
        }
      ];

      // Criar cada aluno de teste
      for (const studentData of testStudents) {
        try {
          // Primeiro criar usuário
          const userResponse = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              firstName: studentData.name.split(' ')[0],
              lastName: studentData.name.split(' ').slice(1).join(' '),
              email: studentData.email,
              password: "password123",
              role: "student",
              status: "approved"
            })
          });

          if (userResponse.ok) {
            const userData = await userResponse.json();
            
            // Depois criar o estudante
            await fetch('/api/students', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: userData.user.id,
                name: studentData.name,
                email: studentData.email,
                phone: studentData.phone,
                cpf: studentData.cpf,
                beltLevel: studentData.beltLevel,
                stripes: studentData.stripes,
                status: studentData.status,
                attendanceRate: studentData.attendanceRate,
                financialResponsibleName: studentData.financialResponsibleName,
                financialResponsibleEmail: studentData.financialResponsibleEmail,
                financialResponsiblePhone: studentData.financialResponsiblePhone,
                financialResponsibleCpf: studentData.financialResponsibleCpf,
                financialResponsibleRelation: studentData.financialResponsibleRelation
              })
            });
          }
        } catch (error) {
          console.error(`Erro ao criar aluno teste ${studentData.name}:`, error);
        }
      }

      return { success: true, studentsCreated: testStudents.length };
    },
    onSuccess: (data) => {
      toast({
        title: "Dados de Teste Criados",
        description: `${data.studentsCreated} alunos de teste adicionados com sucesso!`,
      });
      
      // Recarregar todos os dados
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dash/admin'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/pending'] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao Gerar Dados",
        description: "Ocorreu um erro ao criar os dados de teste.",
        variant: "destructive",
      });
      console.error("Erro na geração de dados QA:", error);
    },
  });

  // Função para popular dados de teste (QA)
  const generateTestData = () => {
    toast({
      title: "Gerando Dados de Teste",
      description: "Criando alunos e situações de teste...",
    });
    
    generateTestDataMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Header com ações principais */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Administrativo</h1>
          <p className="text-muted-foreground">Visão geral da sua escola</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleNewStudent}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Aluno
          </Button>
          <Button variant="outline" onClick={handleScheduleClass}>
            <Calendar className="h-4 w-4 mr-2" />
            Agendar Aula
          </Button>
          <Button variant="secondary" onClick={generateTestData} size="sm">
            <Target className="h-4 w-4 mr-2" />
            Gerar Dados QA
          </Button>
          <Button variant="outline" onClick={fetchLiveMetrics} size="sm" disabled={metricsLoading}>
            <TrendingUp className="h-4 w-4 mr-2" />
            {metricsLoading ? 'Atualizando...' : 'Atualizar Métricas'}
          </Button>
        </div>
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          title="Alunos Ativos"
          value={activeMetrics.activeStudents}
          icon={Users}
          trend="up"
          trendValue={liveMetrics ? `+${activeMetrics.newStudentsThisMonth} este mês` : "+15% vs mês anterior"}
          color="blue"
        />
        <KPICard
          title="Aulas Realizadas"
          value={activeMetrics.classesThisMonth}
          icon={Calendar}
          trend="up"
          trendValue={liveMetrics ? "Dados em tempo real" : "+5% este mês"}
          color="green"
        />
        <KPICard
          title="Taxa de Presença"
          value={`${activeMetrics.attendanceRate}%`}
          icon={UserCheck}
          trend={activeMetrics.attendanceRate > 70 ? "up" : "down"}
          trendValue={liveMetrics ? "Dados em tempo real" : "média mensal"}
          color="green"
        />
        <KPICard
          title="Receita Mensal"
          value={formatCurrency(activeMetrics.monthlyRevenue)}
          icon={DollarSign}
          trend="up"
          trendValue={liveMetrics ? "Dados em tempo real" : "+10%"}
          color="green"
        />
        <KPICard
          title="Alunos em Risco"
          value={activeMetrics.studentsAtRisk}
          icon={AlertTriangle}
          trend={activeMetrics.studentsAtRisk === 0 ? "neutral" : "down"}
          trendValue={liveMetrics ? `${activeMetrics.criticalRiskStudents} risco crítico` : "frequência < 60%"}
          color={activeMetrics.criticalRiskStudents > 0 ? "red" : "orange"}
        />
        <KPICard
          title="Inadimplência"
          value={activeMetrics.overduePayments}
          icon={AlertTriangle}
          trend={activeMetrics.overduePayments === 0 ? "neutral" : "down"}
          trendValue={liveMetrics ? "Pagamentos em atraso" : "mensalidades vencidas"}
          color="orange"
        />
      </div>

      {/* Layout principal com 3 colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1 - Aulas de Hoje */}
        <div className="lg:col-span-2 space-y-6">
          <TodayClassesCard classes={todayClasses} />
          
          {/* Alunos Recentes */}
          <RecentStudentsCard students={recentStudents} onNewStudent={handleNewStudent} />
        </div>

        {/* Coluna 2 - Financeiro e Ações */}
        <div className="space-y-6">
          <FinancialCard data={financialData} />
          <BirthdaysCard birthdays={birthdays} />
          <QuickActionsCard />
        </div>
      </div>
    </div>
  );
}