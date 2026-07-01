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
import { Checkbox } from "@/components/ui/checkbox";
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
  Plus,
  CreditCard,
  Receipt,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Copy,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
} from "date-fns";
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
  previousMonthRevenue: number;
  payingStudentsCount: number;
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

type StatusKey = "PENDING" | "OVERDUE" | "RECEIVED" | "CONFIRMED";

const STATUS_OPTIONS: { key: StatusKey; label: string; color: string }[] = [
  { key: "PENDING",   label: "Aguardando pagamento", color: "text-orange-600" },
  { key: "OVERDUE",   label: "Vencida",              color: "text-red-600"    },
  { key: "RECEIVED",  label: "Recebida",             color: "text-green-600"  },
  { key: "CONFIRMED", label: "Confirmada",           color: "text-blue-600"   },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export default function FinancialDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Month navigation (default = current month)
  const [selectedMonth, setSelectedMonth] = useState(() => startOfMonth(new Date()));
  const [showAllMonths, setShowAllMonths] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentTypeFilter, setPaymentTypeFilter] = useState("all");
  const [statusFilters, setStatusFilters] = useState<Set<StatusKey>>(new Set());

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Dialogs
  const [cancelDialog, setCancelDialog] = useState<CancelDialog>({ open: false, payment: null });
  const [showManualReceipt, setShowManualReceipt] = useState(false);

  // ── Data fetch ────────────────────────────────────────────────────────────
  const { data: financialData, isLoading, error } = useQuery<FinancialData>({
    queryKey: ["/api/financial/payments", format(selectedMonth, "yyyy-MM"), showAllMonths],
    queryFn: async () => {
      let url = `/api/financial/payments?limit=2000`;
      if (!showAllMonths) {
        const startDate = format(startOfMonth(selectedMonth), "yyyy-MM-dd");
        const endDate   = format(endOfMonth(selectedMonth),   "yyyy-MM-dd");
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Erro ao carregar dados financeiros");
      }
      return res.json();
    },
    refetchInterval: 5 * 60 * 1000,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const refreshMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/financial/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error((await response.json()).message || "Erro");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial/payments"] });
      toast({ title: "Dados Atualizados", description: "Informações financeiras atualizadas com sucesso" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const cancelPaymentMutation = useMutation({
    mutationFn: async ({ paymentId, installmentId }: { paymentId: string; installmentId?: string | null }) => {
      const res = await fetch(`/api/financial/payments/${paymentId}`, {
        method: "DELETE", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ installmentId: installmentId || undefined }),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Erro ao cancelar cobrança");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Cobrança cancelada!", description: "A fatura foi cancelada com sucesso no ASAAS." });
      setCancelDialog({ open: false, payment: null });
      queryClient.invalidateQueries({ queryKey: ["/api/financial/payments"] });
    },
    onError: (e: Error) => toast({ title: "Erro ao cancelar", description: e.message, variant: "destructive" }),
  });

  const cancelAllPaymentsMutation = useMutation({
    mutationFn: async (customerId: string) => {
      const res = await fetch(`/api/financial/customers/${customerId}/payments`, {
        method: "DELETE", credentials: "include",
      });
      if (!res.ok) throw new Error((await res.json()).message || "Erro ao cancelar cobranças");
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Cobranças canceladas!", description: `${data.cancelled} fatura(s) cancelada(s) com sucesso.` });
      setCancelDialog({ open: false, payment: null });
      queryClient.invalidateQueries({ queryKey: ["/api/financial/payments"] });
    },
    onError: (e: Error) => toast({ title: "Erro ao cancelar", description: e.message, variant: "destructive" }),
  });

  // ── Helpers ───────────────────────────────────────────────────────────────
  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const formatDate = (s: string) => format(new Date(s), "dd/MM/yyyy", { locale: ptBR });

  const monthLabel = format(selectedMonth, "MMMM yyyy", { locale: ptBR });
  const monthLabelCap = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  const toggleStatus = (key: StatusKey) => {
    const next = new Set(statusFilters);
    if (next.has(key)) next.delete(key); else next.add(key);
    setStatusFilters(next);
    setCurrentPage(1);
  };

  const getStatusBadge = (status: Payment["status"]) => {
    const cfg: Record<string, { label: string; className: string }> = {
      RECEIVED:  { label: "Recebido",   className: "bg-green-100 text-green-800 hover:bg-green-100" },
      CONFIRMED: { label: "Confirmado", className: "bg-blue-100 text-blue-800 hover:bg-blue-100"   },
      PENDING:   { label: "Pendente",   className: "bg-orange-100 text-orange-800 hover:bg-orange-100" },
      OVERDUE:   { label: "Vencida",    className: "bg-red-100 text-red-800 hover:bg-red-100"     },
      CANCELLED: { label: "Cancelado",  className: "bg-gray-100 text-gray-800 hover:bg-gray-100"  },
    };
    const c = cfg[status] || cfg.PENDING;
    return <Badge className={c.className}>{c.label}</Badge>;
  };

  const canCancel = (s: Payment["status"]) => s === "PENDING" || s === "OVERDUE";

  // ── Filtering ─────────────────────────────────────────────────────────────
  const { payments = [], metrics } = financialData || {};

  // Month boundaries used for client-side enforcement
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd   = endOfMonth(selectedMonth);

  const filteredPayments = payments
    .filter((p) => {
      // ① Enforce month filter client-side (ASAAS sometimes leaks records outside the range)
      if (!showAllMonths) {
        const due = new Date(p.dueDate);
        if (due < monthStart || due > monthEnd) return false;
      }

      // ② Status checkboxes
      if (statusFilters.size > 0 && !statusFilters.has(p.status as StatusKey)) return false;

      // ③ Payment type
      if (paymentTypeFilter === "subscriptions" && !p.description?.includes("Mensalidade")) return false;
      if (paymentTypeFilter === "single"        &&  p.description?.includes("Mensalidade")) return false;

      // ④ Text search
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        if (!p.customerName?.toLowerCase().includes(s) && !p.description?.toLowerCase().includes(s)) return false;
      }

      return true;
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  // ── Pagination ────────────────────────────────────────────────────────────
  const totalFiltered = filteredPayments.length;
  const totalPages    = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginated = filteredPayments.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  );

  const goToPage = (p: number) => setCurrentPage(Math.max(1, Math.min(p, totalPages)));

  const clearFilters = () => {
    setSearchTerm("");
    setPaymentTypeFilter("all");
    setStatusFilters(new Set());
    setSelectedMonth(startOfMonth(new Date()));
    setShowAllMonths(false);
    setCurrentPage(1);
  };

  // ── Loading / error states ────────────────────────────────────────────────
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
          <CardHeader><Skeleton className="h-6 w-40" /><Skeleton className="h-4 w-60" /></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Erro ao carregar dados financeiros</h2>
          <p className="text-muted-foreground mb-4">Não foi possível conectar com o sistema financeiro ASAAS</p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/financial/payments"] })}>
            <RefreshCw className="h-4 w-4 mr-2" /> Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-3xl font-bold tracking-tight">Painel Financeiro</h1>
          <p className="text-muted-foreground">
            Sistema integrado com ASAAS •{" "}
            {payments.length} cobrança{payments.length !== 1 ? "s" : ""} carregadas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowManualReceipt(true)} className="bg-green-600 hover:bg-green-700 text-white">
            <Plus className="h-4 w-4 mr-2" />Lançar Recebimento
          </Button>
          <Button onClick={() => refreshMutation.mutate()} disabled={refreshMutation.isPending} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshMutation.isPending ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(metrics?.averageTicket || 0)}</div>
            <p className="text-xs text-muted-foreground">Valor médio por aluno</p>
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
            <CardTitle className="text-sm font-medium">Pagos em Atraso</CardTitle>
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

      {/* Totals */}
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

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Filtros e Busca</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Row 1: search + type + month */}
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">

            {/* Search */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Buscar aluno</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  data-testid="input-search-payment"
                  placeholder="Nome ou descrição..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Type */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Tipo de cobrança</label>
              <Select value={paymentTypeFilter} onValueChange={(v) => { setPaymentTypeFilter(v); setCurrentPage(1); }}>
                <SelectTrigger data-testid="select-payment-type">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="subscriptions">Assinaturas / Mensalidades</SelectItem>
                  <SelectItem value="single">Avulsas</SelectItem>
                  <SelectItem value="installments">Parceladas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Month nav — spans 2 cols on large */}
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-2">
              <label className="text-sm font-medium">Período</label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline" size="icon"
                  onClick={() => { setSelectedMonth(subMonths(selectedMonth, 1)); setShowAllMonths(false); setCurrentPage(1); }}
                  disabled={showAllMonths}
                  data-testid="btn-prev-month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1 text-center font-medium text-sm border rounded-md px-3 py-2 bg-muted/30 min-w-[140px]">
                  {showAllMonths ? "Todos os meses" : monthLabelCap}
                </div>
                <Button
                  variant="outline" size="icon"
                  onClick={() => { setSelectedMonth(addMonths(selectedMonth, 1)); setShowAllMonths(false); setCurrentPage(1); }}
                  disabled={showAllMonths}
                  data-testid="btn-next-month"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline" size="sm" className="shrink-0"
                  onClick={() => { setSelectedMonth(startOfMonth(new Date())); setShowAllMonths(false); setCurrentPage(1); }}
                  data-testid="btn-today-month"
                >
                  Hoje
                </Button>
                <Button
                  variant={showAllMonths ? "default" : "outline"} size="sm" className="shrink-0"
                  onClick={() => { setShowAllMonths(!showAllMonths); setCurrentPage(1); }}
                  data-testid="btn-all-months"
                >
                  Todos os meses
                </Button>
              </div>
            </div>
          </div>

          {/* Row 2: status checkboxes */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Situações das cobranças</label>
            <div className="flex flex-wrap gap-4">
              {STATUS_OPTIONS.map(({ key, label, color }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                  <Checkbox
                    data-testid={`checkbox-status-${key}`}
                    checked={statusFilters.has(key)}
                    onCheckedChange={() => toggleStatus(key)}
                  />
                  <span className={`text-sm font-medium ${statusFilters.has(key) ? color : "text-muted-foreground"}`}>
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Clear */}
          <div className="flex items-center justify-between pt-1">
            <p className="text-sm text-muted-foreground">
              {statusFilters.size > 0 || searchTerm || paymentTypeFilter !== "all"
                ? `${filteredPayments.length} de ${payments.length} cobranças`
                : `${payments.length} cobranças no período`}
            </p>
            <Button variant="ghost" size="sm" onClick={clearFilters} data-testid="btn-clear-filters">
              Limpar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Payments Table ───────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" /> Cobranças
            </CardTitle>
            <CardDescription>
              {showAllMonths ? "Todos os meses" : monthLabelCap} • Sistema integrado com ASAAS
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => refreshMutation.mutate()} disabled={refreshMutation.isPending}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshMutation.isPending ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
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
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      {statusFilters.size > 0 || searchTerm || paymentTypeFilter !== "all"
                        ? "Nenhuma cobrança encontrada com os filtros aplicados"
                        : showAllMonths
                        ? "Nenhuma cobrança encontrada"
                        : `Nenhuma cobrança em ${monthLabelCap}`}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((payment) => (
                    <TableRow key={payment.id} className="hover:bg-muted/50" data-testid={`row-payment-${payment.id}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{payment.customerName}</div>
                          <div className="text-xs text-muted-foreground">{payment.customerEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(payment.value)}</TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(payment.dueDate)}
                          {payment.status === "OVERDUE" && (
                            <div className="text-xs text-red-500">
                              {Math.floor((Date.now() - new Date(payment.dueDate).getTime()) / 86400000)} dias
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {payment.description}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {payment.status === "RECEIVED" || payment.status === "CONFIRMED" ? (
                            <Badge variant="outline" className="text-green-600">Pago</Badge>
                          ) : payment.status === "CANCELLED" ? (
                            <Badge variant="outline" className="text-gray-500">Cancelado</Badge>
                          ) : (
                            <>
                              {payment.invoiceUrl && (
                                <Button size="sm" variant="outline" onClick={() => window.open(payment.invoiceUrl, "_blank")}>
                                  <FileText className="h-3 w-3 mr-1" />Ver Boleto
                                </Button>
                              )}
                              {payment.paymentLink && (
                                <Button size="sm" variant="ghost" onClick={() => {
                                  navigator.clipboard.writeText(payment.paymentLink!);
                                  toast({ title: "Copiado!", description: "Link copiado para a área de transferência" });
                                }}>
                                  <Copy className="h-3 w-3 mr-1" />Link
                                </Button>
                              )}
                              {canCancel(payment.status) && (
                                <Button
                                  size="sm" variant="ghost"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => setCancelDialog({ open: true, payment })}
                                  data-testid={`btn-cancel-payment-${payment.id}`}
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />Cancelar
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
          </div>

          {/* ── Pagination bar ─────────────────────────────────────────── */}
          {totalFiltered > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  Mostrando {(safeCurrentPage - 1) * pageSize + 1}–
                  {Math.min(safeCurrentPage * pageSize, totalFiltered)} de {totalFiltered} resultado{totalFiltered !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Rows per page */}
                <div className="flex items-center gap-1.5 text-sm">
                  <span className="text-muted-foreground whitespace-nowrap">Linhas por página:</span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}
                  >
                    <SelectTrigger className="h-8 w-[70px]" data-testid="select-page-size">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZE_OPTIONS.map((n) => (
                        <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Page nav */}
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goToPage(1)} disabled={safeCurrentPage === 1} data-testid="btn-page-first">
                    <ChevronLeft className="h-3 w-3" />
                  </Button>

                  {/* Page numbers — show at most 5 */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - safeCurrentPage) <= 1)
                    .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                      if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("…");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((item, i) =>
                      item === "…" ? (
                        <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground text-sm">…</span>
                      ) : (
                        <Button
                          key={item}
                          variant={item === safeCurrentPage ? "default" : "outline"}
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => goToPage(item as number)}
                          data-testid={`btn-page-${item}`}
                        >
                          {item}
                        </Button>
                      )
                    )}

                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goToPage(totalPages)} disabled={safeCurrentPage === totalPages} data-testid="btn-page-last">
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Receipt Dialog */}
      <ManualReceiptDialog open={showManualReceipt} onOpenChange={setShowManualReceipt} />

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialog.open} onOpenChange={(open) => !open && setCancelDialog({ open: false, payment: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />Cancelar fatura
            </DialogTitle>
            <DialogDescription>
              {cancelDialog.payment && (
                <span>
                  Você está cancelando a fatura de <strong>{cancelDialog.payment.customerName}</strong> —{" "}
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
              onClick={() => cancelDialog.payment && cancelPaymentMutation.mutate({
                paymentId: cancelDialog.payment.id,
                installmentId: cancelDialog.payment.installment,
              })}
              disabled={cancelPaymentMutation.isPending || cancelAllPaymentsMutation.isPending}
            >
              <div className="font-medium text-orange-800">
                {cancelDialog.payment?.installment ? "Cancelar faturas pendentes deste parcelamento" : "Cancelar apenas esta fatura"}
              </div>
              <div className="text-xs text-orange-600 mt-0.5">
                {cancelDialog.payment?.installment
                  ? `Cancela todas as parcelas pendentes/vencidas do parcelamento no ASAAS.`
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
            <Button variant="outline" onClick={() => setCancelDialog({ open: false, payment: null })}
              disabled={cancelPaymentMutation.isPending || cancelAllPaymentsMutation.isPending}>
              Voltar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
