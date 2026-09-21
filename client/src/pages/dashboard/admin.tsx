import React from 'react';
import { useDashboard } from '@/hooks/useDashboard';
import { useQuery } from '@tanstack/react-query';
import { startOfMonth, endOfMonth } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Users, Calendar, DollarSign, AlertTriangle,
  UserCheck, Gift, ChevronRight, TrendingUp
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BELT_NAMES } from '@/components/ui/belt';
import { localCalendarDateKey } from '@shared/calendarDates';

const KpiCard = ({ value, label, icon: Icon, iconBg, iconColor }: {
  value: string | number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
}) => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
    <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${iconBg}`}>
      <Icon className={`w-6 h-6 ${iconColor}`} />
    </div>
    <div className="min-w-0">
      <p className="text-2xl font-bold text-slate-800 leading-tight">{value}</p>
      <p className="text-sm text-slate-500 mt-0.5 truncate">{label}</p>
    </div>
  </div>
);

const BELT_CHART_STYLES: Record<string, {
  fill: string;
  legend: string;
  stroke?: string;
  strokeWidth?: number;
}> = {
  white:        { fill: '#FFFFFF', legend: '#FFFFFF', stroke: '#94A3B8', strokeWidth: 2 },
  blue:         { fill: '#2563EB', legend: '#2563EB' },
  purple:       { fill: '#7C3AED', legend: '#7C3AED' },
  brown:        { fill: '#92400E', legend: '#92400E' },
  black:        { fill: '#111827', legend: '#111827', stroke: '#94A3B8', strokeWidth: 1.5 },
  coral:        { fill: '#FB7185', legend: '#FB7185' },
  red_white:    { fill: 'url(#belt-red-white)', legend: 'linear-gradient(90deg, #DC2626 0 50%, #FFFFFF 50%)', stroke: '#94A3B8' },
  red:          { fill: '#DC2626', legend: '#DC2626' },
  grey_white:   { fill: 'url(#belt-grey-white)', legend: 'linear-gradient(90deg, #6B7280 0 50%, #FFFFFF 50%)', stroke: '#94A3B8' },
  grey:         { fill: '#6B7280', legend: '#6B7280' },
  grey_black:   { fill: 'url(#belt-grey-black)', legend: 'linear-gradient(90deg, #6B7280 0 50%, #111827 50%)' },
  yellow_white: { fill: 'url(#belt-yellow-white)', legend: 'linear-gradient(90deg, #FACC15 0 50%, #FFFFFF 50%)', stroke: '#94A3B8' },
  yellow:       { fill: '#FACC15', legend: '#FACC15', stroke: '#CA8A04' },
  yellow_black: { fill: 'url(#belt-yellow-black)', legend: 'linear-gradient(90deg, #FACC15 0 50%, #111827 50%)' },
  orange_white: { fill: 'url(#belt-orange-white)', legend: 'linear-gradient(90deg, #F97316 0 50%, #FFFFFF 50%)', stroke: '#94A3B8' },
  orange:       { fill: '#F97316', legend: '#F97316' },
  orange_black: { fill: 'url(#belt-orange-black)', legend: 'linear-gradient(90deg, #F97316 0 50%, #111827 50%)' },
  green_white:  { fill: 'url(#belt-green-white)', legend: 'linear-gradient(90deg, #16A34A 0 50%, #FFFFFF 50%)', stroke: '#94A3B8' },
  green:        { fill: '#16A34A', legend: '#16A34A' },
  green_black:  { fill: 'url(#belt-green-black)', legend: 'linear-gradient(90deg, #16A34A 0 50%, #111827 50%)' },
};

const BELT_GRADIENTS = [
  ['red-white', '#DC2626', '#FFFFFF'],
  ['grey-white', '#6B7280', '#FFFFFF'],
  ['grey-black', '#6B7280', '#111827'],
  ['yellow-white', '#FACC15', '#FFFFFF'],
  ['yellow-black', '#FACC15', '#111827'],
  ['orange-white', '#F97316', '#FFFFFF'],
  ['orange-black', '#F97316', '#111827'],
  ['green-white', '#16A34A', '#FFFFFF'],
  ['green-black', '#16A34A', '#111827'],
] as const;

const BeltDonut = ({ data }: { data: Record<string, number> }) => {
  const chartData = Object.entries(data)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => {
      const style = BELT_CHART_STYLES[k] || {
        fill: '#94A3B8',
        legend: '#94A3B8',
      };
      return {
        name: BELT_NAMES[k] || k,
        value: v,
        ...style,
      };
    });
  const total = chartData.reduce((s, d) => s + d.value, 0);

  if (!chartData.length) return (
    <p className="text-center text-sm text-slate-400 py-8">Sem dados de faixas</p>
  );

  return (
    <div>
      <div className="relative">
        <ResponsiveContainer width="100%" height={190}>
          <PieChart>
            <defs>
              {BELT_GRADIENTS.map(([id, firstColor, secondColor]) => (
                <linearGradient key={id} id={`belt-${id}`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={firstColor} />
                  <stop offset="49.9%" stopColor={firstColor} />
                  <stop offset="50%" stopColor={secondColor} />
                  <stop offset="100%" stopColor={secondColor} />
                </linearGradient>
              ))}
            </defs>
            <Pie data={chartData} cx="50%" cy="50%" innerRadius={58} outerRadius={85}
              dataKey="value" paddingAngle={3}>
              {chartData.map((d, i) => (
                <Cell
                  key={i}
                  fill={d.fill}
                  stroke={d.stroke || '#FFFFFF'}
                  strokeWidth={d.strokeWidth || 2}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontSize: 13 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-slate-800">{total}</span>
          <span className="text-xs text-slate-400 mt-0.5">Alunos</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1.5 justify-center mt-1">
        {chartData.map((d, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
            <div
              className="h-2.5 w-2.5 flex-shrink-0 rounded-full border border-slate-300"
              style={{ background: d.legend }}
            />
            {d.name}
          </div>
        ))}
      </div>
    </div>
  );
};

const DashboardSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-8 bg-slate-200 rounded-lg w-48" />
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-28 shadow-sm border border-slate-100" />)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 bg-white rounded-2xl h-72 shadow-sm border border-slate-100" />
      <div className="bg-white rounded-2xl h-72 shadow-sm border border-slate-100" />
    </div>
  </div>
);

export default function AdminDashboard() {
  const { data, isLoading } = useDashboard();
  const now = new Date();
  const monthStart = localCalendarDateKey(startOfMonth(now));
  const monthEnd   = localCalendarDateKey(endOfMonth(now));
  const { data: financialData } = useQuery<any>({
    queryKey: ['/api/financial/payments', monthStart, monthEnd],
    queryFn: async () => {
      const res = await fetch(
        `/api/financial/payments?startDate=${monthStart}&endDate=${monthEnd}`,
        { credentials: 'include', cache: 'no-store' }
      );
      if (!res.ok) return null;
      return res.json();
    },
    refetchInterval: false,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading || !data) return <DashboardSkeleton />;

  const m = data.metrics;
  const monthlyRevenue = financialData?.metrics?.totalReceived || 0;
  const overdueCount = financialData?.metrics?.overdueCount || 0;
  const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  // Real attendance trend from API (last 6 months, actual counts)
  const trendData: { mes: string; presencas: number }[] = (m as any).monthlyTrend ?? [];
  const atRisk = (m as any).atRiskStudents ?? (m as any).lowEngagement ?? 0;

  const allBelts: Record<string, number> = {};
  Object.entries(data.belts?.adult || {}).forEach(([k, v]) => { allBelts[k] = (allBelts[k] || 0) + (v as number); });
  Object.entries(data.belts?.kids || {}).forEach(([k, v]) => { allBelts[k] = (allBelts[k] || 0) + (v as number); });

  const revenueK = monthlyRevenue >= 1000
    ? `R$${(monthlyRevenue / 1000).toFixed(1)}k`
    : `R$${monthlyRevenue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <div className="flex items-center gap-2 text-sm text-slate-500 bg-white border border-slate-200 rounded-xl px-3.5 py-2 shadow-sm">
          <Calendar className="w-4 h-4 text-indigo-500" />
          <span className="capitalize">{today}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard value={`${m.activeStudents}+`} label="Alunos Ativos" icon={Users} iconBg="bg-indigo-50" iconColor="text-indigo-600" />
        <KpiCard value={`${m.classesHeld}+`} label="Aulas no Mês" icon={Calendar} iconBg="bg-orange-50" iconColor="text-orange-500" />
        <KpiCard value={`${m.monthlyAttendanceCount ?? 0}`} label="Presenças no Mês" icon={UserCheck} iconBg="bg-rose-50" iconColor="text-rose-500" />
        <KpiCard value={revenueK} label="Receita Recebida" icon={DollarSign} iconBg="bg-violet-50" iconColor="text-violet-600" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-slate-800">Relatórios</h2>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="gradIndigo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradViolet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A855F7" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#A855F7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.10)', padding: '10px 14px' }}
                labelStyle={{ color: '#1E293B', fontWeight: 700, fontSize: 13 }}
                itemStyle={{ fontSize: 12 }}
              />
              <Area type="monotone" dataKey="presencas" stroke="#6366F1" strokeWidth={2.5}
                fill="url(#gradIndigo)"
                dot={{ r: 4, fill: '#6366F1', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, fill: '#6366F1' }}
                name="Presenças" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2 justify-center">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <div className="w-3 h-0.5 bg-indigo-500 rounded" />
              Alunos presentes por mês
            </div>
          </div>
        </div>

        {/* Donut — Faixas */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-slate-800">Faixas</h2>
          </div>
          <BeltDonut data={allBelts} />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Aulas de Hoje */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-800">Aulas de Hoje</h2>
            <a href="/classes" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
              Ver todas <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {data.today.classes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-slate-400">
              <Calendar className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Nenhuma aula programada para hoje</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-12 px-6 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide bg-slate-50">
                <span className="col-span-2">Horário</span>
                <span className="col-span-6">Aula</span>
                <span className="col-span-2 text-center">Duração</span>
                <span className="col-span-2 text-right">Ação</span>
              </div>
              <div className="divide-y divide-slate-50">
                {data.today.classes.map((c) => (
                  <div key={c.id} className="grid grid-cols-12 items-center px-6 py-3.5">
                    <span className="col-span-2 text-sm font-semibold text-slate-700">{c.start_time}</span>
                    <span className="col-span-6 text-sm font-medium text-slate-800">{c.name}</span>
                    <span className="col-span-2 text-center">
                      <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                        {c.duration}min
                      </span>
                    </span>
                    <div className="col-span-2 flex justify-end">
                      <Button
                        size="sm"
                        className="h-8 px-3 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg border-0"
                        onClick={() => window.location.href = `/attendance?date=${localCalendarDateKey()}&class=${c.id}`}
                      >
                        Acessar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Side: Aniversariantes + Alertas */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center">
                <Gift className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <h2 className="text-sm font-semibold text-slate-800">Aniversariantes</h2>
            </div>
            {data.today.birthdays.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-5">Nenhum aniversariante hoje 🎉</p>
            ) : (
              <ul className="space-y-2">
                {data.today.birthdays.map((b) => (
                  <li key={b.user_id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-base">🎂</div>
                    <span className="text-sm font-medium text-slate-700">{b.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {(atRisk > 0 || overdueCount > 0) && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <h2 className="text-sm font-semibold text-slate-800 mb-3">Alertas</h2>
              <div className="space-y-2">
                {atRisk > 0 && (
                  <a href="/students-at-risk" className="flex items-center justify-between p-3 rounded-xl bg-amber-50 hover:bg-amber-100 transition-colors">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-medium text-amber-700">Baixo engajamento</span>
                    </div>
                    <span className="text-sm font-bold text-amber-700">{atRisk}</span>
                  </a>
                )}
                {overdueCount > 0 && (
                  <a href="/financial" className="flex items-center justify-between p-3 rounded-xl bg-red-50 hover:bg-red-100 transition-colors">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <span className="text-xs font-medium text-red-700">Inadimplentes</span>
                    </div>
                    <span className="text-sm font-bold text-red-700">{overdueCount}</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
