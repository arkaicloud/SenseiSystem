import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ManualReceiptDialog from "@/components/financial/ManualReceiptDialog";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
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
  ChevronLeft,
  ChevronRight,
  Trash2,
  Copy,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, addMonths, subMonths, isSameMonth, parseISO } from "date-fns";
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
  installment?: string | null;
  installmentNumber?: number | null;
  installmentCount?: number | null;
  billingType?: string | null;
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
  averageTicket: number;
  revenueVariation: number;
  latePaymentsCount: number;
  latePaymentsValue: number;
}

interface FinancialData {
  payments: Payment[];
  metrics: FinancialMetrics;
  totalCount: number;
}

interface CancelDialog {
  open: boolean;
  payment: Payment | null;
}

export default function FinancialDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Month navigation state (default = current month)
  const [selectedMonth, setSelectedMonth] = useState(() => startOfMonth(new Date()));
  const [showAllMonths, setShowAllMonths] = useState(false);

  // Filter states
  const [paymentTypeFilter, setPaymentTypeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Cancel dialog state
  const [cancelDialog, setCancelDialog] = useState<CancelDialog>({ open: false, payment: null });

  // Manual receipt dialog state
  const [showManualReceipt, setShowManualReceipt] = useState(false);

  // Fetch financial data
  const {
    data: financialData,
    isLoading,
    error,
  } = useQuery<FinancialData>({
    queryKey: ["/api/financial/payments"],
    refetchInterval: 5 * 60 * 1000,
  });

  // Refresh mutation
  const refreshMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/financial/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao atualizar dados financeiros");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial/payments"] });
      toast({ title: "Dados Atualizados", description: "Informações financeiras atualizadas com sucesso" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  // Cancel single payment mutation
  const cancelPaymentMutation = useMutation({
    mutationFn: async ({ paymentId, installmentId }: { paymentId: string; installmentId?: string | null }) => {
      const response = await fetch(`/api/financial/payments/${paymentId}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ installmentId: installmentId || undefined }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Erro ao cancelar cobrança");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Cobrança cancelada!", description: "A fatura foi cancelada com sucesso no ASAAS." });
      setCancelDialog({ open: false, payment: null });
      queryClient.invalidateQueries({ queryKey: ["/api/financial/payments"] });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao cancelar", description: error.message, variant: "destructive" });
    },
  });

  // Cancel all customer payments mutation
  const cancelAllPaymentsMutation = useMutation({
    mutationFn: async (customerId: string) => {
      const response = await fetch(`/api/financial/customers/${customerId}/payments`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Erro ao cancelar cobranças");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Cobranças canceladas!",
        description: `${data.cancelled} fatura(s) cancelada(s) com sucesso.`,
      });
      setCancelDialog({ open: false, payment: null });
      queryClient.invalidateQueries({ queryKey: ["/api/financial/payments"] });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao cancelar", description: error.message, variant: "destructive" });
    },
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const formatDate = (dateString: string) =>
    format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });

  const monthLabel = format(selectedMonth, "MMMM yyyy", { locale: ptBR });
  const monthLabelCapitalized = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  // Filter payments
  const getFilteredPayments = () => {
    if (!financialData?.payments) return [];

    return financialData.payments.filter((payment) => {
      // Month filter
      if (!showAllMonths) {
        try {
          const due = parseISO(payment.dueDate);
          if (!isSameMonth(due, selectedMonth)) return false;
        } catch {
          return false;
        }
      }

      // Type filter
      if (paymentTypeFilter !== "all") {
        if (paymentTypeFilter === "subscriptions" && !payment.description?.includes("Mensalidade")) return false;
        if (paymentTypeFilter === "single" && payment.description?.includes("Mensalidade")) return false;
      }

      // Search filter
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        if (!payment.customerName?.toLowerCase().includes(s) && !payment.description?.toLowerCase().includes(s)) {
          return false;
        }
      }

      return true;
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!", description: "Link copiado para a área de transferência" });
  };

  const getStatusBadge = (status: Payment["status"]) => {
    const cfg: Record<string, { label: string; className: string }> = {
      RECEIVED: { label: "Recebido", className: "bg-green-100 text-green-800 hover:bg-green-100" },
      CONFIRMED: { label: "Confirmado", className: "bg-green-100 text-green-800 hover:bg-green-100" },
      PENDING: { label: "Pendente", className: "bg-orange-100 text-orange-800 hover:bg-orange-100" },
      OVERDUE: { label: "Vencido", className: "bg-red-100 text-red-800 hover:bg-red-100" },
      CANCELLED: { label: "Cancelado", className: "bg-gray-100 text-gray-800 hover:bg-gray-100" },
    };
    const c = cfg[status] || cfg.PENDING;
    return <Badge className={c.className}>{c.label}</Badge>;
  };

  const canCancel = (status: Payment["status"]) =>
    status === "PENDING" || status === "OVERDUE";

  if (isLoading) {
    return (
      <div className="p-3 md:p-6 space-y-4 md:space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-3xl font-bold tracking-tight">Painel Financeiro</h1>
            <p className="text-muted-foreground">Contas a receber e métricas financeiras</p>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-3 xl:grid-cols-6">
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
            <p className="text-muted-foreground mb-4">Não foi possível conectar com o sistema financeiro ASAAS</p>
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
  const filteredPayments = getFilteredPayments();

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-3xl font-bold tracking-tight">Painel Financeiro</h1>
          <p className="text-muted-foreground">
            Sistema integrado com ASAAS •{" "}
            {filteredPayments.length} de {payments.length} cobrança{payments.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowManualReceipt(true)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Lançar Recebimento
          </Button>
          <Button onClick={() => refreshMutation.mutate()} disabled={refreshMutation.isPending} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshMutation.isPending ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(metrics?.averageTicket || 0)}</div>
            <p className="text-xs text-muted-foreground">Valor médio por aluno com pagamento confirmado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cobranças Vencidas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics?.overdueCount || 0}</div>
            <p className="text-xs text-muted-foreground">Cobranças vencidas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagamentos em Atraso</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{metrics?.latePaymentsCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Pagos após vencimento ({formatCurrency(metrics?.latePaymentsValue || 0)})
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Inadimplência</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{(metrics?.defaultRate || 0).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Percentual de atraso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cobranças no Mês</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics?.totalPaymentsThisMonth || 0}</div>
            <p className="text-xs text-muted-foreground">Total de cobranças</p>
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
            <p className="text-xs text-muted-foreground">Próxima data de vencimento</p>
          </CardContent>
        </Card>
      </div>

      {/* Total Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Total Recebido</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{formatCurrency(metrics?.totalReceived || 0)}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Total Pendente</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">{formatCurrency(metrics?.totalPending || 0)}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Total em Atraso</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{formatCurrency(metrics?.totalOverdue || 0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
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
              <label className="text-sm font-medium">Tipo de cobrança</label>
              <Select value={paymentTypeFilter} onValueChange={setPaymentTypeFilter}>
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

            {/* Month Navigation */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Período</label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => { setSelectedMonth(subMonths(selectedMonth, 1)); setShowAllMonths(false); }}
                  disabled={showAllMonths}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1 text-center font-medium text-sm border rounded-md px-3 py-2 bg-muted/30 min-w-[160px]">
                  {showAllMonths ? "Todos os meses" : monthLabelCapitalized}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => { setSelectedMonth(addMonths(selectedMonth, 1)); setShowAllMonths(false); }}
                  disabled={showAllMonths}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant={isSameMonth(selectedMonth, new Date()) && !showAllMonths ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setSelectedMonth(startOfMonth(new Date())); setShowAllMonths(false); }}
                  className="shrink-0"
                >
                  Hoje
                </Button>
                <Button
                  variant={showAllMonths ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowAllMonths(!showAllMonths)}
                  className="shrink-0"
                >
                  Todos
                </Button>
              </div>
            </div>
          </div>

          {/* Clear Filters */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setPaymentTypeFilter("all");
                setSelectedMonth(startOfMonth(new Date()));
                setShowAllMonths(false);
              }}
            >
              Limpar filtros
            </Button>
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
              {filteredPayments.length} de {payments.length} cobranças •{" "}
              {showAllMonths ? "Todos os meses" : monthLabelCapitalized} • Sistema integrado com ASAAS
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshMutation.isPending ? "animate-spin" : ""}`} />
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
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {searchTerm || paymentTypeFilter !== "all"
                      ? "Nenhuma cobrança encontrada com os filtros aplicados"
                      : showAllMonths
                      ? "Nenhuma cobrança encontrada"
                      : `Nenhuma cobrança em ${monthLabelCapitalized}`}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments
                  .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                  .map((payment) => (
                    <TableRow key={payment.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div>
                          <div className="font-medium">{payment.customerName}</div>
                          <div className="text-sm text-muted-foreground">{payment.customerEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(payment.value)}</TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(payment.dueDate)}
                          {payment.status === "OVERDUE" && (
                            <div className="text-xs text-red-500">
                              {Math.floor(
                                (Date.now() - new Date(payment.dueDate).getTime()) / (1000 * 60 * 60 * 24)
                              )}{" "}
                              dias
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{payment.description}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {payment.status === "RECEIVED" || payment.status === "CONFIRMED" ? (
                            <Badge variant="outline" className="text-green-600">Pago</Badge>
                          ) : payment.status === "CANCELLED" ? (
                            <Badge variant="outline" className="text-gray-500">Cancelado</Badge>
                          ) : (
                            <>
                              {payment.invoiceUrl && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(payment.invoiceUrl, "_blank")}
                                >
                                  <FileText className="h-3 w-3 mr-1" />
                                  Ver Boleto
                                </Button>
                              )}
                              {payment.paymentLink && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyToClipboard(payment.paymentLink!)}
                                >
                                  <Copy className="h-3 w-3 mr-1" />
                                  Link
                                </Button>
                              )}
                              {canCancel(payment.status) && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => setCancelDialog({ open: true, payment })}
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Cancelar
                                </Button>
                              )}
                            </>
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

      {/* Manual Receipt Dialog */}
      <ManualReceiptDialog open={showManualReceipt} onOpenChange={setShowManualReceipt} />

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialog.open} onOpenChange={(open) => !open && setCancelDialog({ open: false, payment: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Cancelar fatura
            </DialogTitle>
            <DialogDescription>
              {cancelDialog.payment && (
                <span>
                  Você está cancelando a fatura de{" "}
                  <strong>{cancelDialog.payment.customerName}</strong> —{" "}
                  <strong>{formatCurrency(cancelDialog.payment.value)}</strong> com vencimento em{" "}
                  <strong>{formatDate(cancelDialog.payment.dueDate)}</strong>.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">Selecione o que deseja cancelar:</p>

            <button
              className="w-full text-left px-4 py-3 rounded-lg border border-orange-200 bg-orange-50 hover:bg-orange-100 transition-colors"
              onClick={() =>
                cancelDialog.payment &&
                cancelPaymentMutation.mutate({
                  paymentId: cancelDialog.payment.id,
                  installmentId: cancelDialog.payment.installment,
                })
              }
              disabled={cancelPaymentMutation.isPending || cancelAllPaymentsMutation.isPending}
            >
              <div className="font-medium text-orange-800">
                {cancelDialog.payment?.installment
                  ? "Cancelar faturas pendentes deste parcelamento"
                  : "Cancelar apenas esta fatura"}
              </div>
              <div className="text-xs text-orange-600 mt-0.5">
                {cancelDialog.payment?.installment
                  ? `Cancela todas as parcelas pendentes/vencidas do parcelamento ${cancelDialog.payment.installment} no ASAAS.`
                  : "Cancela somente esta cobrança no ASAAS."}
              </div>
            </button>

            <button
              className="w-full text-left px-4 py-3 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 transition-colors"
              onClick={() => cancelDialog.payment && cancelAllPaymentsMutation.mutate(cancelDialog.payment.customer)}
              disabled={cancelPaymentMutation.isPending || cancelAllPaymentsMutation.isPending}
            >
              <div className="font-medium text-red-800">Cancelar todas as faturas pendentes</div>
              <div className="text-xs text-red-600 mt-0.5">
                Cancela todas as cobranças pendentes e vencidas deste aluno no ASAAS.
              </div>
            </button>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialog({ open: false, payment: null })}
              disabled={cancelPaymentMutation.isPending || cancelAllPaymentsMutation.isPending}
            >
              Voltar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
