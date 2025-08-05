import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
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
  Download
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";

interface PendingUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  joinDate: string;
  student?: {
    financialResponsibleName?: string;
    financialResponsibleCpf?: string;
    financialResponsibleEmail?: string;
    financialResponsiblePhone?: string;
    financialResponsibleRelation?: string;
    paymentPlanId?: number;
  };
}

interface PaymentPlan {
  id: number;
  name: string;
  amount: number;
  description?: string;
}

type FilterStatus = 'all' | 'complete' | 'incomplete' | 'no-plan' | 'minor';

export default function PendingApprovalsImproved() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [expandedUsers, setExpandedUsers] = useState<Set<number>>(new Set());
  const [editingPlan, setEditingPlan] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch pending users
  const { data: pendingUsers, isLoading: usersLoading } = useQuery({
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
    
    if (!user.student?.financialResponsibleName) {
      issues.push("Nome do responsável financeiro não informado");
    }
    
    if (!user.student?.financialResponsibleCpf) {
      issues.push("CPF do responsável financeiro não informado");
    }
    
    if (!user.student?.paymentPlanId) {
      issues.push("Plano de pagamento não selecionado");
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
            // Mock logic for minors - you can implement age calculation
            return user.student?.financialResponsibleRelation !== 'self';
        }
      }

      return true;
    });

    // Sort by join date (newest first)
    return filtered.sort((a, b) => 
      new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime()
    );
  }, [pendingUsers, searchTerm, filterStatus]);

  // Mutations
  const approveMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/users/${userId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao aprovar aluno");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Aprovação realizada com sucesso",
        description: "Aluno aprovado e cobrança criada no ASAAS",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users/pending"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro na aprovação",
        description: error.message || "Erro ao aprovar aluno",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/users/${userId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao rejeitar aluno");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Aluno rejeitado",
        description: "O cadastro foi rejeitado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users/pending"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro na rejeição", 
        description: error.message || "Erro ao rejeitar aluno",
        variant: "destructive",
      });
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: async ({ userId, planId }: { userId: number; planId: number }) => {
      const response = await fetch(`/api/users/${userId}/payment-plan`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paymentPlanId: planId }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao atualizar plano");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Plano atualizado",
        description: "Plano de pagamento alterado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users/pending"] });
      setEditingPlan(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar plano",
        description: error.message || "Erro ao alterar plano",
        variant: "destructive",
      });
    },
  });

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
    return plan ? `${plan.name} - R$ ${plan.amount}` : "Não definido";
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

  const exportToCSV = () => {
    const csvData = filteredUsers.map(user => ({
      Nome: `${user.firstName} ${user.lastName}`,
      Email: user.email,
      Telefone: user.phone || '',
      'Data Cadastro': format(new Date(user.joinDate), 'dd/MM/yyyy'),
      'Responsável Financeiro': user.student?.financialResponsibleName || '',
      CPF: user.student?.financialResponsibleCpf || '',
      'Plano': getPaymentPlanName(user.student?.paymentPlanId),
      Status: validateStudentData(user).isValid ? 'Completo' : 'Incompleto'
    }));

    const csvContent = "data:text/csv;charset=utf-8," 
      + Object.keys(csvData[0]).join(",") + "\n"
      + csvData.map(row => Object.values(row).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `aprovacoes_pendentes_${format(new Date(), 'ddMMyyyy')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            {searchTerm || filterStatus !== 'all' ? ' (filtrado)' : ''}
          </p>
        </div>
        
        <Button 
          onClick={exportToCSV} 
          variant="outline" 
          size="sm"
          disabled={filteredUsers.length === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Pesquisar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Status Filter */}
            <Select value={filterStatus} onValueChange={(value: FilterStatus) => setFilterStatus(value)}>
              <SelectTrigger className="w-full md:w-64">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="complete">✅ Dados completos</SelectItem>
                <SelectItem value="incomplete">❌ Dados incompletos</SelectItem>
                <SelectItem value="no-plan">⏳ Sem plano</SelectItem>
                <SelectItem value="minor">🔒 Menores de idade</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

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
            const daysSinceJoin = Math.floor(
              (new Date().getTime() - new Date(user.joinDate).getTime()) / (1000 * 60 * 60 * 24)
            );
            
            return (
              <Card 
                key={user.id} 
                className={`border-l-4 transition-all ${
                  validation.isValid ? 'border-l-green-500' : 'border-l-yellow-500'
                }`}
              >
                {/* Compact View */}
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(user.id)}
                        className="p-1"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                      
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {user.firstName} {user.lastName}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-4 mt-1">
                          <span>{user.email}</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(user.joinDate), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                          {daysSinceJoin > 0 && (
                            <span className="flex items-center gap-1 text-orange-600">
                              <Clock className="h-3 w-3" />
                              {daysSinceJoin} dia{daysSinceJoin !== 1 ? 's' : ''}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getStatusBadge(user)}
                    </div>
                  </div>
                </CardHeader>

                {/* Expanded View */}
                {isExpanded && (
                  <CardContent className="pt-0">
                    <Separator className="mb-4" />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Student Data */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm text-muted-foreground">Dados do Aluno</h4>
                        <div className="space-y-2">
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

                      {/* Financial Responsible */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm text-muted-foreground">Responsável Financeiro</h4>
                        <div className="space-y-2">
                          {user.student?.financialResponsibleName ? (
                            <div className="text-sm">
                              <strong>{user.student.financialResponsibleName}</strong>
                              {user.student.financialResponsibleRelation && (
                                <span className="text-muted-foreground ml-2">
                                  ({user.student.financialResponsibleRelation === 'self' ? 'Próprio aluno' : user.student.financialResponsibleRelation})
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
                      </div>
                    </div>

                    {/* Payment Plan */}
                    <div className="mt-6 space-y-3">
                      <h4 className="font-medium text-sm text-muted-foreground">Plano de Pagamento</h4>
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        {editingPlan === user.id ? (
                          <div className="flex items-center gap-2">
                            <Select 
                              onValueChange={(value) => 
                                updatePlanMutation.mutate({ 
                                  userId: user.id, 
                                  planId: parseInt(value) 
                                })
                              }
                            >
                              <SelectTrigger className="w-64">
                                <SelectValue placeholder="Selecionar plano..." />
                              </SelectTrigger>
                              <SelectContent>
                                {paymentPlans?.plans.map(plan => (
                                  <SelectItem key={plan.id} value={plan.id.toString()}>
                                    {plan.name} - R$ {plan.amount}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setEditingPlan(null)}
                            >
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{getPaymentPlanName(user.student?.paymentPlanId)}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingPlan(user.id)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Validation Issues */}
                    {!validation.isValid && (
                      <Alert className="mt-4">
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

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={() => approveMutation.mutate(user.id)}
                        disabled={!validation.isValid || approveMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {approveMutation.isPending ? (
                          "Aprovando..."
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Aprovar e Criar Cobrança
                          </>
                        )}
                      </Button>

                      <Button
                        variant="destructive"
                        onClick={() => rejectMutation.mutate(user.id)}
                        disabled={rejectMutation.isPending}
                      >
                        {rejectMutation.isPending ? (
                          "Rejeitando..."
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 mr-2" />
                            Rejeitar
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}