import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from '@/hooks/use-translations';
import { useAuth } from '@/hooks/use-auth';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Calendar, CreditCard, BookOpen } from 'lucide-react';
import FinancialPanel from '@/components/student/FinancialPanel';
import AttendanceHistory from '@/components/student/AttendanceHistory';
import { TodayClasses } from '@/components/student/TodayClasses';
import { NoticesBlock } from "@/components/student/NoticesBlock";

export default function StudentDashboard() {
  const { t } = useTranslations();
  const { user } = useAuth();

  // Get student data
  const { data: studentData, isLoading: isStudentLoading } = useQuery({
    queryKey: ['/api/student/profile', user?.id],
    enabled: !!user?.id,
  });

  // Get today's classes
  const { data: todayClasses, isLoading: isClassesLoading } = useQuery({
    queryKey: ['/api/classes/today'],
  });


  // Get attendance count for current month
  const { data: attendanceData, isLoading: isAttendanceLoading } = useQuery({
    queryKey: ['/api/student/attendance-current-month', user?.id],
    enabled: !!user?.id,
  });


  if (isStudentLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  // Get belt color mapping
  const getBeltColor = (beltLevel: string) => {
    const colors = {
      white: '#FFFFFF',
      blue: '#3B82F6',
      purple: '#8B5CF6',
      brown: '#8B4513',
      black: '#000000',
    };
    return colors[beltLevel as keyof typeof colors] || '#FFFFFF';
  };

  // Format belt display
  const formatBelt = (beltLevel: string, stripes: number) => {
    const beltNames = {
      white: 'Branca',
      blue: 'Azul',
      purple: 'Roxa',
      brown: 'Marrom',
      black: 'Preta',
    };
    const stripesText = stripes > 0 ? ` (${stripes} ${stripes === 1 ? 'fita' : 'fitas'})` : '';
    return `${beltNames[beltLevel as keyof typeof beltNames] || beltLevel}${stripesText}`;
  };

  const currentMonthName = new Date().toLocaleDateString('pt-BR', { month: 'long' });
  const currentYear = new Date().getFullYear();

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Saudação e Faixa Atual */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          👋 Olá, {user?.firstName} {user?.lastName}!
        </h1>
        {studentData && 'student' in studentData && studentData.student && (
          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
            <div 
              className="w-4 h-4 rounded-full border-2 border-gray-400"
              style={{ backgroundColor: getBeltColor(studentData.student?.beltLevel || 'white') }}
            ></div>
            <span>
              🥋 Faixa atual: {formatBelt(studentData.student?.beltLevel || 'white', studentData.student?.stripes || 0)}
            </span>
          </div>
        )}
      </div>

      {/* Comunicados da Escola - 3 mais recentes */}
      <NoticesBlock 
        studentId={(studentData && 'id' in studentData) ? studentData.id : 1}
        primaryColor="#3B82F6"
        limit={3}
      />

      {/* Aulas de Hoje */}
      <div className="space-y-4">
          <TodayClasses 
            classes={(todayClasses && 'classes' in todayClasses && Array.isArray(todayClasses.classes)) ? todayClasses.classes : []}
            studentId={(studentData && 'id' in studentData) ? studentData.id : 1}
            primaryColor="#3B82F6"
            isLoading={isClassesLoading}
          />

          {/* Estatísticas do Mês */}
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
              ) : (
                <div className="space-y-4">
                  <div className="text-gray-900 dark:text-white">
                    <span className="text-2xl font-bold text-blue-400">
                      {(attendanceData && 'count' in attendanceData) ? attendanceData.count : 0}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 ml-2">aulas participadas este mês</span>
                  </div>

                  <Progress 
                    value={Math.min(((attendanceData && 'count' in attendanceData) ? attendanceData.count : 0) * 10, 100)} 
                    className="h-2"
                  />

                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {((attendanceData && 'count' in attendanceData) ? attendanceData.count : 0) >= 8 
                      ? '🎉 Parabéns! Você atingiu a meta mensal!'
                      : `Faltam ${8 - ((attendanceData && 'count' in attendanceData) ? attendanceData.count : 0)} aulas para atingir a meta mensal!`
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
      </div>

      {/* Painel Financeiro */}
      <FinancialPanel studentId={user?.id || 1} />

      {/* Histórico de Presenças */}
      <AttendanceHistory studentId={user?.id || 1} />
    </div>
  );
}