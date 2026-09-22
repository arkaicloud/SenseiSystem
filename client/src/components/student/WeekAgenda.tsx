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
  XCircle,
} from "lucide-react";
import { useBookingMutations, type BookingStatus } from "@/hooks/useBookingMutations";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { calendarDateKeyInTimeZone } from "@shared/calendarDates";
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
  const today = calendarDateKeyInTimeZone(new Date());
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
      const dateLabel = format(parseISO(dateStr), "d 'de' MMMM", { locale: ptBR });
      if (dateStr === today) return `Hoje, ${dateLabel}`;
      const weekday = format(parseISO(dateStr), "EEEE", { locale: ptBR });
      return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${dateLabel}`;
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

  const getTimeInMinutes = (time?: string) => {
    if (!time) return Number.MAX_SAFE_INTEGER;
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const isClassPast = (classSession: ClassSession, date: string) => {
    if (date < today) return true;
    if (date > today) return false;

    const endTime = classSession.endTime
      ? getTimeInMinutes(classSession.endTime)
      : getTimeInMinutes(classSession.startTime) + 90;
    const brasiliaTime = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date());
    const currentHour = Number(brasiliaTime.find((part) => part.type === "hour")?.value || 0);
    const currentMinute = Number(brasiliaTime.find((part) => part.type === "minute")?.value || 0);
    return endTime <= currentHour * 60 + currentMinute;
  };

  const selectedClasses = selectedDay?.classes || [];
  const sortedSelectedClasses = useMemo(
    () => [...selectedClasses].sort((a, b) => getTimeInMinutes(a.startTime) - getTimeInMinutes(b.startTime)),
    [selectedClasses],
  );
  const upcomingClasses = sortedSelectedClasses.filter(
    (classSession) => !isClassPast(classSession, selectedDay?.date || selectedDate),
  );
  const pastClasses = sortedSelectedClasses.filter(
    (classSession) => isClassPast(classSession, selectedDay?.date || selectedDate),
  );

  const renderClassActions = (classSession: ClassSession, date: string, isPast: boolean) => {
    if (isPast) {
      return (
        <Badge variant="secondary" className="shrink-0 rounded-full text-[10px]">
          Encerrada
        </Badge>
      );
    }

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
            Reservada
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
        Reservar aula
      </Button>
    );
  };

  const renderClassCard = (classSession: ClassSession, isPast: boolean) => {
    const duration = getDuration(classSession);
    const date = selectedDay?.date || selectedDate;

    return (
      <div
        key={`${date}-${classSession.id}`}
        className={`rounded-2xl border border-border/60 border-l-[3px] bg-card/75 px-3 py-2.5 shadow-[0_5px_18px_rgba(30,64,175,0.06)] backdrop-blur-md transition-shadow hover:shadow-[0_8px_24px_rgba(30,64,175,0.10)] ${
          classSession.isCancelled ? "border-red-300 border-l-red-400 opacity-70" : "border-l-primary"
        }`}
        data-testid={`class-card-${date}-${classSession.id}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3
              className={`text-[15px] font-bold leading-tight ${classSession.isCancelled ? "line-through text-muted-foreground" : "text-foreground"}`}
              data-testid={`text-class-name-${date}-${classSession.id}`}
            >
              {classSession.name}
            </h3>
            <div className="mt-1 flex items-center gap-2">
              <Clock className="size-3.5 text-primary" />
              <span className="text-sm font-medium text-primary">
                {formatTime(classSession.startTime)}
                {classSession.endTime && ` — ${formatTime(classSession.endTime)}`}
              </span>
            </div>
            {classSession.location && (
              <div className="mt-1.5 truncate text-[11px] text-muted-foreground">
                {classSession.location}
              </div>
            )}
            {classSession.isCancelled && (
              <p className="mt-1 text-[10px] font-semibold text-red-500">
                Esta aula foi cancelada pela academia.
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            {duration && <span className="text-xs text-muted-foreground">{duration}</span>}
            {renderClassActions(classSession, date, isPast)}
          </div>
        </div>
      </div>
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
            const isTodayDate = day.date === today;
            const hasClasses = day.classes.length > 0;
            return (
              <button
                key={day.date}
                type="button"
                onClick={() => setSelectedDate(day.date)}
                className={`flex min-w-[43px] flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 transition-colors ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : isTodayDate
                      ? "ring-2 ring-primary/30 text-primary hover:bg-primary/5"
                      : "text-muted-foreground hover:bg-muted"
                }`}
                aria-pressed={isSelected}
              >
                <span className={`text-[9px] font-medium capitalize ${isSelected ? "text-primary-foreground/75" : ""}`}>
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
        <div className="mb-4">
          <h2 className="text-sm font-bold capitalize text-foreground">
            {formatSelectedDate(selectedDay?.date)}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {upcomingClasses.length}{" "}
            {upcomingClasses.length === 1 ? "aula disponível" : "aulas disponíveis"}
            {pastClasses.length > 0 && ` · ${pastClasses.length} encerrada${pastClasses.length === 1 ? "" : "s"}`}
          </p>
        </div>

        {selectedClasses.length === 0 ? (
          <div className="rounded-2xl bg-muted/40 px-4 py-10 text-center text-sm text-muted-foreground">
            Nenhuma aula para este dia.
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingClasses.length > 0 && (
              <section>
                <h3 className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Próximas aulas
                </h3>
                <div className="space-y-2 rounded-2xl bg-muted/20 p-2">
                  {upcomingClasses.map((classSession) => renderClassCard(classSession, false))}
                </div>
              </section>
            )}

            {pastClasses.length > 0 && (
              <section>
                <h3 className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Aulas encerradas
                </h3>
                <div className="space-y-2 rounded-2xl bg-muted/20 p-2">
                  {pastClasses.map((classSession) => renderClassCard(classSession, true))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
