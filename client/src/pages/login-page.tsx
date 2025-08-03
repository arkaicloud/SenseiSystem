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
      description: "Gerencie graduações e evolução técnica com facilidade."
    },
    {
      icon: Users,
      title: "Gestão de Turmas",
      description: "Planeje horários, instrutores e capacidade de cada turma." 
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-['Inter',sans-serif] antialiased">
      <div className="max-w-screen-lg mx-auto min-h-screen grid grid-cols-1 lg:grid-cols-2 gap-y-8 lg:gap-x-12">
        {/* Left Side - Login Form */}
        <div className="flex items-center justify-center px-6 py-10">
          <div className="max-w-md w-full space-y-6">
            {/* School Branding */}
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                {schoolConfig?.logoUrl ? (
                  <div className="relative">
                    <img 
                      src={schoolConfig.logoUrl} 
                      alt={schoolConfig.schoolName || "Logo da Academia"} 
                      className="h-20 w-auto max-w-[200px] sm:h-24 sm:max-w-[240px] object-contain rounded-xl shadow-md bg-white p-3"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-md hidden">
                      <Award className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <img 
                      src={huiosLogo} 
                      alt="Logo Huios Jiu Jitsu"
                      className="h-20 w-auto max-w-[200px] sm:h-24 sm:max-w-[240px] object-contain rounded-xl shadow-md bg-white p-3"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-md hidden">
                      <Award className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-gray-600 text-center">
                  Acesso exclusivo da <br />
                  <span className="font-semibold text-blue-600 text-base">{schoolConfig?.schoolName || "Huios Jiu Jitsu"}</span>
                </p>
                <p className="text-xs text-gray-500 text-center">no SenseiSystem</p>
              </div>
            </div>

            {/* Login Form */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Entre na sua conta</h2>
                <p className="text-gray-600 text-sm">Digite suas credenciais para acessar sua conta.</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium text-gray-700">E-mail</Label>
                  <Input
                    id="username"
                    type="email"
                    value={loginData.username}
                    onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                    placeholder="seu@email.com"
                    className="w-full rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-md shadow-sm hover:shadow-md transition-all duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    "Entrar"
                  )}
                </Button>

                <div className="text-center">
                  <button 
                    type="button" 
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    Esqueceu sua senha?
                  </button>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-600 text-center mb-3">Ainda não tem acesso?</p>
                  <button 
                    type="button" 
                    onClick={handleRegisterClick}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-md border border-gray-300 transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    <Users className="h-4 w-4" />
                    <span>Matricule-se Agora</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-br from-purple-600 to-blue-600 rounded-md flex items-center justify-center">
                  <span className="text-white text-xs font-bold">S</span>
                </div>
                <span className="text-base font-bold text-gray-800">SenseiSystem</span>
              </div>
              <p className="text-xs text-gray-500">Plataforma líder em gestão para artes marciais</p>
            </div>
          </div>
        </div>

        {/* Right Side - Features Showcase */}
        <div className="flex items-center justify-center px-6 py-10 bg-gradient-to-br from-blue-50 to-indigo-50 lg:rounded-none rounded-t-3xl">
          <div className="max-w-md w-full space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                Transforme sua escola<br />
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  com tecnologia
                </span>
              </h1>
              <p className="text-gray-600 leading-relaxed">
                A gestão moderna que seu dojo merece
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-4">
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md flex items-start gap-3 transition-all duration-200"
                >
                  <div className="bg-blue-100 text-blue-600 rounded-lg p-2 flex-shrink-0">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}