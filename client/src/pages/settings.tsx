import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import IosSwitch from "@/components/ui/ios-switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Palette, Bell, Shield, User, Moon, Sun } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Schema de validação para alterar senha
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
    newPassword: z.string().min(8, 'A nova senha deve ter pelo menos 8 caracteres'),
    confirmPassword: z.string().min(1, 'Confirme sua nova senha'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ['confirmPassword'],
  });

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

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

  // Form para alterar senha
  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }
  });

  // Mutation para alterar senha
  const changePasswordMutation = useMutation({
    mutationFn: async (data: z.infer<typeof passwordSchema>) => {
      const response = await apiRequest('PUT', '/api/user/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao alterar senha');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Senha alterada",
        description: "Sua senha foi alterada com sucesso!",
      });
      passwordForm.reset();
      setIsPasswordDialogOpen(false);
    },
    onError: (error: any) => {
      console.error('Error changing password:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao alterar senha",
        variant: 'destructive',
      });
    },
  });

  const handlePasswordChange = (data: z.infer<typeof passwordSchema>) => {
    changePasswordMutation.mutate(data);
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
              <IosSwitch 
                checked={true}
                onChange={() => {}}
                label="Notificações de presença"
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Notificações de pagamento</Label>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Receber notificações sobre pagamentos e vencimentos
                </div>
              </div>
              <IosSwitch 
                checked={true}
                onChange={() => {}}
                label="Notificações de pagamento"
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Notificações de eventos</Label>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Receber notificações sobre eventos da escola
                </div>
              </div>
              <IosSwitch 
                checked={true}
                onChange={() => {}}
                label="Notificações de eventos"
              />
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
              <Button 
                variant="outline" 
                onClick={() => setIsPasswordDialogOpen(true)}
                data-testid="button-change-password"
              >
                Alterar senha
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Diálogo para alterar senha */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="max-w-md" data-testid="dialog-change-password">
          <DialogHeader className="pt-2 pr-8">
            <DialogTitle>Alterar Senha</DialogTitle>
            <DialogDescription>
              Para sua segurança, insira sua senha atual e defina uma nova senha.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha atual</FormLabel>
                    <FormControl>
                      <Input 
                        type="password"
                        {...field} 
                        data-testid="input-current-password"
                        placeholder="Digite sua senha atual"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova senha</FormLabel>
                    <FormControl>
                      <Input 
                        type="password"
                        {...field} 
                        data-testid="input-new-password"
                        placeholder="Digite sua nova senha (mín. 8 caracteres)"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar nova senha</FormLabel>
                    <FormControl>
                      <Input 
                        type="password"
                        {...field} 
                        data-testid="input-confirm-password"
                        placeholder="Confirme sua nova senha"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsPasswordDialogOpen(false)}
                  data-testid="button-cancel"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={changePasswordMutation.isPending}
                  data-testid="button-save-password"
                >
                  {changePasswordMutation.isPending ? "Alterando..." : "Alterar Senha"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}