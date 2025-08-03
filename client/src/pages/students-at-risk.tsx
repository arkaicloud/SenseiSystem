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
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskLabel = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
        return 'Risco Crítico';
      case 'high':
        return 'Alto Risco';
      case 'medium':
        return 'Risco Moderado';
      default:
        return 'Baixo Risco';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-montserrat font-bold text-2xl text-blue-600 flex items-center">
            <span className="material-icons mr-2 text-orange-500">warning</span>
            Alunos em Risco
          </h1>
          <p className="text-gray-600">Identifique e aja proativamente para reter alunos</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label htmlFor="frequency" className="text-sm font-medium text-gray-700">
              Frequência mínima:
            </label>
            <Input
              id="frequency"
              type="number"
              value={frequencyThreshold}
              onChange={(e) => setFrequencyThreshold(Number(e.target.value))}
              className="w-20"
              min="0"
              max="100"
            />
            <span className="text-sm text-gray-500">%</span>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <span className="material-icons mr-1 text-sm">refresh</span>
            Atualizar
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-50 rounded-lg mr-3">
                <span className="material-icons text-red-500">trending_down</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{totalAtRisk}</p>
                <p className="text-sm text-gray-600">Total em Risco</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-50 rounded-lg mr-3">
                <span className="material-icons text-red-600">report_problem</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{criticalRisk}</p>
                <p className="text-sm text-gray-600">Risco Crítico</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-50 rounded-lg mr-3">
                <span className="material-icons text-orange-500">priority_high</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{highRisk}</p>
                <p className="text-sm text-gray-600">Alto Risco</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-50 rounded-lg mr-3">
                <span className="material-icons text-yellow-600">calendar_today</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{averageFrequency}%</p>
                <p className="text-sm text-gray-600">Frequência Média</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students List */}
      <Card>
        <CardHeader>
          <CardTitle>Alunos Identificados</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando alunos em risco...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-icons text-6xl text-gray-300 mb-4">sentiment_very_satisfied</span>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum aluno em risco identificado</h3>
              <p className="text-gray-500">Todos os alunos estão com frequência adequada!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {students.map((student: any) => (
                <div
                  key={student.id}
                  className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${getRiskColor(student.riskLevel)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Avatar */}
                      <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {student.user.firstName?.charAt(0)}{student.user.lastName?.charAt(0)}
                        </span>
                      </div>

                      {/* Student Info */}
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {student.user.firstName} {student.user.lastName}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>📧 {student.user.email}</span>
                          <span>📱 {student.user.phone || 'Sem telefone'}</span>
                          {student.user.emergencyContact && (
                            <span>🚨 {student.user.emergencyContact}</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <BeltWithLabel belt={student.beltLevel} stripes={student.stripes} />
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRiskColor(student.riskLevel)}`}>
                            {getRiskLabel(student.riskLevel)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Statistics */}
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        {student.attendanceRate}%
                      </div>
                      <div className="text-sm text-gray-600">
                        {student.daysSinceLastAttendance} dias sem aula
                      </div>
                      <div className="text-xs text-gray-500">
                        {student.attendedClasses}/{student.totalClasses} aulas
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
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
                        <DialogContent className="sm:max-w-[600px]">
                          <DialogHeader>
                            <DialogTitle>
                              Adicionar Observação - {selectedStudent?.user.firstName} {selectedStudent?.user.lastName}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            {/* Student Contact Info */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <h4 className="font-medium text-gray-900 mb-2">Dados de Contato</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                <div><strong>Email:</strong> {selectedStudent?.user.email}</div>
                                <div><strong>Telefone:</strong> {selectedStudent?.user.phone || 'Não informado'}</div>
                                <div className="md:col-span-2">
                                  <strong>Contato de Emergência:</strong> {selectedStudent?.user.emergencyContact || 'Não informado'}
                                </div>
                              </div>
                            </div>

                            {/* Risk Info */}
                            <div className="bg-orange-50 p-4 rounded-lg">
                              <h4 className="font-medium text-gray-900 mb-2">Situação de Risco</h4>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><strong>Frequência:</strong> {selectedStudent?.attendanceRate}%</div>
                                <div><strong>Último comparecimento:</strong> {selectedStudent?.daysSinceLastAttendance} dias atrás</div>
                                <div><strong>Aulas assistidas:</strong> {selectedStudent?.attendedClasses}</div>
                                <div><strong>Nível de risco:</strong> {getRiskLabel(selectedStudent?.riskLevel || 'low')}</div>
                              </div>
                            </div>

                            {/* Observation Input */}
                            <div>
                              <label htmlFor="observation" className="block text-sm font-medium text-gray-700 mb-2">
                                Observação sobre o aluno
                              </label>
                              <Textarea
                                id="observation"
                                placeholder="Digite sua observação sobre a situação do aluno, ações tomadas, contatos realizados, etc..."
                                value={observation}
                                onChange={(e) => setObservation(e.target.value)}
                                rows={4}
                                className="w-full"
                              />
                            </div>

                            {/* Previous Notes */}
                            {selectedStudent?.notes && (
                              <div className="bg-blue-50 p-4 rounded-lg">
                                <h4 className="font-medium text-gray-900 mb-2">Observações Anteriores</h4>
                                <p className="text-sm text-gray-700">{selectedStudent.notes}</p>
                              </div>
                            )}

                            <div className="flex justify-end space-x-2">
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
                    <div className="mt-3 p-3 bg-white bg-opacity-50 rounded border-l-4 border-blue-400">
                      <p className="text-sm text-gray-700">
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