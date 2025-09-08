import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Bell,
  AlertCircle
} from "lucide-react";
import { useDashboardSummary } from "@/hooks/useDashboardSummary";
import { DataFreshnessIndicator } from "./DataFreshnessIndicator";
import { formatCurrencyBRL } from "@/lib/utils";


export function DashboardLayout() {
  // Use unified dashboard hook (Audit requirement)
  const {
    data: dashboardData,
    isLoading,
    isError,
    error,
    isDataFresh,
    lastUpdated,
    refreshDashboard,
    computedValues,
    metrics,
    todayClasses,
    todayBirthdays
  } = useDashboardSummary();

  // Error state
  if (isError) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar dados do dashboard: {error?.message || 'Erro desconhecido'}
          </AlertDescription>
        </Alert>
        <Button onClick={refreshDashboard} variant="outline">
          Tentar novamente
        </Button>
      </div>
    );
  }

  // Cards de navegação rápida - agora com dados reais do endpoint unificado
  const quickActions = [
    {
      title: "Alunos",
      description: "Gerenciar estudantes",
      href: "/students",
      icon: Users,
      value: metrics?.activeStudents || 0,
      label: "Alunos ativos",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Aulas",
      description: "Horários e instrutores",
      href: "/classes",
      icon: GraduationCap,
      value: metrics?.classesHeld || 0,
      label: "Aulas realizadas",
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Financeiro",
      description: "Pagamentos e receitas",
      href: "/payments",
      icon: CreditCard,
      value: metrics?.delinquency || 0,
      label: (metrics?.delinquency || 0) > 0 ? "Pagamentos em atraso" : "Tudo em dia",
      color: (metrics?.delinquency || 0) > 0 ? "text-red-600" : "text-green-600",
      bgColor: (metrics?.delinquency || 0) > 0 ? "bg-red-50" : "bg-green-50"
    },
    {
      title: "Presenças",
      description: "Controle de frequência",
      href: "/attendance",
      icon: UserCheck,
      value: `${computedValues?.attendanceRatePercentage || 0}%`,
      label: "Taxa de presença",
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    }
  ];

  if (isLoading) {
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
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Birthday Notifications - usando dados do endpoint unificado */}
      {todayBirthdays && todayBirthdays.length > 0 && (
        <Alert>
          <Gift className="h-4 w-4" />
          <AlertDescription>
            Hoje temos {todayBirthdays.length} aniversariante{todayBirthdays.length > 1 ? 's' : ''}: {' '}
            {todayBirthdays.map(b => b.name).join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {/* Header Section com indicador de data freshness */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard Administrativo</h1>
          <p className="text-muted-foreground">
            Visão geral da sua escola
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <DataFreshnessIndicator 
            lastUpdated={lastUpdated}
            isLoading={isLoading}
            onRefresh={refreshDashboard}
          />
          <Badge variant="outline" className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            Sistema ativo
          </Badge>
        </div>
      </div>

      {/* Quick Actions Cards */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Navegação Rápida</h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Card key={index} className="hover:shadow-md transition-all hover:scale-105">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium truncate">
                    {action.title}
                  </CardTitle>
                  <div className={`h-8 w-8 rounded-lg ${action.bgColor} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`h-4 w-4 ${action.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{action.value}</div>
                  <p className="text-xs text-muted-foreground truncate">
                    {action.label}
                  </p>
                  <div className="mt-4">
                    <Link href={action.href}>
                      <Button size="sm" className="w-full">
                        <span className="truncate">{action.description}</span>
                        <ArrowUpRight className="h-3 w-3 ml-1 flex-shrink-0" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Métricas Financeiras - dados do endpoint unificado */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Métricas Financeiras</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrencyBRL(computedValues?.revenueInBRL || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Período: {dashboardData?.period.from} - {dashboardData?.period.to}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inadimplência</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {metrics?.delinquency || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Pagamentos em atraso
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alunos em Risco</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {metrics?.atRiskStudents || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Necessitam atenção
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aprovações Pendentes</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {metrics?.pendingApprovals || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Aguardando aprovação
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Aulas de Hoje - dados do endpoint unificado */}
      {todayClasses && todayClasses.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Aulas de Hoje</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {todayClasses.map((cls) => (
              <Card key={cls.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{cls.name}</CardTitle>
                  <CardDescription>
                    {cls.startTime} - {cls.duration}min
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {cls.instructor && (
                      <p className="text-sm text-muted-foreground">
                        Instrutor: {cls.instructor}
                      </p>
                    )}
                    {cls.maxCapacity && (
                      <p className="text-sm text-muted-foreground">
                        Capacidade: {cls.attendeeCount}/{cls.maxCapacity}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      {/* Distribution de Faixas - dados do endpoint unificado */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Distribuição de Faixas</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-blue-600" />
                Faixas Adulto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(dashboardData?.belts.adult || {}).map(([belt, count]) => (
                  <div key={belt} className="flex justify-between items-center">
                    <span className="text-sm capitalize">{belt.replace('_', ' ')}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between items-center font-medium">
                    <span>Total</span>
                    <span>{computedValues?.totalAdultBelts || 0}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                Faixas Infantil
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(dashboardData?.belts.kids || {}).map(([belt, count]) => (
                  <div key={belt} className="flex justify-between items-center">
                    <span className="text-sm capitalize">{belt.replace('_', ' ')}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between items-center font-medium">
                    <span>Total</span>
                    <span>{computedValues?.totalKidsBelts || 0}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}