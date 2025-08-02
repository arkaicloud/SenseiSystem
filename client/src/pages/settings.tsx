import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Palette, Bell, Shield, User, Moon, Sun } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Buscar configuração da escola
  const { data: schoolConfig } = useQuery({
    queryKey: ['/api/school-config'],
  });

  const updateSchoolConfigMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", "/api/school-config", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Configurações atualizadas",
        description: "As configurações foram salvas com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/school-config'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar configurações",
        variant: "destructive",
      });
    },
  });

  const handleThemeChange = (theme: string) => {
    updateSchoolConfigMutation.mutate({
      defaultTheme: theme
    });
    
    // Aplicar tema imediatamente
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
    }
  };

  

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Configurações</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Gerencie suas preferências e configurações do sistema
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        

        

        {/* Notificações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notificações
            </CardTitle>
            <CardDescription>
              Configure suas preferências de notificações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Notificações de presença</Label>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Receber notificações sobre confirmação de presença
                </div>
              </div>
              <Switch defaultChecked />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Notificações de pagamento</Label>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Receber notificações sobre pagamentos e vencimentos
                </div>
              </div>
              <Switch defaultChecked />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Notificações de eventos</Label>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Receber notificações sobre eventos da escola
                </div>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Conta */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Informações da Conta
            </CardTitle>
            <CardDescription>
              Suas informações pessoais básicas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={user?.firstName || ""} disabled />
              </div>
              <div className="space-y-2">
                <Label>Sobrenome</Label>
                <Input value={user?.lastName || ""} disabled />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Função</Label>
              <Input 
                value={
                  user?.role === 'admin' ? 'Administrador' :
                  user?.role === 'instructor' ? 'Professor' : 'Aluno'
                } 
                disabled 
              />
            </div>
            <div className="pt-4">
              <Button variant="outline" disabled>
                Editar informações pessoais
              </Button>
              <p className="text-sm text-gray-500 mt-2">
                Para alterar suas informações pessoais, entre em contato com o administrador.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Segurança */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Segurança
            </CardTitle>
            <CardDescription>
              Configurações de segurança da sua conta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Alterar senha</Label>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Atualize sua senha para manter sua conta segura
                </div>
              </div>
              <Button variant="outline" disabled>
                Alterar senha
              </Button>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Autenticação de dois fatores</Label>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Adicione uma camada extra de segurança
                </div>
              </div>
              <Switch disabled />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}