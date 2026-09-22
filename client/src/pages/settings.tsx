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
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  CheckCircle2,
  Database,
  ChevronRight,
  Info,
  KeyRound,
  Loader2,
  LogOut,
  MessageCircle,
  Moon,
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
import { useTheme } from "@/hooks/use-theme";
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
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isNotificationsExpanded, setIsNotificationsExpanded] = useState(false);
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
  ) => {
    if (
      key === "eventNotifications" &&
      value &&
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      void Notification.requestPermission().then((permission) => {
        if (permission !== "granted") {
          toast({
            title: "Notificações do navegador desativadas",
            description:
              "Você continuará vendo o contador de avisos dentro do aplicativo.",
          });
        }
      });
    }

    updateNotificationPreferences.mutate({ [key]: value });
  };

  const roleLabel =
    user?.role === "admin"
      ? "Administrador"
      : user?.role === "instructor"
        ? "Professor"
        : user?.role === "guardian"
          ? "Responsável"
          : "Aluno";

  const getAvatarColorForBelt = (beltLevel?: string | null) => {
    switch (beltLevel) {
      case "purple":
        return "purple";
      case "brown":
        return "orange";
      case "black":
        return "slate";
      case "blue":
        return "blue";
      default:
        return "blue";
    }
  };

  return (
    <div className="mx-auto w-full max-w-md space-y-5 px-4 pb-24 pt-4 md:px-5 md:pb-8 md:pt-5">
      <header className="relative flex items-center justify-center">
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-0 size-9 rounded-full text-foreground hover:bg-muted"
          onClick={() => window.history.back()}
          aria-label="Voltar"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="text-lg font-bold tracking-tight text-foreground">Perfil</h1>
      </header>

      <section
        id="profile-summary"
        className="flex flex-col items-center rounded-2xl border border-border/70 bg-card px-4 py-5 text-center shadow-sm"
      >
        {user?.role === "student" && profileStudent?.id ? (
          <CustomAvatar
            studentId={profileStudent.id}
            firstName={user?.firstName || ""}
            lastName={user?.lastName || ""}
            avatarStyle="initials"
            avatarColor={getAvatarColorForBelt(profileStudent.beltLevel)}
            avatarImage={profileStudent.avatarImage || ""}
            size="lg"
            onSave={(data) => updateAvatarMutation.mutate(data)}
            editable
            showActionLabel
          />
        ) : (
          <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
            {user?.firstName?.charAt(0)}
            {user?.lastName?.charAt(0)}
          </div>
        )}
        <div className="mt-3 min-w-0">
          <h2 className="truncate text-lg font-bold text-foreground">
            {user?.firstName} {user?.lastName}
          </h2>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {roleLabel}
          </p>
        </div>
      </section>

      <section>
        <h2 className="mb-2 px-1 text-xs font-medium text-muted-foreground">
          Outras configurações
        </h2>
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
          <button
            type="button"
            className="flex min-h-14 w-full items-center gap-3 px-4 text-left transition-colors hover:bg-muted/50"
            onClick={() =>
              document
                .getElementById("profile-summary")
                ?.scrollIntoView({ behavior: "smooth", block: "center" })
            }
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
              <User className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-foreground">Dados do perfil</span>
              <span className="block text-[11px] text-muted-foreground">Nome e avatar</span>
            </span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>

          <button
            type="button"
            className="flex min-h-14 w-full items-center gap-3 border-t border-border/70 px-4 text-left transition-colors hover:bg-muted/50"
            onClick={() => setIsPasswordDialogOpen(true)}
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
              <KeyRound className="size-4" />
            </span>
            <span className="min-w-0 flex-1 text-sm font-medium text-foreground">Senha</span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>

          <button
            type="button"
            className="flex min-h-14 w-full items-center gap-3 border-t border-border/70 px-4 text-left transition-colors hover:bg-muted/50"
            onClick={() => setIsNotificationsExpanded((expanded) => !expanded)}
            aria-expanded={isNotificationsExpanded}
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
              <Bell className="size-4" />
            </span>
            <span className="min-w-0 flex-1 text-sm font-medium text-foreground">Notificações</span>
            <ChevronRight
              className={`size-4 text-muted-foreground transition-transform ${
                isNotificationsExpanded ? "rotate-90" : ""
              }`}
            />
          </button>

          {isNotificationsExpanded && (
            <div className="space-y-3 border-t border-border/70 bg-muted/20 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-foreground">Presença</span>
                <IosSwitch
                  checked={notificationPreferences?.attendanceNotifications ?? true}
                  onChange={(v) => handleNotificationToggle("attendanceNotifications", v)}
                  disabled={isLoadingPreferences || updateNotificationPreferences.isPending}
                  label="Notificações de presença"
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-foreground">Pagamentos</span>
                <IosSwitch
                  checked={notificationPreferences?.paymentNotifications ?? true}
                  onChange={(v) => handleNotificationToggle("paymentNotifications", v)}
                  disabled={isLoadingPreferences || updateNotificationPreferences.isPending}
                  label="Notificações de pagamento"
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-foreground">Eventos</span>
                <IosSwitch
                  checked={notificationPreferences?.eventNotifications ?? true}
                  onChange={(v) => handleNotificationToggle("eventNotifications", v)}
                  disabled={isLoadingPreferences || updateNotificationPreferences.isPending}
                  label="Notificações de eventos"
                />
              </div>
            </div>
          )}

          <div className="flex min-h-14 items-center gap-3 border-t border-border/70 px-4">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
              <Moon className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-foreground">Modo escuro</span>
              <span className="block text-[11px] text-muted-foreground">
                {theme === "dark" ? "Ativado" : "Desativado"}
              </span>
            </span>
            <IosSwitch
              checked={theme === "dark"}
              onChange={() => toggleTheme()}
              label="Alternar modo escuro"
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-2 px-1 text-xs font-medium text-muted-foreground">
          Aplicativo
        </h2>
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
          <button
            type="button"
            className="flex min-h-14 w-full items-center gap-3 px-4 text-left transition-colors hover:bg-muted/50"
            onClick={() =>
              toast({
                title: "SenseiSystem",
                description: "Gestão da sua escola de artes marciais.",
              })
            }
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
              <Info className="size-4" />
            </span>
            <span className="min-w-0 flex-1 text-sm font-medium text-foreground">Sobre o aplicativo</span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>
          <button
            type="button"
            className="flex min-h-14 w-full items-center gap-3 border-t border-border/70 px-4 text-left transition-colors hover:bg-muted/50"
            onClick={() =>
              toast({
                title: "Ajuda e FAQ",
                description: "Fale com a secretaria da escola para tirar dúvidas.",
              })
            }
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
              <MessageCircle className="size-4" />
            </span>
            <span className="min-w-0 flex-1 text-sm font-medium text-foreground">Ajuda e FAQ</span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>
          <button
            type="button"
            className="flex min-h-14 w-full items-center gap-3 border-t border-border/70 px-4 text-left text-destructive transition-colors hover:bg-destructive/5"
            onClick={() => logout()}
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
              <LogOut className="size-4" />
            </span>
            <span className="min-w-0 flex-1 text-sm font-medium">Sair da conta</span>
            <ChevronRight className="size-4" />
          </button>
        </div>
      </section>

      {shouldShowDatabaseOperations(databaseCopyAccess?.canAccess) && (
        <Card className="border-amber-300 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
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
