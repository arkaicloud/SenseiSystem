import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, BarChart3 } from 'lucide-react';
import AttendanceHistory from '@/components/student/AttendanceHistory';
import bannerImg from '@assets/medium-shot-woman-fighter-looking-down_1773070189915.jpg';

export default function AttendanceStatsPage() {
  const { user } = useAuth();

  const { data: studentData, isLoading: isStudentLoading } = useQuery({
    queryKey: ['/api/student/profile', user?.id],
    enabled: !!user?.id,
  });

  const { data: attendanceData, isLoading: isAttendanceLoading } = useQuery({
    queryKey: ['/api/student/attendance-current-month', user?.id],
    enabled: !!user?.id,
  });

  if (isStudentLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#2B54FF]/20"></div>
          <div className="h-4 w-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const currentMonthName = new Date().toLocaleDateString('pt-BR', { month: 'long' });
  const currentYear = new Date().getFullYear();

  return (
    <div className="font-inter -mx-3 -mt-3 md:mx-0 md:mt-0">
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
            Estatisticas
          </span>
          <h1 className="text-[26px] font-bold text-white leading-[32px] font-inter">
            Presencas
          </h1>
          <p className="text-[14px] text-white/70 font-inter mt-1">
            Acompanhe sua evolucao no tatame
          </p>
        </div>
      </div>

      <div className="px-4 pt-6 pb-24 space-y-6 md:px-6">
        {(studentData as any)?.id && (
          <div className="vyta-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#EEF1FF] flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-[#2B54FF]" />
              </div>
              <h3 className="text-[17px] font-bold text-[#0D0D0D] dark:text-white font-inter">
                {currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1)} {currentYear}
              </h3>
            </div>

            {isAttendanceLoading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded-full w-full"></div>
              </div>
            ) : (() => {
              const attendanceCount = (attendanceData as any)?.attendanceCount || 0;
              const totalClasses = (attendanceData as any)?.totalClasses || 16;
              const attendancePercentage = totalClasses > 0 ? Math.round((attendanceCount / totalClasses) * 100) : 0;

              const getGameStatus = () => {
                if (attendancePercentage >= 60) {
                  return {
                    level: "EXCELENTE",
                    color: "#22C55E",
                    bgColor: "#DCFCE7",
                    message: "Voce e um guerreiro do tatame!",
                    emoji: "🏆"
                  };
                } else if (attendancePercentage >= 50) {
                  return {
                    level: "BOM TRABALHO",
                    color: "#22C55E",
                    bgColor: "#DCFCE7",
                    message: "Continue firme, esta no caminho!",
                    emoji: "✅"
                  };
                } else if (attendancePercentage >= 25) {
                  return {
                    level: "PODE MELHORAR",
                    color: "#F97316",
                    bgColor: "#FFF0E6",
                    message: "Cada aula conta na sua evolucao!",
                    emoji: "💪"
                  };
                } else {
                  return {
                    level: "VAMOS COMECAR",
                    color: "#2B54FF",
                    bgColor: "#EEF1FF",
                    message: "Hora de acelerar sua jornada!",
                    emoji: "🚀"
                  };
                }
              };

              const gameStatus = getGameStatus();

              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{gameStatus.emoji}</span>
                      <span
                        className="text-[11px] font-bold tracking-wider font-inter px-2 py-1 rounded-full"
                        style={{ color: gameStatus.color, backgroundColor: gameStatus.bgColor }}
                      >
                        {gameStatus.level}
                      </span>
                    </div>
                    <span className="text-[28px] font-bold font-inter" style={{ color: gameStatus.color }}>
                      {Math.min(attendancePercentage, 100)}%
                    </span>
                  </div>

                  <div>
                    <span className="text-[32px] font-bold text-[#2B54FF] font-inter">
                      {attendanceCount}
                    </span>
                    <span className="text-[14px] text-[#8D8D8D] ml-2 font-inter">
                      de {totalClasses} aulas
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="w-full bg-[#F0F2F7] rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${Math.min(attendancePercentage, 100)}%`,
                          backgroundColor: gameStatus.color
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-[#B0B0B0] font-inter">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  <p className="text-[14px] font-medium font-inter" style={{ color: gameStatus.color }}>
                    {gameStatus.message}
                  </p>

                  {attendancePercentage < 60 && (
                    <p className="text-[12px] text-[#8D8D8D] font-inter">
                      {attendancePercentage < 50
                        ? `Faltam ${Math.max(0, Math.ceil((totalClasses * 0.5) - attendanceCount))} aulas para 50%`
                        : `Faltam ${Math.max(0, Math.ceil((totalClasses * 0.6) - attendanceCount))} aulas para Excelente!`
                      }
                    </p>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {(studentData as any)?.id && <AttendanceHistory studentId={(studentData as any)?.id} />}
      </div>
    </div>
  );
}
