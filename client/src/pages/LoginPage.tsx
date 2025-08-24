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
          <div className="order-2 lg:order-1 text-white space-y-8 px-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight text-white dark:text-slate-100">
                Transforme sua escola com tecnologia
              </h1>
              <p className="text-xl text-slate-300 dark:text-slate-200">
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
                        className="text-slate-300 hover:text-white transition-colors text-sm"
                      >
                        Visite nosso website
                      </a>
                    </div>
                  )}

                  {/* Redes Sociais */}
                  {(schoolConfig?.config?.instagram || schoolConfig?.config?.facebook || schoolConfig?.config?.whatsapp || schoolConfig?.config?.youtube || schoolConfig?.config?.tiktok) && (
                    <div className="mt-6 pt-6 border-t border-slate-600">
                      <h3 className="text-sm font-medium text-slate-300 mb-4 text-center">Siga-nos nas redes sociais</h3>
                      <div className="flex items-center justify-center gap-4">
                        {/* Instagram */}
                        {schoolConfig?.config?.instagram && (
                          <a
                            href={schoolConfig.config.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-10 h-10 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-white hover:scale-110 transition-transform duration-200"
                            title="Instagram"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                            </svg>
                          </a>
                        )}

                        {/* Facebook */}
                        {schoolConfig?.config?.facebook && (
                          <a
                            href={schoolConfig.config.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white hover:scale-110 transition-transform duration-200"
                            title="Facebook"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                          </a>
                        )}

                        {/* WhatsApp */}
                        {schoolConfig?.config?.whatsapp && (
                          <a
                            href={`https://wa.me/${schoolConfig.config.whatsapp}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center text-white hover:scale-110 transition-transform duration-200"
                            title="WhatsApp"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.488"/>
                            </svg>
                          </a>
                        )}

                        {/* YouTube */}
                        {schoolConfig?.config?.youtube && (
                          <a
                            href={schoolConfig.config.youtube}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center text-white hover:scale-110 transition-transform duration-200"
                            title="YouTube"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                            </svg>
                          </a>
                        )}

                        {/* TikTok */}
                        {schoolConfig?.config?.tiktok && (
                          <a
                            href={schoolConfig.config.tiktok}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-10 h-10 rounded-lg bg-black flex items-center justify-center text-white hover:scale-110 transition-transform duration-200"
                            title="TikTok"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Lado Direito - Formulário de Login */}
          <div className="order-1 lg:order-2">
            <div className="mx-auto max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-8">
              {/* Header */}
              <div className="text-center mb-8">
                {/* Logo or School Name */}
                <div className="mb-4">
                  {(() => {
                    // Check for theme-specific logos first
                    const lightLogo = schoolConfig?.config?.logoLightUrl;
                    const darkLogo = schoolConfig?.config?.logoDarkUrl;
                    const generalLogo = schoolConfig?.config?.logoUrl;
                    
                    // If we have theme-specific logos, use them
                    if (lightLogo || darkLogo) {
                      return (
                        <div className="mb-2">
                          {/* Light theme logo */}
                          {lightLogo && (
                            <img 
                              src={lightLogo} 
                              alt="Logo da Escola"
                              className="h-16 w-auto mx-auto object-contain dark:hidden"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                          {/* Dark theme logo */}
                          {darkLogo && (
                            <img 
                              src={darkLogo} 
                              alt="Logo da Escola"
                              className="h-16 w-auto mx-auto object-contain hidden dark:block"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                          {/* Fallback if only one theme logo exists */}
                          {!lightLogo && darkLogo && (
                            <img 
                              src={darkLogo} 
                              alt="Logo da Escola"
                              className="h-16 w-auto mx-auto object-contain dark:hidden"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                          {!darkLogo && lightLogo && (
                            <img 
                              src={lightLogo} 
                              alt="Logo da Escola"
                              className="h-16 w-auto mx-auto object-contain hidden dark:block"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                        </div>
                      );
                    }
                    
                    // If we have a general logo (not default), use it
                    if (generalLogo && generalLogo !== 'default') {
                      return (
                        <div className="mb-2">
                          <img 
                            src={generalLogo} 
                            alt="Logo da Escola"
                            className="h-16 w-auto mx-auto object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      );
                    }
                    
                    // Default: Show school name in highlighted style
                    return (
                      <h1 className="text-2xl font-bold text-red-600 dark:text-red-500 border-2 border-red-600 dark:border-red-500 px-4 py-2 inline-block rounded">
                        {schoolConfig?.config?.schoolName?.toUpperCase() || "SENSEI SYSTEM"}
                      </h1>
                    );
                  })()}
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  {schoolConfig?.config?.welcomeMessage || "Seja bem-vindo"}
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
                      placeholder="Digite seu E-mail"
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
                      onClick={() => setLocation("/auth/forgot-password")}
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