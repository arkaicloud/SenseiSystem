"use client";

import React, { useEffect, useRef, useState } from "react";
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
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Database,
  ChevronRight,
  Loader2,
  LogOut,
  Shield,
  User,
  XCircle,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  getDatabaseCopyUiStatus,
  shouldShowDatabaseOperations,
} from "@/lib/databaseCopyUi";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { UserNotificationPreferences } from "@shared/schema";
import CustomAvatar, { type AvatarData } from "@/components/students/CustomAvatar";
import MedicalCertificateUpload from "@/components/students/MedicalCertificateUpload";
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

type DatabaseCopyJob = {
  id: string;
  status: "running" | "success" | "error";
  startedAt: string;
  finishedAt?: string;
  error?: string;
};

export default function Settings() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isDatabaseCopyDialogOpen, setIsDatabaseCopyDialogOpen] = useState(false);
  const [databaseCopyJobId, setDatabaseCopyJobId] = useState<string | null>(null);
  const notifiedDatabaseCopyJob = useRef<string | null>(null);

  const { data: studentData } = useQuery<any>({
    queryKey: [`/api/students/by-user/${user?.id || 0}`],
    enabled: !!user?.id && user?.role === "student",
    retry: false,
  });
  const profileStudent = studentData?.student || studentData;

  const updateAvatarMutation = useMutation({
    mutationFn: async (data: AvatarData) => {
      const response = await apiRequest(
        "PUT",
        `/api/students/${profileStudent?.id}/avatar`,
        data,
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/students/by-user/${user?.id || 0}`],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/student/profile"] });
    },
    onError: (error: any) => {
      toast({
        title: "Não foi possível atualizar o avatar",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Preferências de notificação
  const { data: notificationPreferences, isLoading: isLoadingPreferences } =
    useQuery<UserNotificationPreferences>({
      queryKey: ["/api/user/notification-preferences"],
      retry: false,
    });

  const { data: databaseCopyAccess } = useQuery<{
    canAccess: boolean;
    configured: boolean;
  }>({
    queryKey: ["/api/admin/database/prod-to-dev/access"],
    retry: false,
  });

  const { data: databaseCopyJob } = useQuery<DatabaseCopyJob>({
    queryKey: ["/api/admin/database/prod-to-dev", databaseCopyJobId],
    queryFn: async () => {
      const response = await apiRequest(
        "GET",
        `/api/admin/database/prod-to-dev/${databaseCopyJobId}`,
      );
      return response.json();
    },
    enabled: !!databaseCopyJobId,
    refetchInterval: (query) =>
      query.state.data?.status === "running" ? 2000 : false,
    retry: false,
  });
  const databaseCopyMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "POST",
        "/api/admin/database/prod-to-dev",
      );
      return response.json() as Promise<DatabaseCopyJob>;
    },
    onSuccess: (job) => {
      setDatabaseCopyJobId(job.id);
      setIsDatabaseCopyDialogOpen(false);
      toast({
        title: "Cópia iniciada",
        description: "O banco está sendo copiado em segundo plano.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Não foi possível iniciar",
        description: error.message || "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    },
  });
  const databaseCopyUiStatus = getDatabaseCopyUiStatus(
    databaseCopyJob?.status,
    databaseCopyMutation.isPending,
  );

  useEffect(() => {
    if (
      !databaseCopyJob ||
      databaseCopyJob.status === "running" ||
      notifiedDatabaseCopyJob.current === databaseCopyJob.id
    ) {
      return;
    }

    notifiedDatabaseCopyJob.current = databaseCopyJob.id;
    if (databaseCopyJob.status === "success") {
      toast({
        title: "Cópia concluída com sucesso",
        description: "O banco de desenvolvimento agora contém os dados de produção.",
      });
    } else {
      toast({
        title: "Falha ao copiar o banco",
        description:
          databaseCopyJob.error ||
          "Verifique a configuração e tente novamente.",
        variant: "destructive",
      });
    }
  }, [databaseCopyJob, toast]);

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
    <div className="mx-auto max-w-md space-y-3 px-4 py-4 md:px-5 md:py-6">
      <section className="rounded-[28px] border border-border/70 bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Minha conta
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
              Meu perfil
            </h1>
          </div>
          <User className="size-5 text-muted-foreground" />
        </div>

        <div className="mt-5 flex items-center gap-4">
          {user?.role === "student" && profileStudent?.id ? (
            <CustomAvatar
              studentId={profileStudent.id}
              firstName={user?.firstName || ""}
              lastName={user?.lastName || ""}
              avatarStyle={profileStudent.avatarStyle || "initials"}
              avatarColor={profileStudent.avatarColor || "blue"}
              avatarImage={profileStudent.avatarImage || ""}
              size="lg"
              onSave={(data) => updateAvatarMutation.mutate(data)}
              editable
              showActionLabel={false}
            />
          ) : (
            <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
              {user?.firstName?.charAt(0)}
              {user?.lastName?.charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-foreground">
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">{user?.email}</p>
            <span className="mt-2 inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              {user?.role === "admin"
                ? "Administrador"
                : user?.role === "instructor"
                  ? "Professor"
                  : user?.role === "guardian"
                    ? "Responsável"
                    : "Aluno"}
            </span>
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Toque no ícone da câmera para alterar sua foto
        </p>
      </section>

      <div className="grid gap-3">
        {/* Notificações */}
        <Card className="order-1 overflow-hidden rounded-[24px]">
          <CardHeader className="border-b border-border/70 px-4 py-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="size-4 text-primary" />
              Notificações
            </CardTitle>
            <CardDescription className="mt-1">
              Configure suas preferências de notificações
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-0 px-4 py-1">
            {/* Presença */}
            <div className="flex items-center justify-between gap-3 py-3">
              <div className="space-y-0.5 min-w-0">
                <Label className="text-sm font-semibold">Presença</Label>
                <div className="text-xs text-muted-foreground">
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
            <div className="flex items-center justify-between gap-3 py-3">
              <div className="space-y-0.5 min-w-0">
                <Label className="text-sm font-semibold">Pagamentos</Label>
                <div className="text-xs text-muted-foreground">
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
            <div className="flex items-center justify-between gap-3 py-3">
              <div className="space-y-0.5 min-w-0">
                <Label className="text-sm font-semibold">Eventos</Label>
                <div className="text-xs text-muted-foreground">
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

        {user?.role === "student" &&
          profileStudent?.id &&
          (
            profileStudent.requiresMedicalCertificate === true ||
            ["PENDING", "UPLOADED", "RECEIVED"].includes(profileStudent.medicalCertificateStatus)
          ) && (
            <div className="order-3">
              <MedicalCertificateUpload
                studentId={profileStudent.id}
                required={profileStudent.requiresMedicalCertificate}
                status={profileStudent.medicalCertificateStatus}
              />
            </div>
          )}

        {/* Segurança */}
        <Card className="order-2 overflow-hidden rounded-[24px]">
          <CardHeader className="border-b border-border/70 px-4 py-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="size-4 text-primary" />
              Segurança
            </CardTitle>
            <CardDescription>
              Configurações de segurança da sua conta
            </CardDescription>
          </CardHeader>

          <CardContent className="px-4 py-2">
            <div className="flex items-center justify-between gap-3 py-2">
              <div className="space-y-0.5">
                <Label className="text-sm font-semibold">Alterar senha</Label>
                <div className="text-xs text-muted-foreground">
                  Atualize sua senha para manter sua conta segura
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 rounded-xl"
                onClick={() => setIsPasswordDialogOpen(true)}
              >
                Alterar senha
              </Button>
              <ChevronRight className="size-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {shouldShowDatabaseOperations(databaseCopyAccess?.canAccess) && (
          <Card className="order-4 border-amber-300 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-amber-700 dark:text-amber-400" />
                Operações do banco
              </CardTitle>
              <CardDescription>
                Recursos administrativos para sincronizar os ambientes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3 rounded-lg border border-amber-300 bg-amber-100 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-100">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                <p>
                  Esta operação substitui todos os dados atuais do banco de
                  desenvolvimento pelos dados de produção. Execute somente pelo
                  ambiente de desenvolvimento.
                </p>
              </div>

              {!databaseCopyAccess?.configured && (
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  Configure o segredo PROD_DATABASE_URL no ambiente de
                  desenvolvimento para habilitar esta operação.
                </p>
              )}

              {databaseCopyJob && (
                <div
                  className="flex items-center gap-2 text-sm"
                  aria-live="polite"
                >
                  {databaseCopyUiStatus === "running" && (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Cópia em andamento. Não feche o ambiente de desenvolvimento.
                    </>
                  )}
                  {databaseCopyUiStatus === "success" && (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Cópia concluída com sucesso.
                    </>
                  )}
                  {databaseCopyUiStatus === "error" && (
                    <>
                      <XCircle className="h-4 w-4 text-red-600" />
                      {databaseCopyJob.error || "A cópia não pôde ser concluída."}
                    </>
                  )}
                </div>
              )}

              <Button
                className="bg-amber-600 text-white hover:bg-amber-700"
                disabled={
                  !databaseCopyAccess?.configured ||
                  databaseCopyMutation.isPending ||
                  databaseCopyUiStatus === "running"
                }
                onClick={() => setIsDatabaseCopyDialogOpen(true)}
              >
                {databaseCopyMutation.isPending ||
                databaseCopyUiStatus === "running" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Copiando banco...
                  </>
                ) : (
                  "Copiar produção para desenvolvimento"
                )}
              </Button>
            </CardContent>
          </Card>
        )}
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

      <Dialog
        open={isDatabaseCopyDialogOpen}
        onOpenChange={setIsDatabaseCopyDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader className="pt-2 pr-8">
            <DialogTitle>Copiar produção para desenvolvimento?</DialogTitle>
            <DialogDescription>
              Esta operação substituirá todos os dados atuais do banco de
              desenvolvimento pelos dados de produção. A operação pode levar
              alguns minutos e não pode ser desfeita pelo Dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setIsDatabaseCopyDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={databaseCopyMutation.isPending}
              onClick={() => databaseCopyMutation.mutate()}
            >
              {databaseCopyMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Sim, substituir o banco de desenvolvimento
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
