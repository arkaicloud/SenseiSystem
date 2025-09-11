import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, User, CheckCircle, XCircle, Loader2, Calendar } from "lucide-react";
import { useBookingMutations, type BookingStatus } from "@/hooks/useBookingMutations";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ClassSession {
  id: number;
  name: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  instructorName?: string;
  location?: string;
  attendanceConfirmed: boolean;
  bookingStatus?: BookingStatus;
  dateISO?: string;
  canConfirm?: boolean;
  canCancel?: boolean;
  maxCapacity?: number;
  attendanceCount?: number;
}

interface TodayClassesProps {
  classes: ClassSession[];
  studentId: number;
  primaryColor: string;
  isLoading?: boolean;
}

export const TodayClasses = ({ classes, studentId, primaryColor, isLoading }: TodayClassesProps) => {
  const { confirmMutation, cancelMutation, isLoading: isMutating } = useBookingMutations(studentId);

  const handleConfirm = (classSession: ClassSession) => {
    const today = new Date().toISOString().split('T')[0];
    const dateISO = classSession.dateISO || today;

    confirmMutation.mutate({
      classId: classSession.id,
      dateISO: dateISO
    });
  };

  const handleCancel = (classSession: ClassSession) => {
    const today = new Date().toISOString().split('T')[0];
    const dateISO = classSession.dateISO || today;

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

  const formatTime = (time: string, duration?: number) => {
    if (duration) {
      const [hours, minutes] = time.split(':').map(Number);
      const startMinutes = hours * 60 + minutes;
      const endMinutes = startMinutes + duration;
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      return `${time} - ${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
    }
    return time;
  };

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
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-24"></div>
              </div>
            ))}
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
        <p className="text-sm text-muted-foreground">
          {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {classes.map((classSession) => (
          <div
            key={classSession.id}
            className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-medium">{classSession.name}</h4>
                  <Badge variant="outline" className="text-xs">
                    {classSession.location || 'Tatame Principal'}
                  </Badge>
                  {classSession.maxCapacity && (
                    <Badge variant="secondary" className="text-xs">
                      {classSession.attendanceCount || 0}/{classSession.maxCapacity}
                    </Badge>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatTime(classSession.startTime, classSession.duration)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>{classSession.instructorName || 'Instrutor'}</span>
                  </div>
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
                      onClick={() => handleCancel(classSession)}
                      disabled={isMutating}
                      className="w-full sm:w-auto text-red-500 border-red-200 hover:text-red-700 hover:bg-red-50"
                    >
                      {isMutating ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4 mr-2" />
                      )}
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleConfirm(classSession)}
                    disabled={isMutating}
                    className="w-full sm:w-auto text-white font-medium bg-blue-500 hover:bg-blue-600"
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
      </CardContent>
    </Card>
  );
};

export default TodayClasses;