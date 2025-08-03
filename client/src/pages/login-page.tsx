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
import huiosLogo from "@assets/targeted_element_1754259068936.png";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login, user, error, isLoading } = useAuth();
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const { t } = useContext(LanguageContext);

  // Fetch school configuration for tenant-specific branding
  const { data: schoolConfigResponse } = useQuery<{ config: any }>({
    queryKey: ["/api/school-config"],
  });

  // Safely extract config from response
  const schoolConfig = schoolConfigResponse?.config || null;

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
      description: "Monitore a frequência dos alunos em tempo real."
    },
    {
      icon: Award,
      title: "Progressão de Graduação", 
      description: "Acompanhe o desenvolvimento de cada estudante."
    },
    {
      icon: Users,
      title: "Gestão de Turmas",
      description: "Organize horários e instrutores responsáveis." 
    }
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-['Inter',sans-serif] antialiased">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex items-center justify-center bg-white px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        <div className="max-w-md w-full space-y-4 sm:space-y-6">
          {/* School Branding */}
          <div className="text-center space-y-4 sm:space-y-6">
            {/* Logo Compacto */}
            <div className="flex justify-center">
              {schoolConfig?.logoUrl ? (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl shadow-lg bg-white p-2 flex items-center justify-center">
                  <img 
                    src={schoolConfig.logoUrl} 
                    alt={schoolConfig.schoolName || "Logo da Academia"} 
                    className="w-full h-full object-contain rounded-lg"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl shadow-lg bg-white p-2 flex items-center justify-center">
                  <img 
                    src={huiosLogo} 
                    alt="Logo Huios Jiu Jitsu"
                    className="w-full h-full object-contain rounded-lg"
                    onError={(e) => {
                      // Fallback to icon if logo fails
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg hidden">
                    <Award className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                  </div>
                </div>
              )}
            </div>
            
            {/* Título Compacto */}
            <div className="space-y-2">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-700">
                Acesso exclusivo da
              </h1>
              <h2 className="text-xl sm:text-2xl font-bold text-blue-600">
                {schoolConfig?.schoolName || "Huios Jiu Jitsu"}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">
                no SenseiSystem
              </p>
            </div>
          </div>

          {/* Login Form */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-100">
            <div className="mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">{t("auth.loginToAccount")}</h2>
              <p className="text-gray-600 text-xs sm:text-sm">{t("auth.loginDescription")}</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
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
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">{t("auth.password")}</Label>
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

              <div className="text-center">
                <button 
                  type="button" 
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  {t("auth.forgotPassword")}
                </button>
              </div>

              <div className="text-center space-y-4 pt-6 border-t border-gray-100">
                <p className="text-sm text-gray-600">Ainda não tem acesso?</p>
                <button 
                  type="button" 
                  onClick={handleRegisterClick}
                  className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-gray-900 font-medium py-3 px-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <Users className="h-4 w-4" />
                  <span>Solicitar Acesso • Nova Matrícula</span>
                </button>
              </div>
            </form>
          </div>

          {/* Footer - SenseiSystem Branding */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-7 h-7 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white text-sm font-bold">S</span>
              </div>
              <span className="text-lg font-bold text-gray-800">SenseiSystem</span>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600 font-medium">
                Junte-se às <span className="font-bold text-gray-900">escolas</span> que confiam no SenseiSystem
              </p>
              <p className="text-xs text-gray-500">Plataforma líder em gestão para artes marciais</p>
            </div>
          </div>
        </div>
      </div>
      {/* Right Side - Features Showcase Elegante */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 items-center justify-center p-6 lg:p-8 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-600 rounded-full mix-blend-multiply filter blur-xl"></div>
          <div className="absolute -bottom-8 -left-4 w-72 h-72 bg-indigo-600 rounded-full mix-blend-multiply filter blur-xl"></div>
        </div>
        
        <div className="max-w-lg w-full relative z-10 mt-[12px] mb-[12px] pl-[5px] pr-[5px] text-left pt-[80px] pb-[80px]">
          {/* Header Elegante Compacto */}
          <div className="text-center mb-8 lg:mb-10">
            <h1 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 mb-4 leading-tight">
              O futuro da<br />
              <span className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 bg-clip-text text-transparent">
                gestão escolar
              </span>
            </h1>
            <p className="text-gray-600 text-sm lg:text-base leading-relaxed">
              Plataforma completa para transformar a administração da sua escola de artes marciais
            </p>
          </div>

          {/* Features List com Glassmorphism Compacto */}
          <div className="space-y-3 lg:space-y-4">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="group relative flex items-start space-x-4 p-4 lg:p-5 rounded-xl lg:rounded-2xl bg-white/60 backdrop-blur-md border border-white/20 shadow-lg hover:shadow-xl hover:bg-white/80 transition-all duration-300 hover:scale-[1.02]"
              >
                {/* Gradient Border Effect */}
                <div className="absolute inset-0 rounded-xl lg:rounded-2xl bg-gradient-to-r from-blue-600/10 to-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg p-2.5 lg:p-3 flex-shrink-0 shadow-lg">
                  <feature.icon className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
                </div>
                <div className="relative">
                  <h3 className="text-sm lg:text-base font-bold text-gray-900 mb-1 group-hover:text-blue-700 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-xs lg:text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}