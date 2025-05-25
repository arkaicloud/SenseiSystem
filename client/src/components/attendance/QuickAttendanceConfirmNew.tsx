import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CalendarDays, CheckCircle, Clock, Loader2, XCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { formatTime } from "@/lib/utils";

interface QuickAttendanceConfirmProps {
  userId: number;
  compact?: boolean;
}

const QuickAttendanceConfirm: React.FC<QuickAttendanceConfirmProps> = ({ 
  userId, 
  compact = false 
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [confirmedClasses, setConfirmedClasses] = useState<number[]>([]);
  
  // Buscar aulas do dia
  const { data: classesData, isLoading } = useQuery({
    queryKey: ['/api/classes/today'],
    refetchInterval: 300000, // Atualiza a cada 5 minutos
  });
  
  // Buscar estudante pelo userId
  const { data: studentData } = useQuery({
    queryKey: ['/api/students/by-user', userId],
    enabled: !!userId,
  });
  
  // Buscar presenças do aluno
  const { data: attendanceData } = useQuery({
    queryKey: ['/api/attendance/by-student', userId],
    enabled: !!userId,
  });

  // Processar dados das aulas do dia
  const todaysClasses = classesData?.classes || [];
  // Simplificar filtro para mostrar todas as aulas do dia para fins de demonstração
  const availableClasses = todaysClasses;
  
  // Verificar se há aulas disponíveis
  const hasAvailableClasses = availableClasses.length > 0;
  
  // Atualizar classes confirmadas com base nos dados de presença
  useEffect(() => {
    if (attendanceData && Array.isArray(attendanceData)) {
      // Criar uma lista de IDs de aulas em que o aluno já marcou presença hoje
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      const confirmedIds = attendanceData
        .filter(attendance => {
          const attendanceDate = new Date(attendance.date).toISOString().split('T')[0];
          return attendanceDate === today;
        })
        .map(attendance => attendance.classId);
      
      setConfirmedClasses(confirmedIds);
    }
  }, [attendanceData]);
  
  // Mutação para confirmar presença
  const { mutate: confirmAttendance, isPending } = useMutation({
    mutationFn: async (classId: number) => {
      if (!studentData?.student) {
        throw new Error("Informações do aluno não disponíveis");
      }
      
      const response = await apiRequest('POST', '/api/attendance', {
        studentId: studentData.student.id,
        classId: classId,
        date: new Date(),
        status: 'present'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao confirmar presença");
      }
      
      return response.json();
    },
    onSuccess: (data, classId) => {
      // Adicionar o ID da aula à lista de aulas confirmadas
      setConfirmedClasses(prev => [...prev, classId]);
      
      // Atualizar dados de presença
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/by-student', userId] });
      
      toast({
        title: t('presenca_confirmada'),
        description: t('presenca_confirmada_sucesso'),
        variant: "default",
      });
      
      setSelectedClassId(null);
    },
    onError: (error: Error) => {
      toast({
        title: t('erro_ao_confirmar'),
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Mutação para cancelar presença
  const { mutate: cancelAttendance, isPending: isCancelling } = useMutation({
    mutationFn: async (classId: number) => {
      if (!studentData?.student) {
        throw new Error("Informações do aluno não disponíveis");
      }
      
      const response = await apiRequest('DELETE', '/api/attendance/cancel', {
        studentId: studentData.student.id,
        classId: classId,
        date: new Date()
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao cancelar presença");
      }
      
      return response.json();
    },
    onSuccess: (data, classId) => {
      // Remover o ID da aula da lista de aulas confirmadas
      setConfirmedClasses(prev => prev.filter(id => id !== classId));
      
      // Atualizar dados de presença
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/by-student', userId] });
      
      toast({
        title: t('presenca_cancelada'),
        description: t('presenca_cancelada_sucesso'),
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('erro_ao_cancelar'),
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Se não houver aulas disponíveis e estiver no modo compacto, mostrar apenas um botão desabilitado
  if (compact && !hasAvailableClasses) {
    return (
      <Button disabled className="w-full">
        {t('sem_aulas_disponiveis_agora')}
      </Button>
    );
  }
  
  // Se estiver carregando e for compacto
  if (isLoading && compact) {
    return (
      <Button disabled className="w-full">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        {t('carregando')}
      </Button>
    );
  }
  
  // Se for modo compacto com aulas disponíveis
  if (compact) {
    const classItem = availableClasses[0];
    const { time, period } = formatTime(classItem.startTime);
    const isConfirmed = confirmedClasses.includes(classItem.id);
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm font-medium">{classItem.name}</div>
            <div className="text-xs text-gray-500">
              {time} • {classItem.duration} min
            </div>
          </div>
          
          {isConfirmed ? (
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <CheckCircle className="mr-2 h-3 w-3" />
                {t('presenca_confirmada')}
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-red-500 border-red-200 hover:text-red-700 hover:bg-red-50"
                onClick={() => cancelAttendance(classItem.id)}
                disabled={isCancelling}
              >
                {isCancelling ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
              </Button>
            </div>
          ) : (
            <Button 
              size="sm" 
              onClick={() => confirmAttendance(classItem.id)}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
              {t('confirmar')}
            </Button>
          )}
        </div>
      </div>
    );
  }
  
  // Versão completa (não compacta)
  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-lg font-semibold mb-4">{t('aulas_hoje')}</h3>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !hasAvailableClasses ? (
          <div className="text-center py-4 text-gray-500">
            {t('sem_aulas_disponiveis_hoje')}
          </div>
        ) : (
          <div className="space-y-4">
            {availableClasses.map(c => {
              const { time, period } = formatTime(c.startTime);
              const isConfirmed = confirmedClasses.includes(c.id);
              
              return (
                <div 
                  key={c.id} 
                  className={`p-3 rounded-lg border ${
                    isConfirmed ? 'bg-green-50 border-green-200' : 'bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">{c.name}</h4>
                      <p className="text-sm text-gray-500">{c.description}</p>
                    </div>
                    {isConfirmed && (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        {t('presenca_confirmada')}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {time} • {c.duration} min
                    </div>
                    <div className="flex items-center">
                      <CalendarDays className="h-4 w-4 mr-1" />
                      {t('hoje')}
                    </div>
                  </div>
                  
                  {!isConfirmed ? (
                    <Button 
                      className="w-full mt-3" 
                      onClick={() => confirmAttendance(c.id)}
                      disabled={isPending}
                    >
                      {isPending && selectedClassId === c.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      {t('confirmar_presenca')}
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      className="w-full mt-3 text-red-500 border-red-200 hover:text-red-700 hover:bg-red-50"
                      onClick={() => cancelAttendance(c.id)}
                      disabled={isCancelling}
                    >
                      {isCancelling ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="mr-2 h-4 w-4" />
                      )}
                      {t('cancelar_presenca')}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuickAttendanceConfirm;