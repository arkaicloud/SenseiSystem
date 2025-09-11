import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, AlertTriangle, DollarSign } from "lucide-react";

interface Invoice {
  id: string;
  amount: number;
  dueDate: string;
  description: string;
  status: "pending" | "overdue" | "paid";
  paymentUrl?: string;
}

interface FinancialStatusProps {
  invoices: Invoice[];
  isFinancialResponsible: boolean;
  primaryColor: string;
  isLoading?: boolean;
}

export const FinancialStatus = ({ 
  invoices, 
  isFinancialResponsible, 
  primaryColor,
  isLoading 
}: FinancialStatusProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount / 100);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "paid":
        return "Pago";
      case "pending":
        return "Pendente";
      case "overdue":
        return "Vencido";
      default:
        return "Pendente";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" style={{ color: primaryColor }} />
            Situação Financeira
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Carregando dados financeiros...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isFinancialResponsible) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" style={{ color: primaryColor }} />
            Situação Financeira
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <DollarSign className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p>Você não é o responsável financeiro</p>
            <p className="text-sm">Entre em contato com quem faz os pagamentos para mais informações</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Dados estáticos para demonstração se não houver invoices
  const defaultInvoices: Invoice[] = [
    {
      id: "1",
      amount: 15000,
      dueDate: "09/08/2024",
      description: "Mensalidade - Agosto 2024",
      status: "pending"
    },
    {
      id: "2",
      amount: 5000,
      dueDate: "24/07/2024",
      description: "Taxa de Graduação",
      status: "overdue"
    }
  ];

  const displayInvoices = invoices.length > 0 ? invoices : defaultInvoices;
  const overdueInvoices = displayInvoices.filter(inv => inv.status === "overdue");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" style={{ color: primaryColor }} />
          Situação Financeira
          {overdueInvoices.length > 0 && (
            <AlertTriangle className="w-4 h-4 text-red-500" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {overdueInvoices.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="font-medium text-red-900">
                {overdueInvoices.length} fatura{overdueInvoices.length > 1 ? 's' : ''} em atraso
              </span>
            </div>
            <p className="text-sm text-red-700 mb-3">
              Regularize sua situação para continuar participando das aulas.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {displayInvoices.map((invoice) => (
            <div key={invoice.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">{invoice.description}</span>
                <Badge className={`text-xs font-medium ${getStatusBadge(invoice.status)}`}>
                  {getStatusText(invoice.status)}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                <span>Vencimento: {invoice.dueDate}</span>
                <span className="font-bold text-gray-900">{formatCurrency(invoice.amount)}</span>
              </div>
              <Button 
                className="w-full text-white font-medium"
                style={{ backgroundColor: primaryColor }}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Pagar Agora (Pix/Boleto)
              </Button>
            </div>
          ))}
        </div>

        <div className="text-center pt-2 border-t border-gray-200">
          <p className="text-xs text-muted-foreground">
            Dúvidas? Entre em contato com a secretaria da escola
          </p>
        </div>
      </CardContent>
    </Card>
  );
};