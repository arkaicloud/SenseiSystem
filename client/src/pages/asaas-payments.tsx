import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CreditCard, Settings, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";

interface SchoolPayment {
  id: number;
  tenantId: number;
  asaasPaymentId: string | null;
  status: string;
  dueDate: string;
  value: number;
  paidAt: string | null;
  description: string;
  createdAt: string;
}

interface SchoolConfig {
  id: number;
  schoolName: string;
  asaasCustomerId: string | null;
  asaasApiKey: string | null;
  planValue: number;
  planType: string;
  active: boolean;
}

export default function AsaasPayments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [asaasConfig, setAsaasConfig] = useState({
    asaasApiKey: "",
    planValue: 19990,
    planType: "monthly"
  });

  // Buscar configuração da escola
  const { data: schoolConfig, isLoading: configLoading } = useQuery<{ config: SchoolConfig }>({
    queryKey: ["/api/school-config"],
  });

  // Buscar pagamentos da escola
  const { data: paymentsData, isLoading: paymentsLoading } = useQuery<{ payments: SchoolPayment[] }>({
    queryKey: ["/api/school-payments"],
  });

  // Mutation para atualizar configuração ASAAS
  const updateAsaasConfig = useMutation({
    mutationFn: async (data: typeof asaasConfig) => {
      return await apiRequest("/api/school/asaas-config", "PATCH", data);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Configurações ASAAS atualizadas com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/school-config"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar configurações",
        variant: "destructive",
      });
    },
  });

  // Atualizar estado quando dados chegarem
  useEffect(() => {
    if (schoolConfig?.config) {
      setAsaasConfig({
        asaasApiKey: schoolConfig.config.asaasApiKey || "",
        planValue: schoolConfig.config.planValue || 19990,
        planType: schoolConfig.config.planType || "monthly"
      });
    }
  }, [schoolConfig]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Pago</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" />Vencido</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800"><XCircle className="w-3 h-3 mr-1" />Cancelado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (configLoading) {
    return <div className="flex justify-center items-center h-64">Carregando...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Integração ASAAS</h1>
          <p className="text-muted-foreground">Gerencie pagamentos automáticos da escola</p>
        </div>
        <div className="flex items-center space-x-2">
          <CreditCard className="w-5 h-5" />
          <span className="text-sm">
            Status: {schoolConfig?.config.active ? (
              <Badge className="bg-green-100 text-green-800">Ativo</Badge>
            ) : (
              <Badge className="bg-red-100 text-red-800">Inativo</Badge>
            )}
          </span>
        </div>
      </div>

      {/* Configuração ASAAS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurações ASAAS
          </CardTitle>
          <CardDescription>
            Configure sua integração com o gateway de pagamentos ASAAS
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="asaasApiKey">API Key ASAAS</Label>
              <Input
                id="asaasApiKey"
                type="password"
                placeholder="$aact_..."
                value={asaasConfig.asaasApiKey}
                onChange={(e) => setAsaasConfig(prev => ({ ...prev, asaasApiKey: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="planValue">Valor do Plano (R$)</Label>
              <Input
                id="planValue"
                type="number"
                step="0.01"
                value={(asaasConfig.planValue / 100).toFixed(2)}
                onChange={(e) => setAsaasConfig(prev => ({ 
                  ...prev, 
                  planValue: Math.round(parseFloat(e.target.value) * 100) 
                }))}
              />
            </div>
          </div>
          
          <Button 
            onClick={() => updateAsaasConfig.mutate(asaasConfig)}
            disabled={updateAsaasConfig.isPending}
          >
            {updateAsaasConfig.isPending ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </CardContent>
      </Card>

      {/* Status da Integração */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium">Customer ID</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              {schoolConfig?.config.asaasCustomerId ? "Configurado" : "Não configurado"}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm font-medium">Valor Mensal</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              {formatCurrency(schoolConfig?.config.planValue || 19990)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-sm font-medium">Próximo Pagamento</span>
            </div>
            <p className="text-2xl font-bold mt-2">01/09/2025</p>
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Pagamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pagamentos</CardTitle>
          <CardDescription>
            Acompanhe todos os pagamentos da escola
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paymentsLoading ? (
            <div className="text-center py-4">Carregando pagamentos...</div>
          ) : paymentsData?.payments.length === 0 ? (
            <Alert>
              <AlertDescription>
                Nenhum pagamento encontrado. A integração ASAAS criará automaticamente os pagamentos mensais.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {paymentsData?.payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-medium">{payment.description}</p>
                      {getStatusBadge(payment.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Vencimento: {formatDate(payment.dueDate)}
                      {payment.paidAt && ` • Pago em: ${formatDate(payment.paidAt)}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{formatCurrency(payment.value)}</p>
                    {payment.asaasPaymentId && (
                      <p className="text-xs text-muted-foreground">ID: {payment.asaasPaymentId}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informações sobre Webhook */}
      <Card>
        <CardHeader>
          <CardTitle>Webhook ASAAS</CardTitle>
          <CardDescription>
            Configure este endpoint no seu painel ASAAS para receber notificações automáticas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 p-3 rounded-md">
            <code className="text-sm">{window.location.origin}/webhooks/asaas</code>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Este webhook será chamado automaticamente quando houver mudanças no status dos pagamentos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}