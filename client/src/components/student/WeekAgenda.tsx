import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, 
  ChevronDown, 
  ChevronRight, 
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
}

export const WeekAgenda = ({ studentId, primaryColor = "#B85C38" }: WeekAgendaProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loadingActions, setLoadingActions] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para buscar aulas da semana
  const { data: weekClasses, isLoading } = useQuery({
    queryKey: [`/api/students/${studentId}/classes/week`],
    queryFn: async () => {
      // Por enquanto, simular dados da semana usando as aulas de hoje
      const today = new Date();
      const startDate = format(startOfDay(today), 'yyyy-MM-dd');
      
      const response = await apiRequest('GET', '/api/classes/today');
      if (!response.ok) {
        throw new Error('Erro ao buscar aulas');
      }
      
      const data = await response.json();
      
      // Criar dados simulados para a semana
      const weekData: DayClasses[] = [];
      
      for (let i = 0; i < 7; i++) {
        const currentDate = addDays(today, i);
        const dayName = format(currentDate, 'EEEE', { locale: ptBR });
        
        // Simular algumas aulas para cada dia (em uma implementação real, isso viria da API)
        const dayClasses = data.classes?.map((cls: any, index: number) => ({
          ...cls,
          // Simular confirmação para dias futuros
          attendanceConfirmed: i === 0 ? cls.attendanceConfirmed : false,
          canConfirm: i >= 0, // Pode confirmar hoje e no futuro
          canCancel: i >= 0 && cls.attendanceConfirmed
        })).slice(0, Math.max(1, Math.floor(Math.random() * 4) + 1)) || [];
        
        weekData.push({
          date: currentDate,
          dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1),
          classes: dayClasses
        });
      }
      
      return weekData;
    },
    enabled: isOpen, // Só carrega quando o accordion é aberto
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
    <Card data-testid="card-week-agenda">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Agenda da Semana
              </div>
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5, 6, 7].map(i => (
                  <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {weekClasses?.map((day) => (
                  <div key={day.date.toISOString()} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="font-semibold text-lg">
                        {day.dayName}
                      </h3>
                      <Badge variant={isToday(day.date) ? "default" : "outline"}>
                        {format(day.date, 'dd/MM')}
                      </Badge>
                      {isToday(day.date) && (
                        <Badge style={{ backgroundColor: primaryColor }}>
                          Hoje
                        </Badge>
                      )}
                    </div>
                    
                    {day.classes.length === 0 ? (
                      <p className="text-muted-foreground text-sm">
                        Nenhuma aula programada
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {day.classes.map((classItem) => {
                          const actionKey = `${classItem.id}-${format(day.date, 'yyyy-MM-dd')}`;
                          const isActionLoading = loadingActions.has(actionKey);
                          
                          return (
                            <div
                              key={`${classItem.id}-${day.date.toISOString()}`}
                              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded"
                              data-testid={`week-class-${classItem.id}-${format(day.date, 'yyyy-MM-dd')}`}
                            >
                              <div className="flex-1">
                                <h4 className="font-medium">{classItem.name}</h4>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {classItem.startTime}
                                  </div>
                                  {classItem.instructorName && (
                                    <div className="flex items-center gap-1">
                                      <User className="h-3 w-3" />
                                      {classItem.instructorName}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {classItem.attendanceConfirmed ? (
                                  <>
                                    <Badge variant="secondary" className="flex items-center gap-1">
                                      <CheckCircle className="h-3 w-3" />
                                      Confirmado
                                    </Badge>
                                    {classItem.canCancel && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleCancelAttendance(classItem.id, day.date)}
                                        disabled={isActionLoading}
                                        data-testid={`button-cancel-${classItem.id}-${format(day.date, 'yyyy-MM-dd')}`}
                                      >
                                        {isActionLoading ? (
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                          <X className="h-3 w-3" />
                                        )}
                                      </Button>
                                    )}
                                  </>
                                ) : (
                                  classItem.canConfirm && (
                                    <Button
                                      size="sm"
                                      style={{ backgroundColor: primaryColor }}
                                      onClick={() => handleConfirmAttendance(classItem.id, day.date)}
                                      disabled={isActionLoading}
                                      data-testid={`button-confirm-${classItem.id}-${format(day.date, 'yyyy-MM-dd')}`}
                                    >
                                      {isActionLoading ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        "Confirmar"
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
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};