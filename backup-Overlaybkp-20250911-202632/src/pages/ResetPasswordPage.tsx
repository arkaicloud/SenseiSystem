
import React, { useState, useEffect } from 'react';
import { useLocation } from "wouter";
import { Lock, Eye, EyeOff, ArrowLeft, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";

export default function ResetPasswordPage() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [userInfo, setUserInfo] = useState<{ userEmail: string; userName: string } | null>(null);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: ""
  });

  // Get token from URL
  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get('token');

  // Validate token on component mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError("Token de redefinição não encontrado na URL");
        setTokenValid(false);
        setIsValidatingToken(false);
        return;
      }

      try {
        const response = await apiRequest('GET', `/api/auth/validate-reset-token/${token}`);
        const data = await response.json();

        if (data.valid) {
          setTokenValid(true);
          setUserInfo({ 
            userEmail: data.userEmail, 
            userName: data.userName 
          });
        } else {
          setError(data.message || "Token inválido ou expirado");
          setTokenValid(false);
        }
      } catch (error: any) {
        console.error('❌ Error validating token:', error);
        setError("Erro ao validar token de redefinição");
        setTokenValid(false);
      } finally {
        setIsValidatingToken(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Validate form
    if (!formData.newPassword || !formData.confirmPassword) {
      setError("Por favor, preencha todos os campos");
      setIsLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("As senhas não coincidem");
      setIsLoading(false);
      return;
    }

    if (formData.newPassword.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres");
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiRequest('POST', '/api/auth/reset-password', {
        token,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword
      });

      if (response.ok) {
        setIsSuccess(true);
        console.log('✅ Password reset completed successfully');
      } else {
        const data = await response.json();
        setError(data.message || "Erro ao redefinir senha");
      }
    } catch (error: any) {
      console.error('❌ Error resetting password:', error);
      setError("Erro ao redefinir senha. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setLocation("/login");
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    let feedback = [];

    if (password.length >= 8) strength++;
    else feedback.push("Pelo menos 8 caracteres");

    if (/[a-z]/.test(password)) strength++;
    else feedback.push("Uma letra minúscula");

    if (/[A-Z]/.test(password)) strength++;
    else feedback.push("Uma letra maiúscula");

    if (/[0-9]/.test(password)) strength++;
    else feedback.push("Um número");

    if (/[^A-Za-z0-9]/.test(password)) strength++;
    else feedback.push("Um caractere especial");

    return { strength, feedback };
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

  // Loading state while validating token
  if (isValidatingToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700">
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
                <p className="text-slate-600 dark:text-slate-400">
                  Validando token de redefinição...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Success state
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
                  Senha Atualizada!
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">
                  Sua nova senha foi definida com sucesso
                </p>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                <AlertDescription className="text-green-800 dark:text-green-200 text-center">
                  Agora você pode fazer login com sua nova senha
                </AlertDescription>
              </Alert>

              <Button 
                onClick={handleBackToLogin}
                className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
              >
                Ir para Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Token Inválido
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">
                  Não foi possível validar o token de redefinição
                </p>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>

              <div className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                <p><strong>Possíveis causas:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Token expirado (válido por apenas 1 hora)</li>
                  <li>Token já utilizado</li>
                  <li>Link malformado ou incompleto</li>
                </ul>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={() => setLocation("/auth/forgot-password")}
                  className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
                >
                  Solicitar Novo Link
                </Button>
                
                <Button 
                  onClick={handleBackToLogin}
                  variant="outline" 
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main reset form
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Nova Senha
              </h1>
              {userInfo && (
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">
                  Olá, <strong>{userInfo.userName}</strong>! <br />
                  Defina sua nova senha para <span className="font-mono text-xs">{userInfo.userEmail}</span>
                </p>
              )}
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
                <Label htmlFor="newPassword" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Nova senha
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    placeholder="Digite sua nova senha"
                    className="w-full pr-10"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                
                {/* Password strength indicator */}
                {formData.newPassword && (
                  <div className="space-y-2">
                    <div className="flex space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full ${
                            i < passwordStrength.strength
                              ? passwordStrength.strength <= 2
                                ? 'bg-red-400'
                                : passwordStrength.strength <= 3
                                ? 'bg-yellow-400'
                                : 'bg-green-400'
                              : 'bg-slate-200 dark:bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                    {passwordStrength.feedback.length > 0 && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Adicione: {passwordStrength.feedback.join(", ")}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Confirmar nova senha
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Digite novamente sua nova senha"
                    className="w-full pr-10"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                
                {/* Password match indicator */}
                {formData.confirmPassword && (
                  <p className={`text-xs ${
                    formData.newPassword === formData.confirmPassword
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {formData.newPassword === formData.confirmPassword
                      ? '✓ Senhas coincidem'
                      : '✗ Senhas não coincidem'
                    }
                  </p>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
                disabled={isLoading || passwordStrength.strength < 3 || formData.newPassword !== formData.confirmPassword}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redefinindo...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Redefinir Senha
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
