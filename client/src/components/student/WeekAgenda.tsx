import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  BanIcon,
  CalendarDays,
  CheckCircle,
  Clock,
  Loader2,
  Plus,
  XCircle,
} from "lucide-react";
import { useBookingMutations, type BookingStatus } from "@/hooks/useBookingMutations";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { localCalendarDateKey } from "@shared/calendarDates";
import { Link } from "wouter";

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
  isCancelled?: boolean;
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
  isLoading?: boolean;
}

export const WeekAgenda = ({ weekData, studentId, isLoading }: WeekAgendaProps) => {
  const { confirmMutation, cancelMutation, isLoading: isMutating } = useBookingMutations(studentId);
  const days = weekData ?? [];
  const firstDayWithClasses = days.find((day) => day.classes.length > 0)?.date;
  const today = localCalendarDateKey();
  const [selectedDate, setSelectedDate] = useState(today);

  useEffect(() => {
    if (!days.some((day) => day.date === selectedDate)) {
      setSelectedDate(
        days.some((day) => day.date === today)
          ? today
          : firstDayWithClasses || days[0]?.date || today,
      );
    }
  }, [days, firstDayWithClasses, selectedDate, today]);

  const selectedDay = useMemo(
    () => days.find((day) => day.date === selectedDate) || days[0],
    [days, selectedDate],
  );

  const handleConfirm = (classSession: ClassSession, date: string) => {
    const dateISO = classSession.dateISO || date;
    confirmMutation.mutate({ classId: classSession.id, dateISO });
  };

  const handleCancel = (classSession: ClassSession, date: string) => {
    const dateISO = classSession.dateISO || date;
    cancelMutation.mutate({ classId: classSession.id, dateISO });
  };

  const isConfirmed = (classSession: ClassSession) => {
    if (classSession.bookingStatus != null) {
      return classSession.bookingStatus === 'CONFIRMED';
    }
    return classSession.attendanceConfirmed;
  };

  const getDateParts = (dateStr: string, dayName: string) => {
    try {
      const date = parseISO(dateStr);
      return {
        weekday: format(date, "EEE", { locale: ptBR }).replace(".", ""),
        dayNumber: format(date, "d", { locale: ptBR }),
        month: format(date, "MMMM", { locale: ptBR }),
      };
    } catch {
      return { weekday: dayName.slice(0, 3), dayNumber: dateStr, month: "" };
    }
  };

  const formatSelectedDate = (dateStr?: string) => {
    if (!dateStr) return "Aulas";
    try {
      return format(parseISO(dateStr), "EEEE, d 'de' MMMM", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (time?: string) => {
    if (!time) return "--:--";
    return time.slice(0, 5);
  };

  const getDuration = (classSession: ClassSession) => {
    if (!classSession.endTime) return null;
    try {
      const [startHour, startMinute] = classSession.startTime.split(":").map(Number);
      const [endHour, endMinute] = classSession.endTime.split(":").map(Number);
      const minutes = endHour * 60 + endMinute - (startHour * 60 + startMinute);
      return minutes > 0 ? `${minutes} min` : null;
    } catch {
      return null;
    }
  };

  const getInstructorInitials = (name?: string) =>
    (name || "Professor")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();

  const selectedClasses = selectedDay?.classes || [];

  const renderClassActions = (classSession: ClassSession, date: string) => {
    if (classSession.isCancelled) {
      return (
        <Badge variant="destructive" className="shrink-0 gap-1 rounded-full text-[10px]">
          <BanIcon className="size-3" />
          Cancelada
        </Badge>
      );
    }

    if (isConfirmed(classSession)) {
      return (
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
            <CheckCircle className="size-3.5" />
            Confirmado
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCancel(classSession, date)}
            disabled={isMutating}
            className="h-7 px-2 text-[11px] text-red-500 hover:bg-red-50 hover:text-red-700"
            data-testid={`button-cancel-${date}-${classSession.id}`}
          >
            {isMutating ? <Loader2 className="mr-1 size-3 animate-spin" /> : <XCircle className="mr-1 size-3" />}
            Cancelar
          </Button>
        </div>
      );
    }

    return (
      <Button
        size="sm"
        onClick={() => handleConfirm(classSession, date)}
        disabled={isMutating}
        className="h-8 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
        data-testid={`button-confirm-${date}-${classSession.id}`}
      >
        {isMutating ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : <CheckCircle className="mr-1.5 size-3.5" />}
        Confirmar
      </Button>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-[420px] animate-pulse rounded-[28px] bg-card p-5">
        <div className="h-5 w-32 rounded bg-muted" />
        <div className="mt-8 h-14 rounded-2xl bg-muted" />
        <div className="mt-8 space-y-5">
          <div className="h-20 rounded-xl bg-muted" />
          <div className="h-20 rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  if (days.length === 0) {
    return (
      <div className="rounded-[28px] bg-card px-5 py-16 text-center text-muted-foreground shadow-sm">
        <CalendarDays className="mx-auto mb-4 size-10 text-muted-foreground/50" />
        <p className="font-semibold text-foreground">Nenhuma aula encontrada</p>
        <p className="mt-2 text-sm">Verifique com a academia os horários disponíveis.</p>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-[28px] bg-card shadow-sm">
      <header className="flex items-center justify-between px-4 pb-2 pt-4">
        <Link
          href="/"
          aria-label="Voltar para início"
          className="flex size-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-base font-bold tracking-tight text-foreground">Agenda</h1>
        <button
          type="button"
          aria-label="Calendário"
          className="flex size-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
        >
          <CalendarDays className="size-5" />
        </button>
      </header>

      <div className="px-4 pb-4 pt-1">
        <h2 className="text-lg font-bold capitalize text-foreground">
          {selectedDay ? getDateParts(selectedDay.date, selectedDay.dayName).month : "Agenda"}
        </h2>
        <div className="-mx-1 mt-3 flex gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {days.map((day) => {
            const parts = getDateParts(day.date, day.dayName);
            const isSelected = day.date === selectedDay?.date;
            const hasClasses = day.classes.length > 0;
            return (
              <button
                key={day.date}
                type="button"
                onClick={() => setSelectedDate(day.date)}
                className={`flex min-w-[43px] flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 transition-colors ${
                  isSelected ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"
                }`}
                aria-pressed={isSelected}
              >
                <span className={`text-[9px] font-medium capitalize ${isSelected ? "text-white/75" : ""}`}>
                  {parts.weekday}
                </span>
                <span className="text-base font-bold leading-none">{parts.dayNumber}</span>
                {hasClasses && !isSelected && <span className="size-1 rounded-full bg-primary" />}
                {isSelected && <span className="size-1 rounded-full bg-primary-foreground/80" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-border/60 px-4 pb-5 pt-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wide text-foreground">
            {selectedDay?.date === today ? "Hoje" : formatSelectedDate(selectedDay?.date)}
          </h2>
          <button
            type="button"
            aria-label="Adicionar aula"
            className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
          >
            <Plus className="size-4" />
          </button>
        </div>

        {selectedClasses.length === 0 ? (
          <div className="rounded-2xl bg-muted/40 px-4 py-10 text-center text-sm text-muted-foreground">
            Nenhuma aula para este dia.
          </div>
        ) : (
          <div className="space-y-1">
            {selectedClasses.map((classSession) => {
              const duration = getDuration(classSession);
              return (
                <div
                  key={`${selectedDay?.date}-${classSession.id}`}
                  className={`border-l-2 py-2 pl-3 pr-1 ${
                    classSession.isCancelled ? "border-red-400 opacity-70" : "border-primary"
                  }`}
                  data-testid={`class-card-${selectedDay?.date}-${classSession.id}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Clock className="size-3.5 text-primary" />
                        <span className="text-sm font-medium text-primary">
                          {formatTime(classSession.startTime)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">
                          {getInstructorInitials(classSession.instructorName)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-semibold text-foreground">
                            {classSession.instructorName || "Professor"}
                          </p>
                          <p className="truncate text-[10px] text-muted-foreground">
                            {classSession.location || "Professor da escola"}
                          </p>
                        </div>
                      </div>
                      <h3
                        className={`mt-2 text-base font-bold ${classSession.isCancelled ? "line-through text-muted-foreground" : "text-foreground"}`}
                        data-testid={`text-class-name-${selectedDay?.date}-${classSession.id}`}
                      >
                        {classSession.name}
                      </h3>
                      {classSession.isCancelled && (
                        <p className="mt-1 text-[10px] font-semibold text-red-500">
                          Esta aula foi cancelada pela academia.
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      {duration && <span className="text-sm text-muted-foreground">{duration}</span>}
                      {renderClassActions(classSession, selectedDay?.date || selectedDate)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
