
import React, { useState } from 'react';
import { useLocation } from "wouter";
import { Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";

export default function ForgotPasswordPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!email) {
      setError("Por favor, informe seu e-mail");
      setIsLoading(false);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Por favor, informe um e-mail válido");
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiRequest('POST', '/api/auth/forgot-password', {
        email: email.toLowerCase().trim()
      });

      if (response.ok) {
        setIsSuccess(true);
        console.log('✅ Password reset request sent successfully');
      } else {
        const data = await response.json();
        setError(data.message || "Erro ao processar solicitação");
      }
    } catch (error: any) {
      console.error('❌ Error requesting password reset:', error);
      setError("Erro ao enviar solicitação. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setLocation("/login");
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  E-mail Enviado!
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">
                  Verifique sua caixa de entrada
                </p>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                <AlertDescription className="text-green-800 dark:text-green-200 text-center">
                  Se o e-mail <strong>{email}</strong> estiver cadastrado, enviaremos instruções para redefinir sua senha.
                </AlertDescription>
              </Alert>

              <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg space-y-2">
                  <h3 className="font-medium text-slate-900 dark:text-white">Próximos passos:</h3>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Verifique sua caixa de entrada</li>
                    <li>Se não encontrar, verifique o spam</li>
                    <li>Clique no link do e-mail em até 1 hora</li>
                    <li>Defina sua nova senha</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={handleBackToLogin}
                  variant="outline" 
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao Login
                </Button>
                
                <Button 
                  onClick={() => {
                    setIsSuccess(false);
                    setEmail("");
                  }}
                  variant="ghost" 
                  className="w-full"
                >
                  Tentar outro e-mail
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Esqueceu sua senha?
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">
                Não se preocupe, vamos te ajudar a recuperá-la
              </p>
            </div>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  E-mail cadastrado
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="w-full"
                  required
                  disabled={isLoading}
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Digite o e-mail usado no seu cadastro
                </p>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Enviar Link de Redefinição
                  </>
                )}
              </Button>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-600">
                <Button 
                  type="button"
                  onClick={handleBackToLogin}
                  variant="ghost" 
                  className="w-full"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar ao Login
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
