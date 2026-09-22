import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, XCircle, Loader2, Calendar } from "lucide-react";
import { useBookingMutations, type BookingStatus } from "@/hooks/useBookingMutations";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { localCalendarDateKey } from "@shared/calendarDates";

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
  isCancelled?: boolean;
}

interface TodayClassesProps {
  classes: ClassSession[];
  studentId: number;
  primaryColor: string;
  isLoading?: boolean;
}

export const TodayClasses = ({ classes, studentId, primaryColor, isLoading }: TodayClassesProps) => {
  const { confirmMutation, cancelMutation, isLoading: isMutating } = useBookingMutations(studentId);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  const handleConfirm = (classSession: ClassSession) => {
    const today = localCalendarDateKey();
    const dateISO = classSession.dateISO || today;

    confirmMutation.mutate({
      classId: classSession.id,
      dateISO: dateISO
    });
  };

  const handleCancel = (classSession: ClassSession) => {
    const today = localCalendarDateKey();
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

  const getTimeInMinutes = (time?: string) => {
    if (!time) return Number.MAX_SAFE_INTEGER;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const currentBrasiliaMinutes = (() => {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(now);
    return (
      Number(parts.find((part) => part.type === "hour")?.value || 0) * 60 +
      Number(parts.find((part) => part.type === "minute")?.value || 0)
    );
  })();

  const visibleClasses = classes.filter((classSession) => {
    if (classSession.isCancelled) return false;
    const endTime = classSession.endTime
      ? getTimeInMinutes(classSession.endTime)
      : getTimeInMinutes(classSession.startTime) + (classSession.duration || 90);
    return endTime > currentBrasiliaMinutes;
  });

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
                <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-muted rounded w-24"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!visibleClasses || visibleClasses.length === 0) {
    return (
      <Card className="overflow-hidden rounded-2xl border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="w-5 h-5" style={{ color: primaryColor }} />
            Aulas de Hoje
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-8">
          <div className="py-5 text-center text-muted-foreground">
            <Calendar className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm">Nenhuma aula disponível para hoje</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden rounded-2xl border-border/60 shadow-sm">
      <CardHeader className="flex-row items-start justify-between gap-3 pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="w-5 h-5" style={{ color: primaryColor }} />
            Aulas de Hoje
          </CardTitle>
          <p className="mt-1 text-xs capitalize text-muted-foreground">
            {format(now, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <Badge variant="secondary" className="rounded-full px-2.5 text-[11px]">
          {visibleClasses.length} {visibleClasses.length === 1 ? "aula" : "aulas"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3 px-3 pb-4 pt-0">
        {visibleClasses.map((classSession) => (
          <div
            key={classSession.id}
            className="rounded-2xl border border-border/60 border-l-4 border-l-primary bg-card px-3 py-3 shadow-[0_5px_18px_rgba(30,64,175,0.06)] transition-shadow hover:shadow-[0_8px_24px_rgba(30,64,175,0.10)]"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="truncate text-[15px] font-bold text-foreground">
                    {classSession.name}
                  </h4>
                  {classSession.maxCapacity && (
                    <Badge variant="secondary" className="shrink-0 rounded-full px-2 text-[10px]">
                      {classSession.attendanceCount || 0}/{classSession.maxCapacity}
                    </Badge>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 font-medium text-primary">
                    <Clock className="h-3.5 w-3.5" />
                    {formatTime(classSession.startTime, classSession.duration)}
                  </span>
                  {classSession.location && <span className="truncate">{classSession.location}</span>}
                </div>
              </div>
              <div className="flex w-full shrink-0 items-center justify-end gap-2 sm:w-auto">
                {isConfirmed(classSession) ? (
                  <>
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-xs font-semibold">Reservada</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancel(classSession)}
                      disabled={isMutating}
                      className="h-8 px-2 text-xs text-red-500 border-red-200 hover:bg-red-50 hover:text-red-700"
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
                     className="w-full sm:w-auto text-white font-medium bg-primary hover:bg-[#1A3FCC] rounded-2xl font-inter"
                  >
                    {isMutating ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Reservar aula
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