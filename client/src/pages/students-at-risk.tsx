import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BeltWithLabel } from "@/components/ui/belt";
import { CalendarDays, RefreshCw, ShieldAlert, TrendingDown, ArrowUpRight } from "lucide-react";

const StudentsAtRisk: React.FC = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [observation, setObservation] = useState("");
  const [frequencyThreshold, setFrequencyThreshold] = useState(60);

  const { data: studentsData, isLoading, refetch } = useQuery({
    queryKey: ['/api/students/at-risk', frequencyThreshold],
    queryFn: () => apiRequest('GET', `/api/students/at-risk?threshold=${frequencyThreshold}`)
  });

  const { data: settingsData } = useQuery({
    queryKey: ['/api/risk-settings'],
  });

  const { mutate: saveObservation, isPending: isSaving } = useMutation({
    mutationFn: ({ studentId, notes }: { studentId: number; notes: string }) => 
      apiRequest('PUT', `/api/students/${studentId}/notes`, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students/at-risk'] });
      setSelectedStudent(null);
      setObservation("");
      toast({
        title: "Sucesso",
        description: "Observação salva com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar observação",
        variant: "destructive",
      });
    },
  });

  const students = (studentsData as any)?.students || [];
  
  // Calculate risk statistics
  const totalAtRisk = students.length;
  const criticalRisk = students.filter((s: any) => s.riskLevel === 'critical').length;
  const highRisk = students.filter((s: any) => s.riskLevel === 'high').length;
  const averageFrequency = students.length > 0 
    ? Math.round(students.reduce((sum: number, s: any) => sum + s.attendanceRate, 0) / students.length)
    : 0;

  const handleSaveObservation = () => {
    if (!selectedStudent || !observation.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, digite uma observação",
        variant: "destructive",
      });
      return;
    }

    saveObservation({
      studentId: selectedStudent.id,
      notes: observation
    });
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'high':
        return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      default:
        return 'text-secondary-foreground dark:text-muted-foreground bg-background dark:bg-card border-border dark:border-border';
    }
  };

  const getRiskLabel = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
        return 'Engajamento Crítico';
      case 'high':
        return 'Baixo Engajamento';
      case 'medium':
        return 'Engajamento Moderado';
      default:
        return 'Bom Engajamento';
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-warning">Acompanhamento da turma</p>
          <h1 className="flex items-center text-2xl font-bold text-foreground sm:text-3xl">
            <ShieldAlert className="mr-3 size-7 text-warning" />
            Engajamento em Baixa
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Identifique sinais de afastamento e registre o próximo passo para cada aluno.</p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1.5 text-xs text-accent-foreground"><CalendarDays className="size-3.5" /> Análise aplicada a matrículas com mais de 30 dias</div>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="frequency" className="text-sm font-medium text-secondary-foreground">
              Frequência mínima:
            </label>
            <Input
              id="frequency"
              type="number"
              value={frequencyThreshold}
              onChange={(e) => setFrequencyThreshold(Number(e.target.value))}
              className="w-24"
              min="0"
              max="100"
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="size-4" /> Atualizar
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-lg mr-3">
                <span className="material-icons text-red-500">trending_down</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{totalAtRisk}</p>
                <p className="text-sm text-secondary-foreground dark:text-muted-foreground">Baixo Engajamento</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-lg mr-3">
                <span className="material-icons text-red-600">report_problem</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{criticalRisk}</p>
                <p className="text-sm text-secondary-foreground dark:text-muted-foreground">Engajamento Crítico</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg mr-3">
                <span className="material-icons text-orange-500">priority_high</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{highRisk}</p>
                <p className="text-sm text-secondary-foreground dark:text-muted-foreground">Baixo Engajamento</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg mr-3">
                <span className="material-icons text-yellow-600">calendar_today</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{averageFrequency}%</p>
                <p className="text-sm text-secondary-foreground dark:text-muted-foreground">Frequência Média</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students List */}
      <Card>
        <CardHeader>
          <CardTitle>Alunos com Baixo Engajamento</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-secondary-foreground">Carregando alunos com baixo engajamento...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-icons text-6xl text-muted-foreground mb-4">sentiment_very_satisfied</span>
              <h3 className="text-lg font-medium text-foreground dark:text-foreground mb-2">Nenhum aluno com baixo engajamento identificado</h3>
              <p className="text-muted-foreground">Todos os alunos estão com engajamento adequado!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {students.map((student: any) => (
                <div
                  key={student.id}
                  className={`rounded-2xl border p-4 transition-shadow hover:shadow-md sm:p-5 ${getRiskColor(student.riskLevel)}`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-start gap-4">
                      {/* Avatar */}
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-sm font-medium text-secondary-foreground">
                          {student.user.firstName?.charAt(0)}{student.user.lastName?.charAt(0)}
                        </span>
                      </div>

                      {/* Student Info */}
                      <div>
                        <h3 className="font-medium text-foreground dark:text-foreground">
                          {student.user.firstName} {student.user.lastName}
                        </h3>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-secondary-foreground dark:text-muted-foreground">
                          <span className="truncate">📧 {student.user.email}</span>
                          <span>📱 {student.user.phone || 'Sem telefone'}</span>
                          {student.user.emergencyContact && (
                            <span>🚨 {student.user.emergencyContact}</span>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <BeltWithLabel belt={student.beltLevel} stripes={student.stripes} />
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRiskColor(student.riskLevel)}`}>
                            {getRiskLabel(student.riskLevel)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Statistics */}
                    <div className="flex items-center justify-between gap-4 lg:block lg:text-right">
                      <div className="text-lg font-bold text-foreground dark:text-foreground">
                        {student.attendanceRate}%
                      </div>
                      <div className="text-sm text-secondary-foreground dark:text-muted-foreground">
                        {student.daysSinceLastAttendance} dias sem aula
                      </div>
                      <div className="text-xs text-muted-foreground dark:text-muted-foreground">
                        {student.attendedClasses}/{student.totalClasses} aulas
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 lg:shrink-0">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedStudent(student);
                              setObservation(student.notes || '');
                            }}
                          >
                            <span className="material-icons mr-1 text-sm">note_add</span>
                            Observação
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[92dvh] w-[calc(100vw-1rem)] overflow-y-auto rounded-2xl sm:max-w-[600px]">
                          <DialogHeader>
                            <DialogTitle>
                              Observação de Engajamento - {selectedStudent?.user.firstName} {selectedStudent?.user.lastName}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="flex flex-col gap-4">
                            {/* Student Contact Info */}
                            <div className="bg-background dark:bg-muted p-4 rounded-lg">
                              <h4 className="font-medium text-foreground dark:text-foreground mb-2">Dados de Contato</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                <div><strong>Email:</strong> {selectedStudent?.user.email}</div>
                                <div><strong>Telefone:</strong> {selectedStudent?.user.phone || 'Não informado'}</div>
                                <div className="md:col-span-2">
                                  <strong>Contato de Emergência:</strong> {selectedStudent?.user.emergencyContact || 'Não informado'}
                                </div>
                              </div>
                            </div>

                            {/* Risk Info */}
                            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                              <h4 className="font-medium text-foreground dark:text-foreground mb-2">Situação de Engajamento</h4>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><strong>Frequência:</strong> {selectedStudent?.attendanceRate}%</div>
                                <div><strong>Último comparecimento:</strong> {selectedStudent?.daysSinceLastAttendance} dias atrás</div>
                                <div><strong>Aulas assistidas:</strong> {selectedStudent?.attendedClasses}</div>
                                <div><strong>Nível de engajamento:</strong> {getRiskLabel(selectedStudent?.riskLevel || 'low')}</div>
                              </div>
                            </div>

                            {/* Observation Input */}
                            <div>
                              <label htmlFor="observation" className="block text-sm font-medium text-secondary-foreground mb-2">
                                Observação sobre o aluno
                              </label>
                              <Textarea
                                id="observation"
                                placeholder="Digite sua observação sobre o engajamento do aluno, ações tomadas, contatos realizados, etc..."
                                value={observation}
                                onChange={(e) => setObservation(e.target.value)}
                                rows={4}
                                className="w-full"
                              />
                            </div>

                            {/* Previous Notes */}
                            {selectedStudent?.notes && (
                              <div className="bg-accent dark:bg-accent/20 p-4 rounded-lg">
                                <h4 className="font-medium text-foreground dark:text-foreground mb-2">Observações Anteriores</h4>
                                <p className="text-sm text-secondary-foreground dark:text-secondary-foreground">{selectedStudent.notes}</p>
                              </div>
                            )}

                            <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
                              <Button variant="outline" onClick={() => setSelectedStudent(null)}>
                                Cancelar
                              </Button>
                              <Button onClick={handleSaveObservation} disabled={isSaving}>
                                {isSaving ? "Salvando..." : "Salvar Observação"}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  {/* Show current notes if any */}
                  {student.notes && (
                    <div className="mt-3 p-3 bg-card dark:bg-card bg-opacity-50 dark:bg-opacity-50 rounded border-l-4 border-primary">
                      <p className="text-sm text-secondary-foreground dark:text-secondary-foreground">
                        <strong>Observação:</strong> {student.notes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentsAtRisk;
