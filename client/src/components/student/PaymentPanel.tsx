import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, 
  Download, 
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

interface Payment {
  id: number;
  asaasPaymentId: string;
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
}

export default function PaymentPanel() {
  const { toast } = useToast();
  const { user } = useAuth();

  // Buscar pagamentos do aluno
  const { data: paymentsData, isLoading } = useQuery<PaymentResponse>({
    queryKey: [`/api/student/${user?.id}/payments`],
    enabled: !!user?.id,
  });

  const payments = paymentsData?.payments || [];

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
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
          <Badge variant="outline" className="bg-gray-100 text-gray-800">
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

  const downloadBoleto = (url: string) => {
    window.open(url, '_blank');
  };

  const openInvoice = (url: string) => {
    window.open(url, '_blank');
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

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

  if (payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Meus Pagamentos
          </CardTitle>
          <CardDescription>
            Suas mensalidades e cobranças aparecerão aqui
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Nenhum pagamento encontrado</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Meus Pagamentos</h2>
        <p className="text-muted-foreground">
          {payments.length} pagamento{payments.length !== 1 ? 's' : ''} registrado{payments.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid gap-4">
        {payments.map((payment) => (
          <Card key={payment.id} className={`${
            payment.status === 'OVERDUE' || isOverdue(payment.dueDate) 
              ? 'border-l-4 border-l-red-500' 
              : payment.status === 'RECEIVED' 
                ? 'border-l-4 border-l-green-500'
                : 'border-l-4 border-l-yellow-500'
          }`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{payment.description}</CardTitle>
                  <CardDescription className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Vencimento: {format(new Date(payment.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      R$ {(payment.value / 100).toFixed(2)}
                    </span>
                  </CardDescription>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {getStatusBadge(payment.status)}
                  <Badge variant="outline">
                    {getBillingTypeLabel(payment.billingType)}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Alerta de vencimento */}
              {(payment.status === 'OVERDUE' || isOverdue(payment.dueDate)) && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>Pagamento em atraso!</strong> 
                    Regularize sua situação o quanto antes para continuar utilizando os serviços.
                  </AlertDescription>
                </Alert>
              )}

              {/* PIX - Mostrar QR Code e código para cópia */}
              {payment.billingType === 'PIX' && payment.status === 'PENDING' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <QrCode className="h-4 w-4" />
                    <span className="font-medium">Pagamento via PIX</span>
                  </div>
                  
                  {payment.pixCopyAndPaste && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Código PIX (copiar e colar):</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyPixCode(payment.pixCopyAndPaste!)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copiar
                        </Button>
                      </div>
                      <code className="text-xs text-gray-800 bg-white p-2 rounded mt-2 block break-all">
                        {payment.pixCopyAndPaste}
                      </code>
                    </div>
                  )}
                </div>
              )}

              {/* Datas importantes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium">Criado em</p>
                    <p className="text-gray-600">
                      {format(new Date(payment.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                </div>

                {payment.confirmedDate && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="font-medium">Confirmado em</p>
                      <p className="text-gray-600">
                        {format(new Date(payment.confirmedDate), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                )}

                {payment.overdueDate && (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <div>
                      <p className="font-medium">Vencido em</p>
                      <p className="text-gray-600">
                        {format(new Date(payment.overdueDate), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Ações do pagamento */}
              {payment.status === 'PENDING' && (
                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  {payment.bankSlipUrl && (
                    <Button
                      variant="outline"
                      onClick={() => downloadBoleto(payment.bankSlipUrl!)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Baixar Boleto
                    </Button>
                  )}
                  
                  {payment.invoiceUrl && (
                    <Button
                      variant="outline"
                      onClick={() => openInvoice(payment.invoiceUrl!)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Ver Fatura
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    onClick={() => window.open(`https://www.asaas.com/c/${payment.asaasPaymentId}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver no ASAAS
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}