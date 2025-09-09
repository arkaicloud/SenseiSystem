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
import { useDashboard } from '@/hooks/useDashboard';
import { currencyBRL } from '@/utils/fmt';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  AlertTriangle, 
  UserCheck, 
  Clock, 
  Gift,
  Star,
  ChevronRight,
  Plus,
  Eye,
  FileText,
  Settings,
  RefreshCw,
  CalendarCheck
} from 'lucide-react';
import BeltSummaryWidget from '@/components/dashboard/BeltSummaryWidget';
import BeltSummaryAdultWidget from '@/components/dashboard/BeltSummaryAdultWidget';
import BeltSummaryChildWidget from '@/components/dashboard/BeltSummaryChildWidget';
import { FinancialCard } from '@/components/dashboard/FinancialCard';
import PendingApprovalsWidget from '@/components/admin/PendingApprovalsWidget';

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



// Dashboard Skeleton - Componente de loading
const DashboardSkeleton = () => (
  <div className="space-y-6">
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  </div>
);

// Card de estatística
const StatCard = ({ title, value, icon: Icon, variant }: {
  title: string;
  value: string | number;
  icon: any;
  variant?: 'default' | 'success' | 'danger';
}) => {
  const variantClasses = {
    default: 'text-blue-600 bg-blue-50',
    success: 'text-green-600 bg-green-50',
    danger: 'text-red-600 bg-red-50'
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={`p-2 rounded-lg ${variantClasses[variant || 'default']}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Componente Empty State
const EmptyState = ({ icon: Icon, children }: { icon: any; children: React.ReactNode }) => (
  <div className="text-center py-8 text-muted-foreground">
    <Icon className="h-8 w-8 mx-auto mb-2 opacity-50" />
    <p>{children}</p>
  </div>
);

// Card para distribuição de faixas
const BeltsCard = ({ title, data }: { title: string; data: Record<string, number> }) => {
  const beltColors: Record<string, string> = {
    white: '#f3f4f6',
    blue: '#3b82f6',
    purple: '#8b5cf6',
    brown: '#a3681a',
    black: '#1f2937'
  };

  const entries = Object.entries(data);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <EmptyState icon={Users}>Nenhum aluno cadastrado</EmptyState>
        ) : (
          <ul className="space-y-2">
            {entries.map(([belt, count]) => (
              <li key={belt} className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: beltColors[belt] || '#9ca3af' }}
                  />
                  <span className="capitalize">{belt}</span>
                </div>
                <span className="font-medium">{count}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default function AdminDashboard() {
  const { data, isLoading } = useDashboard();
  
  if (isLoading || !data) return <DashboardSkeleton />;

  const m = data.metrics;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Alunos Ativos" value={m.activeStudents} icon={Users} />
        <StatCard title="Aulas Realizadas (mês)" value={m.classesHeld} icon={CalendarCheck} />
        <StatCard 
          title="Taxa de Presença" 
          value={`${Math.round(m.attendanceRate*100)}%`} 
          icon={UserCheck} 
          variant={m.attendanceRate < 0.6 ? "danger" : "success"} 
        />
        <StatCard title="Receita Mensal" value={currencyBRL(m.monthlyRevenue)} icon={DollarSign} />
        <StatCard 
          title="Engajamento em Baixa" 
          value={m.lowEngagement} 
          icon={AlertTriangle}
          variant={m.lowEngagement > 0 ? "danger" : "default"}
        />
        <StatCard 
          title="Inadimplência" 
          value={m.delinquency} 
          icon={AlertTriangle}
          variant={m.delinquency > 0 ? "danger" : "default"}
        />
      </section>

      {/* Aulas de Hoje */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Aulas de Hoje</span>
              <Badge variant="outline">{data.today.classes.length} aulas</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.today.classes.length === 0 ? (
              <EmptyState icon={Calendar}>Nenhuma aula programada para hoje</EmptyState>
            ) : (
              <ul className="divide-y divide-slate-200/30">
                {data.today.classes.map((c) => (
                  <li key={c.id} className="flex items-center justify-between py-3">
                    <div>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-sm text-slate-500">{c.start_time} · {c.duration} min</div>
                    </div>
                    <Button size="sm" onClick={() => window.location.href = `/aulas/${c.id}`}>
                      Acessar
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Aniversariantes — apenas HOJE */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Gift className="h-4 w-4 mr-2" />
              Aniversariantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.today.birthdays.length === 0 ? (
              <EmptyState icon={Gift}>Nenhum aniversariante hoje</EmptyState>
            ) : (
              <ul className="space-y-2">
                {data.today.birthdays.map((b) => (
                  <li key={b.user_id} className="px-3 py-2 rounded-lg bg-rose-50 text-rose-700">
                    🎂 {b.name}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Faixas */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BeltsCard title="Faixas Adulto" data={data.belts.adult} />
        <BeltsCard title="Faixas Infantil" data={data.belts.kids} />
      </section>
    </div>
  );
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

  

  return (
    <div className="space-y-6">
      {/* Header com ações principais */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Dashboard Administrativo</h1>
          <p className="text-muted-foreground">Visão geral da sua escola</p>
        </div>
        
        {/* Botões de ação - layout otimizado para mobile */}
        <div className="flex flex-col w-full lg:w-auto gap-3">
          {/* Layout mobile: 2 botões em uma linha horizontal */}
          <div className="grid grid-cols-2 gap-2 w-full md:flex md:gap-3 md:w-auto">
            <Button 
              variant="outline" 
              onClick={handleScheduleClass} 
              className="flex-1 md:flex-initial text-xs md:text-sm px-2 md:px-4 py-2 md:py-2 min-w-0"
              size="sm"
            >
              <Calendar className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2 flex-shrink-0" />
              <span className="truncate">Agendar Aula</span>
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                fetchLiveMetrics();
                fetchEngagementMetrics();
              }} 
              disabled={metricsLoading}
              className="flex-1 md:flex-initial text-xs md:text-sm px-2 md:px-4 py-2 md:py-2 min-w-0"
            >
              <RefreshCw className={`h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2 flex-shrink-0 ${metricsLoading ? 'animate-spin' : ''}`} />
              <span className="truncate">
                {metricsLoading ? 'Atualizando...' : 'Reload'}
              </span>
            </Button>
          </div>
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
          value={`${engagementMetrics?.attendanceRate || activeMetrics.attendanceRate}%`}
          icon={UserCheck}
          trend={(engagementMetrics?.attendanceRate || activeMetrics.attendanceRate) > 70 ? "up" : "down"}
          trendValue={engagementMetrics ? "Média de alunos ativos" : "média mensal"}
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
          value={engagementMetrics?.overduePayments || activeMetrics.overduePayments}
          icon={AlertTriangle}
          trend={(engagementMetrics?.overduePayments || activeMetrics.overduePayments) === 0 ? "neutral" : "down"}
          trendValue={engagementMetrics ? "Pagamentos em atraso" : "mensalidades vencidas"}
          color="orange"
        />
      </div>

      {/* Layout principal com 3 colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1 - Aulas de Hoje e Faixas */}
        <div className="lg:col-span-2 space-y-6">
          <TodayClassesCard classes={todayClasses} />
          
          {/* Total por Faixa */}
          <BeltSummaryAdultWidget />
          <BeltSummaryChildWidget />
        </div>

        {/* Coluna 2 - Financeiro, Aprovações e Ações */}
        <div className="space-y-6">
          <FinancialCard />
          <PendingApprovalsWidget />
          <BirthdaysCard birthdays={birthdays} />
        </div>
      </div>
    </div>
  );
}