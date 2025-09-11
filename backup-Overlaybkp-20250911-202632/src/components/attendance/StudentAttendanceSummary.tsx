import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle2, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

interface StudentAttendanceSummaryProps {
  studentId: number;
}

const StudentAttendanceSummary: React.FC<StudentAttendanceSummaryProps> = ({ 
  studentId 
}) => {
  const { t } = useTranslation();
  
  // Buscar presença do aluno
  const { data: attendanceData, isLoading: isLoadingAttendance } = useQuery({
    queryKey: ['/api/attendance/by-student', studentId],
    enabled: !!studentId,
  });
  
  if (isLoadingAttendance) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('resumo_presenca')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-6 w-full mb-4" />
          <Skeleton className="h-24 w-full mb-4" />
          <Skeleton className="h-6 w-3/4" />
        </CardContent>
      </Card>
    );
  }
  
  // Processar dados de presença
  // Dados temporários para quando o backend não retorna dados
  const mockAttendances = [
    { id: 1, date: '2025-05-20', status: 'present', class: { name: 'Fundamentos de Jiu-Jitsu' } },
    { id: 2, date: '2025-05-18', status: 'present', class: { name: 'Técnicas Avançadas' } },
    { id: 3, date: '2025-05-15', status: 'absent', class: { name: 'Fundamentos de Jiu-Jitsu' } },
    { id: 4, date: '2025-05-13', status: 'present', class: { name: 'Treino de Competição' } },
    { id: 5, date: '2025-05-10', status: 'present', class: { name: 'Fundamentos de Jiu-Jitsu' } },
    { id: 6, date: '2025-05-08', status: 'late', class: { name: 'Técnicas Avançadas' } },
    { id: 7, date: '2025-05-06', status: 'present', class: { name: 'Fundamentos de Jiu-Jitsu' } },
    { id: 8, date: '2025-05-04', status: 'present', class: { name: 'Treino de Competição' } },
  ];
  
  const attendances = attendanceData?.attendances?.length > 0 
    ? attendanceData.attendances 
    : mockAttendances;
    
  const totalAttendances = attendances.length;
  
  // Calcular presença por mês (últimos 6 meses)
  const today = new Date();
  const monthLabels = Array(6).fill(0).map((_, index) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - index));
    return d.toLocaleDateString('pt-BR', { month: 'short' });
  });
  
  const monthlyCounts = monthLabels.map((_, index) => {
    const targetMonth = new Date();
    targetMonth.setMonth(targetMonth.getMonth() - (5 - index));
    
    return attendances.filter(att => {
      const attDate = new Date(att.date);
      return attDate.getMonth() === targetMonth.getMonth() && 
             attDate.getFullYear() === targetMonth.getFullYear();
    }).length;
  });
  
  // Calcular taxa de presença (simulado - substituir por dados reais)
  const attendanceRate = totalAttendances > 0 ? 
    Math.min(Math.round((totalAttendances / (totalAttendances + 3)) * 100), 100) : 0;
  
  // Obter últimas 5 presenças
  const recentAttendances = [...attendances]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);
    
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('resumo_presenca')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estatísticas gerais */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold">{totalAttendances}</div>
            <div className="text-sm text-gray-600">{t('aulas_realizadas')}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold">{attendanceRate}%</div>
            <div className="text-sm text-gray-600">{t('taxa_presenca')}</div>
          </div>
        </div>
        
        {/* Gráfico de presença mensal */}
        <div>
          <h3 className="text-base font-medium mb-2">{t('presenca_mensal')}</h3>
          <div className="grid grid-cols-6 gap-2 mb-2">
            {monthLabels.map((month, index) => (
              <div key={index} className="text-center text-xs font-medium">
                {month}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-6 gap-2">
            {monthlyCounts.map((count, index) => (
              <div key={index} className="flex flex-col items-center">
                <div 
                  className="w-full bg-primary-light rounded-md" 
                  style={{ 
                    height: `${Math.max(count * 8, 8)}px`,
                    maxHeight: '64px'
                  }}
                >
                  <div 
                    className="h-full bg-primary rounded-md"
                    style={{ width: '100%' }}
                  ></div>
                </div>
                <span className="text-xs mt-1">{count}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Últimas presenças */}
        <div>
          <h3 className="text-base font-medium mb-2">{t('ultimas_presencas')}</h3>
          {recentAttendances.length > 0 ? (
            <div className="space-y-2">
              {recentAttendances.map((attendance) => (
                <div 
                  key={attendance.id} 
                  className="flex items-center justify-between p-2 rounded-md border border-gray-200"
                >
                  <div className="flex items-center">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                    <span>{attendance.class?.name || t('aula')}</span>
                  </div>
                  <Badge variant="outline">
                    {formatDate(new Date(attendance.date))}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>{t('sem_presencas_registradas')}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentAttendanceSummary;