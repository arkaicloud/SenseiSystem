import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Mail, 
  Phone, 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  Calendar,
  Edit,
  Clock,
  Download,
  Users,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import StudentEditDialog from "@/components/students/StudentEditDialog";

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
    financialResponsibleCpf?: string;
    financialResponsibleEmail?: string;
    financialResponsiblePhone?: string;
    financialResponsibleRelation?: string;
    paymentPlanId?: number;
    isScholarship?: boolean;
    couponCode?: string;
  };
}

interface PaymentPlan {
  id: number;
  name: string;
  amount: number;
  description?: string;
}

type FilterStatus = 'all' | 'complete' | 'incomplete' | 'no-plan' | 'minor';

export default function PendingApprovalsBatch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [expandedUsers, setExpandedUsers] = useState<Set<number>>(new Set());
  const [editingPlan, setEditingPlan] = useState<number | null>(null);
  const [editingStudent, setEditingStudent] = useState<number | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [userStatuses, setUserStatuses] = useState<Map<number, {
    status: 'success' | 'error' | 'pending',
    message: string,
    asaasError?: string
  }>>(new Map());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch pending users
  const { data: pendingUsers, isLoading: usersLoading } = useQuery<{ users: PendingUser[] }>({
    queryKey: ["/api/users/pending"],
    refetchInterval: 30000,
  });

  // Fetch payment plans
  const { data: paymentPlans } = useQuery<{ plans: PaymentPlan[] }>({
    queryKey: ["/api/payment-plans"],
  });

  // Validation function
  const validateStudentData = (user: PendingUser) => {
    const issues: string[] = [];
    const isScholarship = user.student?.isScholarship === true;

    // Bolsistas não precisam de plano de pagamento nem de responsável financeiro
    if (!isScholarship) {
      if (!user.student?.financialResponsibleName) {
        issues.push("Nome do responsável financeiro não informado");
      }
      if (!user.student?.financialResponsibleCpf) {
        issues.push("CPF do responsável financeiro não informado");
      }
      if (!user.student?.paymentPlanId) {
        issues.push("Plano de pagamento não selecionado");
      }
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  };

  // Filter and search logic
  const filteredUsers = useMemo(() => {
    if (!pendingUsers?.users) return [];

    let filtered = pendingUsers.users.filter((user: PendingUser) => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
        const email = user.email.toLowerCase();
        
        if (!fullName.includes(searchLower) && !email.includes(searchLower)) {
          return false;
        }
      }

      // Status filter
      if (filterStatus !== 'all') {
        const validation = validateStudentData(user);
        
        switch (filterStatus) {
          case 'complete':
            return validation.isValid;
          case 'incomplete':
            return !validation.isValid;
          case 'no-plan':
            return !user.student?.paymentPlanId;
          case 'minor':
            return user.student?.financialResponsibleRelation !== 'self';
        }
      }

      return true;
    });

    // Sort by join date (newest first)
    return filtered.sort((a: PendingUser, b: PendingUser) => 
      new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime()
    );
  }, [pendingUsers, searchTerm, filterStatus]);

  // Batch approval mutation
  const batchApproveMutation = useMutation({
    mutationFn: async (userIds: number[]) => {
      const response = await fetch("/api/users/batch-approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userIds }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro na aprovação em lote");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Update user statuses based on results
      const newStatuses = new Map(userStatuses);
      
      if (data.userResults) {
        data.userResults.forEach((result: any) => {
          newStatuses.set(result.userId, {
            status: result.status,
            message: result.message,
            asaasError: result.asaasError
          });
        });
      }
      
      setUserStatuses(newStatuses);

      // Show success toast with summary
      toast({
        title: "Processamento Concluído",
        description: `${data.successful} aprovados, ${data.failed} com erro`,
      });

      // Clear selection for successful users only
      const successfulUserIds = data.userResults
        ?.filter((result: any) => result.status === 'success')
        ?.map((result: any) => result.userId) || [];
      
      const newSelection = new Set(selectedUsers);
      successfulUserIds.forEach((userId: number) => {
        newSelection.delete(userId);
      });
      setSelectedUsers(newSelection);

      // Auto-reload after successful integrations
      if (successfulUserIds.length > 0) {
        setTimeout(() => {
          // Clear all statuses for successful users to make them disappear
          const updatedStatuses = new Map(userStatuses);
          successfulUserIds.forEach((userId: number) => {
            updatedStatuses.delete(userId);
          });
          setUserStatuses(updatedStatuses);
          
          // Refresh pending users to remove successful approvals
          queryClient.invalidateQueries({ queryKey: ["/api/users/pending"] });
          
          toast({
            title: "Lista Atualizada",
            description: `${successfulUserIds.length} aluno(s) aprovado(s) removido(s) da lista`,
          });
        }, 3000); // Wait 3 seconds to show success messages, then reload
      } else {
        // If no successful users, just refresh immediately  
        queryClient.invalidateQueries({ queryKey: ["/api/users/pending"] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na aprovação em lote",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Individual approval mutation
  const approveMutation = useMutation({
    mutationFn: async (userId: number) => {
      const user = pendingUsers?.users?.find((u: PendingUser) => u.id === userId);
      const planId = user?.student?.paymentPlanId;
      
      if (!planId) {
        throw new Error("Plano de pagamento é obrigatório para aprovação");
      }
      
      const response = await fetch(`/api/users/${userId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planId }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao aprovar aluno");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Aluno aprovado com sucesso e integração ASAAS realizada.",
      });
      
      // Auto-reload after 2 seconds to remove the approved student
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/users/pending"] });
        toast({
          title: "Lista Atualizada",
          description: "Aluno aprovado removido da lista",
        });
      }, 2000);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Batch selection functions
  const toggleUserSelection = (userId: number) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const selectAllUsers = () => {
    const eligibleUsers = filteredUsers.filter((user: PendingUser) => validateStudentData(user).isValid);
    setSelectedUsers(new Set(eligibleUsers.map((user: PendingUser) => user.id)));
  };

  const clearSelection = () => {
    setSelectedUsers(new Set());
  };

  const handleBatchApproval = () => {
    if (selectedUsers.size === 0) {
      toast({
        title: "Nenhum aluno selecionado",
        description: "Selecione pelo menos um aluno para aprovação em lote.",
        variant: "destructive",
      });
      return;
    }

    batchApproveMutation.mutate(Array.from(selectedUsers));
  };

  const toggleExpanded = (userId: number) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  const getPaymentPlanName = (planId?: number) => {
    if (!planId || !paymentPlans?.plans) return "Não definido";
    const plan = paymentPlans.plans.find(p => p.id === planId);
    return plan ? `${plan.name} - ${new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(plan.amount / 100)}` : "Não definido";
  };

  const getStatusBadge = (user: PendingUser) => {
    const validation = validateStudentData(user);
    
    if (validation.isValid) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Pronto para aprovação
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Dados incompletos
        </Badge>
      );
    }
  };

  if (usersLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">Carregando aprovações pendentes...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Aprovações Pendentes</h2>
          <p className="text-muted-foreground">
            {filteredUsers.length} de {pendingUsers?.users?.length || 0} aluno{filteredUsers.length !== 1 ? 's' : ''}
          </p>
          {selectedUsers.size > 0 && (
            <p className="text-sm text-blue-600 font-medium">
              {selectedUsers.size} aluno{selectedUsers.size !== 1 ? 's' : ''} selecionado{selectedUsers.size !== 1 ? 's' : ''} para aprovação
            </p>
          )}
        </div>
        
        {/* Batch Actions */}
        {selectedUsers.size > 0 && (
          <div className="flex gap-2">
            <Button
              onClick={handleBatchApproval}
              disabled={batchApproveMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {batchApproveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Users className="h-4 w-4 mr-2" />
              )}
              Aprovar {selectedUsers.size} Aluno{selectedUsers.size !== 1 ? 's' : ''}
            </Button>
            <Button
              variant="outline"
              onClick={clearSelection}
            >
              Limpar Seleção
            </Button>
          </div>
        )}
      </div>

      {/* Batch Selection Bar */}
      {filteredUsers.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg border">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedUsers.size === filteredUsers.filter((user: PendingUser) => validateStudentData(user).isValid).length && selectedUsers.size > 0}
              onCheckedChange={(checked) => {
                if (checked) {
                  selectAllUsers();
                } else {
                  clearSelection();
                }
              }}
            />
            <span className="text-sm font-medium">Selecionar todos elegíveis</span>
          </div>
          
          <div className="text-sm text-muted-foreground">
            {filteredUsers.filter((user: PendingUser) => validateStudentData(user).isValid).length} alunos prontos para aprovação
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={filterStatus} onValueChange={(value: FilterStatus) => setFilterStatus(value)}>
          <SelectTrigger className="w-full md:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="complete">Dados completos</SelectItem>
            <SelectItem value="incomplete">Dados incompletos</SelectItem>
            <SelectItem value="no-plan">Sem plano</SelectItem>
            <SelectItem value="minor">Menores de idade</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results */}
      {filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              {searchTerm || filterStatus !== 'all' 
                ? "Nenhum aluno encontrado com os filtros aplicados"
                : "Nenhuma aprovação pendente"
              }
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredUsers.map((user: PendingUser) => {
            const validation = validateStudentData(user);
            const isExpanded = expandedUsers.has(user.id);
            const isSelected = selectedUsers.has(user.id);
            const daysSinceJoin = Math.floor(
              (new Date().getTime() - new Date(user.joinDate).getTime()) / (1000 * 60 * 60 * 24)
            );
            
            return (
              <Card 
                key={user.id} 
                className={`border-l-4 transition-all ${
                  validation.isValid ? 'border-l-green-500' : 'border-l-yellow-500'
                } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
              >
                <CardContent className="p-3 md:p-5">
                  {/* Top row: checkbox + name + badge + actions */}
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleUserSelection(user.id)}
                      disabled={!validation.isValid}
                      className="mt-1 shrink-0"
                    />

                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                      {/* Name + badge + action buttons row */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <h3 className="text-base font-semibold leading-tight truncate">
                            {user.firstName} {user.lastName}
                          </h3>
                          <div className="mt-1">{getStatusBadge(user)}</div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleExpanded(user.id)}
                            className="h-8 w-8 p-0"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>

                          {!validation.isValid && user.student?.id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingStudent(user.student!.id)}
                              className="h-8 w-8 p-0 text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}

                          {validation.isValid && (
                            <Button
                              size="sm"
                              onClick={() => approveMutation.mutate(user.id)}
                              disabled={approveMutation.isPending}
                              className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700 text-white"
                            >
                              {approveMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Info grid */}
                      <div className="grid grid-cols-1 gap-y-1 text-xs text-muted-foreground mb-3">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 shrink-0" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          <span>Cadastrado há {daysSinceJoin} dia{daysSinceJoin !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <CreditCard className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{getPaymentPlanName(user.student?.paymentPlanId)}</span>
                        </div>
                      </div>

                        {/* User Status (ASAAS errors, etc.) */}
                        {userStatuses.has(user.id) && (
                          <Alert className={`mb-3 ${
                            userStatuses.get(user.id)?.status === 'error' 
                              ? 'border-red-500 bg-red-50 dark:bg-red-950' 
                              : 'border-green-500 bg-green-50 dark:bg-green-950'
                          }`}>
                            {userStatuses.get(user.id)?.status === 'error' ? (
                              <XCircle className="h-4 w-4 text-red-600" />
                            ) : (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                            <AlertDescription>
                              <div className="font-medium mb-1">
                                {userStatuses.get(user.id)?.status === 'error' ? 'Erro na Aprovação:' : 'Status:'}
                              </div>
                              <div className="text-sm">
                                {userStatuses.get(user.id)?.message}
                              </div>
                              {userStatuses.get(user.id)?.asaasError && (
                                <div className="text-sm mt-1 p-2 bg-red-100 dark:bg-red-900 rounded border-l-4 border-red-500">
                                  <span className="font-medium text-red-800 dark:text-red-200">ASAAS: </span>
                                  <span className="text-red-700 dark:text-red-300">
                                    {userStatuses.get(user.id)?.asaasError}
                                  </span>
                                </div>
                              )}
                            </AlertDescription>
                          </Alert>
                        )}

                        {/* Validation Issues */}
                        {!validation.isValid && (
                          <Alert className="mb-3">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              <div className="font-medium mb-1">Pendências para aprovação:</div>
                              <ul className="list-disc list-inside text-sm">
                                {validation.issues.map((issue, index) => (
                                  <li key={index}>{issue}</li>
                                ))}
                              </ul>
                            </AlertDescription>
                          </Alert>
                        )}

                        {/* Expanded Details */}
                        {isExpanded && user.student && (
                          <div className="border-t pt-4 mt-4">
                            <h4 className="font-medium mb-3">Detalhes do Responsável Financeiro</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="font-medium">Nome:</span>
                                <span className="ml-2">{user.student.financialResponsibleName || 'Não informado'}</span>
                              </div>
                              <div>
                                <span className="font-medium">CPF:</span>
                                <span className="ml-2">{user.student.financialResponsibleCpf || 'Não informado'}</span>
                              </div>
                              <div>
                                <span className="font-medium">Email:</span>
                                <span className="ml-2">{user.student.financialResponsibleEmail || 'Não informado'}</span>
                              </div>
                              <div>
                                <span className="font-medium">Telefone:</span>
                                <span className="ml-2">{user.student.financialResponsiblePhone || 'Não informado'}</span>
                              </div>
                              <div>
                                <span className="font-medium">Relação:</span>
                                <span className="ml-2">
                                  {user.student.financialResponsibleRelation === 'self' ? 'Próprio aluno' : 
                                   user.student.financialResponsibleRelation === 'parent' ? 'Pai/Mãe' :
                                   user.student.financialResponsibleRelation === 'spouse' ? 'Cônjuge' :
                                   user.student.financialResponsibleRelation || 'Não informado'}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Student Edit Dialog */}
      {editingStudent && (
        <StudentEditDialog
          studentId={editingStudent}
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setEditingStudent(null);
              // Refresh pending users list after edit
              queryClient.invalidateQueries({ queryKey: ["/api/users/pending"] });
            }
          }}
        />
      )}
    </div>
  );
}