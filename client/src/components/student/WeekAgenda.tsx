import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, User, CheckCircle, XCircle, Loader2, Calendar } from "lucide-react";
import { useBookingMutations, type BookingStatus } from "@/hooks/useBookingMutations";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ClassSession {
  id: number;
  name: string;
  startTime: string;
  endTime?: string;
  instructorName?: string;
  location?: string;
  attendanceConfirmed: boolean;
  bookingStatus?: BookingStatus;
  dateISO?: string;
  canConfirm?: boolean;
  canCancel?: boolean;
}

interface DayAgenda {
  date: string;
  dayOfWeek: number;
  dayName: string;
  classes: ClassSession[];
}

interface WeekAgendaProps {
  weekData: DayAgenda[];
  studentId: number;
  primaryColor: string;
  isLoading?: boolean;
}

export const WeekAgenda = ({ weekData, studentId, primaryColor, isLoading }: WeekAgendaProps) => {
  const { confirmMutation, cancelMutation, isLoading: isMutating } = useBookingMutations(studentId);
  
  // Debug
  React.useEffect(() => {
    console.log('🔍 WeekAgenda props:', { 
      weekDataLength: weekData?.length, 
      studentId, 
      isLoading,
      weekData: weekData?.slice(0, 2) // Log primeiros 2 dias para debug
    });
  }, [weekData, studentId, isLoading]);

  const handleConfirm = (classSession: ClassSession, date: string) => {
    const dateISO = classSession.dateISO || date;
    confirmMutation.mutate({
      classId: classSession.id,
      dateISO: dateISO
    });
  };

  const handleCancel = (classSession: ClassSession, date: string) => {
    const dateISO = classSession.dateISO || date;
    cancelMutation.mutate({
      classId: classSession.id,
      dateISO: dateISO
    });
  };

  const isConfirmed = (classSession: ClassSession) => {
    // Priorizar bookingStatus se disponível e não null, senão usar attendanceConfirmed
    if (classSession.bookingStatus != null) {
      return classSession.bookingStatus === 'CONFIRMED';
    }
    return classSession.attendanceConfirmed;
  };

  const formatDayHeader = (dateStr: string, dayName: string) => {
    try {
      const date = parseISO(dateStr);
      const dayNumber = format(date, 'd', { locale: ptBR });
      const monthName = format(date, 'MMM', { locale: ptBR });
      return `${dayName} - ${dayNumber} ${monthName}`;
    } catch {
      return `${dayName} - ${dateStr}`;
    }
  };

  const isToday = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" style={{ color: primaryColor }} />
            Agenda Semanal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mx-auto mb-4"></div>
              <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
            </div>
            <p className="text-muted-foreground mt-4">Carregando agenda...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filtrar dias com aulas
  const daysWithClasses = (weekData ?? []).filter(dayData => dayData.classes.length > 0);

  if (!isLoading && daysWithClasses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" style={{ color: primaryColor }} />
            Agenda Semanal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p>Nenhuma aula encontrada para esta semana</p>
            <p className="text-sm mt-2">Verifique com a academia sobre os horários disponíveis</p>
            <p className="text-xs mt-1 text-muted-foreground/70">StudentId: {studentId}</p>
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
          Agenda Semanal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {daysWithClasses.map((dayData) => (
          <div key={dayData.date} className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 
                className={`font-semibold text-lg font-inter ${isToday(dayData.date) ? 'text-[#2B54FF]' : 'text-foreground'}`}
                data-testid={`text-day-header-${dayData.date}`}
              >
                {formatDayHeader(dayData.date, dayData.dayName)}
              </h3>
              {isToday(dayData.date) && (
                <Badge variant="default" className="text-xs bg-[#EEF1FF] text-[#2B54FF]">
                  Hoje
                </Badge>
              )}
            </div>

            <div className="space-y-3">
              {dayData.classes.map((classSession) => (
                <div
                    key={`${dayData.date}-${classSession.id}`}
                    className="border rounded-lg p-4 hover:shadow-sm transition-shadow ml-4"
                    data-testid={`class-card-${dayData.date}-${classSession.id}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium" data-testid={`text-class-name-${dayData.date}-${classSession.id}`}>
                            {classSession.name}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {classSession.location || 'Tatame 1'}
                          </Badge>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{classSession.startTime} - {classSession.endTime}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>{classSession.instructorName}</span>
                          </div>
                          {classSession.location && (
                            <div className="flex items-center gap-1 text-xs">
                              <span>📍 {classSession.location}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2 sm:flex-shrink-0">
                        {isConfirmed(classSession) ? (
                          <>
                            <div className="flex items-center justify-center gap-2 text-green-600 py-2 px-3 bg-green-50 rounded-md sm:bg-transparent sm:p-0">
                              <CheckCircle className="w-5 h-5" />
                              <span className="text-sm font-medium">Confirmado</span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancel(classSession, dayData.date)}
                              disabled={isMutating}
                              className="w-full sm:w-auto text-red-500 border-red-200 hover:text-red-700 hover:bg-red-50"
                              data-testid={`button-cancel-${dayData.date}-${classSession.id}`}
                            >
                              {isMutating ? (
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
                            onClick={() => handleConfirm(classSession, dayData.date)}
                            disabled={isMutating}
                            className="w-full sm:w-auto text-white font-medium bg-[#2B54FF] hover:bg-[#1A3FCC] rounded-2xl font-inter"
                            data-testid={`button-confirm-${dayData.date}-${classSession.id}`}
                          >
                            {isMutating ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <CheckCircle className="w-4 h-4 mr-2" />
                            )}
                            Confirmar Presença
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};