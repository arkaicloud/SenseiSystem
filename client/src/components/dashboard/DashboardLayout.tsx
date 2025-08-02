import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Users, 
  GraduationCap, 
  CreditCard, 
  Calendar,
  TrendingUp,
  ArrowUpRight,
  Activity,
  DollarSign,
  UserCheck,
  Gift,
  Bell
} from "lucide-react";
import { FinancialDashboard } from "./FinancialDashboard";
import { BirthdayNotifications, BirthdayCard } from "./BirthdayNotifications";
import { EnrollmentChart } from "@/components/charts/EnrollmentChart";
import { formatCurrencyBRL } from "@/lib/utils";

interface DashboardStats {
  totalStudents: number;
  totalClasses: number;
  totalAttendances: number;
  activeStudents: number;
  averageAttendance: number;
  beltDistribution: Array<{ level: string; count: number }>;
}

export function DashboardLayout() {
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/stats'],
    refetchInterval: false,
  });

  const { data: overdueData } = useQuery({
    queryKey: ['/api/student-payments/overdue'],
    refetchInterval: false,
  });

  const stats = (statsData?.stats as DashboardStats) || {
    totalStudents: 0,
    totalClasses: 0,
    totalAttendances: 0,
    activeStudents: 0,
    averageAttendance: 0,
    beltDistribution: []
  };

  const overdueCount = (overdueData as any)?.overdue?.length || 0;

  // Cards de navegação rápida (inspirado no dashboard-01)
  const quickActions = [
    {
      title: "Alunos",
      description: "Gerenciar estudantes",
      href: "/students",
      icon: Users,
      value: stats.totalStudents,
      label: "Total de alunos",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Aulas",
      description: "Horários e instrutores",
      href: "/classes",
      icon: GraduationCap,
      value: stats.totalClasses,
      label: "Aulas cadastradas",
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Financeiro",
      description: "Pagamentos e receitas",
      href: "/payments",
      icon: CreditCard,
      value: overdueCount,
      label: overdueCount > 0 ? "Pagamentos em atraso" : "Tudo em dia",
      color: overdueCount > 0 ? "text-red-600" : "text-green-600",
      bgColor: overdueCount > 0 ? "bg-red-50" : "bg-green-50"
    },
    {
      title: "Presenças",
      description: "Controle de frequência",
      href: "/attendance",
      icon: UserCheck,
      value: stats.totalAttendances,
      label: "Presenças registradas",
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    }
  ];

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-8 bg-gray-200 rounded w-32"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Birthday Notifications */}
      <BirthdayNotifications />

      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral da sua academia de Jiu-Jitsu
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            Sistema ativo
          </Badge>
        </div>
      </div>

      {/* Quick Actions Cards */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Navegação Rápida</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Card key={index} className="hover:shadow-md transition-all hover:scale-105">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {action.title}
                  </CardTitle>
                  <div className={`h-8 w-8 rounded-lg ${action.bgColor} flex items-center justify-center`}>
                    <Icon className={`h-4 w-4 ${action.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{action.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {action.label}
                  </p>
                  <div className="mt-4">
                    <Link href={action.href}>
                      <Button size="sm" className="w-full">
                        {action.description}
                        <ArrowUpRight className="h-3 w-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Dashboard Financeiro */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Métricas Financeiras</h2>
        <FinancialDashboard />
      </div>

      {/* Enrollment Chart */}
      <div className="mt-6">
        <EnrollmentChart />
      </div>

      {/* Statistics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <BirthdayCard />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Alunos Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeStudents}</div>
            <p className="text-xs text-muted-foreground">
              de {stats.totalStudents} alunos cadastrados
            </p>
            <div className="mt-2">
              <div className="text-xs text-muted-foreground">Taxa de atividade</div>
              <div className="text-sm font-medium">
                {stats.totalStudents > 0 
                  ? Math.round((stats.activeStudents / stats.totalStudents) * 100)
                  : 0}%
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              Frequência Média
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageAttendance}</div>
            <p className="text-xs text-muted-foreground">
              presenças por aula
            </p>
            <div className="mt-2">
              <div className="text-xs text-muted-foreground">Total de presenças</div>
              <div className="text-sm font-medium">{stats.totalAttendances}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-purple-600" />
              Distribuição de Faixas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.beltDistribution.map((belt, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm capitalize">{belt.level}</span>
                  <Badge variant="outline">{belt.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}