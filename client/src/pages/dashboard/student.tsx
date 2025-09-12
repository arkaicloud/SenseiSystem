import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from '@/hooks/use-translations';
import { useAuth } from '@/hooks/use-auth';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, CreditCard } from 'lucide-react';
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


  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Saudação e Faixa Atual */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
          👋 Olá, {user?.firstName} {user?.lastName}!
        </h1>
        {studentData && (studentData as any)?.beltLevel && (
          <div className="flex items-center space-x-4">
            <img 
              src={`https://agilisbr.com.br/Faixas/${(studentData as any)?.beltLevel === 'white' ? 'branca' : 
                   (studentData as any)?.beltLevel === 'blue' ? 'azul' : 
                   (studentData as any)?.beltLevel === 'purple' ? 'roxa' : 
                   (studentData as any)?.beltLevel === 'brown' ? 'marrom' : 
                   (studentData as any)?.beltLevel === 'black' ? 'preta' : 'branca'}.svg`}
              alt={`Faixa ${formatBelt((studentData as any)?.beltLevel || 'white', (studentData as any)?.stripes || 0)}`}
              className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 object-contain"
              onError={(e) => {
                // Fallback para bolinha colorida se a imagem não carregar
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = document.createElement('div');
                fallback.className = 'w-6 h-6 rounded-full shadow-sm';
                fallback.style.backgroundColor = getBeltColor((studentData as any)?.beltLevel || 'white');
                target.parentNode?.appendChild(fallback);
              }}
            />
            <span className="text-lg font-medium text-gray-700 dark:text-gray-200">
              Faixa {formatBelt((studentData as any)?.beltLevel || 'white', (studentData as any)?.stripes || 0)}
            </span>
          </div>
        )}
      </div>

      {/* Comunicados da Escola - 3 mais recentes */}
      {(studentData as any)?.id && (
        <NoticesBlock 
          studentId={(studentData as any)?.id}
          primaryColor="#3B82F6"
          limit={3}
        />
      )}

      {/* Aulas de Hoje */}
      {(studentData as any)?.id && (
        <TodayClasses 
          classes={Array.isArray((todayClasses as any)?.classes) ? (todayClasses as any).classes : []}
          studentId={(studentData as any)?.id}
          primaryColor="#3B82F6"
          isLoading={isClassesLoading}
        />
      )}



    </div>
  );
}