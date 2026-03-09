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
      const response = await apiRequest("PATCH", "/api/school-config", data);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Erro ao salvar configurações");
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Configurações ASAAS atualizadas com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/school-config"] });
    },
    onError: (error: any) => {
      console.error("Erro ao atualizar ASAAS config:", error);
      toast({
        title: "Erro",
        description: error?.message || "Erro ao atualizar configurações ASAAS",
        variant: "destructive",
      });
    },
  });

  // Mutation para testar conexão ASAAS
  const testAsaasConnection = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/asaas/test-connection");
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Erro ao testar conexão");
      }
      return await response.json();
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "Conexão Bem-sucedida",
          description: result.message,
        });
      } else {
        toast({
          title: "Erro na Conexão",
          description: result.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error("Erro ao testar conexão ASAAS:", error);
      toast({
        title: "Erro",
        description: error?.message || "Erro ao testar conexão com ASAAS",
        variant: "destructive",
      });
    },
  });

  // Mutation para sincronizar alunos do ASAAS
  const syncAsaasCustomers = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/asaas/sync-customers");
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Erro ao sincronizar alunos");
      }
      return await response.json();
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "Sincronização Concluída! ✅",
          description: `${result.syncedCount} alunos importados do ASAAS de ${result.totalCustomers} clientes.`,
          variant: "default"
        });
        // Refresh student data
        queryClient.invalidateQueries({ queryKey: ['/api/students'] });
        queryClient.invalidateQueries({ queryKey: ['/api/users/pending'] });
      } else {
        toast({
          title: "Erro na Sincronização",
          description: result.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error("Erro ao sincronizar alunos ASAAS:", error);
      toast({
        title: "Erro",
        description: error?.message || "Erro ao sincronizar alunos do ASAAS",
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
    }).format(value);
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
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {asaasConfig.asaasApiKey?.startsWith('$aact_YTU') || asaasConfig.asaasApiKey?.includes('sandbox') ? 
                "🧪 Ambiente Sandbox (Teste) - Use a API key de teste do ASAAS. Os pagamentos não serão reais." : 
                "🚨 Ambiente Produção - Atenção você está usando a API key de produção do ASAAS. Os pagamentos são reais."
              }
            </AlertDescription>
          </Alert>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
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
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => updateAsaasConfig.mutate(asaasConfig)}
              disabled={updateAsaasConfig.isPending}
            >
              {updateAsaasConfig.isPending ? "Salvando..." : "Salvar Configurações"}
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => testAsaasConnection.mutate()}
              disabled={testAsaasConnection.isPending || !asaasConfig.asaasApiKey}
            >
              {testAsaasConnection.isPending ? "Testando..." : "Testar Conexão"}
            </Button>

            <Button 
              variant="secondary"
              onClick={() => syncAsaasCustomers.mutate()}
              disabled={syncAsaasCustomers.isPending || !asaasConfig.asaasApiKey}
            >
              {syncAsaasCustomers.isPending ? "Sincronizando..." : "Sincronizar Alunos"}
            </Button>
          </div>
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