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
    queryKey: ['/api/attendance/classes', dateString],
    queryFn: async () => {
      const response = await apiRequest(`/api/attendance/classes?date=${dateString}`);
      return Array.isArray(response) ? response : [];
    },
  });

  // Fetch roster when class is selected
  const { data: rosterData = [], isLoading: rosterLoading } = useQuery<RosterStudent[]>({
    queryKey: ['/api/classes', selectedClass?.id, 'roster', dateString],
    queryFn: async () => {
      const response = await apiRequest(`/api/classes/${selectedClass?.id}/roster?date=${dateString}`);
      return Array.isArray(response) ? response : [];
    },
    enabled: !!selectedClass,
  });

  // Update local roster state when data changes
  useEffect(() => {
    setRoster(rosterData);
  }, [rosterData]);

  // Individual attendance mutation
  const attendanceMutation = useMutation({
    mutationFn: async ({ classId, studentId, status }: { classId: number; studentId: number; status: string | null }) => {
      return apiRequest(`/api/attendance/${classId}/${studentId}`, 'PATCH', { date: dateString, status });
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
      return apiRequest('/api/attendance/bulk', 'POST', { date: dateString, classId: selectedClass?.id, updates });
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
    mutationFn: () => apiRequest(`/api/classes/${selectedClass?.id}/start`, 'POST', { date: dateString }),
    onSuccess: () => {
      setIsClassStarted(true);
      toast({ title: "Aula iniciada", description: "Chamada liberada para preenchimento" });
    }
  });

  // Finish class mutation  
  const finishClassMutation = useMutation({
    mutationFn: (finalizeAbsentRest: boolean = false) => apiRequest(`/api/classes/${selectedClass?.id}/finish`, 'POST', { date: dateString, finalizeAbsentRest }),
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
        updates = roster.map(s => ({ studentId: s.student_id, status: null as const }));
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="flex flex-col lg:flex-row h-screen">
        
        {/* Sidebar */}
        <div className="lg:w-80 bg-white dark:bg-slate-800 border-r dark:border-slate-700 p-4 space-y-4 overflow-auto">
          
          {/* Calendar */}
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
              
              {/* Quick date buttons */}
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

          {/* Classes do Dia */}
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
                      setIsClassStarted(false); // Reset class status
                    }}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Area */}
        <div className="flex-1 p-6 overflow-auto">
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