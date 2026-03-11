import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, Mail, Phone, CreditCard, CheckCircle, XCircle, AlertTriangle, FileWarning, GraduationCap } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PendingUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  joinDate: string;
  student?: {
    id: number;
    financialResponsibleName?: string;
    financialResponsibleEmail?: string;
    financialResponsiblePhone?: string;
    financialResponsibleCpf?: string;
    financialResponsibleRelation?: string;
    paymentPlanId?: number;
    requiresMedicalCertificate?: boolean;
    medicalCertificateStatus?: string;
    isScholarship?: boolean;
    couponCode?: string;
  };
}

interface PaymentPlan {
  id: number;
  name: string;
  amount: number;
  frequency: string;
}

export default function PendingApprovals() {
  const { toast } = useToast();

  const { data: pendingUsers, isLoading: loadingUsers } = useQuery({
    queryKey: ['/api/users/pending'],
    refetchInterval: 30000,
  });

  const { data: paymentPlans } = useQuery({
    queryKey: ['/api/payment-plans'],
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/users/pending'] });
    queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] });
    queryClient.invalidateQueries({ queryKey: ['/api/financial-stats'] });
  };

  // Mutation para aprovar aluno normal
  const approveMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await apiRequest(`/api/users/${userId}/approve`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      toast({ title: "Aluno aprovado com sucesso!" });
      invalidateAll();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao aprovar aluno",
        description: error.message || "Verifique a configuração do ASAAS.",
        variant: "destructive",
      });
    },
  });

  // Mutation para aprovar como bolsista (marca isScholarship=true + aprova)
  const approveScholarshipMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await apiRequest(`/api/users/${userId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ isScholarship: true }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Bolsista aprovado com sucesso!",
        description: "O aluno foi marcado como bolsista e ativado.",
      });
      invalidateAll();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao aprovar bolsista",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  // Mutation para rejeitar aluno
  const rejectMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await apiRequest(`/api/admin/student/${userId}/reject`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      toast({ title: "Aluno rejeitado", description: "O cadastro foi removido do sistema." });
      queryClient.invalidateQueries({ queryKey: ['/api/users/pending'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao rejeitar aluno",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const getPaymentPlanName = (planId?: number): string => {
    if (!planId || !paymentPlans?.plans) return 'Plano não definido';
    const plan = paymentPlans.plans.find((p: PaymentPlan) => p.id === planId);
    return plan ? `${plan.name} - ${new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(plan.amount / 100)}` : 'Plano não encontrado';
  };

  const validateStudentData = (user: PendingUser): { isValid: boolean; issues: string[] } => {
    const issues: string[] = [];
    const isScholarship = user.student?.isScholarship === true;

    if (!isScholarship) {
      if (!user.student?.financialResponsibleName) {
        issues.push('Nome do responsável financeiro não informado');
      }
      if (!user.student?.financialResponsibleCpf) {
        issues.push('CPF do responsável financeiro não informado');
      }
      if (!user.student?.paymentPlanId) {
        issues.push('Plano de pagamento não selecionado');
      }
    }

    return { isValid: issues.length === 0, issues };
  };

  // Verifica se o único problema é a falta de plano (sem dados financeiros também ausentes)
  const isMissingOnlyPlan = (user: PendingUser): boolean => {
    const isScholarship = user.student?.isScholarship === true;
    if (isScholarship) return false;
    const { issues } = validateStudentData(user);
    return issues.length === 1 && issues[0] === 'Plano de pagamento não selecionado';
  };

  // Verifica se o único problema é o plano E dados financeiros (cenário de bolsista não marcado)
  const canApproveAsScholarship = (user: PendingUser): boolean => {
    return user.student !== undefined && !user.student?.isScholarship;
  };

  if (loadingUsers) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Carregando aprovações pendentes...</span>
      </div>
    );
  }

  if (!pendingUsers?.users || pendingUsers.users.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Aprovações Pendentes
          </CardTitle>
          <CardDescription>
            Não há alunos aguardando aprovação no momento.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Aprovações Pendentes</h2>
        <p className="text-muted-foreground">
          {pendingUsers.users.length} aluno{pendingUsers.users.length !== 1 ? 's' : ''} aguardando aprovação
        </p>
      </div>

      <div className="grid gap-6">
        {pendingUsers.users.map((user: PendingUser) => {
          const validation = validateStudentData(user);
          const isPendingApprove = approveMutation.isPending || approveScholarshipMutation.isPending;

          return (
            <Card key={user.id} className={`border-l-4 ${validation.isValid ? 'border-l-green-500' : 'border-l-yellow-500'}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {user.firstName} {user.lastName}
                      {validation.isValid ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Pronto para aprovação
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Dados incompletos
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Cadastrado em {format(new Date(user.joinDate), 'dd/MM/yyyy', { locale: ptBR })}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground">Dados do Aluno</h4>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {user.email}
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {user.phone}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground">Responsável Financeiro</h4>
                    {user.student?.isScholarship ? (
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">Bolsista — isento de pagamento</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {user.student?.financialResponsibleName ? (
                          <div className="text-sm">
                            <strong>{user.student.financialResponsibleName}</strong>
                            {user.student.financialResponsibleRelation && (
                              <span className="text-muted-foreground ml-2">
                                ({user.student.financialResponsibleRelation})
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-red-600">Nome não informado</div>
                        )}
                        {user.student?.financialResponsibleCpf ? (
                          <div className="text-sm text-muted-foreground">
                            CPF: {user.student.financialResponsibleCpf}
                          </div>
                        ) : (
                          <div className="text-sm text-red-600">CPF não informado</div>
                        )}
                        {user.student?.financialResponsibleEmail && (
                          <div className="text-sm text-muted-foreground">
                            {user.student.financialResponsibleEmail}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">Plano de Pagamento</h4>
                  <div className="flex items-center gap-2">
                    {user.student?.isScholarship ? (
                      <>
                        <GraduationCap className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">
                          Bolsista{user.student.couponCode ? ` — Cupom: ${user.student.couponCode}` : ''}
                        </span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{getPaymentPlanName(user.student?.paymentPlanId)}</span>
                      </>
                    )}
                  </div>
                </div>

                {user.student?.requiresMedicalCertificate && user.student?.medicalCertificateStatus === 'PENDING' && (
                  <Alert className="border-orange-300 bg-orange-50">
                    <FileWarning className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                      <strong>Atestado médico pendente:</strong> Este aluno possui respostas de saúde
                      que requerem atestado médico. O atestado ainda não foi enviado. Você pode aprovar
                      a matrícula, mas o aluno precisa enviar o atestado pelo seu perfil.
                    </AlertDescription>
                  </Alert>
                )}

                {!validation.isValid && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Dados incompletos:</strong>
                      <ul className="list-disc list-inside mt-1">
                        {validation.issues.map((issue, index) => (
                          <li key={index} className="text-sm">{issue}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-wrap gap-3 pt-4">
                  {/* Botão aprovar normal */}
                  {validation.isValid && (
                    <Button
                      onClick={() => approveMutation.mutate(user.id)}
                      disabled={isPendingApprove}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {approveMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Aprovando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {user.student?.isScholarship ? 'Aprovar Bolsista' : 'Aprovar e Criar Cobrança'}
                        </>
                      )}
                    </Button>
                  )}

                  {/* Botão aprovar como bolsista — aparece quando não tem isScholarship marcado */}
                  {canApproveAsScholarship(user) && (
                    <Button
                      onClick={() => approveScholarshipMutation.mutate(user.id)}
                      disabled={isPendingApprove}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {approveScholarshipMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Aprovando...
                        </>
                      ) : (
                        <>
                          <GraduationCap className="h-4 w-4 mr-2" />
                          Aprovar como Bolsista
                        </>
                      )}
                    </Button>
                  )}

                  <Button
                    variant="destructive"
                    onClick={() => rejectMutation.mutate(user.id)}
                    disabled={rejectMutation.isPending}
                  >
                    {rejectMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Rejeitando...
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        Rejeitar
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
