import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BookOpen, BarChart3 } from 'lucide-react';
import AttendanceHistory from '@/components/student/AttendanceHistory';

export default function AttendanceStatsPage() {
  const { user } = useAuth();

  // Get student data
  const { data: studentData, isLoading: isStudentLoading } = useQuery({
    queryKey: ['/api/student/profile', user?.id],
    enabled: !!user?.id,
  });

  // Get attendance count for current month
  const { data: attendanceData, isLoading: isAttendanceLoading } = useQuery({
    queryKey: ['/api/student/attendance-current-month', user?.id],
    enabled: !!user?.id,
  });

  if (isStudentLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600 dark:text-gray-400">Carregando...</div>
      </div>
    );
  }

  const currentMonthName = new Date().toLocaleDateString('pt-BR', { month: 'long' });
  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-6 h-6 text-blue-500" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Presenças e Estatísticas</h1>
      </div>

      {/* Estatísticas do Mês */}
      {(studentData as any)?.id && (
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white flex items-center space-x-2">
              <BookOpen className="w-5 h-5" />
              <span>Presenças em {currentMonthName} {currentYear}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isAttendanceLoading ? (
              <div className="text-gray-600 dark:text-gray-400">Carregando estatísticas...</div>
            ) : (() => {
              const attendanceCount = (attendanceData as any)?.attendanceCount || 0;
              const totalClasses = (attendanceData as any)?.totalClasses || 16;
              const attendancePercentage = totalClasses > 0 ? Math.round((attendanceCount / totalClasses) * 100) : 0;
              
              // Gamificação baseada na porcentagem
              const getGameStatus = () => {
                if (attendancePercentage >= 60) {
                  return {
                    level: "🏆 EXCELENTE",
                    color: "text-yellow-500",
                    bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
                    borderColor: "border-yellow-200 dark:border-yellow-700",
                    progressColor: "bg-gradient-to-r from-yellow-400 to-yellow-600",
                    message: "🎉 Parabéns! Você é um verdadeiro guerreiro do tatame!",
                    emoji: "🥇"
                  };
                } else if (attendancePercentage >= 50) {
                  return {
                    level: "✅ BOM TRABALHO",
                    color: "text-green-500",
                    bgColor: "bg-green-50 dark:bg-green-900/20",
                    borderColor: "border-green-200 dark:border-green-700",
                    progressColor: "bg-gradient-to-r from-green-400 to-green-600",
                    message: "👏 Você está no caminho certo! Continue firme!",
                    emoji: "🥈"
                  };
                } else if (attendancePercentage >= 25) {
                  return {
                    level: "⚡ PODE MELHORAR",
                    color: "text-orange-500",
                    bgColor: "bg-orange-50 dark:bg-orange-900/20",
                    borderColor: "border-orange-200 dark:border-orange-700",
                    progressColor: "bg-gradient-to-r from-orange-400 to-orange-600",
                    message: "💪 Vamos lá! Cada aula conta na sua evolução!",
                    emoji: "🥉"
                  };
                } else {
                  return {
                    level: "🚀 VAMOS COMEÇAR",
                    color: "text-blue-500",
                    bgColor: "bg-blue-50 dark:bg-blue-900/20",
                    borderColor: "border-blue-200 dark:border-blue-700",
                    progressColor: "bg-gradient-to-r from-blue-400 to-blue-600",
                    message: "🎯 Hora de acelerar! Sua jornada está começando!",
                    emoji: "🎯"
                  };
                }
              };

              const gameStatus = getGameStatus();
              
              return (
                <div className={`space-y-4 p-4 rounded-lg border-2 ${gameStatus.bgColor} ${gameStatus.borderColor}`}>
                  {/* Header com nível gamificado */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{gameStatus.emoji}</span>
                      <span className={`font-bold text-sm ${gameStatus.color}`}>
                        {gameStatus.level}
                      </span>
                    </div>
                    <div className={`text-2xl font-bold ${gameStatus.color}`}>
                      {Math.min(attendancePercentage, 100)}%
                    </div>
                  </div>

                  {/* Estatísticas */}
                  <div className="text-gray-900 dark:text-white">
                    <span className="text-2xl font-bold text-blue-400">
                      {attendanceCount}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 ml-2">
                      de {totalClasses} aulas disponíveis
                    </span>
                  </div>

                  {/* Barra de progresso gamificada */}
                  <div className="space-y-2">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 relative overflow-hidden">
                      <div 
                        className={`h-full ${gameStatus.progressColor} transition-all duration-700 ease-out rounded-full`}
                        style={{ width: `${Math.min(attendancePercentage, 100)}%` }}
                      />
                      {/* Marcadores de meta */}
                      <div className="absolute inset-0">
                        <div 
                          className="absolute w-0.5 h-2 bg-white/70 rounded-full top-1/2 transform -translate-y-1/2 -translate-x-1/2"
                          style={{ left: '50%' }}
                          title="Meta: 50%"
                        />
                        <div 
                          className="absolute w-0.5 h-2 bg-white/70 rounded-full top-1/2 transform -translate-y-1/2 -translate-x-1/2"
                          style={{ left: '60%' }}
                          title="Excelente: 60%"
                        />
                      </div>
                    </div>
                    
                    {/* Legendas das metas */}
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>0%</span>
                      <span className="text-green-600 dark:text-green-400">✅ 50%</span>
                      <span className="text-yellow-600 dark:text-yellow-400">🏆 60%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* Mensagem motivacional gamificada */}
                  <div className="space-y-2">
                    <p className={`text-sm font-medium ${gameStatus.color}`}>
                      {gameStatus.message}
                    </p>
                    
                    {/* Próxima meta */}
                    {attendancePercentage < 60 && (
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {attendancePercentage < 50 
                          ? `Faltam ${Math.max(0, Math.ceil((totalClasses * 0.5) - attendanceCount))} aulas para atingir 50% ✅`
                          : `Faltam ${Math.max(0, Math.ceil((totalClasses * 0.6) - attendanceCount))} aulas para ser EXCELENTE! 🏆`
                        }
                      </p>
                    )}
                    
                    {/* Conquista desbloqueada */}
                    {attendancePercentage >= 60 && (
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="animate-bounce">🏆</span>
                        <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                          CONQUISTA DESBLOQUEADA: Guerreiro do Tatame!
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Histórico de Presenças */}
      {(studentData as any)?.id && <AttendanceHistory studentId={(studentData as any)?.id} />}
    </div>
  );
}