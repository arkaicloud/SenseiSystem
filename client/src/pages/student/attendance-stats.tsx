import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Flame, CheckCircle2, Target, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  format, subMonths, addMonths, subDays, getDaysInMonth,
  startOfMonth, getDay, isAfter, isSameMonth, isSameDay,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import bannerImg from '@assets/medium-shot-woman-fighter-looking-down_1773070189915.jpg';
import AttendanceHistory from '@/components/student/AttendanceHistory';

interface AttendanceData {
  attendances: Array<{
    id: number;
    date: string;
    status: 'present' | 'absent' | 'late';
    class: { id: number; name: string; startTime: string; instructorId: number | null } | null;
  }>;
  stats: { totalClasses: number; presentCount: number; absentCount: number; attendanceRate: number };
  period: { month: number; year: number } | null;
}

const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export default function AttendanceStatsPage() {
  const { user } = useAuth();
  const now = useMemo(() => new Date(), []);

  const [viewDate, setViewDate] = useState(now);

  const { data: studentData, isLoading: isStudentLoading } = useQuery({
    queryKey: ['/api/student/profile', user?.id],
    enabled: !!user?.id,
  });

  const studentId = (studentData as any)?.id;

  // Fetch the displayed month
  const displayedMonth = viewDate.getMonth() + 1;
  const displayedYear = viewDate.getFullYear();

  const { data: monthData, isLoading: isMonthLoading } = useQuery<AttendanceData>({
    queryKey: [`/api/student/attendance-history/${studentId}?month=${displayedMonth}&year=${displayedYear}`],
    enabled: !!studentId,
  });

  // Also fetch current month for streak & stats (always)
  const { data: currentMonthData } = useQuery<AttendanceData>({
    queryKey: [`/api/student/attendance-history/${studentId}?month=${now.getMonth() + 1}&year=${now.getFullYear()}`],
    enabled: !!studentId,
  });

  // Fetch previous month for streak continuation
  const prevMonth = subMonths(now, 1);
  const { data: prevMonthData } = useQuery<AttendanceData>({
    queryKey: [`/api/student/attendance-history/${studentId}?month=${prevMonth.getMonth() + 1}&year=${prevMonth.getFullYear()}`],
    enabled: !!studentId,
  });

  // All present dates (current + prev month for streak)
  const allPresentDates = useMemo(() => {
    const set = new Set<string>();
    [currentMonthData, prevMonthData].forEach(d => {
      d?.attendances
        .filter(a => a.status === 'present' || a.status === 'late')
        .forEach(a => set.add(a.date.split('T')[0]));
    });
    return set;
  }, [currentMonthData, prevMonthData]);

  // Present dates for the displayed month
  const displayedPresentDates = useMemo(() => {
    const set = new Set<string>();
    monthData?.attendances
      .filter(a => a.status === 'present' || a.status === 'late')
      .forEach(a => set.add(a.date.split('T')[0]));
    return set;
  }, [monthData]);

  // Streak (based on current + prev month data)
  const streak = useMemo(() => {
    if (allPresentDates.size === 0) return 0;
    let count = 0;
    let d = new Date(now);
    if (!allPresentDates.has(format(d, 'yyyy-MM-dd'))) d = subDays(d, 1);
    while (allPresentDates.has(format(d, 'yyyy-MM-dd'))) {
      count++;
      d = subDays(d, 1);
    }
    return count;
  }, [allPresentDates, now]);

  // Stats from current month
  const stats = useMemo(() => ({
    totalPresent: currentMonthData?.stats.presentCount ?? 0,
    totalClasses: currentMonthData?.stats.totalClasses ?? 0,
    rate: currentMonthData?.stats.attendanceRate ?? 0,
  }), [currentMonthData]);

  // Build calendar cells for displayed month
  const calendarCells = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysCount = getDaysInMonth(viewDate);
    const firstDow = getDay(startOfMonth(viewDate));
    const today = format(now, 'yyyy-MM-dd');
    const isCurrentMonth = isSameMonth(viewDate, now);

    const cells: Array<{
      day: number | null;
      dateStr: string | null;
      isPresent: boolean;
      isToday: boolean;
      isFuture: boolean;
    }> = [];

    // Leading empty cells
    for (let e = 0; e < firstDow; e++) {
      cells.push({ day: null, dateStr: null, isPresent: false, isToday: false, isFuture: false });
    }

    for (let day = 1; day <= daysCount; day++) {
      const cellDate = new Date(year, month, day);
      const dateStr = format(cellDate, 'yyyy-MM-dd');
      cells.push({
        day,
        dateStr,
        isPresent: displayedPresentDates.has(dateStr),
        isToday: dateStr === today,
        isFuture: isAfter(cellDate, now) && !isSameDay(cellDate, now),
      });
    }

    return cells;
  }, [viewDate, displayedPresentDates, now]);

  const canGoNext = isSameMonth(viewDate, now) === false && isAfter(addMonths(viewDate, 1), now) === false
    || !isSameMonth(viewDate, now) && !isAfter(viewDate, now);
  const isCurrentMonthView = isSameMonth(viewDate, now);
  const canGoPrev = true; // Allow going back as far as needed

  const monthTitle = format(viewDate, 'MMMM yyyy', { locale: ptBR });
  const monthTitleCapitalized = monthTitle.charAt(0).toUpperCase() + monthTitle.slice(1);

  const presentCount = monthData?.stats.presentCount ?? 0;
  const totalClasses = monthData?.stats.totalClasses ?? 0;

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
      {/* Hero */}
      <div className="vyta-hero h-[180px] md:rounded-2xl">
        <img src={bannerImg} alt="Fighter" className="absolute inset-0 w-full h-full object-cover object-top" />
        <div className="vyta-hero-gradient" />
        <div className="vyta-hero-content flex flex-col justify-end h-full p-5 pb-5">
          <span className="vyta-pill mb-2 w-fit">
            <BarChart3 className="w-3 h-3" />
            Estatísticas
          </span>
          <h1 className="text-[26px] font-bold text-white leading-[32px] font-inter">Presenças</h1>
          <p className="text-[14px] text-white/70 font-inter mt-1">Acompanhe sua evolução no tatame</p>
        </div>
      </div>

      {/* ── MOBILE ── */}
      <div className="md:hidden px-4 pt-5 pb-28 space-y-5">

        {/* Streak card */}
        <div
          className="rounded-2xl p-6 flex flex-col items-center gap-1 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1636cc 0%, #2B54FF 55%, #6b87ff 100%)' }}
        >
          <div className="absolute inset-0 opacity-25" style={{ background: 'radial-gradient(circle at 50% 20%, white, transparent 65%)' }} />
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mb-2 relative z-10">
            <Flame className="w-7 h-7 text-white" strokeWidth={2} />
          </div>
          <span className="text-[56px] font-bold text-white leading-none relative z-10 font-inter">{streak}</span>
          <span className="text-[13px] text-white/90 font-semibold font-inter relative z-10 tracking-wide uppercase">Sequência Atual</span>
          <span className="text-[12px] text-white/60 font-inter relative z-10">
            {streak === 1 ? 'dia consecutivo' : 'dias consecutivos'}
          </span>
        </div>

        {/* Monthly calendar */}
        <div>
          <h2 className="text-[17px] font-bold text-[#0D0D0D] dark:text-white font-inter mb-3">Consistência</h2>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
            {/* Month navigator */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setViewDate(d => subMonths(d, 1))}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#2B54FF] hover:bg-[#EEF1FF] transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="text-center">
                <span className="text-[15px] font-bold text-[#0D0D0D] dark:text-white font-inter">
                  {monthTitleCapitalized}
                </span>
                {isCurrentMonthView && (
                  <span className="ml-2 text-[10px] font-semibold text-[#2B54FF] bg-[#EEF1FF] px-2 py-0.5 rounded-full">
                    Atual
                  </span>
                )}
              </div>

              <button
                onClick={() => { if (!isCurrentMonthView) setViewDate(d => addMonths(d, 1)); }}
                disabled={isCurrentMonthView}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  isCurrentMonthView
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-[#2B54FF] hover:bg-[#EEF1FF]'
                }`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Month summary */}
            {!isMonthLoading && totalClasses > 0 && (
              <div className="flex items-center justify-center gap-1 mb-3">
                <span className="text-[13px] text-[#8D8D8D] font-inter">
                  <span className="text-[15px] font-bold text-[#2B54FF]">{presentCount}</span>
                  {' '}de {totalClasses} aulas
                </span>
              </div>
            )}

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEKDAY_LABELS.map((label, i) => (
                <div key={i} className="text-center text-[10px] font-semibold text-[#B0B0B0] font-inter py-1">
                  {label}
                </div>
              ))}
            </div>

            {/* Day cells */}
            {isMonthLoading ? (
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} className="aspect-square rounded-lg bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1">
                {calendarCells.map((cell, idx) => (
                  <div
                    key={idx}
                    className="aspect-square rounded-lg flex items-center justify-center transition-colors"
                    style={{
                      backgroundColor: !cell.day
                        ? 'transparent'
                        : cell.isFuture
                        ? '#F5F6FA'
                        : cell.isPresent
                        ? '#2B54FF'
                        : '#EEF1FF',
                      boxShadow: cell.isToday ? '0 0 0 2px #2B54FF' : undefined,
                    }}
                  >
                    {cell.day && (
                      <span
                        className="text-[10px] font-semibold font-inter"
                        style={{
                          color: cell.isFuture
                            ? '#C0C0C0'
                            : cell.isPresent
                            ? '#ffffff'
                            : '#9BB3FF',
                        }}
                      >
                        {cell.day}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 justify-end">
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded-[4px] bg-[#2B54FF]" />
                <span className="text-[10px] text-[#8D8D8D] font-inter">Treinou</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded-[4px] bg-[#EEF1FF]" />
                <span className="text-[10px] text-[#8D8D8D] font-inter">Sem treino</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats — current month */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-[#EEF1FF] flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-[#2B54FF]" />
            </div>
            <span className="text-[32px] font-bold text-[#0D0D0D] dark:text-white font-inter leading-none">
              {stats.totalPresent}
            </span>
            <span className="text-[11px] text-[#8D8D8D] font-inter text-center leading-tight">Treinos no Mês</span>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-[#EEF1FF] flex items-center justify-center">
              <Target className="w-5 h-5 text-[#2B54FF]" />
            </div>
            <span className="text-[32px] font-bold text-[#0D0D0D] dark:text-white font-inter leading-none">
              {stats.rate}%
            </span>
            <span className="text-[11px] text-[#8D8D8D] font-inter text-center leading-tight">Taxa de Presença</span>
          </div>
        </div>
      </div>

      {/* ── DESKTOP ── */}
      <div className="hidden md:block px-6 pt-6 pb-12 space-y-6">
        {studentId && <AttendanceHistory studentId={studentId} />}
      </div>
    </div>
  );
}
