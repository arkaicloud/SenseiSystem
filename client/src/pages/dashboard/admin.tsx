import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
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
                <Button size="sm" variant="outline">
                  <Eye className="h-3 w-3 mr-1" />
                  Ver
                </Button>
                {classItem.status === 'scheduled' && (
                  <Button size="sm">
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
const RecentStudentsCard = ({ students }: { students: RecentStudent[] }) => {
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
        <Button size="sm">
          <Plus className="h-3 w-3 mr-1" />
          Novo Aluno
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {students.map((student) => (
          <div key={student.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                {student.name.substring(0, 2).toUpperCase()}
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

  // Buscar dados reais da API
  const { data: stats } = useQuery({
    queryKey: ['/api/dash/admin'],
  });

  const { data: classes } = useQuery({
    queryKey: ['/api/classes'],
  });

  const { data: students } = useQuery({
    queryKey: ['/api/students'],
  });

  // Dados mockados para demonstração (substituir por dados reais da API)
  const dashboardStats: DashboardStats = {
    activeStudents: stats?.totalActiveStudents || 247,
    monthlyClasses: 89,
    attendanceRate: 87,
    monthlyRevenue: 42350,
    studentsAtRisk: 8,
    overduePayments: 12,
  };

  const todayClasses: TodayClass[] = [
    {
      id: 1,
      name: 'Jiu-Jitsu Iniciante',
      time: '18:30',
      instructor: 'João Silva',
      confirmedStudents: 14,
      totalCapacity: 20,
      status: 'scheduled',
    },
    {
      id: 2,
      name: 'Jiu-Jitsu Avançado',
      time: '19:30',
      instructor: 'Marcos Santos',
      confirmedStudents: 12,
      totalCapacity: 15,
      status: 'in-progress',
    },
  ];

  const financialData: FinancialData = {
    receivedThisMonth: 39110,
    pendingInvoices: 5690,
    overdueAmount: 3240,
    defaultRate: 7.8,
  };

  const recentStudents: RecentStudent[] = [
    {
      id: 1,
      name: 'Pedro Henrique',
      belt: 'white',
      status: 'active',
      attendanceRate: 95,
      joinDate: '2024-01-15',
    },
    {
      id: 2,
      name: 'Júlia Santos',
      belt: 'blue',
      status: 'active',
      attendanceRate: 87,
      joinDate: '2024-01-20',
    },
    {
      id: 3,
      name: 'Roberto Silva',
      belt: 'white',
      status: 'pending',
      attendanceRate: 45,
      joinDate: '2024-02-01',
    },
  ];

  const birthdays: Birthday[] = [
    {
      id: 1,
      name: 'Carlos Silva',
      date: '27 de dez.',
      type: 'student',
    },
    {
      id: 2,
      name: 'Prof. João Santos',
      date: '29 de dez.',
      type: 'instructor',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header com ações principais */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Administrativo</h1>
          <p className="text-muted-foreground">Visão geral da sua escola</p>
        </div>
        <div className="flex space-x-2">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Aluno
          </Button>
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Agendar Aula
          </Button>
        </div>
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          title="Alunos Ativos"
          value={dashboardStats.activeStudents}
          icon={Users}
          trend="up"
          trendValue="+15% vs mês anterior"
          color="blue"
        />
        <KPICard
          title="Aulas Realizadas"
          value={dashboardStats.monthlyClasses}
          icon={Calendar}
          trend="up"
          trendValue="+5% este mês"
          color="green"
        />
        <KPICard
          title="Taxa de Presença"
          value={`${dashboardStats.attendanceRate}%`}
          icon={UserCheck}
          trend="up"
          trendValue="média mensal"
          color="green"
        />
        <KPICard
          title="Receita Mensal"
          value={formatCurrency(dashboardStats.monthlyRevenue)}
          icon={DollarSign}
          trend="up"
          trendValue="+10%"
          color="green"
        />
        <KPICard
          title="Alunos em Risco"
          value={dashboardStats.studentsAtRisk}
          icon={AlertTriangle}
          trend="down"
          trendValue="frequência < 50%"
          color="red"
        />
        <KPICard
          title="Inadimplência"
          value={dashboardStats.overduePayments}
          icon={AlertTriangle}
          trend="neutral"
          trendValue="mensalidades vencidas"
          color="orange"
        />
      </div>

      {/* Layout principal com 3 colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1 - Aulas de Hoje */}
        <div className="lg:col-span-2 space-y-6">
          <TodayClassesCard classes={todayClasses} />
          
          {/* Alunos Recentes */}
          <RecentStudentsCard students={recentStudents} />
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