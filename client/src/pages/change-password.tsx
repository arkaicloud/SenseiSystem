import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Informe a senha temporária"),
  newPassword: z.string().min(8, "A nova senha deve ter pelo menos 8 caracteres"),
  confirmPassword: z.string().min(1, "Confirme sua nova senha"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordPage() {
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const handleSubmit = async (data: ChangePasswordForm) => {
    setIsLoading(true);
    try {
      await apiRequest("PUT", "/api/user/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      toast({
        title: "Senha alterada com sucesso!",
        description: "Agora você pode acessar o sistema normalmente.",
      });

      window.location.href = "/";
    } catch (error: any) {
      const message = error?.message || "Erro ao alterar senha. Verifique a senha temporária e tente novamente.";
      toast({
        title: "Erro ao alterar senha",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#2B54FF]/20 border border-[#2B54FF]/40 mb-4">
            <ShieldCheck className="w-8 h-8 text-[#2B54FF]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Primeira acesso</h1>
          <p className="text-slate-400 text-sm">
            Por segurança, você precisa criar uma nova senha antes de continuar.
          </p>
        </div>

        <Card className="bg-white/5 border-white/10 backdrop-blur-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#2B54FF]" />
              Criar nova senha
            </CardTitle>
            <CardDescription className="text-slate-400">
              A senha temporária foi enviada para o seu e-mail. Use ela no campo abaixo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Senha temporária (recebida por e-mail)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showCurrent ? "text" : "password"}
                            placeholder="Cole a senha do e-mail aqui"
                            className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 pr-10"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrent(!showCurrent)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                          >
                            {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Nova senha</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showNew ? "text" : "password"}
                            placeholder="Mínimo 8 caracteres"
                            className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 pr-10"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowNew(!showNew)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                          >
                            {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Confirmar nova senha</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirm ? "text" : "password"}
                            placeholder="Repita a nova senha"
                            className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 pr-10"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirm(!showConfirm)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                          >
                            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#2B54FF] hover:bg-[#2B54FF]/90 text-white font-semibold h-11 mt-2"
                >
                  {isLoading ? "Salvando..." : "Criar minha senha"}
                </Button>
              </form>
            </Form>

            <div className="mt-4 pt-4 border-t border-white/10 text-center">
              <button
                onClick={() => logout()}
                className="text-slate-400 hover:text-white text-sm transition-colors"
              >
                Sair e entrar com outra conta
              </button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-slate-500 text-xs mt-6">
          Sua senha é criptografada e nunca compartilhada.
        </p>
      </div>
    </div>
  );
}
