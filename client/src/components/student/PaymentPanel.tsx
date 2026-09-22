import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, 
  Copy, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Calendar,
  DollarSign,
  FileText,
  QrCode,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { parsePaymentDateAsLocal } from '@shared/paymentDates';

interface Payment {
  id: number | string;
  asaasPaymentId?: string;
  status: string;
  billingType: string;
  value: number;
  netValue?: number;
  dueDate: string;
  description: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  pixQrCode?: string;
  pixCopyAndPaste?: string;
  confirmedDate?: string;
  receivedDate?: string;
  overdueDate?: string;
  createdAt: string;
}

interface PaymentResponse {
  payments: Payment[];
  isFinancialResponsible: boolean;
  isFinanciallyBlocked: boolean;
  hasOverdue: boolean;
  overdueCount: number;
  familyMemberCount: number;
  view?: 'upcoming' | 'paid';
  message?: string | null;
}

export default function PaymentPanel() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [paymentView, setPaymentView] = React.useState<'upcoming' | 'paid'>('upcoming');

  const { data: paymentsData, isLoading } = useQuery<PaymentResponse>({
    queryKey: [`/api/student/financial?view=${paymentView}`],
    enabled: !!user?.id,
  });

  const payments = paymentsData?.payments || [];

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return (
          <Badge variant="secondary" className="border-primary/20 bg-primary/10 text-primary">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
      case 'RECEIVED':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Pago
          </Badge>
        );
      case 'OVERDUE':
        return (
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Vencido
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge variant="outline" className="bg-muted text-foreground">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelado
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  const getBillingTypeLabel = (billingType: string) => {
    switch (billingType) {
      case 'BOLETO':
        return 'Boleto Bancário';
      case 'PIX':
        return 'PIX';
      case 'CREDIT_CARD':
        return 'Cartão de Crédito';
      case 'DEBIT_CARD':
        return 'Cartão de Débito';
      case 'TRANSFER':
        return 'Transferência';
      default:
        return billingType;
    }
  };

  const copyPixCode = (pixCode: string) => {
    navigator.clipboard.writeText(pixCode);
    toast({
      title: "Código PIX copiado!",
      description: "Cole no seu app de pagamentos para efetuar o pagamento.",
    });
  };

  const openPayment = (payment: Payment) => {
    const paymentUrl = payment.invoiceUrl ||
      (payment.asaasPaymentId ? `https://www.asaas.com/c/${payment.asaasPaymentId}` : payment.bankSlipUrl);
    if (paymentUrl) window.open(paymentUrl, '_blank', 'noopener,noreferrer');
  };

  const formatPaymentValue = (value: number) => new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value / 100);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Meus Pagamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Carregando pagamentos...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-[28px] border border-slate-700/60 bg-gradient-to-br from-slate-950 via-slate-900 to-[#1d3fae] p-5 text-white shadow-[0_18px_50px_rgba(15,23,42,0.18)] sm:p-6">
        <div className="pointer-events-none absolute -right-14 -top-20 h-48 w-48 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/15">
              <CreditCard className="size-5 text-blue-100" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-100/75">Financeiro</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight">Plano familiar</h2>
              <p className="mt-1 text-sm text-slate-200/75">Mensalidades do mês atual e do próximo.</p>
            </div>
          </div>
          <div className="shrink-0 rounded-2xl bg-white/10 px-3 py-2 text-right ring-1 ring-white/10">
            <span className="block text-[10px] font-medium uppercase tracking-wider text-blue-100/70">Cobranças</span>
            <span className="mt-0.5 block text-2xl font-bold leading-none">{payments.length}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card p-1.5 shadow-sm">
        <button
          type="button"
          onClick={() => setPaymentView('upcoming')}
          className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
            paymentView === 'upcoming'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          Em aberto
        </button>
        <button
          type="button"
          onClick={() => setPaymentView('paid')}
          className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
            paymentView === 'paid'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          Faturas pagas
        </button>
      </div>

      {payments.length === 0 ? (
        <Card className="rounded-[24px] border-border/70 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10">
              <CreditCard className="size-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">
              {paymentView === 'paid' ? 'Nenhuma fatura paga encontrada' : 'Nenhuma cobrança em aberto'}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {paymentsData?.isFinancialResponsible
                ? paymentView === 'paid'
                  ? 'Quando uma cobrança for paga, ela aparecerá neste histórico.'
                  : 'Não há cobranças do mês atual ou do próximo no momento.'
                : 'As cobranças são exibidas no perfil do responsável financeiro.'}
            </p>
          </CardContent>
        </Card>
      ) : (
      <div className="grid gap-4">
        {payments.map((payment) => (
          <Card key={payment.id} className={`group overflow-hidden rounded-[24px] border-border/70 bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
            payment.status === 'OVERDUE'
              ? 'border-red-200/80 dark:border-red-900/60'
              : payment.status === 'RECEIVED' 
                ? 'border-emerald-200/80 dark:border-emerald-900/60'
                : 'border-primary/25'
          }`}>
            <div className={`h-1 ${
              payment.status === 'OVERDUE'
                ? 'bg-red-500'
                : payment.status === 'RECEIVED'
                  ? 'bg-emerald-500'
                  : 'bg-primary'
            }`} />
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-lg font-bold tracking-tight">{payment.description}</CardTitle>
                    {getStatusBadge(payment.status)}
                  </div>
                  <CardDescription className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1">
                      <Calendar className="size-3.5" />
                      Vence em {format(parsePaymentDateAsLocal(payment.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1">
                      <FileText className="size-3.5" />
                      {getBillingTypeLabel(payment.billingType)}
                    </span>
                  </CardDescription>
                </div>
                <div className="rounded-2xl bg-muted/60 px-4 py-2.5 sm:min-w-[132px] sm:text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Valor</p>
                  <p className="mt-0.5 text-xl font-bold tracking-tight text-foreground">{formatPaymentValue(payment.value)}</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Alerta de vencimento */}
              {payment.status === 'OVERDUE' && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>Pagamento em atraso!</strong> 
                    Regularize sua situação o quanto antes para continuar utilizando os serviços.
                  </AlertDescription>
                </Alert>
              )}

              {/* PIX - Mostrar QR Code e código para cópia */}
              {payment.billingType === 'PIX' && (payment.status === 'PENDING' || payment.status === 'OVERDUE') && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <QrCode className="h-4 w-4" />
                    <span className="font-medium">Pagamento via PIX</span>
                  </div>
                  
                  {payment.pixCopyAndPaste && (
                    <div className="bg-background p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-secondary-foreground">Código PIX (copiar e colar):</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyPixCode(payment.pixCopyAndPaste!)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copiar
                        </Button>
                      </div>
                      <code className="text-xs text-foreground bg-card p-2 rounded mt-2 block break-all">
                        {payment.pixCopyAndPaste}
                      </code>
                    </div>
                  )}
                </div>
              )}

              {/* Datas importantes */}
              <div className="grid grid-cols-1 gap-3 border-t border-border/70 pt-4 text-sm sm:grid-cols-3">
                <div className="flex items-center gap-2 rounded-xl bg-muted/35 px-3 py-2.5">
                  <Calendar className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Criado em</p>
                    <p className="text-secondary-foreground">
                      {format(new Date(payment.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                </div>

                {payment.confirmedDate && (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 dark:bg-emerald-950/20">
                    <CheckCircle className="size-4 text-green-500" />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Confirmado em</p>
                      <p className="text-secondary-foreground">
                        {format(new Date(payment.confirmedDate), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                )}

                {payment.overdueDate && (
                  <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2.5 dark:bg-red-950/20">
                    <AlertTriangle className="size-4 text-red-500" />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Vencido em</p>
                      <p className="text-secondary-foreground">
                        {format(new Date(payment.overdueDate), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Ações do pagamento */}
              {(payment.status === 'PENDING' || payment.status === 'OVERDUE') && (
                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  {(payment.invoiceUrl || payment.asaasPaymentId || payment.bankSlipUrl) && (
                    <Button
                      className="w-full rounded-xl bg-primary font-semibold shadow-md shadow-primary/20 transition-transform hover:-translate-y-0.5 sm:w-auto"
                      onClick={() => openPayment(payment)}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Pagar
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      )}
    </div>
  );
}