import { useMemo } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import {
  Flame, CheckCircle2, Target, BarChart3, BookOpen,
} from 'lucide-react';
import {
  format, subMonths, subDays, getDaysInMonth, startOfMonth,
  getDay, isAfter,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import bannerImg from '@assets/medium-shot-woman-fighter-looking-down_1773070189915.jpg';
import AttendanceHistory from '@/components/student/AttendanceHistory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AttendanceData {
  attendances: Array<{
    id: number;
    date: string;
    status: 'present' | 'absent' | 'late';
    class: { id: number; name: string; startTime: string; instructorId: number | null } | null;
  }>;
  stats: {
    totalClasses: number;
    presentCount: number;
    absentCount: number;
    attendanceRate: number;
  };
  period: { month: number; year: number } | null;
}

export default function AttendanceStatsPage() {
  const { user } = useAuth();
  const now = useMemo(() => new Date(), []);

  const { data: studentData, isLoading: isStudentLoading } = useQuery({
    queryKey: ['/api/student/profile', user?.id],
    enabled: !!user?.id,
  });

  const studentId = (studentData as any)?.id;

  const monthsToFetch = useMemo(
    () => [0, 1, 2, 3, 4].map(i => {
      const d = subMonths(now, i);
      return { month: d.getMonth() + 1, year: d.getFullYear() };
    }),
    [now]
  );

  const attendanceQueries = useQueries({
    queries: monthsToFetch.map(({ month, year }) => ({
      queryKey: [`/api/student/attendance-history/${studentId}?month=${month}&year=${year}`],
      enabled: !!studentId,
    })),
  });

  const presentDates = useMemo(() => {
    const set = new Set<string>();
    attendanceQueries.forEach(q => {
      const data = q.data as AttendanceData | undefined;
      if (!data) return;
      data.attendances
        .filter(a => a.status === 'present' || a.status === 'late')
        .forEach(a => set.add(a.date.split('T')[0]));
    });
    return set;
  }, [attendanceQueries]);

  const totalStats = useMemo(() => {
    let totalPresent = 0;
    let totalClasses = 0;
    attendanceQueries.forEach(q => {
      const data = q.data as AttendanceData | undefined;
      if (!data) return;
      totalPresent += data.stats.presentCount;
      totalClasses += data.stats.totalClasses;
    });
    return {
      totalPresent,
      totalClasses,
      rate: totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0,
    };
  }, [attendanceQueries]);

  const streak = useMemo(() => {
    if (presentDates.size === 0) return 0;
    let count = 0;
    let d = new Date(now);
    const todayStr = format(d, 'yyyy-MM-dd');
    if (!presentDates.has(todayStr)) d = subDays(d, 1);
    while (presentDates.has(format(d, 'yyyy-MM-dd'))) {
      count++;
      d = subDays(d, 1);
    }
    return count;
  }, [presentDates, now]);

  // Build 4 months for the heatmap (newest → oldest)
  const heatmapMonths = useMemo(() => {
    return [0, 1, 2, 3].map(i => {
      const d = subMonths(now, i);
      const year = d.getFullYear();
      const month = d.getMonth();
      const daysCount = getDaysInMonth(d);
      const firstDow = getDay(startOfMonth(d));
      const monthName = format(d, 'MMM', { locale: ptBR });

      const cells: Array<{
        day: number | null;
        dateStr: string | null;
        isPresent: boolean;
        isToday: boolean;
        isFuture: boolean;
      }> = [];

      for (let e = 0; e < firstDow; e++) {
        cells.push({ day: null, dateStr: null, isPresent: false, isToday: false, isFuture: false });
      }
      for (let day = 1; day <= daysCount; day++) {
        const cellDate = new Date(year, month, day);
        const dateStr = format(cellDate, 'yyyy-MM-dd');
        cells.push({
          day,
          dateStr,
          isPresent: presentDates.has(dateStr),
          isToday: dateStr === format(now, 'yyyy-MM-dd'),
          isFuture: isAfter(cellDate, now),
        });
      }
      return { monthName, cells };
    });
  }, [presentDates, now]);

  const currentMonthName = now.toLocaleDateString('pt-BR', { month: 'long' });
  const currentYear = now.getFullYear();

  if (isStudentLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#2B54FF]/20" />
          <div className="h-4 w-48 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="font-inter -mx-3 -mt-3 md:mx-0 md:mt-0">
      {/* Hero banner */}
      <div className="vyta-hero h-[180px] md:rounded-2xl">
        <img
          src={bannerImg}
          alt="Fighter"
          className="absolute inset-0 w-full h-full object-cover object-top"
        />
        <div className="vyta-hero-gradient" />
        <div className="vyta-hero-content flex flex-col justify-end h-full p-5 pb-5">
          <span className="vyta-pill mb-2 w-fit">
            <BarChart3 className="w-3 h-3" />
            Estatísticas
          </span>
          <h1 className="text-[26px] font-bold text-white leading-[32px] font-inter">
            Presenças
          </h1>
          <p className="text-[14px] text-white/70 font-inter mt-1">
            Acompanhe sua evolução no tatame
          </p>
        </div>
      </div>

      {/* ── MOBILE LAYOUT ── */}
      <div className="md:hidden px-4 pt-5 pb-28 space-y-5">

        {/* Streak card */}
        <div
          className="rounded-2xl p-6 flex flex-col items-center gap-1 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1636cc 0%, #2B54FF 55%, #6b87ff 100%)' }}
        >
          <div
            className="absolute inset-0 opacity-25"
            style={{ background: 'radial-gradient(circle at 50% 20%, white, transparent 65%)' }}
          />
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mb-2 relative z-10">
            <Flame className="w-7 h-7 text-white" strokeWidth={2} />
          </div>
          <span className="text-[56px] font-bold text-white leading-none relative z-10 font-inter">
            {streak}
          </span>
          <span className="text-[13px] text-white/90 font-semibold font-inter relative z-10 tracking-wide uppercase">
            Sequência Atual
          </span>
          <span className="text-[12px] text-white/60 font-inter relative z-10">
            {streak === 1 ? 'dia consecutivo' : 'dias consecutivos'}
          </span>
        </div>

        {/* Consistency heatmap */}
        <div>
          <h2 className="text-[17px] font-bold text-[#0D0D0D] dark:text-white font-inter mb-3">
            Consistência
          </h2>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 overflow-x-auto">
            <div className="flex gap-3 min-w-max">
              {heatmapMonths.map(({ monthName, cells }) => (
                <div key={monthName} className="flex flex-col items-start">
                  <span className="text-[10px] font-semibold text-[#8D8D8D] font-inter mb-1.5 capitalize tracking-wide">
                    {monthName}
                  </span>
                  <div className="grid grid-cols-7 gap-[3px]">
                    {cells.map((cell, idx) => (
                      <div
                        key={idx}
                        className="w-[17px] h-[17px] rounded-[4px] transition-colors"
                        style={{
                          backgroundColor: !cell.day
                            ? 'transparent'
                            : cell.isFuture
                            ? '#F0F2F7'
                            : cell.isPresent
                            ? '#2B54FF'
                            : '#DDEAFF',
                          boxShadow: cell.isToday && !cell.isFuture
                            ? '0 0 0 2px #2B54FF'
                            : undefined,
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 justify-end">
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded-[3px] bg-[#2B54FF]" />
                <span className="text-[10px] text-[#8D8D8D] font-inter">Treinou</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded-[3px] bg-[#DDEAFF]" />
                <span className="text-[10px] text-[#8D8D8D] font-inter">Sem treino</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-[#EEF1FF] flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-[#2B54FF]" />
            </div>
            <span className="text-[32px] font-bold text-[#0D0D0D] dark:text-white font-inter leading-none">
              {totalStats.totalPresent}
            </span>
            <span className="text-[11px] text-[#8D8D8D] font-inter text-center leading-tight">
              Treinos Feitos
            </span>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-[#EEF1FF] flex items-center justify-center">
              <Target className="w-5 h-5 text-[#2B54FF]" />
            </div>
            <span className="text-[32px] font-bold text-[#0D0D0D] dark:text-white font-inter leading-none">
              {totalStats.rate}%
            </span>
            <span className="text-[11px] text-[#8D8D8D] font-inter text-center leading-tight">
              Taxa de Conclusão
            </span>
          </div>
        </div>
      </div>

      {/* ── DESKTOP LAYOUT (unchanged) ── */}
      <div className="hidden md:block px-6 pt-6 pb-12 space-y-6">
        {studentId && (
          <div className="vyta-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#EEF1FF] flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-[#2B54FF]" />
              </div>
              <h3 className="text-[17px] font-bold text-[#0D0D0D] dark:text-white font-inter">
                {currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1)} {currentYear}
              </h3>
            </div>
            {(() => {
              const data = (attendanceQueries[0]?.data as AttendanceData | undefined);
              const attendanceCount = data?.stats.presentCount || 0;
              const totalClasses = data?.stats.totalClasses || 16;
              const pct = totalClasses > 0 ? Math.round((attendanceCount / totalClasses) * 100) : 0;
              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[32px] font-bold text-[#2B54FF] font-inter">{attendanceCount}</span>
                    <span className="text-[28px] font-bold text-[#22C55E] font-inter">{pct}%</span>
                  </div>
                  <div className="w-full bg-[#F0F2F7] rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#2B54FF] transition-all duration-700"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {attendanceCount} de {totalClasses} aulas no mês atual
                  </p>
                </div>
              );
            })()}
          </div>
        )}

        {studentId && <AttendanceHistory studentId={studentId} />}
      </div>
    </div>
  );
}
