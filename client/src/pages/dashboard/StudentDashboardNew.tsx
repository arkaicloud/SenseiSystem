import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { formatDate, formatTime, getBeltColor } from '@/lib/utils';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, Users, Trophy, AlertTriangle, CreditCard, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import FinancialPanel from '@/components/student/FinancialPanel';
import AttendanceHistory from '@/components/student/AttendanceHistory';

export default function StudentDashboardNew() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("proximas-aulas");
  
  // Get school configuration for colors
  const { data: schoolConfig } = useQuery({
    queryKey: ['/api/school-config'],
  });
  
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
    mutationFn: (data: { classId: number, date: string }) => 
      apiRequest('/api/attendance/confirm', 'POST', data),
    onSuccess: () => {
      toast({
        title: "Presença confirmada!",
        description: "Sua presença foi confirmada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/classes/today'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível confirmar a presença.",
        variant: "destructive",
      });
    },
  });
  
  const handleConfirmAttendance = (classId: number) => {
    const today = new Date().toISOString().split('T')[0];
    confirmAttendanceMutation.mutate({ classId, date: today });
  };
  
  if (isStudentLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }
  
  // Get colors from school config or use defaults
  const primaryColor = schoolConfig?.config?.primaryColor || '#B85C38';
  const secondaryColor = schoolConfig?.config?.secondaryColor || '#D97659';
  
  // Get belt information
  const beltLevel = studentData?.beltLevel || 'white';
  const beltColor = getBeltColor(beltLevel);
  const beltName = {
    white: 'Faixa Branca',
    blue: 'Faixa Azul',
    purple: 'Faixa Roxa',
    brown: 'Faixa Marrom',
    black: 'Faixa Preta'
  }[beltLevel] || 'Faixa Branca';
  
  const studentName = user ? `${user.firstName} ${user.lastName}` : 'Aluno';
  const currentDate = new Date();
  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const totalAttendances = attendanceData?.attendanceCount || 0;
  const availableClasses = attendanceData?.totalClasses || 16;
  const attendancePercentage = availableClasses > 0 ? Math.round((totalAttendances / availableClasses) * 100) : 0;
  
  return (
    <div className="min-h-screen bg-gray-50 p-4 space-y-6">
      {/* Header Card - Saudação com Faixa */}
      <Card 
        className="relative overflow-hidden border-0 shadow-lg"
        style={{ backgroundColor: primaryColor }}
      >
        <CardContent className="p-6 text-white relative">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">
                Olá, {studentName}! 👋
              </h1>
              <p className="text-white/90 mb-4">
                Continue sua jornada nas artes marciais com dedicação e disciplina.
              </p>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5" />
                  <span className="font-medium">Faixa Atual</span>
                </div>
                <div 
                  className="px-3 py-1 rounded-full text-sm font-medium text-white border-2 border-white/30"
                  style={{ backgroundColor: beltColor }}
                >
                  {beltName}
                </div>
              </div>
            </div>
            <div className="hidden md:block text-right">
              <p className="text-white/80 text-sm">Desde</p>
              <p className="font-medium">{formatDate(new Date())}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Aulas de Hoje */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-md border-0">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2 text-gray-800">
                <Calendar className="w-5 h-5" style={{ color: primaryColor }} />
                <span>Aulas de Hoje</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isClassesLoading ? (
                <div className="text-gray-500">Carregando aulas...</div>
              ) : todayClasses?.classes?.length > 0 ? (
                todayClasses.classes.map((aula: any) => (
                  <div key={aula.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{aula.name}</h3>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            Tatame 1
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{aula.startTime} - {aula.endTime || '20:30'}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>Professor {aula.instructorName || 'Marcus'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        {aula.attendanceConfirmed ? (
                          <div className="flex items-center space-x-2 text-green-600">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm font-medium">Confirmado</span>
                          </div>
                        ) : (
                          <Button
                            onClick={() => handleConfirmAttendance(aula.id)}
                            disabled={confirmAttendanceMutation.isPending}
                            className="text-white font-medium"
                            style={{ backgroundColor: primaryColor }}
                          >
                            {confirmAttendanceMutation.isPending ? 'Confirmando...' : 'Confirmar Presença'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhuma aula programada para hoje</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Avisos e Eventos */}
          <Card className="shadow-md border-0">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2 text-gray-800">
                <AlertTriangle className="w-5 h-5" style={{ color: primaryColor }} />
                <span>Avisos e Eventos</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      <h4 className="font-medium text-gray-900">Seminário de Jiu-Jitsu com Mestre João</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Grande seminário técnico no próximo sábado. Inscrições abertas até quinta-feira. Não percam esta oportunidade única!
                    </p>
                  </div>
                  <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded font-medium">
                    Sáb, 10/08
                  </span>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Trophy className="w-4 h-4 text-yellow-600" />
                      <h4 className="font-medium text-gray-900">Graduação de Faixas - Agosto</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      A cerimônia de graduação será realizada no dia 25. Os alunos aprovados receberão comunicado individual.
                    </p>
                  </div>
                  <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded font-medium">
                    Dom, 25/08
                  </span>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="w-4 h-4 text-green-600" />
                      <h4 className="font-medium text-gray-900">Horário especial - Quinta-feira</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Aula das 19h será antecipada para 18h30 devido ao evento na academia vizinha.
                    </p>
                  </div>
                  <span className="text-xs bg-green-600 text-white px-2 py-1 rounded font-medium">
                    Qui, 08/08
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Stats and Financial */}
        <div className="space-y-6">
          {/* Frequência */}
          <Card className="shadow-md border-0">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2 text-gray-800">
                <BarChart3 className="w-5 h-5" style={{ color: primaryColor }} />
                <span>Frequência em {monthName.split(' ')[0]}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <div className="text-3xl font-bold" style={{ color: primaryColor }}>
                  {totalAttendances}
                </div>
                <p className="text-sm text-gray-600">
                  aulas participadas de {availableClasses} disponíveis
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Progresso</span>
                  <span className="font-medium">{attendancePercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${attendancePercentage}%`,
                      backgroundColor: primaryColor 
                    }}
                  ></div>
                </div>
                <div className="flex items-center justify-center space-x-1 text-sm mt-3">
                  <span className="text-green-600">📈</span>
                  <span className="text-gray-600">Boa frequência! Você está no caminho certo!</span>
                  <span className="text-yellow-500">⚠️</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Situação Financeira */}
          <Card className="shadow-md border-0">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2 text-gray-800">
                <CreditCard className="w-5 h-5" style={{ color: primaryColor }} />
                <span>Situação Financeira</span>
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="font-medium text-red-900">1 fatura em atraso</span>
                </div>
                <p className="text-sm text-red-700 mb-3">
                  Regularize sua situação para continuar participando das aulas.
                </p>
              </div>

              <div className="space-y-3">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">Mensalidade - Agosto 2024</span>
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-medium">
                      Pendente
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                    <span>Vencimento: 09/08/2024</span>
                    <span className="font-bold text-gray-900">R$ 150,00</span>
                  </div>
                  <Button 
                    className="w-full text-white font-medium"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pagar Agora (Pix/Boleto)
                  </Button>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">Taxa de Graduação</span>
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded font-medium">
                      Vencido
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                    <span>Vencimento: 24/07/2024</span>
                    <span className="font-bold text-gray-900">R$ 50,00</span>
                  </div>
                  <Button 
                    className="w-full text-white font-medium"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pagar Agora (Pix/Boleto)
                  </Button>
                </div>
              </div>

              <div className="text-center pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Dúvidas? Entre em contato com a secretaria da escola
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}