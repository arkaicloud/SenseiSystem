import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Phone, Mail, MessageSquare, Calendar, Users, TrendingDown } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { BeltWithLabel } from "@/components/ui/belt";

interface StudentAtRisk {
  id: number;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  beltLevel: string;
  stripes: number;
  attendanceRate: number;
  lastAttendance: string | null;
  daysSinceLastAttendance: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  totalClasses: number;
  attendedClasses: number;
}

const StudentsAtRisk: React.FC = () => {
  const { toast } = useToast();
  const [selectedStudent, setSelectedStudent] = useState<StudentAtRisk | null>(null);
  const [actionType, setActionType] = useState<string>("");
  const [actionDialog, setActionDialog] = useState(false);
  const [riskThreshold, setRiskThreshold] = useState(60); // 60% frequência mínima

  // Buscar alunos em risco
  const { data: studentsAtRiskData, isLoading } = useQuery({
    queryKey: ['/api/students/at-risk', riskThreshold],
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  // Buscar configurações de risco
  const { data: riskSettings } = useQuery({
    queryKey: ['/api/risk-settings'],
  });

  // Mutation para executar ações
  const actionMutation = useMutation({
    mutationFn: async (data: {
      studentId: number;
      actionType: string;
      notes?: string;
      scheduledDate?: string;
    }) => {
      const response = await apiRequest('POST', '/api/students/risk-actions', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Ação registrada",
        description: "A ação foi registrada com sucesso.",
      });
      setActionDialog(false);
      setSelectedStudent(null);
      queryClient.invalidateQueries({ queryKey: ['/api/students/at-risk'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const studentsAtRisk = studentsAtRiskData?.students || [];

  const getRiskBadge = (riskLevel: string) => {
    const variants = {
      low: "bg-yellow-100 text-yellow-800 border-yellow-200",
      medium: "bg-orange-100 text-orange-800 border-orange-200", 
      high: "bg-red-100 text-red-800 border-red-200",
      critical: "bg-red-600 text-white border-red-700"
    };
    
    const labels = {
      low: "Baixo Risco",
      medium: "Risco Médio",
      high: "Alto Risco", 
      critical: "Risco Crítico"
    };

    return (
      <Badge className={variants[riskLevel as keyof typeof variants]}>
        {labels[riskLevel as keyof typeof labels]}
      </Badge>
    );
  };

  const handleQuickAction = (student: StudentAtRisk, action: string) => {
    setSelectedStudent(student);
    setActionType(action);
    setActionDialog(true);
  };

  const handleSubmitAction = () => {
    if (!selectedStudent || !actionType) return;

    const formData = new FormData(document.getElementById('action-form') as HTMLFormElement);
    
    actionMutation.mutate({
      studentId: selectedStudent.id,
      actionType,
      notes: formData.get('notes') as string,
      scheduledDate: formData.get('scheduledDate') as string,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Analisando frequência dos alunos...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <div>
          <h1 className="font-montserrat font-bold text-2xl text-primary flex items-center gap-2">
            <AlertTriangle className="h-7 w-7" />
            Alunos em Risco
          </h1>
          <p className="text-gray-600">Identifique e aja proativamente para reter alunos</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Frequência mínima:</span>
            <Input
              type="number"
              value={riskThreshold}
              onChange={(e) => setRiskThreshold(Number(e.target.value))}
              className="w-20"
              min="0"
              max="100"
            />
            <span className="text-sm text-gray-600">%</span>
          </div>
        </div>
      </div>

      {/* Estatísticas Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total em Risco</p>
                <p className="text-2xl font-bold text-red-600">{studentsAtRisk.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Risco Crítico</p>
                <p className="text-2xl font-bold text-red-600">
                  {studentsAtRisk.filter(s => s.riskLevel === 'critical').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Alto Risco</p>
                <p className="text-2xl font-bold text-orange-600">
                  {studentsAtRisk.filter(s => s.riskLevel === 'high').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Calendar className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Frequência Média</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {studentsAtRisk.length > 0 
                    ? Math.round(studentsAtRisk.reduce((acc, s) => acc + s.attendanceRate, 0) / studentsAtRisk.length) 
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Alunos em Risco */}
      <Card>
        <CardHeader>
          <CardTitle>Alunos Identificados</CardTitle>
        </CardHeader>
        <CardContent>
          {studentsAtRisk.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum aluno em risco identificado</p>
              <p className="text-sm text-gray-500">Todos os alunos estão com frequência adequada!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {studentsAtRisk.map((student) => (
                <div
                  key={student.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {student.user.firstName} {student.user.lastName}
                          </h3>
                          <p className="text-sm text-gray-600">{student.user.email}</p>
                        </div>
                        <BeltWithLabel level={student.beltLevel} stripes={student.stripes} />
                        {getRiskBadge(student.riskLevel)}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Frequência:</span>
                          <span className="ml-1 font-medium text-red-600">
                            {student.attendanceRate}%
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Última presença:</span>
                          <span className="ml-1 font-medium">
                            {student.daysSinceLastAttendance > 0 
                              ? `${student.daysSinceLastAttendance} dias atrás`
                              : 'Hoje'
                            }
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Aulas:</span>
                          <span className="ml-1 font-medium">
                            {student.attendedClasses}/{student.totalClasses}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Telefone:</span>
                          <span className="ml-1 font-medium">
                            {student.user.phone || 'Não informado'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuickAction(student, 'call')}
                      >
                        <Phone className="h-4 w-4 mr-1" />
                        Ligar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuickAction(student, 'email')}
                      >
                        <Mail className="h-4 w-4 mr-1" />
                        Email
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuickAction(student, 'whatsapp')}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        WhatsApp
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Ações */}
      <Dialog open={actionDialog} onOpenChange={setActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Ação para {selectedStudent?.user.firstName} {selectedStudent?.user.lastName}
            </DialogTitle>
          </DialogHeader>
          
          <form id="action-form" className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tipo de Ação</label>
              <Select value={actionType} onValueChange={setActionType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de ação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Ligação Telefônica</SelectItem>
                  <SelectItem value="email">Envio de Email</SelectItem>
                  <SelectItem value="whatsapp">Mensagem WhatsApp</SelectItem>
                  <SelectItem value="visit">Visita Presencial</SelectItem>
                  <SelectItem value="discount">Oferecer Desconto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Observações</label>
              <Textarea
                name="notes"
                placeholder="Descreva a ação realizada ou planejada..."
                rows={3}
              />
            </div>

            {actionType === 'call' && (
              <div>
                <label className="block text-sm font-medium mb-2">Agendar para</label>
                <Input
                  type="datetime-local"
                  name="scheduledDate"
                />
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActionDialog(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleSubmitAction}
                disabled={actionMutation.isPending}
              >
                {actionMutation.isPending ? 'Salvando...' : 'Salvar Ação'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StudentsAtRisk;