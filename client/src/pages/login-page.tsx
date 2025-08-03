import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Award, Calendar, CreditCard, Loader2, Shield, Users, BarChart3, Bell } from "lucide-react";
import { useContext } from "react";
import { LanguageContext } from "@/providers/i18n-provider";
import { useQuery } from "@tanstack/react-query";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login, user, error, isLoading } = useAuth();
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const { t } = useContext(LanguageContext);

  // Fetch school configuration for tenant-specific branding
  const { data: schoolConfig } = useQuery({
    queryKey: ["/api/school-config"],
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(loginData.username, loginData.password);
  };

  const handleRegisterClick = () => {
    setLocation("/onboarding");
  };

  const features = [
    {
      icon: Shield,
      title: "Controle de Presença",
      description: "Monitore a frequência dos alunos em tempo real com confirmação de presença automática."
    },
    {
      icon: Award,
      title: "Progressão de Graduação", 
      description: "Acompanhe o desenvolvimento técnico e evolução de cada estudante."
    },
    {
      icon: Users,
      title: "Gestão de Turmas",
      description: "Organize horários, capacidade e instrutores responsáveis." 
    },
    {
      icon: BarChart3,
      title: "Relatórios Financeiros",
      description: "Controle completo de mensalidades, pagamentos e inadimplência."
    },
    {
      icon: Bell,
      title: "Comunicação Integrada",
      description: "Sistema de avisos, eventos e comunicados para toda a escola."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-sans">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-white px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md w-full space-y-8">
          {/* School Branding */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
                <Award className="h-8 w-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {schoolConfig?.config?.schoolName || "Huios Jiu Jitsu"}
              </h1>
              <p className="text-gray-600 text-sm">Sistema de Gestão Escolar</p>
            </div>
          </div>

          {/* Login Form */}
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{t("auth.loginToAccount")}</h2>
              <p className="text-gray-600 text-sm">{t("auth.loginDescription")}</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-semibold text-gray-700">{t("auth.email")}</Label>
                <Input
                  id="username"
                  type="email"
                  value={loginData.username}
                  onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                  placeholder="seu@email.com"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-sm font-semibold text-gray-700">{t("auth.password")}</Label>
                  <button 
                    type="button" 
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    {t("auth.forgotPassword")}
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {t("auth.loggingIn")}
                  </>
                ) : (
                  t("auth.login")
                )}
              </Button>

              <div className="text-center space-y-3 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-600">Ainda não tem acesso?</p>
                <button 
                  type="button" 
                  onClick={handleRegisterClick}
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-semibold transition-colors"
                >
                  Solicitar Acesso
                  <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    Nova matrícula
                  </span>
                </button>
              </div>
            </form>
          </div>

          {/* Footer - SenseiSystem Branding */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-br from-purple-600 to-blue-600 rounded-md flex items-center justify-center">
                <span className="text-white text-xs font-bold">S</span>
              </div>
              <span className="text-sm font-semibold text-gray-700">SenseiSystem</span>
            </div>
            <p className="text-xs text-gray-500">Plataforma de Gestão para Artes Marciais</p>
          </div>
        </div>
      </div>

      {/* Right Side - Features Showcase - Hidden on Mobile */}
      <div className="flex-1 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 lg:flex items-center justify-center p-8 hidden lg:block">
        <div className="max-w-xl w-full">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              Bem-vindo ao<br />
              <span className="bg-gradient-to-r from-yellow-300 to-yellow-100 bg-clip-text text-transparent">
                Futuro da Gestão
              </span>
            </h1>
            <p className="text-blue-100 text-lg">
              Transforme a administração da sua escola de artes marciais
            </p>
          </div>

          {/* Features List */}
          <div className="space-y-6">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="flex items-start space-x-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300"
              >
                <div className="bg-gradient-to-br from-white/20 to-white/10 rounded-lg p-3 flex-shrink-0">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-white">
                  <h3 className="text-lg font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-blue-100 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-12 text-center">
            <p className="text-blue-100 text-sm">
              Mais de <span className="font-semibold text-white">1000+ escolas</span> confiam no SenseiSystem
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}