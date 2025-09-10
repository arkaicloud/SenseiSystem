import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, 
  Clock, 
  User, 
  CheckCircle, 
  Loader2,
  X
} from "lucide-react";
import { format, addDays, startOfDay, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ClassSession {
  id: number;
  name: string;
  startTime: string;
  endTime?: string;
  instructorName?: string;
  location?: string;
  attendanceConfirmed?: boolean;
  canConfirm?: boolean;
  canCancel?: boolean;
}

interface DayClasses {
  date: Date;
  dayName: string;
  classes: ClassSession[];
}

interface WeekAgendaProps {
  studentId: number;
  primaryColor?: string;
  showHeader?: boolean;
}

export const WeekAgenda = ({ studentId, primaryColor = "#B85C38", showHeader = true }: WeekAgendaProps) => {
  const [loadingActions, setLoadingActions] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para buscar aulas da semana
  const { data: weekClasses, isLoading } = useQuery({
    queryKey: [`/api/students/${studentId}/classes/week`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/students/${studentId}/classes/week`);
      if (!response.ok) {
        throw new Error('Erro ao buscar agenda da semana');
      }
      
      const data = await response.json();
      const weekData = data.weekData || [];
      
      // Converter os dados para o formato esperado pelo componente
      const formattedWeekData: DayClasses[] = weekData.map((dayData: any) => {
        const currentDate = new Date(dayData.date);
        const dayName = format(currentDate, 'EEEE', { locale: ptBR });
        
        return {
          date: currentDate,
          dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1),
          classes: dayData.classes || []
        };
      });
      
      return formattedWeekData;
    },
    enabled: !!studentId, // Carrega automaticamente
  });

  // Mutation para confirmar presença
  const confirmAttendanceMutation = useMutation({
    mutationFn: async ({ classId, date }: { classId: number; date: string }) => {
      const response = await apiRequest('POST', '/api/attendance/confirm', {
        classId,
        date
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao confirmar presença");
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/students/${studentId}/classes/week`] });
      queryClient.invalidateQueries({ queryKey: ['/api/classes/today'] });
      
      toast({
        title: "Presença confirmada!",
        description: "Sua confirmação foi registrada com sucesso.",
      });
      
      setLoadingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(`${variables.classId}-${variables.date}`);
        return newSet;
      });
    },
    onError: (error: any, variables) => {
      toast({
        title: "Erro ao confirmar presença",
        description: error.message,
        variant: "destructive",
      });
      
      setLoadingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(`${variables.classId}-${variables.date}`);
        return newSet;
      });
    },
  });

  // Mutation para cancelar presença
  const cancelAttendanceMutation = useMutation({
    mutationFn: async ({ classId, date }: { classId: number; date: string }) => {
      const response = await apiRequest('DELETE', '/api/attendance/cancel', {
        classId,
        date
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao cancelar presença");
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/students/${studentId}/classes/week`] });
      queryClient.invalidateQueries({ queryKey: ['/api/classes/today'] });
      
      toast({
        title: "Presença cancelada",
        description: "Sua confirmação foi cancelada.",
      });
      
      setLoadingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(`${variables.classId}-${variables.date}`);
        return newSet;
      });
    },
    onError: (error: any, variables) => {
      toast({
        title: "Erro ao cancelar presença",
        description: error.message,
        variant: "destructive",
      });
      
      setLoadingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(`${variables.classId}-${variables.date}`);
        return newSet;
      });
    },
  });

  const handleConfirmAttendance = (classId: number, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const actionKey = `${classId}-${dateStr}`;
    
    setLoadingActions(prev => new Set(prev).add(actionKey));
    confirmAttendanceMutation.mutate({ classId, date: dateStr });
  };

  const handleCancelAttendance = (classId: number, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const actionKey = `${classId}-${dateStr}`;
    
    setLoadingActions(prev => new Set(prev).add(actionKey));
    cancelAttendanceMutation.mutate({ classId, date: dateStr });
  };

  const isToday = (date: Date) => {
    return isSameDay(date, new Date());
  };

  return (
    <Card data-testid="card-week-agenda" className="w-full">
      {showHeader && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Agenda da Semana
          </CardTitle>
        </CardHeader>
      )}
      
      <CardContent className={showHeader ? "" : "pt-6"}>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6, 7].map(i => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {weekClasses?.map((day) => (
              <Card key={day.date.toISOString()} className="w-full shadow-sm border border-gray-200 dark:border-gray-700">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                      {day.dayName}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={isToday(day.date) ? "default" : "outline"}
                        className="text-sm"
                      >
                        {format(day.date, 'dd/MM')}
                      </Badge>
                      {isToday(day.date) && (
                        <Badge 
                          className="text-sm text-white font-medium"
                          style={{ backgroundColor: primaryColor }}
                        >
                          Hoje
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                
                {day.classes.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      Nenhuma aula programada
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {day.classes.map((classItem) => {
                      const actionKey = `${classItem.id}-${format(day.date, 'yyyy-MM-dd')}`;
                      const isActionLoading = loadingActions.has(actionKey);
                      
                      return (
                        <div
                          key={`${classItem.id}-${day.date.toISOString()}`}
                          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600"
                          data-testid={`week-class-${classItem.id}-${format(day.date, 'yyyy-MM-dd')}`}
                        >
                          {/* Informações da aula - Coluna 1 */}
                          <div className="flex flex-col space-y-2 md:col-span-1 lg:col-span-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white text-base">{classItem.name}</h4>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span className="font-medium">{classItem.startTime}</span>
                              </div>
                              {classItem.instructorName && (
                                <div className="flex items-center gap-1">
                                  <User className="h-4 w-4" />
                                  <span>{classItem.instructorName}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Ações (CTA) - Coluna 2/3 */}
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 md:col-span-1 lg:col-span-1">
                            {classItem.attendanceConfirmed ? (
                              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                <Badge variant="secondary" className="flex items-center justify-center gap-1 py-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                  <CheckCircle className="h-4 w-4" />
                                  <span>Confirmado</span>
                                </Badge>
                                {classItem.canCancel && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="w-full sm:w-auto h-10 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900"
                                    onClick={() => handleCancelAttendance(classItem.id, day.date)}
                                    disabled={isActionLoading}
                                    data-testid={`button-cancel-${classItem.id}-${format(day.date, 'yyyy-MM-dd')}`}
                                  >
                                    {isActionLoading ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <X className="h-4 w-4" />
                                    )}
                                    <span className="ml-1">Cancelar</span>
                                  </Button>
                                )}
                              </div>
                            ) : (
                              classItem.canConfirm && (
                                <Button
                                  size="sm"
                                  className="w-full sm:w-auto h-10 text-white font-medium"
                                  style={{ backgroundColor: primaryColor }}
                                  onClick={() => handleConfirmAttendance(classItem.id, day.date)}
                                  disabled={isActionLoading}
                                  data-testid={`button-confirm-${classItem.id}-${format(day.date, 'yyyy-MM-dd')}`}
                                >
                                  {isActionLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      <span>Confirmar Presença</span>
                                    </>
                                  )}
                                </Button>
                              )
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};