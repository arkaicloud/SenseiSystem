import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { formatCurrencyBRL } from "@/lib/utils";
import { TrendingUp, TrendingDown, Clock, AlertTriangle, RefreshCw, Users } from "lucide-react";

interface FinancialMetric {
  totalReceived: number;
  pendingAmount: number;
  overdueAmount: number;
  monthlyRecurring: number;
  revenueGrowth: number;
  totalStudents: number;
}

export function FinancialDashboard() {
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['/api/financial-stats'],
    refetchInterval: false,
  });

  const stats = (statsData as FinancialMetric) || {
    totalReceived: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    monthlyRecurring: 0,
    revenueGrowth: 0,
    totalStudents: 0
  };

  const metrics = [
    {
      title: "Recebido no Mês",
      value: formatCurrencyBRL(stats.totalReceived),
      change: `${stats.revenueGrowth > 0 ? '+' : ''}${stats.revenueGrowth.toFixed(1)}%`,
      changeType: stats.revenueGrowth >= 0 ? 'positive' : 'negative',
      description: "vs mês anterior",
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Valores Pendentes",
      value: formatCurrencyBRL(stats.pendingAmount),
      change: null,
      changeType: 'neutral',
      description: "A receber este mês",
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: "Valores em Atraso",
      value: formatCurrencyBRL(stats.overdueAmount),
      change: null,
      changeType: 'negative',
      description: "Requer atenção",
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Receita Recorrente",
      value: formatCurrencyBRL(stats.monthlyRecurring),
      change: `${stats.totalStudents} alunos`,
      changeType: 'positive',
      description: "Estimativa mensal",
      icon: RefreshCw,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <div className={`h-8 w-8 rounded-lg ${metric.bgColor} flex items-center justify-center`}>
                <Icon className={`h-4 w-4 ${metric.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              {metric.change && (
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  {metric.changeType === 'positive' && (
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  )}
                  {metric.changeType === 'negative' && (
                    <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  <span className={
                    metric.changeType === 'positive' ? 'text-green-600' :
                    metric.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                  }>
                    {metric.change}
                  </span>
                  {metric.description && (
                    <span className="text-muted-foreground ml-1">
                      {metric.description}
                    </span>
                  )}
                </p>
              )}
              {!metric.change && metric.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {metric.description}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}