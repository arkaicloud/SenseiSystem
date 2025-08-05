import React, { useState } from 'react';
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Eye, EyeOff, Users, Shield, Award, Calendar, MapPin, Phone, Mail, Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Types
interface SchoolConfig {
  config: {
    schoolName: string;
    welcomeMessage?: string;
  };
}

interface PublicInfo {
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");

  // Fetch school configuration
  const { data: schoolConfig } = useQuery<SchoolConfig>({
    queryKey: ['/api/school-config'],
    retry: false,
  });

  // Fetch public school info
  const { data: publicInfo } = useQuery<PublicInfo>({
    queryKey: ['/api/school/public-info'],
    retry: false,
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await apiRequest('POST', '/api/login', {
        email: credentials.username,
        password: credentials.password,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Login realizado com sucesso!",
        description: `Bem-vindo, ${data.user.firstName}!`,
      });
      
      // Store auth token and redirect
      localStorage.setItem('token', 'authenticated');
      
      // Use setTimeout to allow toast to show before redirect
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    },
    onError: (error: any) => {
      setError(error.message || "Erro ao fazer login");
    },
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!loginData.username || !loginData.password) {
      setError("Por favor, preencha todos os campos");
      return;
    }

    loginMutation.mutate(loginData);
  };

  const handleRegisterClick = () => {
    setLocation("/onboarding");
  };

  // Features for the left side
  const features = [
    {
      icon: Users,
      title: "Controle de Presença",
      description: "Monitore a frequência dos alunos em tempo real"
    },
    {
      icon: Shield,
      title: "Progressão de Graduação", 
      description: "Gerencie graduações e evolução técnica com facilidade"
    },
    {
      icon: Calendar,
      title: "Gestão de Turmas",
      description: "Planeje horários, instrutores e capacidade de cada turma" 
    }
  ];

  // Helper function to detect social media type from URL
  const getSocialMediaInfo = (url: string) => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('instagram.com')) {
      return { type: 'Instagram', icon: '📷' };
    }
    if (lowerUrl.includes('facebook.com')) {
      return { type: 'Facebook', icon: '👥' };
    }
    if (lowerUrl.includes('youtube.com')) {
      return { type: 'YouTube', icon: '📹' };
    }
    if (lowerUrl.includes('tiktok.com')) {
      return { type: 'TikTok', icon: '🎵' };
    }
    return { type: 'Website', icon: '🌐' };
  };

  // Helper function to format phone for WhatsApp
  const formatPhoneForWhatsApp = (phone: string) => {
    const numbers = phone.replace(/\D/g, '');
    if (numbers.startsWith('0')) {
      return `55${numbers.slice(1)}`;
    }
    if (!numbers.startsWith('55')) {
      return `55${numbers}`;
    }
    return numbers;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
          
          {/* Lado Esquerdo - Área de Apresentação */}
          <div className="order-1 lg:order-1 text-white space-y-8 px-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
                Transforme sua escola com tecnologia
              </h1>
              <p className="text-xl text-slate-300">
                A gestão moderna que seu dojo merece
              </p>
            </div>

            {/* Features Cards */}
            <div className="space-y-4">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="bg-slate-800/50 dark:bg-slate-900/50 backdrop-blur-sm p-4 rounded-xl border border-slate-700/50 dark:border-slate-600/50"
                >
                  <div className="flex items-start gap-3">
                    <div className="bg-slate-700/50 dark:bg-slate-600/50 p-2 rounded-lg">
                      <feature.icon className="h-5 w-5 text-slate-300" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                      <p className="text-sm text-slate-400">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* School Info Card */}
            {publicInfo && (publicInfo.address || publicInfo.phone || publicInfo.email || publicInfo.website) && (
              <div className="bg-slate-800/30 dark:bg-slate-900/30 backdrop-blur-sm p-6 rounded-xl border border-slate-700/30 dark:border-slate-600/30">
                <h3 className="font-semibold text-white text-lg mb-4">
                  Informações da Escola
                </h3>
                
                <div className="space-y-3">
                  {publicInfo.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-slate-400 mt-1 flex-shrink-0" />
                      <span className="text-slate-300 text-sm leading-relaxed">{publicInfo.address}</span>
                    </div>
                  )}
                  
                  {publicInfo.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-green-400 flex-shrink-0" />
                      <a 
                        href={`https://wa.me/${formatPhoneForWhatsApp(publicInfo.phone)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-400 hover:text-green-300 transition-colors text-sm"
                      >
                        {publicInfo.phone}
                      </a>
                    </div>
                  )}
                  
                  {publicInfo.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      <a 
                        href={`mailto:${publicInfo.email}`}
                        className="text-slate-300 hover:text-white transition-colors text-sm"
                      >
                        {publicInfo.email}
                      </a>
                    </div>
                  )}
                  
                  {publicInfo.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      <a 
                        href={publicInfo.website}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-slate-300 hover:text-white transition-colors text-sm flex items-center gap-1"
                      >
                        {getSocialMediaInfo(publicInfo.website).icon} Visite nosso {getSocialMediaInfo(publicInfo.website).type}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Lado Direito - Formulário de Login */}
          <div className="order-2 lg:order-2">
            <div className="mx-auto max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="mb-4">
                  <h1 className="text-2xl font-bold text-red-600 dark:text-red-500 border-2 border-red-600 dark:border-red-500 px-4 py-2 inline-block rounded">
                    {schoolConfig?.config?.schoolName?.toUpperCase() || "SENSEI SYSTEM"}
                  </h1>
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  {schoolConfig?.config?.welcomeMessage || "Seja bem-vindo ao Leo"}
                </p>
              </div>
              
              {/* Login Form */}
              <div className="space-y-6">
                <div className="text-left">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Entre na sua conta</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Digite suas credenciais para acessar sua conta</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium text-slate-700 dark:text-slate-300">E-mail</Label>
                    <Input
                      id="username"
                      type="email"
                      value={loginData.username}
                      onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                      placeholder="adm@senseisystem.com.br"
                      className="w-full"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">Senha</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        placeholder="Digite sua senha"
                        className="w-full pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <button 
                      type="button" 
                      className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
                    >
                      Esqueceu sua senha?
                    </button>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-medium py-3 rounded-md transition-all duration-200"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      "Entrar"
                    )}
                  </Button>

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-600">
                    <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-3">Ainda não tem acesso?</p>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={handleRegisterClick}
                      className="w-full border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950"
                    >
                      Matricule-se Agora
                    </Button>
                  </div>
                </form>
              </div>

              {/* Footer */}
              <div className="text-center mt-8 space-y-3">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-purple-600 to-blue-600 rounded-md flex items-center justify-center">
                    <span className="text-white text-xs font-bold">S</span>
                  </div>
                  <span className="text-base font-bold text-slate-800 dark:text-slate-200">SenseiSystem</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Plataforma líder em gestão para artes marciais</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}