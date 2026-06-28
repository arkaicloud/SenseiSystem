import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar, CheckCircle2, XCircle, Users, ChevronLeft, Save, Loader2
} from "lucide-react";

function parseQueryParams() {
  const search = window.location.search;
  const params = new URLSearchParams(search);
  return {
    date: params.get("date") || format(new Date(), "yyyy-MM-dd"),
    classId: params.get("class") ? Number(params.get("class")) : null,
  };
}

export default function AttendancePage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { date: initialDate, classId: initialClassId } = parseQueryParams();
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(initialClassId);

  const [attendance, setAttendance] = useState<Record<number, "present" | "absent">>({});
  const [saved, setSaved] = useState(false);

  const { data: classesData, isLoading: classesLoading } = useQuery<any>({
    queryKey: ["/api/classes"],
  });

  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useQuery<any>({
    queryKey: ["/api/classes", selectedClassId, "enrollments"],
    queryFn: () =>
      fetch(`/api/classes/${selectedClassId}/enrollments`, { credentials: "include" }).then(r => r.json()),
    enabled: !!selectedClassId,
  });

  const { data: existingAttendance, isLoading: attendanceLoading } = useQuery<any>({
    queryKey: ["/api/attendance/class", selectedClassId, selectedDate],
    queryFn: () =>
      fetch(`/api/attendance/class/${selectedClassId}?date=${selectedDate}`, { credentials: "include" }).then(r => r.json()),
    enabled: !!selectedClassId,
  });

  useEffect(() => {
    if (!existingAttendance?.attendances) return;
    const initial: Record<number, "present" | "absent"> = {};
    existingAttendance.attendances.forEach((a: any) => {
      initial[a.studentId] = a.status;
    });
    setAttendance(initial);
    setSaved(false);
  }, [existingAttendance, selectedClassId, selectedDate]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const students = enrollmentsData || [];
      const updates = students.map((s: any) => ({
        studentId: s.student_id,
        status: attendance[s.student_id] ?? "absent",
      }));
      const res = await apiRequest("POST", "/api/attendance/bulk", {
        date: selectedDate,
        classId: selectedClassId,
        updates,
      });
      return res.json();
    },
    onSuccess: () => {
      setSaved(true);
      toast({ title: "Presença salva!", description: "Registro atualizado com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/class", selectedClassId, selectedDate] });
    },
    onError: () => {
      toast({ title: "Erro", description: "Falha ao salvar presença.", variant: "destructive" });
    },
  });

  const toggleAttendance = (studentId: number) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: prev[studentId] === "present" ? "absent" : "present",
    }));
    setSaved(false);
  };

  const markAll = (status: "present" | "absent") => {
    const students = enrollmentsData || [];
    const next: Record<number, "present" | "absent"> = {};
    students.forEach((s: any) => { next[s.student_id] = status; });
    setAttendance(next);
    setSaved(false);
  };

  const classes = classesData?.classes || [];
  const students = enrollmentsData || [];
  const selectedClass = classes.find((c: any) => c.id === selectedClassId);

  const presentCount = students.filter((s: any) => attendance[s.student_id] === "present").length;
  const absentCount = students.length - presentCount;

  const isLoading = enrollmentsLoading || attendanceLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="h-9 w-9">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Controle de Aulas</h1>
            <p className="text-sm text-slate-500">Registre a presença dos alunos</p>
          </div>
        </div>
        {selectedClassId && students.length > 0 && (
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
          >
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saved ? "Salvo ✓" : "Salvar Presença"}
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="border border-slate-100 shadow-sm rounded-2xl">
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Data
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => { setSelectedDate(e.target.value); setSaved(false); }}
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Class selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Aula
              </label>
              {classesLoading ? (
                <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
              ) : (
                <select
                  value={selectedClassId ?? ""}
                  onChange={e => { setSelectedClassId(e.target.value ? Number(e.target.value) : null); setSaved(false); }}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Selecione uma aula...</option>
                  {classes.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      {selectedClassId && !isLoading && students.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-slate-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800">{students.length}</p>
              <p className="text-xs text-slate-500">Total</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800">{presentCount}</p>
              <p className="text-xs text-slate-500">Presentes</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800">{absentCount}</p>
              <p className="text-xs text-slate-500">Ausentes</p>
            </div>
          </div>
        </div>
      )}

      {/* Student list */}
      {selectedClassId && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-semibold text-slate-800">
                {selectedClass?.name || "Alunos"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 capitalize">
                {format(new Date(selectedDate + "T12:00:00"), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
            {students.length > 0 && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => markAll("present")}
                  className="h-8 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                  Marcar todos
                </Button>
                <Button variant="outline" size="sm" onClick={() => markAll("absent")}
                  className="h-8 text-xs border-red-200 text-red-600 hover:bg-red-50">
                  Limpar todos
                </Button>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="divide-y divide-slate-50">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between px-6 py-4 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100" />
                    <div className="h-4 w-32 bg-slate-100 rounded" />
                  </div>
                  <div className="h-8 w-24 bg-slate-100 rounded-xl" />
                </div>
              ))}
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Users className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">Nenhum aluno matriculado nesta aula</p>
            </div>
          ) : (
            <>
              {/* Column header */}
              <div className="grid grid-cols-12 px-6 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide bg-slate-50">
                <span className="col-span-8">Aluno</span>
                <span className="col-span-4 text-right">Status</span>
              </div>
              <div className="divide-y divide-slate-50">
                {students.map((s: any) => {
                  const status = attendance[s.student_id];
                  const isPresent = status === "present";
                  return (
                    <div key={s.student_id}
                      className="grid grid-cols-12 items-center px-6 py-3.5 hover:bg-slate-50/60 transition-colors cursor-pointer"
                      onClick={() => toggleAttendance(s.student_id)}
                    >
                      <div className="col-span-8 flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors ${
                          isPresent ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                        }`}>
                          {(s.first_name?.[0] || "?").toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {s.first_name} {s.last_name}
                          </p>
                          {s.belt_level && (
                            <p className="text-xs text-slate-400 capitalize">{s.belt_level}</p>
                          )}
                        </div>
                      </div>
                      <div className="col-span-4 flex justify-end">
                        <button
                          onClick={e => { e.stopPropagation(); toggleAttendance(s.student_id); }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            isPresent
                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                              : status === "absent"
                              ? "bg-red-50 text-red-500 hover:bg-red-100"
                              : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                          }`}
                        >
                          {isPresent ? (
                            <><CheckCircle2 className="w-3.5 h-3.5" /> Presente</>
                          ) : status === "absent" ? (
                            <><XCircle className="w-3.5 h-3.5" /> Ausente</>
                          ) : (
                            <><span className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 inline-block" /> Marcar</>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Empty state when no class selected */}
      {!selectedClassId && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center py-20 text-slate-400">
          <Calendar className="w-14 h-14 mb-4 opacity-25" />
          <p className="text-base font-medium">Selecione uma aula para controlar a presença</p>
          <p className="text-sm mt-1 opacity-70">Escolha a data e a aula nos filtros acima</p>
        </div>
      )}
    </div>
  );
}
