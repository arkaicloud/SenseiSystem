import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/analytics";
import {
  format, getDaysInMonth, startOfMonth, getDay,
  addMonths, subMonths, parseISO
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { localCalendarDateKey } from "@shared/calendarDates";
import {
  ChevronLeft, ChevronRight, Search, Users, CheckCircle2, XCircle,
  Clock, Calendar, Save, Loader2, UserCheck, LayoutList, Check, X,
  BanIcon, RotateCcw, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

type AttStatus = "present" | "absent";
type FilterTab = "all" | "present" | "absent" | "pending";

interface ClassItem {
  id: number;
  name: string;
  dayOfWeek: number;
  startTime: string;
  duration: number;
  type: string;
  isActive: boolean;
  maxStudents?: number;
}

interface RosterStudent {
  student_id: number;
  first_name: string;
  last_name: string;
  belt_level?: string;
  stripes?: number;
  attendance_status: string | null;   // 'confirmed' | 'present' | 'absent' | null
  has_self_confirmed: boolean;        // true when status === 'confirmed'
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BELT_COLORS: Record<string, string> = {
  white: "#d1d5db", blue: "#3b82f6", purple: "#8b5cf6",
  brown: "#92400e", black: "#374151", red: "#ef4444",
  green: "#22c55e", orange: "#f97316", yellow: "#eab308",
};

const BELT_PT: Record<string, string> = {
  white: "Branca", blue: "Azul", purple: "Roxa",
  brown: "Marrom", black: "Preta", red: "Vermelha",
  green: "Verde", orange: "Laranja", yellow: "Amarela",
  "grey/white": "Cinza/Branca", grey: "Cinza",
  "grey/black": "Cinza/Preta", "yellow/black": "Amarela/Preta",
  "orange/black": "Laranja/Preta", "green/black": "Verde/Preta",
};

function beltColor(belt?: string) {
  if (!belt) return "#94a3b8";
  const k = belt.toLowerCase();
  for (const [key, val] of Object.entries(BELT_COLORS)) {
    if (k.includes(key)) return val;
  }
  return "#94a3b8";
}

function beltPt(belt?: string) {
  if (!belt) return "";
  const k = belt.toLowerCase();
  for (const [key, val] of Object.entries(BELT_PT)) {
    if (k === key || k.includes(key)) return val;
  }
  return belt;
}

function initials(first: string, last: string) {
  return ((first?.[0] || "") + (last?.[0] || "")).toUpperCase();
}

// ─── Mini Calendar ────────────────────────────────────────────────────────────

function MiniCalendar({
  viewDate, selectedDate, classDays, onSelectDate, onChangeMonth,
}: {
  viewDate: Date;
  selectedDate: string;
  classDays: Set<number>;
  onSelectDate: (d: string) => void;
  onChangeMonth: (d: Date) => void;
}) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = getDaysInMonth(viewDate);
  const firstWeekday = getDay(startOfMonth(viewDate));
  const todayStr = localCalendarDateKey();
  const weekdays = ["D", "S", "T", "Q", "Q", "S", "S"];

  const cells = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="select-none">
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={() => onChangeMonth(subMonths(viewDate, 1))}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-bold text-slate-700 capitalize">
          {format(viewDate, "MMMM yyyy", { locale: ptBR })}
        </span>
        <button onClick={() => onChangeMonth(addMonths(viewDate, 1))}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="px-3 pb-3">
        <div className="grid grid-cols-7 mb-1">
          {weekdays.map((wd, i) => (
            <div key={i} className="text-center text-[10px] font-bold text-slate-400 py-1">{wd}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-0.5">
          {cells.map((day, idx) => {
            if (!day) return <div key={idx} />;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const weekday = (firstWeekday + day - 1) % 7;
            const hasClass = classDays.has(weekday);
            const isSelected = dateStr === selectedDate;
            const isTodayDay = dateStr === todayStr;
            return (
              <button key={idx} onClick={() => onSelectDate(dateStr)}
                className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-xs font-medium transition-all
                  ${isSelected ? "bg-indigo-600 text-white font-bold shadow-sm"
                    : isTodayDay ? "border border-indigo-400 text-indigo-600 font-bold"
                    : hasClass ? "text-slate-700 hover:bg-slate-100"
                    : "text-slate-400 hover:bg-slate-50"}`}>
                {day}
                {hasClass && (
                  <span className={`absolute bottom-1 w-1 h-1 rounded-full ${isSelected ? "bg-white/70" : "bg-indigo-400"}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Student Row ──────────────────────────────────────────────────────────────

function StudentRow({
  student, localStatus, isSelected, onToggleSelect, onSetStatus,
}: {
  student: RosterStudent;
  localStatus: AttStatus | null;
  isSelected: boolean;
  onToggleSelect: () => void;
  onSetStatus: (s: AttStatus) => void;
}) {
  const bc = beltColor(student.belt_level);
  const init = initials(student.first_name, student.last_name);

  // Effective display status: instructor override > self-confirmed > null
  const displayStatus: "present" | "absent" | "confirmed" | null =
    localStatus ?? (student.attendance_status === "confirmed" ? "confirmed" : null);

  const rowBorderClass =
    displayStatus === "present" ? "border-l-2 border-l-emerald-400"
    : displayStatus === "absent" ? "border-l-2 border-l-red-400"
    : displayStatus === "confirmed" ? "border-l-2 border-l-indigo-400"
    : "border-l-2 border-l-transparent";

  return (
    <div
      className={`flex items-center gap-3 px-5 py-3 border-b border-slate-50 cursor-pointer transition-colors
        ${isSelected ? "bg-indigo-50/60" : "hover:bg-slate-50/70"} ${rowBorderClass}`}
      onClick={onToggleSelect}
    >
      {/* Checkbox */}
      <div className={`flex-shrink-0 rounded-md border-2 flex items-center justify-center transition-all
          ${isSelected ? "bg-indigo-600 border-indigo-600" : "border-slate-300 hover:border-indigo-400"}`}
        style={{ width: 18, height: 18 }}>
        {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
      </div>

      {/* Avatar */}
      <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 border-2"
        style={{ borderColor: bc, color: bc, backgroundColor: bc + "20" }}>
        {init}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-700 truncate">
            {student.first_name} {student.last_name}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {student.belt_level && (
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <span className="w-2 h-2 rounded-full inline-block flex-shrink-0" style={{ background: bc }} />
              {beltPt(student.belt_level)}
              {(student.stripes ?? 0) > 0 && Array.from({ length: student.stripes! }).map((_, i) => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
              ))}
            </span>
          )}
          {student.has_self_confirmed && !localStatus && (
            <span className="text-[11px] text-indigo-500 font-semibold">• App ✓ confirmou</span>
          )}
          {student.has_self_confirmed && localStatus && (
            <span className="text-[11px] text-indigo-400">• App ✓</span>
          )}
        </div>
      </div>

      {/* Status badge (desktop) */}
      <div className="hidden sm:block">
        <StatusBadge status={displayStatus} />
      </div>

      {/* P/A Toggle */}
      <div className="flex bg-slate-100 border border-slate-200 rounded-xl overflow-hidden flex-shrink-0"
        onClick={e => e.stopPropagation()}>
        <button onClick={() => onSetStatus("present")}
          className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold transition-all
            ${localStatus === "present" ? "bg-emerald-100 text-emerald-700"
              : "text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"}`}>
          <Check className="w-3 h-3" />
          <span className="hidden sm:inline">P</span>
        </button>
        <div className="w-px bg-slate-200" />
        <button onClick={() => onSetStatus("absent")}
          className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold transition-all
            ${localStatus === "absent" ? "bg-red-100 text-red-600"
              : "text-slate-400 hover:bg-red-50 hover:text-red-500"}`}>
          <X className="w-3 h-3" />
          <span className="hidden sm:inline">F</span>
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: "present" | "absent" | "confirmed" | null }) {
  if (status === "present")
    return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
      <CheckCircle2 className="w-3 h-3" /> Presente</span>;
  if (status === "absent")
    return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-red-50 text-red-500 border border-red-200">
      <XCircle className="w-3 h-3" /> Falta</span>;
  if (status === "confirmed")
    return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
      <UserCheck className="w-3 h-3" /> App ✓</span>;
  return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-100 text-slate-400 border border-slate-200">
    — Pendente</span>;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AttendancePage() {
  const { toast } = useToast();

  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(localCalendarDateKey());
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

  // localMap: instructor overrides — only present/absent set by instructor
  const [localMap, setLocalMap] = useState<Record<number, AttStatus>>({});
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [hasChanges, setHasChanges] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(true);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // ─── Queries ──────────────────────────────────────────────────────────────

  const { data: classesData, isLoading: classesLoading } = useQuery<{ classes: ClassItem[] }>({
    queryKey: ["/api/classes"],
  });

  const allClasses = useMemo(() =>
    classesData?.classes?.filter(c => c.isActive) ?? [], [classesData]);

  const classDaySet = useMemo(() => {
    const set = new Set<number>();
    allClasses.forEach(c => set.add(c.dayOfWeek));
    return set;
  }, [allClasses]);

  const selectedWeekday = useMemo(() =>
    selectedDate ? getDay(parseISO(selectedDate)) : -1, [selectedDate]);

  const classesForDay = useMemo(() =>
    allClasses.filter(c => c.dayOfWeek === selectedWeekday), [allClasses, selectedWeekday]);

  // Cancellation status query
  const { data: cancellationData, refetch: refetchCancellation } = useQuery<{ cancelled: boolean; cancellation: any }>({
    queryKey: ["/api/classes", selectedClassId, "cancel-session", selectedDate],
    queryFn: async () => {
      if (!selectedClassId) return { cancelled: false, cancellation: null };
      const res = await fetch(`/api/classes/${selectedClassId}/cancel-session?date=${selectedDate}`, { credentials: "include" });
      return res.json();
    },
    enabled: !!selectedClassId && !!selectedDate,
    staleTime: 0,
  });

  const isSessionCancelled = cancellationData?.cancelled ?? false;

  const cancelSessionMutation = useMutation({
    mutationFn: async ({ cancel, reason }: { cancel: boolean; reason?: string }) => {
      if (cancel) {
        const res = await apiRequest("POST", `/api/classes/${selectedClassId}/cancel-session`, { date: selectedDate, reason });
        return res.json();
      } else {
        const res = await apiRequest("DELETE", `/api/classes/${selectedClassId}/cancel-session`, { date: selectedDate });
        return res.json();
      }
    },
    onSuccess: (_, vars) => {
      setShowCancelConfirm(false);
      setCancelReason("");
      refetchCancellation();
      queryClient.invalidateQueries({ queryKey: ["/api/classes", selectedClassId, "roster", selectedDate] });
      toast({
        title: vars.cancel ? "Aula cancelada" : "Aula restaurada",
        description: vars.cancel
          ? "A aula foi cancelada. Os alunos verão o aviso na agenda."
          : "A aula foi restaurada e está disponível novamente.",
      });
    },
    onError: () => toast({ title: "Erro ao atualizar status da aula", variant: "destructive" }),
  });

  // Main roster query — single endpoint combining enrollments + self-confirmed
  const { data: rosterData, isLoading: rosterLoading } = useQuery<RosterStudent[]>({
    queryKey: ["/api/classes", selectedClassId, "roster", selectedDate],
    queryFn: async () => {
      const res = await fetch(
        `/api/classes/${selectedClassId}/roster?date=${selectedDate}`,
        { credentials: "include", cache: "no-store" }
      );
      const json = await res.json();
      // Normalize: API may return { roster: [...] } or [...] directly
      const raw: any[] = Array.isArray(json) ? json : (json?.roster ?? []);
      // Normalize fields: handle `name` fallback if first_name/last_name missing
      return raw.map((s: any) => {
        const parts = (s.name || "").split(" ");
        return {
          student_id: s.student_id,
          first_name: s.first_name || parts[0] || "",
          last_name: s.last_name || parts.slice(1).join(" ") || "",
          belt_level: s.belt_level,
          stripes: s.stripes ?? 0,
          attendance_status: s.attendance_status ?? null,
          has_self_confirmed: s.has_self_confirmed ?? (s.attendance_status === "confirmed"),
        } as RosterStudent;
      });
    },
    enabled: !!selectedClassId,
    staleTime: 0,
  });

  const students = rosterData ?? [];
  const studentsRef = useRef(students);
  useEffect(() => { studentsRef.current = students; }, [students]);

  // Reset local state when class/date changes
  useEffect(() => {
    setLocalMap({});
    setSelected(new Set());
    setSearchQuery("");
    setFilterTab("all");
    setHasChanges(false);
  }, [selectedClassId, selectedDate]);

  // Pre-load already instructor-set statuses (present/absent) from roster data
  useEffect(() => {
    if (!students.length) return;
    const map: Record<number, AttStatus> = {};
    students.forEach(s => {
      if (s.attendance_status === "present" || s.attendance_status === "absent") {
        map[s.student_id] = s.attendance_status as AttStatus;
      }
    });
    setLocalMap(map);
    setHasChanges(false);
  }, [rosterData]);

  // ─── Derived counts ────────────────────────────────────────────────────────

  const getLocalStatus = (id: number): AttStatus | null => localMap[id] ?? null;

  const getEffectiveStatus = (s: RosterStudent): "present" | "absent" | "confirmed" | null => {
    const local = localMap[s.student_id];
    if (local) return local;
    if (s.attendance_status === "confirmed") return "confirmed";
    return null;
  };

  const presentCount = students.filter(s => localMap[s.student_id] === "present").length;
  const absentCount = students.filter(s => localMap[s.student_id] === "absent").length;
  const confirmedCount = students.filter(s => s.has_self_confirmed && !localMap[s.student_id]).length;
  const pendingCount = students.length - presentCount - absentCount - confirmedCount;
  const selfConfirmedTotal = students.filter(s => s.has_self_confirmed).length;

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const q = searchQuery.toLowerCase();
      const nameMatch = !q || `${s.first_name} ${s.last_name}`.toLowerCase().includes(q);
      const eff = getEffectiveStatus(s);
      const tabMatch =
        filterTab === "all" ||
        (filterTab === "present" && eff === "present") ||
        (filterTab === "absent" && eff === "absent") ||
        (filterTab === "pending" && !eff);
      return nameMatch && tabMatch;
    });
  }, [students, searchQuery, filterTab, localMap]);

  const withSelfConfirm = filteredStudents.filter(s => s.has_self_confirmed);
  const withoutSelfConfirm = filteredStudents.filter(s => !s.has_self_confirmed);

  // ─── Actions ──────────────────────────────────────────────────────────────

  const setStatus = useCallback((id: number, status: AttStatus) => {
    setLocalMap(prev => {
      if (prev[id] === status) {
        // Toggle-off: check if student has a 'present'/'late' record in DB
        // If yes → must send 'absent' to actually remove from count
        // If no existing record → just remove from localMap (nothing to undo)
        const dbStatus = studentsRef.current.find(s => s.student_id === id)?.attendance_status;
        const next = { ...prev };
        if (dbStatus === 'present' || dbStatus === 'late') {
          next[id] = 'absent';
        } else {
          delete next[id];
        }
        return next;
      }
      return { ...prev, [id]: status };
    });
    setHasChanges(true);
  }, []);

  const bulkSet = (status: AttStatus) => {
    if (!selected.size) return;
    setLocalMap(prev => {
      const next = { ...prev };
      selected.forEach(id => { next[id] = status; });
      return next;
    });
    setSelected(new Set());
    setHasChanges(true);
  };

  const markAllSelfConfirmed = () => {
    setLocalMap(prev => {
      const next = { ...prev };
      students.filter(s => s.has_self_confirmed).forEach(s => {
        next[s.student_id] = "present";
      });
      return next;
    });
    setHasChanges(true);
  };

  const discardChanges = () => {
    const map: Record<number, AttStatus> = {};
    students.forEach(s => {
      if (s.attendance_status === "present" || s.attendance_status === "absent") {
        map[s.student_id] = s.attendance_status as AttStatus;
      }
    });
    setLocalMap(map);
    setHasChanges(false);
  };

  const toggleSelect = (id: number) =>
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const selectAll = () => setSelected(new Set(filteredStudents.map(s => s.student_id)));
  const clearSelection = () => setSelected(new Set());

  // ─── Save ─────────────────────────────────────────────────────────────────

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Only send students that have an explicit instructor status
      const updates = Object.entries(localMap).map(([id, status]) => ({
        studentId: Number(id),
        status,
      }));
      // Also include self-confirmed students that aren't overridden
      // (leave them as-is — don't downgrade to absent)
      const res = await apiRequest("POST", "/api/attendance/bulk", {
        date: selectedDate,
        classId: selectedClassId,
        updates,
      });
      return res.json();
    },
    onSuccess: () => {
      trackEvent("attendance_roster_saved", {
        present_count: presentCount,
        absent_count: absentCount,
        class_id: selectedClassId || 0,
      });
      setHasChanges(false);
      toast({ title: "Presenças salvas!", description: `${presentCount} presentes, ${absentCount} faltas.` });
      queryClient.invalidateQueries({ queryKey: ["/api/classes", selectedClassId, "roster", selectedDate] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
    onError: () => {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    },
  });

  // ─── Metadata ─────────────────────────────────────────────────────────────

  const selectedClass = allClasses.find(c => c.id === selectedClassId);
  const selectedDateLabel = selectedDate
    ? format(parseISO(selectedDate), "EEEE, d 'de' MMMM", { locale: ptBR })
    : "";

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 72px)" }}>
      <div className="flex flex-1 overflow-hidden gap-4">

        {/* ═══ LEFT: Calendar + Class List ═══ */}
        <aside className={`bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col
          overflow-hidden flex-shrink-0 lg:w-72 w-full
          ${!mobileSidebarOpen ? "hidden lg:flex" : "flex"}`}>

          <div className="px-4 pt-4 pb-1 flex items-center justify-between lg:hidden">
            <h1 className="text-base font-bold text-slate-800">Controle de Presenças</h1>
            {selectedClassId && (
              <button onClick={() => setMobileSidebarOpen(false)}
                className="text-xs text-indigo-600 font-semibold">
                Ver alunos →
              </button>
            )}
          </div>

          <MiniCalendar
            viewDate={viewDate}
            selectedDate={selectedDate}
            classDays={classDaySet}
            onSelectDate={d => { setSelectedDate(d); setSelectedClassId(null); }}
            onChangeMonth={setViewDate}
          />

          <div className="border-t border-slate-100 mx-3" />

          <div className="flex-1 overflow-y-auto px-3 py-3">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aulas do dia</span>
              {classesForDay.length > 0 && (
                <span className="text-[10px] font-bold text-indigo-500">
                  {classesForDay.length} aula{classesForDay.length > 1 ? "s" : ""}
                </span>
              )}
            </div>

            {classesLoading ? (
              <div className="space-y-2">
                {[1, 2].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
              </div>
            ) : classesForDay.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-6">
                {selectedDate ? "Nenhuma aula neste dia" : "← Selecione uma data"}
              </p>
            ) : (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-indigo-500 px-1 pb-1 capitalize">
                  {selectedDateLabel}
                </p>
                {classesForDay.map(cls => {
                  const isActive = cls.id === selectedClassId;
                  return (
                    <button key={cls.id}
                      onClick={() => { setSelectedClassId(cls.id); setMobileSidebarOpen(false); }}
                      className={`w-full text-left rounded-xl p-3 pl-4 border transition-all relative overflow-hidden
                        ${isActive ? "bg-indigo-50 border-indigo-300" : "bg-slate-50 border-slate-100 hover:bg-slate-100 hover:border-slate-200"}`}>
                      <span className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-l-full ${isActive ? "bg-indigo-600" : "bg-slate-300"}`} />
                      <p className={`text-sm font-semibold ${isActive ? "text-indigo-700" : "text-slate-700"}`}>{cls.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                        <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{cls.startTime}</span>
                        <span>·</span>
                        <span>{cls.duration}min</span>
                        {cls.type && cls.type !== "misto" && <><span>·</span><span className="capitalize">{cls.type}</span></>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* ═══ RIGHT: Student Attendance ═══ */}
        <section className={`flex-1 flex flex-col overflow-hidden gap-3 min-w-0
          ${mobileSidebarOpen ? "hidden lg:flex" : "flex"}`}>

          <div className="lg:hidden flex items-center gap-2">
            <button onClick={() => setMobileSidebarOpen(true)}
              className="flex items-center gap-1.5 text-sm text-indigo-600 font-semibold">
              <ChevronLeft className="w-4 h-4" /> Calendário
            </button>
            {selectedClass && <span className="text-slate-400 text-sm">/ {selectedClass.name}</span>}
          </div>

          {!selectedClassId ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex-1 flex flex-col
              items-center justify-center text-center px-8 gap-3">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-2">
                <LayoutList className="w-8 h-8 text-indigo-400" />
              </div>
              <p className="text-lg font-bold text-slate-700">Selecione uma aula</p>
              <p className="text-sm text-slate-400 max-w-xs">
                Clique em uma data no calendário e escolha a aula para registrar as presenças.
              </p>
            </div>
          ) : (
            <>
              {/* Cancelled session banner */}
              {isSessionCancelled && (
                <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                    <BanIcon className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-red-700">Aula Cancelada</p>
                    <p className="text-xs text-red-500 mt-0.5">
                      Esta sessão foi cancelada e está indisponível para os alunos.
                      {cancellationData?.cancellation?.reason && ` Motivo: ${cancellationData.cancellation.reason}`}
                    </p>
                  </div>
                  <button
                    onClick={() => cancelSessionMutation.mutate({ cancel: false })}
                    disabled={cancelSessionMutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-white border border-red-200 text-red-600 hover:bg-red-50 transition flex-shrink-0"
                  >
                    {cancelSessionMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                    Restaurar Aula
                  </button>
                </div>
              )}

              {/* Cancel confirmation dialog */}
              {showCancelConfirm && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <p className="text-sm font-bold text-amber-800">Cancelar esta sessão?</p>
                  </div>
                  <p className="text-xs text-amber-700">
                    A aula ficará indisponível para confirmação. Alunos que já fizeram check-in verão o aviso de cancelamento.
                  </p>
                  <input
                    type="text"
                    placeholder="Motivo (opcional)"
                    value={cancelReason}
                    onChange={e => setCancelReason(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-amber-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => cancelSessionMutation.mutate({ cancel: true, reason: cancelReason })}
                      disabled={cancelSessionMutation.isPending}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-red-600 text-white hover:bg-red-700 transition"
                    >
                      {cancelSessionMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BanIcon className="w-3.5 h-3.5" />}
                      Confirmar Cancelamento
                    </button>
                    <button
                      onClick={() => { setShowCancelConfirm(false); setCancelReason(""); }}
                      className="px-4 py-2 text-xs font-semibold rounded-xl border border-amber-200 text-amber-700 hover:bg-amber-100 transition"
                    >
                      Voltar
                    </button>
                  </div>
                </div>
              )}

              {/* Class header + stats */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4
                flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h2 className={`text-lg font-bold ${isSessionCancelled ? "text-slate-400 line-through" : "text-slate-800"}`}>{selectedClass?.name}</h2>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 flex-wrap">
                    <span className="flex items-center gap-1 capitalize"><Calendar className="w-3 h-3" />{selectedDateLabel}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{selectedClass?.startTime} · {selectedClass?.duration}min</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {!isSessionCancelled && !showCancelConfirm && (
                    <button
                      onClick={() => setShowCancelConfirm(true)}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition"
                      data-testid="button-cancel-session"
                    >
                      <BanIcon className="w-3.5 h-3.5" /> Cancelar Aula
                    </button>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { label: "Total", value: students.length, color: "text-slate-700", bg: "bg-slate-50" },
                      { label: "Presentes", value: presentCount, color: "text-emerald-600", bg: "bg-emerald-50" },
                      { label: "Faltas", value: absentCount, color: "text-red-500", bg: "bg-red-50" },
                      { label: "App ✓", value: confirmedCount, color: "text-indigo-600", bg: "bg-indigo-50" },
                      { label: "Pendentes", value: pendingCount, color: "text-slate-400", bg: "bg-slate-50" },
                    ].map(({ label, value, color, bg }) => (
                      <div key={label} className={`${bg} rounded-xl px-3 py-2 text-center min-w-[56px]`}>
                        <p className={`text-xl font-extrabold ${color}`}>{value}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Toolbar */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3
                flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[160px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <input type="text" placeholder="Buscar aluno..." value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50
                      focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition" />
                </div>

                <div className="flex bg-slate-100 rounded-xl overflow-hidden border border-slate-200 text-xs font-semibold">
                  {([
                    ["all", `Todos (${students.length})`],
                    ["present", `✓ (${presentCount})`],
                    ["absent", `✗ (${absentCount})`],
                    ["pending", `— (${pendingCount + confirmedCount})`],
                  ] as [FilterTab, string][]).map(([tab, label]) => (
                    <button key={tab} onClick={() => setFilterTab(tab)}
                      className={`px-3 py-2 transition-colors whitespace-nowrap
                        ${filterTab === tab ? "bg-white text-slate-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                      {label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  {selected.size > 0 ? (
                    <>
                      <span className="text-xs text-slate-500">{selected.size} sel.</span>
                      <button onClick={() => bulkSet("present")}
                        className="flex items-center gap-1 px-3 py-2 text-xs font-bold rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition">
                        <Check className="w-3 h-3" /> Presença
                      </button>
                      <button onClick={() => bulkSet("absent")}
                        className="flex items-center gap-1 px-3 py-2 text-xs font-bold rounded-xl bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition">
                        <X className="w-3 h-3" /> Falta
                      </button>
                      <button onClick={clearSelection}
                        className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition">
                        Limpar
                      </button>
                    </>
                  ) : (
                    <>
                      {selfConfirmedTotal > 0 && (
                        <button onClick={markAllSelfConfirmed}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition">
                          <UserCheck className="w-3 h-3" /> Confirmar {selfConfirmedTotal} check-in{selfConfirmedTotal > 1 ? "s" : ""}
                        </button>
                      )}
                      <button onClick={selectAll}
                        className="px-3 py-2 text-xs font-semibold text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-100 transition">
                        Selecionar todos
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Student list */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex-1 overflow-y-auto min-h-0">
                {rosterLoading ? (
                  <div className="divide-y divide-slate-50">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3 px-5 py-3.5 animate-pulse">
                        <div className="w-4 h-4 bg-slate-100 rounded flex-shrink-0" />
                        <div className="w-9 h-9 bg-slate-100 rounded-full flex-shrink-0" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3.5 w-36 bg-slate-100 rounded" />
                          <div className="h-3 w-20 bg-slate-100 rounded" />
                        </div>
                        <div className="h-8 w-20 bg-slate-100 rounded-xl" />
                      </div>
                    ))}
                  </div>
                ) : students.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                    <Users className="w-14 h-14 mb-3" />
                    <p className="text-sm font-semibold text-slate-400">Nenhum aluno nesta aula</p>
                    <p className="text-xs text-slate-300 mt-1">Nenhum matriculado ou com check-in para este dia</p>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-300">
                    <Search className="w-10 h-10 mb-2" />
                    <p className="text-sm text-slate-400 font-medium">Nenhum aluno encontrado</p>
                  </div>
                ) : (
                  <>
                    {/* Group: with self-confirmation */}
                    {withSelfConfirm.length > 0 && (
                      <>
                        <div className="px-5 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider
                          bg-indigo-50/50 border-b border-slate-100 flex items-center gap-1.5">
                          <UserCheck className="w-3 h-3 text-indigo-500" />
                          Confirmaram pelo app ({withSelfConfirm.length})
                        </div>
                        {withSelfConfirm.map(s => (
                          <StudentRow key={s.student_id} student={s}
                            localStatus={getLocalStatus(s.student_id)}
                            isSelected={selected.has(s.student_id)}
                            onToggleSelect={() => toggleSelect(s.student_id)}
                            onSetStatus={st => setStatus(s.student_id, st)} />
                        ))}
                      </>
                    )}

                    {/* Group: without self-confirmation */}
                    {withoutSelfConfirm.length > 0 && (
                      <>
                        <div className={`px-5 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider
                          bg-slate-50/80 flex items-center gap-1.5
                          ${withSelfConfirm.length > 0 ? "border-t border-slate-100 border-b border-slate-100" : "border-b border-slate-100"}`}>
                          <Users className="w-3 h-3 text-slate-400" />
                          Sem check-in ({withoutSelfConfirm.length})
                        </div>
                        {withoutSelfConfirm.map(s => (
                          <StudentRow key={s.student_id} student={s}
                            localStatus={getLocalStatus(s.student_id)}
                            isSelected={selected.has(s.student_id)}
                            onToggleSelect={() => toggleSelect(s.student_id)}
                            onSetStatus={st => setStatus(s.student_id, st)} />
                        ))}
                      </>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </section>
      </div>

      {/* ═══ Floating Save Banner ═══ */}
      <div className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-50 transition-all duration-300
        ${hasChanges ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"}`}>
        <div className="bg-slate-900 text-white rounded-2xl shadow-2xl px-5 py-3.5
          flex items-center gap-4 border border-slate-700 whitespace-nowrap">
          <div className="text-sm font-semibold">
            <span className="text-indigo-400 font-bold">{presentCount + absentCount}</span> alterações a salvar
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
              size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5 rounded-xl h-8">
              {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Salvar presenças
            </Button>
            <button onClick={discardChanges}
              className="px-3 h-8 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition">
              Descartar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
