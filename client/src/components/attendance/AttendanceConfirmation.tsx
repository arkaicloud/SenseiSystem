import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ClassWithAttendance {
  id: number;
  name: string;
  startTime: string;
  duration: number;
  maxCapacity: number;
  instructorName?: string;
  currentAttendance: number;
  isConfirmed: boolean;
  canConfirm: boolean;
}

const AttendanceConfirmation: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [confirmingClassId, setConfirmingClassId] = useState<number | null>(null);

  // Buscar aulas de hoje
  const { data: todayClassesData, isLoading } = useQuery({
    queryKey: ['/api/classes/today'],
  });

  // Buscar confirmações do usuário atual
  const { data: userAttendanceData } = useQuery({
    queryKey: ['/api/attendance/by-student', user?.id],
    enabled: !!user?.id,
  });

  const classes: ClassWithAttendance[] = (todayClassesData?.classes || []).map((classItem: any) => {
    const userConfirmation = (userAttendanceData?.attendances || []).find(
      (att: any) => att.classId === classItem.id && 
      format(new Date(att.date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
    );

    return {
      ...classItem,
      currentAttendance: classItem.attendanceCount || 0,
      isConfirmed: !!userConfirmation && userConfirmation.status === 'present',
      canConfirm: !userConfirmation || userConfirmation.status !== 'present'
    };
  });

  // Mutation para confirmar presença
  const confirmAttendanceMutation = useMutation({
    mutationFn: async (classId: number) => {
      const response = await apiRequest('POST', '/api/attendance/confirm', {
        classId
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao confirmar presença');
      }
      
      return response.json();
    },
    onSuccess: (data, classId) => {
      const className = classes.find(c => c.id === classId)?.name;
      toast({
        title: "Presença confirmada!",
        description: `Sua presença na aula "${className}" foi confirmada com sucesso.`,
      });
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['/api/classes/today'] });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/by-student', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao confirmar presença",
        description: error.message || "Ocorreu um erro ao confirmar sua presença.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setConfirmingClassId(null);
    }
  });

  // Mutation para cancelar presença
  const cancelAttendanceMutation = useMutation({
    mutationFn: async (classId: number) => {
      const response = await apiRequest('DELETE', '/api/attendance/cancel', {
        classId
      });
      return response.json();
    },
    onSuccess: (data, classId) => {
      const className = classes.find(c => c.id === classId)?.name;
      toast({
        title: "Presença cancelada!",
        description: `Sua presença na aula "${className}" foi cancelada.`,
      });
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['/api/classes/today'] });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/by-student', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao cancelar presença",
        description: error.message || "Ocorreu um erro ao cancelar sua presença.",
        variant: "destructive",
      });
    }
  });

  const handleConfirmAttendance = (classId: number) => {
    setConfirmingClassId(classId);
    confirmAttendanceMutation.mutate(classId);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!classes.length) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-gray-500 mb-2">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Nenhuma aula hoje</h3>
          <p className="text-gray-600">
            Não há aulas programadas para hoje. Volte amanhã para conferir a programação!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Aulas de Hoje</h2>
        <Badge variant="outline" className="text-sm">
          {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </Badge>
      </div>

      {classes.map((classItem) => (
        <Card key={classItem.id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{classItem.name}</CardTitle>
              <div className="flex items-center gap-2">
                {user?.role !== 'student' && (
                  <Badge variant="secondary" className="text-sm">
                    <Users className="w-3 h-3 mr-1" />
                    {classItem.currentAttendance}/{classItem.maxCapacity}
                  </Badge>
                )}
                <Badge 
                  variant={classItem.isConfirmed ? "default" : "outline"}
                  className={classItem.isConfirmed ? "bg-green-500" : ""}
                >
                  {classItem.isConfirmed ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Confirmado
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3 mr-1" />
                      Pendente
                    </>
                  )}
                </Badge>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="w-4 h-4 mr-2" />
                  {classItem.startTime} - {classItem.duration} minutos
                </div>
                {classItem.instructorName && (
                  <div className="text-sm text-gray-600">
                    Professor: {classItem.instructorName}
                  </div>
                )}
              </div>

              {user?.role === 'student' && (
                <>
                  {classItem.canConfirm ? (
                    <Button
                      onClick={() => handleConfirmAttendance(classItem.id)}
                      disabled={confirmingClassId === classItem.id || confirmAttendanceMutation.isPending}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      {confirmingClassId === classItem.id ? (
                        "Confirmando..."
                      ) : (
                        "Confirmar Presença"
                      )}
                    </Button>
                  ) : classItem.isConfirmed ? (
                    <div className="flex items-center gap-2">
                      <span className="text-green-600 font-medium">✓ Confirmado</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => cancelAttendanceMutation.mutate(classItem.id)}
                        disabled={cancelAttendanceMutation.isPending}
                        className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                      >
                        {cancelAttendanceMutation.isPending ? "Cancelando..." : "Cancelar"}
                      </Button>
                    </div>
                  ) : null}
                </>
              )}

              {user?.role !== 'student' && (
                <Button
                  variant="outline"
                  onClick={() => window.location.href = `/attendance?class=${classItem.id}`}
                >
                  Gerenciar Presença
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AttendanceConfirmation;