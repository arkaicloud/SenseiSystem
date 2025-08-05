import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  DollarSign, 
  Clock, 
  AlertTriangle, 
  TrendingDown, 
  FileText, 
  Calendar,
  RefreshCw,
  ExternalLink,
  Eye
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Payment {
  id: string;
  customer: string;
  customerName: string;
  customerEmail: string;
  value: number;
  status: 'RECEIVED' | 'PENDING' | 'OVERDUE' | 'CONFIRMED' | 'CANCELLED';
  dueDate: string;
  description: string;
  invoiceUrl?: string;
  paymentLink?: string;
  dateCreated: string;
  paymentDate?: string;
  clientPaymentDate?: string;
  externalReference?: string;
}

interface FinancialMetrics {
  receivedThisMonth: number;
  pendingValue: number;
  overdueCount: number;
  defaultRate: number;
  totalPaymentsThisMonth: number;
  nextDueDate: Date | null;
  totalReceived: number;
  totalPending: number;
  totalOverdue: number;
}

interface FinancialData {
  payments: Payment[];
  metrics: FinancialMetrics;
  totalCount: number;
}

export default function FinancialDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch financial data
  const { data: financialData, isLoading, error } = useQuery<FinancialData>({
    queryKey: ["/api/financial/payments"],
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  // Refresh mutation
  const refreshMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/financial/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao atualizar dados financeiros");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial/payments"] });
      toast({
        title: "Dados Atualizados",
        description: "Informações financeiras atualizadas com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
  };

  const getStatusBadge = (status: Payment['status']) => {
    const statusConfig = {
      RECEIVED: { label: "Recebido", variant: "default" as const, className: "bg-green-100 text-green-800 hover:bg-green-100" },
      CONFIRMED: { label: "Confirmado", variant: "default" as const, className: "bg-green-100 text-green-800 hover:bg-green-100" },
      PENDING: { label: "Pendente", variant: "secondary" as const, className: "bg-orange-100 text-orange-800 hover:bg-orange-100" },
      OVERDUE: { label: "Vencido", variant: "destructive" as const, className: "bg-red-100 text-red-800 hover:bg-red-100" },
      CANCELLED: { label: "Cancelado", variant: "outline" as const, className: "bg-gray-100 text-gray-800 hover:bg-gray-100" },
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Painel Financeiro</h1>
            <p className="text-muted-foreground">Contas a receber e métricas financeiras</p>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Skeleton Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Skeleton Table */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Erro ao carregar dados financeiros</h2>
            <p className="text-muted-foreground mb-4">
              Não foi possível conectar com o sistema financeiro ASAAS
            </p>
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/financial/payments"] })}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { payments = [], metrics } = financialData || {};

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Painel Financeiro</h1>
          <p className="text-muted-foreground">
            Contas a receber e métricas financeiras integradas com ASAAS
          </p>
        </div>
        <Button 
          onClick={() => refreshMutation.mutate()}
          disabled={refreshMutation.isPending}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
          Atualizar Dados
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recebido no Mês</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(metrics?.receivedThisMonth || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Pagamentos confirmados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor em Aberto</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(metrics?.pendingValue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Aguardando pagamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagamentos em Atraso</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {metrics?.overdueCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Cobranças vencidas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Inadimplência</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {(metrics?.defaultRate || 0).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Percentual de atraso
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cobranças no Mês</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {metrics?.totalPaymentsThisMonth || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Total de cobranças
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximo Vencimento</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {metrics?.nextDueDate ? formatDate(metrics.nextDueDate.toString()) : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              Próxima data de vencimento
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Cobranças</CardTitle>
          <CardDescription>
            Lista de todas as cobranças integradas com ASAAS • {payments.length} cobranças
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Aluno</th>
                  <th className="text-left py-3 px-4">Valor</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Vencimento</th>
                  <th className="text-left py-3 px-4">Descrição</th>
                  <th className="text-left py-3 px-4">Ação</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhuma cobrança encontrada
                    </td>
                  </tr>
                ) : (
                  payments
                    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                    .map((payment) => (
                      <tr key={payment.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium">{payment.customerName}</div>
                            <div className="text-sm text-muted-foreground">{payment.customerEmail}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium">
                          {formatCurrency(payment.value)}
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(payment.status)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            {formatDate(payment.dueDate)}
                            {payment.status === 'OVERDUE' && (
                              <div className="text-xs text-red-500">
                                {Math.floor((Date.now() - new Date(payment.dueDate).getTime()) / (1000 * 60 * 60 * 24))} dias
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {payment.description}
                        </td>
                        <td className="py-3 px-4">
                          {payment.status === 'RECEIVED' || payment.status === 'CONFIRMED' ? (
                            <Badge variant="outline" className="text-green-600">
                              Pago
                            </Badge>
                          ) : payment.invoiceUrl ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(payment.invoiceUrl, '_blank')}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Ver Boleto
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </Button>
                          ) : payment.paymentLink ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(payment.paymentLink, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Pagar
                            </Button>
                          ) : (
                            <span className="text-sm text-muted-foreground">N/A</span>
                          )}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}