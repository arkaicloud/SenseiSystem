import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClassCard } from "@/components/attendance/ClassCard";
import { RosterRow } from "@/components/attendance/RosterRow";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ClassWithStats {
  id: number;
  name: string;
  type: string;
  startTime: string;
  duration: number;
  maxStudents: number;
  instructor: { id: number; name: string } | null;
  stats: {
    confirmed: number;
    present: number;
    late: number;
    absent: number;
    pending: number;
  };
}

interface RosterStudent {
  student_id: number;
  name: string;
  belt_level: string;
  confirmed: boolean;
  status: 'confirmed' | 'present' | 'late' | 'absent' | null;
}

export default function NewAttendancePage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedClass, setSelectedClass] = useState<ClassWithStats | null>(null);
  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [searchStudent, setSearchStudent] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [autoSaveStatus, setAutoSaveStatus] = useState<string | null>(null);
  const [isClassStarted, setIsClassStarted] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const dateString = selectedDate.toISOString().split('T')[0];

  // Fetch classes for selected date with stats
  const { data: classes = [], isLoading: classesLoading } = useQuery<ClassWithStats[]>({
    queryKey: [`/api/classes?date=${dateString}`],
  });

  // Fetch roster when class is selected
  const { data: rosterData = [], isLoading: rosterLoading } = useQuery<RosterStudent[]>({
    queryKey: [`/api/classes/${selectedClass?.id}/roster?date=${dateString}`],
    enabled: !!selectedClass,
  });

  // Update local roster state when data changes
  useEffect(() => {
    setRoster(rosterData);
  }, [rosterData]);

  // Individual attendance mutation
  const attendanceMutation = useMutation({
    mutationFn: async ({ classId, studentId, status }: { classId: number; studentId: number; status: string | null }) => {
      const response = await apiRequest('PATCH', `/api/attendance/${classId}/${studentId}`, { date: dateString, status });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      setAutoSaveStatus("Salvo automaticamente ✓");
      setTimeout(() => setAutoSaveStatus(null), 3000);
      queryClient.invalidateQueries({ queryKey: ['/api/classes', dateString] });
      queryClient.invalidateQueries({ queryKey: ['/api/classes', selectedClass?.id, 'roster'] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao salvar - tentar novamente",
        variant: "destructive",
      });
    }
  });

  // Bulk attendance mutation
  const bulkMutation = useMutation({
    mutationFn: async (updates: { studentId: number; status: string | null }[]) => {
      const response = await apiRequest('POST', '/api/attendance/bulk', { date: dateString, classId: selectedClass?.id, updates });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      setAutoSaveStatus("Ações em lote salvas ✓");
      setTimeout(() => setAutoSaveStatus(null), 3000);
      queryClient.invalidateQueries({ queryKey: ['/api/classes', dateString] });
      queryClient.invalidateQueries({ queryKey: ['/api/classes', selectedClass?.id, 'roster'] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha na operação em lote",
        variant: "destructive",
      });
    }
  });

  // Start class mutation
  const startClassMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/classes/${selectedClass?.id}/start`, { date: dateString });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      setIsClassStarted(true);
      toast({ title: "Aula iniciada", description: "Chamada liberada para preenchimento" });
    }
  });

  // Finish class mutation  
  const finishClassMutation = useMutation({
    mutationFn: async (finalizeAbsentRest: boolean = false) => {
      const response = await apiRequest('POST', `/api/classes/${selectedClass?.id}/finish`, { date: dateString, finalizeAbsentRest });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      setIsClassStarted(false);
      toast({ title: "Aula encerrada", description: "Presença finalizada com sucesso" });
    }
  });

  const handleStatusChange = (studentId: number, status: 'confirmed' | 'present' | 'absent' | 'late' | null) => {
    // Update local state immediately for UI responsiveness
    setRoster(prev => prev.map(s => 
      s.student_id === studentId ? { ...s, status } : s
    ));
    
    // Save to backend
    attendanceMutation.mutate({ 
      classId: selectedClass!.id, 
      studentId, 
      status 
    });
  };

  const handleBulkAction = (action: 'mark-confirmed-present' | 'mark-remaining-absent' | 'clear-all') => {
    let updates: { studentId: number; status: 'confirmed' | 'present' | 'absent' | 'late' | null }[] = [];

    switch (action) {
      case 'mark-confirmed-present':
        updates = roster
          .filter(s => s.confirmed)
          .map(s => ({ studentId: s.student_id, status: 'present' }));
        break;
      case 'mark-remaining-absent':
        updates = roster
          .filter(s => !s.status || s.status === null)
          .map(s => ({ studentId: s.student_id, status: 'absent' }));
        break;
      case 'clear-all':
        updates = roster.map(s => ({ studentId: s.student_id, status: null }));
        break;
    }

    if (updates.length > 0) {
      // Update local state
      setRoster(prev => prev.map(s => {
        const update = updates.find(u => u.studentId === s.student_id);
        return update ? { ...s, status: update.status } : s;
      }));
      
      // Save to backend
      bulkMutation.mutate(updates);
    }
  };

  const filteredRoster = roster.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchStudent.toLowerCase());
    const matchesFilter = statusFilter === 'all' || 
      statusFilter === student.status || 
      (statusFilter === 'pending' && !student.status);
    return matchesSearch && matchesFilter;
  });

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'short', 
      day: '2-digit', 
      month: 'short' 
    });
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900">
      <div className="flex flex-col lg:flex-row lg:min-h-screen">
        
        {/* Left panel: date + classes */}
        <div className="lg:w-80 bg-white dark:bg-slate-800 border-b lg:border-b-0 lg:border-r dark:border-slate-700 p-3 lg:p-4 lg:space-y-4 lg:overflow-auto lg:sticky lg:top-0 lg:h-screen">
          
          {/* Mobile: compact row layout */}
          <div className="flex gap-3 lg:hidden">
            {/* Date selector (compact) */}
            <div className="flex-shrink-0">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Data</p>
              <input
                type="date"
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(e) => e.target.value && setSelectedDate(new Date(e.target.value + 'T12:00:00'))}
                className="border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white"
              />
            </div>

            {/* Classes list (horizontal scroll on mobile) */}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                Aulas — {formatDate(selectedDate)}
              </p>
              {classesLoading ? (
                <p className="text-sm text-slate-400 py-1">Carregando...</p>
              ) : classes.length === 0 ? (
                <p className="text-sm text-slate-400 py-1">Nenhuma aula</p>
              ) : (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {classes.map((classItem: ClassWithStats) => (
                    <button
                      key={classItem.id}
                      onClick={() => { setSelectedClass(classItem); setIsClassStarted(false); }}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                        selectedClass?.id === classItem.id
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600'
                      }`}
                    >
                      {classItem.startTime} · {classItem.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Desktop: full calendar + cards */}
          <div className="hidden lg:block space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Selecionar Data</CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="w-full"
                  data-testid="attendance-calendar"
                />
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDate(new Date())}
                    className="text-xs"
                    data-testid="button-today"
                  >
                    Hoje
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Aulas de Hoje</CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {classes.length} aulas encontradas
                </p>
              </CardHeader>
              <CardContent className="p-3 space-y-3">
                {classesLoading ? (
                  <div className="text-center py-4 text-sm">Carregando...</div>
                ) : classes.length === 0 ? (
                  <div className="text-center py-4 text-sm text-slate-500">
                    Nenhuma aula encontrada
                  </div>
                ) : (
                  classes.map((classItem: ClassWithStats) => (
                    <ClassCard
                      key={classItem.id}
                      class={classItem}
                      onOpen={(id) => {
                        const selected = classes.find((c: ClassWithStats) => c.id === id);
                        setSelectedClass(selected || null);
                        setIsClassStarted(false);
                      }}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Area */}
        <div className="flex-1 p-3 lg:p-6 overflow-auto">
          {!selectedClass ? (
            <div className="h-full flex items-center justify-center text-center">
              <div className="text-slate-500 dark:text-slate-400">
                <div className="text-4xl mb-4">📋</div>
                <h2 className="text-xl font-medium mb-2">Selecione uma aula</h2>
                <p>Escolha uma aula na barra lateral para iniciar a chamada</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Class Header */}
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border dark:border-slate-700">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {selectedClass.name}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                      <span className="capitalize font-medium text-slate-600 dark:text-slate-300">{selectedClass.type}</span> • {formatDate(selectedDate)} — {selectedClass.startTime} ({selectedClass.duration} min)
                      {selectedClass.instructor && ` • ${selectedClass.instructor.name}`}
                    </p>
                  </div>
                  
                  {/* Auto-save status */}
                  {autoSaveStatus && (
                    <div className="text-sm text-green-600 dark:text-green-400">
                      {autoSaveStatus}
                    </div>
                  )}
                </div>

                {/* Stats chips */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="outline">Confirmados {selectedClass.stats.confirmed}</Badge>
                  <Badge variant="outline">Presentes {selectedClass.stats.present}</Badge>
                  <Badge variant="outline">Atrasos {selectedClass.stats.late}</Badge>
                  <Badge variant="outline">Faltas {selectedClass.stats.absent}</Badge>
                  <Badge variant="outline">Pendentes {selectedClass.stats.pending}</Badge>
                  <Badge variant="secondary">Capacidade {selectedClass.maxStudents}</Badge>
                </div>

                {/* Action buttons */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {!isClassStarted ? (
                    <Button 
                      onClick={() => startClassMutation.mutate()}
                      disabled={startClassMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                      data-testid="button-start-class"
                    >
                      ▶ Iniciar Aula
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={() => handleBulkAction('mark-confirmed-present')}
                        disabled={bulkMutation.isPending}
                        variant="outline"
                        data-testid="button-mark-confirmed-present"
                      >
                        Confirmados → Presente
                      </Button>
                      <Button
                        onClick={() => handleBulkAction('mark-remaining-absent')}
                        disabled={bulkMutation.isPending}
                        variant="outline"
                        data-testid="button-mark-remaining-absent"
                      >
                        Restantes → Falta
                      </Button>
                      <Button
                        onClick={() => finishClassMutation.mutate(true)}
                        disabled={finishClassMutation.isPending}
                        className="bg-red-600 hover:bg-red-700"
                        data-testid="button-finish-class"
                      >
                        Encerrar Aula
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Roster */}
              <div className="bg-white dark:bg-slate-800 rounded-lg border dark:border-slate-700">
                <div className="p-6 border-b dark:border-slate-700">
                  <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                      <Input
                        placeholder="Buscar aluno..."
                        value={searchStudent}
                        onChange={(e) => setSearchStudent(e.target.value)}
                        data-testid="input-search-student"
                      />
                    </div>
                    
                    {/* Status filter */}
                    <div className="w-48">
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger data-testid="select-status-filter">
                          <SelectValue placeholder="Filtrar por status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="confirmed">Confirmados</SelectItem>
                          <SelectItem value="pending">Pendentes</SelectItem>
                          <SelectItem value="present">Presentes</SelectItem>
                          <SelectItem value="late">Atrasos</SelectItem>
                          <SelectItem value="absent">Faltas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Roster table */}
                <div className="overflow-x-auto">
                  {rosterLoading ? (
                    <div className="p-8 text-center">Carregando roster...</div>
                  ) : filteredRoster.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                      {roster.length === 0 ? 'Nenhum aluno matriculado' : 'Nenhum resultado encontrado'}
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="border-b dark:border-slate-700">
                        <tr>
                          <th className="text-left py-3 px-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                            Aluno ({filteredRoster.length})
                          </th>
                          <th className="text-left py-3 px-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRoster.map((student) => (
                          <RosterRow
                            key={student.student_id}
                            student={student}
                            onStatusChange={(status) => handleStatusChange(student.student_id, status)}
                            readOnly={!isClassStarted}
                          />
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}