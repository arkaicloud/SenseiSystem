import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Calendar, 
  AlertCircle, 
  CheckCircle, 
  ExternalLink,
  Banknote,
  Receipt
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FinancialPanelProps {
  studentId: number;
}

interface FinancialData {
  isFinancialResponsible: boolean;
  message?: string;
  student?: {
    id: number;
    name: string;
    financialResponsibleCpf: string;
  };
  asaasData?: {
    invoices: any[];
    customerId: string;
  };
  localPayments?: any[];
}

const FinancialPanel: React.FC<FinancialPanelProps> = ({ studentId }) => {
  const { data: financialData, isLoading } = useQuery<FinancialData>({
    queryKey: [`/api/student/financial/${studentId}`],
    retry: false,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Painel Financeiro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-4">Carregando dados financeiros...</div>
        </CardContent>
      </Card>
    );
  }

  if (!financialData?.isFinancialResponsible) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Painel Financeiro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-4 text-gray-500">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>Você não é responsável financeiro por este aluno.</p>
            <p className="text-sm mt-1">Entre em contato com a administração para mais informações.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value / 100);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'pago':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
      case 'vencido':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'Pago';
      case 'pending':
        return 'Pendente';
      case 'overdue':
        return 'Vencido';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Painel Financeiro
          </CardTitle>
          <p className="text-sm text-gray-600">
            CPF: {financialData.student?.financialResponsibleCpf}
          </p>
        </CardHeader>
      </Card>

      {/* ASAAS Invoices */}
      {financialData.asaasData && financialData.asaasData.invoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Faturas ASAAS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {financialData.asaasData.invoices.map((invoice: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getStatusColor(invoice.status)}>
                        {getStatusText(invoice.status)}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        Vence em: {format(parseISO(invoice.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    </div>
                    <p className="font-semibold">{formatCurrency(invoice.value)}</p>
                    <p className="text-sm text-gray-600">{invoice.description || 'Mensalidade'}</p>
                  </div>
                  
                  {invoice.status === 'pending' && invoice.invoiceUrl && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(invoice.invoiceUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Pagar
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Local Payments */}
      {financialData.localPayments && financialData.localPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5" />
              Mensalidades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {financialData.localPayments.map((payment: any) => (
                <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getStatusColor(payment.status)}>
                        {getStatusText(payment.status)}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        Vencimento: {format(new Date(payment.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    </div>
                    <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                    {payment.paidDate && (
                      <p className="text-sm text-green-600">
                        Pago em: {format(new Date(payment.paidDate), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    )}
                    {payment.notes && (
                      <p className="text-sm text-gray-600">{payment.notes}</p>
                    )}
                  </div>
                  
                  {payment.status === 'pending' && (
                    <div className="flex items-center gap-2 text-yellow-600">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">Aguardando</span>
                    </div>
                  )}
                  
                  {payment.status === 'paid' && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">Pago</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {(!financialData.asaasData || financialData.asaasData.invoices.length === 0) && 
       (!financialData.localPayments || financialData.localPayments.length === 0) && (
        <Card>
          <CardContent className="text-center p-8">
            <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma fatura encontrada</h3>
            <p className="text-gray-600">
              Não há faturas ou mensalidades registradas no momento.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FinancialPanel;