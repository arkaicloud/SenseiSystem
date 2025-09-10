import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, User, CheckCircle, Calendar, XCircle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ClassSession {
  id: number;
  name: string;
  startTime: string;
  endTime?: string;
  instructorName?: string;
  location?: string;
  attendanceConfirmed: boolean;
}

interface TodayClassesProps {
  classes: ClassSession[];
  onCheckIn: (classId: number) => void;
  onCancel?: (classId: number) => void;
  primaryColor: string;
  isLoading?: boolean;
}

export const TodayClasses = ({ classes, onCheckIn, onCancel, primaryColor, isLoading }: TodayClassesProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [checkedInClasses, setCheckedInClasses] = useState<Set<number>>(new Set());

  // Sincronizar o estado local com os dados da API sempre que mudarem
  useEffect(() => {
    const confirmedIds = classes.filter(c => c.attendanceConfirmed).map(c => c.id);
    setCheckedInClasses(new Set(confirmedIds));
  }, [classes]);

  // Mutação para cancelar presença
  const cancelAttendanceMutation = useMutation({
    mutationFn: async (classId: number) => {
      const response = await apiRequest('DELETE', '/api/attendance/cancel', {
        classId: classId,
        date: new Date().toISOString().split('T')[0]
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao cancelar presença");
      }
      
      return response.json();
    },
    onSuccess: (data, classId) => {
      // Remover o ID da aula da lista de aulas confirmadas
      setCheckedInClasses(prev => {
        const newSet = new Set(Array.from(prev));
        newSet.delete(classId);
        return newSet;
      });
      
      // Atualizar dados
      queryClient.invalidateQueries({ queryKey: ['/api/classes/today'] });
      
      toast({
        title: "Presença cancelada!",
        description: "Sua confirmação de presença foi cancelada.",
        variant: "default",
      });
      
      if (onCancel) {
        onCancel(classId);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao cancelar",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleCheckIn = (classId: number) => {
    setCheckedInClasses(prev => {
      const newSet = new Set(Array.from(prev));
      newSet.add(classId);
      return newSet;
    });
    onCheckIn(classId);
  };

  const isCheckedIn = (classId: number) => checkedInClasses.has(classId) || classes.find(c => c.id === classId)?.attendanceConfirmed;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" style={{ color: primaryColor }} />
            Aulas de Hoje
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Carregando aulas...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!classes || classes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" style={{ color: primaryColor }} />
            Aulas de Hoje
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p>Nenhuma aula agendada para hoje</p>
            <p className="text-sm">Aproveite para descansar e se preparar para as próximas aulas!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" style={{ color: primaryColor }} />
          Aulas de Hoje
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {classes.map((classSession) => (
          <div key={classSession.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold">{classSession.name}</h3>
                  <Badge variant="outline" className="text-xs">
                    {classSession.location || 'Tatame 1'}
                  </Badge>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{classSession.startTime} - {classSession.endTime || '20:30'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>Professor {classSession.instructorName || 'Marcus'}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2 sm:flex-shrink-0">
                {isCheckedIn(classSession.id) ? (
                  <>
                    <div className="flex items-center justify-center gap-2 text-green-600 py-2 px-3 bg-green-50 rounded-md sm:bg-transparent sm:p-0">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">Confirmado</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => cancelAttendanceMutation.mutate(classSession.id)}
                      disabled={cancelAttendanceMutation.isPending}
                      className="w-full sm:w-auto text-red-500 border-red-200 hover:text-red-700 hover:bg-red-50"
                    >
                      {cancelAttendanceMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <XCircle className="w-4 h-4 mr-2" />
                      )}
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleCheckIn(classSession.id)}
                    className="w-full sm:w-auto text-white font-medium"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirmar Presença
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};