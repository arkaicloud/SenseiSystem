import React from 'react';
import { useDashboard } from '@/hooks/useDashboard';
import { currencyBRL } from '@/utils/fmt';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  AlertTriangle, 
  UserCheck, 
  CalendarCheck,
  Gift
} from 'lucide-react';

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
                  <span>{belt}</span>
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
                    <Button size="sm" onClick={() => window.location.href = `/attendance?date=${new Date().toISOString().split('T')[0]}&class=${c.id}`}>
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
}