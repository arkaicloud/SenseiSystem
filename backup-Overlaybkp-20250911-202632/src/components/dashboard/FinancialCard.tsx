import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Clock, AlertTriangle, Settings, Receipt, BarChart3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface FinancialMetric {
  totalReceived: number;
  pendingAmount: number;
  overdueAmount: number;
  monthlyRecurring: number;
  revenueGrowth: number;
  totalStudents: number;
  averageTicket: number;
  revenueVariation: number;
  payingStudentsCount: number;
}

import { centsToBRL } from "@shared/money";

export function FinancialCard() {
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['/api/financial-stats'],
    staleTime: 30_000, // 30 seconds
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchInterval: 300000, // 5 minutes
  });

  const stats = (statsData as FinancialMetric) || {
    totalReceived: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    monthlyRecurring: 0,
    revenueGrowth: 0,
    totalStudents: 0,
    averageTicket: 0,
    revenueVariation: 0,
    payingStudentsCount: 0
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Visão Financeira</span>
            <div className="animate-pulse bg-gray-200 rounded w-16 h-4"></div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-32"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const defaultRate = stats.overdueAmount > 0 && stats.totalReceived > 0 
    ? ((stats.overdueAmount / (stats.totalReceived + stats.overdueAmount)) * 100)
    : 7.8; // Taxa padrão como no mock

  return (
    <Card>
    </Card>
  );
}