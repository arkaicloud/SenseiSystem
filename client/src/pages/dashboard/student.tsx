import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslations } from '@/hooks/use-translations';
import { useAuth } from '@/hooks/use-auth';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, CreditCard, BookOpen, Users, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import FinancialPanel from '@/components/student/FinancialPanel';
import AttendanceHistory from '@/components/student/AttendanceHistory';

export default function StudentDashboard() {
  const { t } = useTranslations();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("proximas-aulas");
  
  // Get student data
  const { data: studentData, isLoading: isStudentLoading } = useQuery({
    queryKey: ['/api/student/profile', user?.id],
    enabled: !!user?.id,
  });
  
  // Get today's classes
  const { data: todayClasses, isLoading: isClassesLoading } = useQuery({
    queryKey: ['/api/classes/today'],
  });
  
  // Get school events
  const { data: schoolEvents, isLoading: isEventsLoading } = useQuery({
    queryKey: ['/api/school-events'],
  });
  
  // Get attendance count for current month
  const { data: attendanceData, isLoading: isAttendanceLoading } = useQuery({
    queryKey: ['/api/student/attendance-current-month', user?.id],
    enabled: !!user?.id,
  });
  
  // Confirm attendance mutation
  const confirmAttendanceMutation = useMutation({
    mutationFn: (classId: number) => 
      apiRequest(`/api/classes/${classId}/confirm-attendance`, 'POST', { studentId: user?.id }),
    onSuccess: () => {
      toast({
        title: "Presença confirmada!",
        description: "Sua presença foi confirmada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível confirmar a presença.",
        variant: "destructive",
      });
    },
  });
  
  const handleConfirmAttendance = (classId: number) => {
    confirmAttendanceMutation.mutate(classId);
  };
  
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
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h1 className="text-2xl font-semibold text-white mb-2">
          👋 Olá, {user?.firstName} {user?.lastName}!
        </h1>
        {studentData?.student && (
          <div className="flex items-center space-x-2 text-gray-300">
            <div 
              className="w-4 h-4 rounded-full border-2 border-gray-400"
              style={{ backgroundColor: getBeltColor(studentData.student.beltLevel) }}
            ></div>
            <span>
              🥋 Faixa atual: {formatBelt(studentData.student.beltLevel, studentData.student.stripes || 0)}
            </span>
          </div>
        )}
      </div>

      {/* Avisos e Eventos da Escola */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <span>📢</span>
            <span>Avisos e Eventos</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isEventsLoading ? (
            <div className="text-gray-400">Carregando eventos...</div>
          ) : schoolEvents && Array.isArray(schoolEvents) && schoolEvents.length > 0 ? (
            <div className="space-y-3">
              {schoolEvents.slice(0, 3).map((evento: any, i: number) => (
                <div key={i} className="bg-blue-900/20 p-4 rounded-xl border border-blue-700/30">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-white">{evento.title}</p>
                      <p className="text-sm text-gray-400 mt-1">{evento.description}</p>
                    </div>
                    <span className="text-xs text-blue-400 bg-blue-900/30 px-2 py-1 rounded">
                      {formatDate(evento.event_date)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-700/30 p-4 rounded-xl text-center text-gray-400">
              Nenhum evento ou aviso no momento. Fique atento às próximas novidades!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navegação por Abas */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800 border border-gray-700">
          <TabsTrigger 
            value="proximas-aulas" 
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-300"
          >
            📅 Próximas Aulas
          </TabsTrigger>
          <TabsTrigger 
            value="financeiro" 
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-300"
          >
            💳 Financeiro
          </TabsTrigger>
          <TabsTrigger 
            value="historico" 
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-300"
          >
            📊 Histórico
          </TabsTrigger>
        </TabsList>

        {/* Aulas de Hoje */}
        <TabsContent value="proximas-aulas" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Aulas de Hoje</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isClassesLoading ? (
                <div className="text-gray-400">Carregando aulas...</div>
              ) : todayClasses?.classes?.length > 0 ? (
                <div className="space-y-3">
                  {todayClasses.classes.map((aula: any) => (
                    <div key={aula.id} className="bg-gray-700 p-4 rounded-xl flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-600 p-2 rounded-lg">
                          <Users className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{aula.name}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{aula.startTime}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Users className="w-3 h-3" />
                              <span>{aula.instructorName || 'Sem instrutor'}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div>
                        {aula.attendanceConfirmed ? (
                          <span className="text-green-400 font-medium flex items-center space-x-1">
                            <span>✅</span>
                            <span>Presença Confirmada</span>
                          </span>
                        ) : (
                          <Button
                            onClick={() => handleConfirmAttendance(aula.id)}
                            disabled={confirmAttendanceMutation.isPending}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            {confirmAttendanceMutation.isPending ? 'Confirmando...' : 'Confirmar'}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-700/30 p-4 rounded-xl text-center text-gray-400">
                  Nenhuma aula agendada para hoje.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Estatísticas do Mês */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <BookOpen className="w-5 h-5" />
                <span>Presenças em {currentMonthName} {currentYear}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isAttendanceLoading ? (
                <div className="text-gray-400">Carregando estatísticas...</div>
              ) : (
                <div className="space-y-4">
                  <div className="text-white">
                    <span className="text-2xl font-bold text-blue-400">
                      {attendanceData?.count || 0}
                    </span>
                    <span className="text-gray-400 ml-2">aulas participadas este mês</span>
                  </div>
                  
                  <Progress 
                    value={Math.min((attendanceData?.count || 0) * 10, 100)} 
                    className="h-2"
                  />
                  
                  <p className="text-sm text-gray-400">
                    {(attendanceData?.count || 0) >= 8 
                      ? '🎉 Parabéns! Você atingiu a meta mensal!'
                      : `Faltam ${8 - (attendanceData?.count || 0)} aulas para atingir a meta mensal!`
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Painel Financeiro */}
        <TabsContent value="financeiro">
          <FinancialPanel studentId={user?.id} />
        </TabsContent>

        {/* Histórico de Presenças */}
        <TabsContent value="historico">
          <AttendanceHistory studentId={user?.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}