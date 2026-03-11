"use client";

import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import IosSwitch from "@/components/ui/ios-switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Bell, Shield, User, LogOut } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { UserNotificationPreferences } from "@shared/schema";
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
    currentPassword: z.string().min(1, "Senha atual é obrigatória"),
    newPassword: z
      .string()
      .min(8, "A nova senha deve ter pelo menos 8 caracteres"),
    confirmPassword: z.string().min(1, "Confirme sua nova senha"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export default function Settings() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  // Preferências de notificação
  const { data: notificationPreferences, isLoading: isLoadingPreferences } =
    useQuery<UserNotificationPreferences>({
      queryKey: ["/api/user/notification-preferences"],
      retry: false,
    });

  // Config da escola (se necessário em outra seção)
  const { data: schoolConfig } = useQuery({
    queryKey: ["/api/school-config"],
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
      queryClient.invalidateQueries({ queryKey: ["/api/school-config"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar configurações",
        variant: "destructive",
      });
    },
  });

  // Form para alterar senha
  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: z.infer<typeof passwordSchema>) => {
      const response = await apiRequest("PUT", "/api/user/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao alterar senha");
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
      toast({
        title: "Erro",
        description: error.message || "Falha ao alterar senha",
        variant: "destructive",
      });
    },
  });

  // Mutation com UI otimista para preferências
  const updateNotificationPreferences = useMutation({
    mutationFn: async (preferences: Partial<UserNotificationPreferences>) => {
      const response = await apiRequest(
        "PATCH",
        "/api/user/notification-preferences",
        preferences,
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao atualizar preferências");
      }
      return response.json();
    },
    onMutate: async (newPreferences) => {
      await queryClient.cancelQueries({
        queryKey: ["/api/user/notification-preferences"],
      });
      const previousPreferences = queryClient.getQueryData([
        "/api/user/notification-preferences",
      ]);
      queryClient.setQueryData(
        ["/api/user/notification-preferences"],
        (old: UserNotificationPreferences) => ({ ...old, ...newPreferences }),
      );
      return { previousPreferences };
    },
    onError: (err: any, _newPreferences, context) => {
      queryClient.setQueryData(
        ["/api/user/notification-preferences"],
        context?.previousPreferences,
      );
      toast({
        title: "Erro",
        description:
          err?.message || "Erro ao atualizar preferências de notificação",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "Preferências atualizadas",
        description: "Suas preferências foram salvas com sucesso!",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/user/notification-preferences"],
      });
    },
  });

  const handleNotificationToggle = (
    key: keyof Pick<
      UserNotificationPreferences,
      "attendanceNotifications" | "paymentNotifications" | "eventNotifications"
    >,
    value: boolean,
  ) => updateNotificationPreferences.mutate({ [key]: value });

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Configurações
          </h1>
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
            {/* Presença */}
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5 min-w-0">
                <Label className="text-base">Notificações de presença</Label>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Receber notificações sobre confirmação de presença
                </div>
              </div>
              <div className="shrink-0">
                <IosSwitch
                  checked={
                    notificationPreferences?.attendanceNotifications ?? true
                  }
                  onChange={(v) =>
                    handleNotificationToggle("attendanceNotifications", v)
                  }
                  disabled={
                    isLoadingPreferences ||
                    updateNotificationPreferences.isPending
                  }
                  label="Notificações de presença"
                />
              </div>
            </div>

            <Separator />

            {/* Pagamento */}
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5 min-w-0">
                <Label className="text-base">Notificações de pagamento</Label>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Receber notificações sobre pagamentos e vencimentos
                </div>
              </div>
              <div className="shrink-0">
                <IosSwitch
                  checked={
                    notificationPreferences?.paymentNotifications ?? true
                  }
                  onChange={(v) =>
                    handleNotificationToggle("paymentNotifications", v)
                  }
                  disabled={
                    isLoadingPreferences ||
                    updateNotificationPreferences.isPending
                  }
                  label="Notificações de pagamento"
                />
              </div>
            </div>

            <Separator />

            {/* Eventos */}
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5 min-w-0">
                <Label className="text-base">Notificações de eventos</Label>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Receber notificações sobre eventos da escola
                </div>
              </div>
              <div className="shrink-0">
                <IosSwitch
                  checked={notificationPreferences?.eventNotifications ?? true}
                  onChange={(v) =>
                    handleNotificationToggle("eventNotifications", v)
                  }
                  disabled={
                    isLoadingPreferences ||
                    updateNotificationPreferences.isPending
                  }
                  label="Notificações de eventos"
                />
              </div>
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
            <CardDescription>Suas informações pessoais básicas</CardDescription>
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
                  user?.role === "admin"
                    ? "Administrador"
                    : user?.role === "instructor"
                      ? "Professor"
                      : "Aluno"
                }
                disabled
              />
            </div>

            <div className="pt-4">
              <p className="text-sm text-gray-500">
                Para alterar suas informações pessoais, entre em contato com o
                administrador.
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
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label className="text-base">Alterar senha</Label>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Atualize sua senha para manter sua conta segura
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsPasswordDialogOpen(true)}
              >
                Alterar senha
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logout — mobile only */}
      <div className="md:hidden">
        <Button
          variant="outline"
          className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 font-semibold h-12 rounded-xl gap-2"
          onClick={() => logout()}
        >
          <LogOut className="w-4 h-4" />
          Sair da conta
        </Button>
      </div>

      {/* Diálogo: Alterar senha */}
      <Dialog
        open={isPasswordDialogOpen}
        onOpenChange={setIsPasswordDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader className="pt-2 pr-8">
            <DialogTitle>Alterar Senha</DialogTitle>
            <DialogDescription>
              Para sua segurança, insira sua senha atual e defina uma nova
              senha.
            </DialogDescription>
          </DialogHeader>

          <Form {...passwordForm}>
            <form
              onSubmit={passwordForm.handleSubmit((data) =>
                changePasswordMutation.mutate(data),
              )}
              className="space-y-4"
            >
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
                        placeholder="Confirme sua nova senha"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPasswordDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                >
                  {changePasswordMutation.isPending
                    ? "Alterando..."
                    : "Alterar Senha"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
