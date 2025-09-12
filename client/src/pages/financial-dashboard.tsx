import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  DollarSign,
  Clock,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  FileText,
  RefreshCw,
  Search,
  Calendar,
  Filter,
  Download,
  Eye,
  ExternalLink,
  Plus,
  Check,
  X,
  CreditCard,
  BarChart3,
  Receipt,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Payment {
  id: string;
  customer: string;
  customerName: string;
  customerEmail: string;
  value: number;
  status: "RECEIVED" | "PENDING" | "OVERDUE" | "CONFIRMED" | "CANCELLED";
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
  averageTicket: number; // Added for Ticket Médio
  revenueVariation: number; // Added for Variação de Receita
  // NOVO: Pagamentos em atraso (pagos após vencimento)
  latePaymentsCount: number;
  latePaymentsValue: number;
}

interface FinancialData {
  payments: Payment[];
  metrics: FinancialMetrics;
  totalCount: number;
}

export default function FinancialDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Filter states
  const [paymentTypeFilter, setPaymentTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("dueDate");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCashPayments, setShowCashPayments] = useState(false);
  const [hideAdvancedPayments, setHideAdvancedPayments] = useState(false);
  const [hideNegativePayments, setHideNegativePayments] = useState(false);

  // Fetch financial data
  const {
    data: financialData,
    isLoading,
    error,
  } = useQuery<FinancialData>({
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
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
  };

  // Filter payments based on current filters
  const getFilteredPayments = () => {
    if (!financialData?.payments) return [];

    return financialData.payments.filter((payment) => {
      // Type filter
      if (paymentTypeFilter !== "all") {
        // In a real scenario, you'd check billing type or subscription type
        // For now, we'll assume all are monthly subscriptions
        if (
          paymentTypeFilter === "subscriptions" &&
          !payment.description?.includes("Mensalidade")
        ) {
          return false;
        }
        if (
          paymentTypeFilter === "single" &&
          payment.description?.includes("Mensalidade")
        ) {
          return false;
        }
      }

      // Search term filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (
          !payment.customerName?.toLowerCase().includes(searchLower) &&
          !payment.description?.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }

      // Status filters
      if (hideNegativePayments && payment.status === "CANCELLED") {
        return false;
      }

      return true;
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Link copiado para a área de transferência",
    });
  };

  const getStatusBadge = (status: Payment["status"]) => {
    const statusConfig = {
      RECEIVED: {
        label: "Recebido",
        variant: "default" as const,
        className: "bg-green-100 text-green-800 hover:bg-green-100",
      },
      CONFIRMED: {
        label: "Confirmado",
        variant: "default" as const,
        className: "bg-green-100 text-green-800 hover:bg-green-100",
      },
      PENDING: {
        label: "Pendente",
        variant: "secondary" as const,
        className: "bg-orange-100 text-orange-800 hover:bg-orange-100",
      },
      OVERDUE: {
        label: "Vencido",
        variant: "destructive" as const,
        className: "bg-red-100 text-red-800 hover:bg-red-100",
      },
      CANCELLED: {
        label: "Cancelado",
        variant: "outline" as const,
        className: "bg-gray-100 text-gray-800 hover:bg-gray-100",
      },
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
            <h1 className="text-3xl font-bold tracking-tight">
              Painel Financeiro
            </h1>
            <p className="text-muted-foreground">
              Contas a receber e métricas financeiras
            </p>
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
            <h2 className="text-xl font-semibold mb-2">
              Erro ao carregar dados financeiros
            </h2>
            <p className="text-muted-foreground mb-4">
              Não foi possível conectar com o sistema financeiro ASAAS
            </p>
            <Button
              onClick={() =>
                queryClient.invalidateQueries({
                  queryKey: ["/api/financial/payments"],
                })
              }
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { payments = [], metrics } = financialData || {};
  const filteredPayments = getFilteredPayments();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Painel Financeiro
          </h1>
          <p className="text-muted-foreground">
            Sistema integrado com ASAAS • {filteredPayments.length} de{" "}
            {payments.length} cobrança{payments.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          onClick={() => refreshMutation.mutate()}
          disabled={refreshMutation.isPending}
          variant="outline"
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${refreshMutation.isPending ? "animate-spin" : ""}`}
          />
          Atualizar
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* Ticket Médio Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-600" /> {/* New icon */}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(metrics?.averageTicket || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor médio por aluno com pagamento confirmado
            </p>
          </CardContent>
        </Card>

        {/* NOVO: Cobranças Vencidas (overdue) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Cobranças Vencidas
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {metrics?.overdueCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">Cobranças vencidas</p>
          </CardContent>
        </Card>

        {/* NOVO: Pagamentos em Atraso (late payments) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pagamentos em Atraso
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {metrics?.latePaymentsCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Pagos após vencimento ({formatCurrency(metrics?.latePaymentsValue || 0)})
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taxa de Inadimplência
            </CardTitle>
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
            <CardTitle className="text-sm font-medium">
              Cobranças no Mês
            </CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {metrics?.totalPaymentsThisMonth || 0}
            </div>
            <p className="text-xs text-muted-foreground">Total de cobranças</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Próximo Vencimento
            </CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {metrics?.nextDueDate
                ? formatDate(metrics.nextDueDate.toString())
                : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              Próxima data de vencimento
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Total Cards - Bottom Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">
              Total Recebido
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {formatCurrency(metrics?.totalReceived || 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">
              Total Pendente
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">
              {formatCurrency(metrics?.totalPending || 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">
              Total em Atraso
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">
              {formatCurrency(metrics?.totalOverdue || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle>Filtros e Busca</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar aluno</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nome ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Payment Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Filtrar por tipo de cobrança
              </label>
              <Select
                value={paymentTypeFilter}
                onValueChange={setPaymentTypeFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="subscriptions">Assinaturas</SelectItem>
                  <SelectItem value="single">Avulsas</SelectItem>
                  <SelectItem value="installments">Parceladas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Filtrar por data</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Data de vencimento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dueDate">Data de vencimento</SelectItem>
                  <SelectItem value="paymentDate">
                    Data de recebimento
                  </SelectItem>
                  <SelectItem value="dateCreated">
                    Data de criação da cobrança
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            <div className="space-y-2">
              <label className="text-sm font-medium opacity-0">Actions</label>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setPaymentTypeFilter("all");
                  setDateFilter("dueDate");
                  setShowCashPayments(false);
                  setHideAdvancedPayments(false);
                  setHideNegativePayments(false);
                }}
                className="w-full"
              >
                Limpar
              </Button>
            </div>
          </div>

          <Separator />

          {/* Other Options */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Outras opções</h4>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showCash"
                  checked={showCashPayments}
                  onCheckedChange={(checked) => setShowCashPayments(checked === true)}
                />
                <label htmlFor="showCash" className="text-sm">
                  Mostrar cobranças recebidas em dinheiro
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hideAdvanced"
                  checked={hideAdvancedPayments}
                  onCheckedChange={(checked) => setHideAdvancedPayments(checked === true)}
                />
                <label htmlFor="hideAdvanced" className="text-sm">
                  Ocultar cobranças antecipadas
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hideNegative"
                  checked={hideNegativePayments}
                  onCheckedChange={(checked) => setHideNegativePayments(checked === true)}
                />
                <label htmlFor="hideNegative" className="text-sm">
                  Ocultar cobranças canceladas
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Cobranças
            </CardTitle>
            <CardDescription>
              {filteredPayments.length} de {payments.length} cobranças • Sistema
              integrado com ASAAS
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshMutation.isPending ? "animate-spin" : ""}`}
            />
            Atualizar
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {searchTerm || paymentTypeFilter !== "all"
                      ? "Nenhuma cobrança encontrada com os filtros aplicados"
                      : "Nenhuma cobrança encontrada"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments
                  .sort(
                    (a, b) =>
                      new Date(a.dueDate).getTime() -
                      new Date(b.dueDate).getTime(),
                  )
                  .map((payment) => (
                    <TableRow key={payment.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {payment.customerName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {payment.customerEmail}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(payment.value)}
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(payment.dueDate)}
                          {payment.status === "OVERDUE" && (
                            <div className="text-xs text-red-500">
                              {Math.floor(
                                (Date.now() -
                                  new Date(payment.dueDate).getTime()) /
                                  (1000 * 60 * 60 * 24),
                              )}{" "}
                              dias
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {payment.description}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {payment.status === "RECEIVED" ||
                          payment.status === "CONFIRMED" ? (
                            <Badge variant="outline" className="text-green-600">
                              Pago
                            </Badge>
                          ) : (
                            <div className="flex gap-2">
                              {payment.invoiceUrl && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    window.open(payment.invoiceUrl, "_blank")
                                  }
                                >
                                  <FileText className="h-3 w-3 mr-1" />
                                  Ver Boleto
                                </Button>
                              )}
                              {payment.paymentLink && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    copyToClipboard(payment.paymentLink!)
                                  }
                                >
                                  <Copy className="h-3 w-3 mr-1" />
                                  Link
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
