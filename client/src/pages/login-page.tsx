import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Award, Calendar, CreditCard, Loader2, Shield, Users, BarChart3, Bell, MapPin, Phone, Mail, ExternalLink } from "lucide-react";
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

  // Fetch public school information
  const { data: publicInfoResponse } = useQuery<{
    schoolName: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    logoUrl: string | null;
  }>({
    queryKey: ["/api/school/public-info"],
  });

  // Safely extract config from response
  const schoolConfig = schoolConfigResponse?.config || null;
  const publicInfo = publicInfoResponse || null;

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(loginData.username, loginData.password);
    } catch (error) {
      // Error is already handled by the auth provider and set in the error state
      console.error('Login failed:', error);
    }
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
    // Remove all non-digits
    const numbers = phone.replace(/\D/g, '');
    // If starts with 0, assume it's a country code that needs +55 (Brazil)
    if (numbers.startsWith('0')) {
      return `55${numbers.slice(1)}`;
    }
    // If doesn't start with country code, add Brazil code
    if (!numbers.startsWith('55')) {
      return `55${numbers}`;
    }
    return numbers;
  };

  // School Info Card Component
  const SchoolInfoCard = () => {
    if (!publicInfo) return null;

    const { address, phone, email, website } = publicInfo;

    // Don't show if no contact info available
    if (!address && !phone && !email && !website) return null;

    return (
      <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-white/40 space-y-3">
        <h3 className="font-semibold text-gray-900 text-center text-sm">
          Informações da Escola
        </h3>
        
        <div className="space-y-2 text-xs">
          {address && (
            <div className="flex items-start gap-2">
              <MapPin className="h-3.5 w-3.5 text-gray-600 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700 leading-relaxed">{address}</span>
            </div>
          )}
          
          {phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
              <a 
                href={`https://wa.me/${formatPhoneForWhatsApp(phone)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 hover:text-green-700 font-medium transition-colors"
                title="Clique para abrir no WhatsApp"
              >
                {phone}
              </a>
            </div>
          )}
          
          {email && (
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
              <a 
                href={`mailto:${email}`}
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                title="Clique para enviar email"
              >
                {email}
              </a>
            </div>
          )}
          
          {website && (
            <div className="flex items-center gap-2">
              <ExternalLink className="h-3.5 w-3.5 text-purple-600 flex-shrink-0" />
              <a 
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:text-purple-700 font-medium transition-colors flex items-center gap-1"
                title={`Visite nosso ${getSocialMediaInfo(website).type}`}
              >
                <span>{getSocialMediaInfo(website).icon}</span>
                <span>Visite nosso {getSocialMediaInfo(website).type}</span>
              </a>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 font-['Inter',sans-serif] antialiased">
      <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-2 gap-0">
        {/* Left Side - Login Form */}
        <div className="flex items-center justify-center px-6 py-10 pl-[25px] pr-[25px] pt-[0px] pb-[0px]">
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
              
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-800">
                  Seja Bem Vindos ao {schoolConfig?.schoolName || "Academia"}
                </h2>
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
        <div className="relative flex items-center justify-center px-4 py-8 bg-gradient-to-br from-blue-50 to-indigo-50 lg:rounded-none rounded-t-3xl min-h-screen overflow-hidden">
          <div className="w-full max-w-lg space-y-6 relative z-10 pl-[7px] pr-[7px] pt-[0px] pb-[0px]">
            {/* Decorative Elements - Better positioned */}
            <div className="absolute -top-16 -right-16 w-32 h-32 bg-gradient-to-br from-blue-200/20 to-indigo-200/20 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-12 -left-8 w-24 h-24 bg-gradient-to-br from-purple-200/20 to-blue-200/20 rounded-full blur-xl"></div>
            <div className="absolute top-1/2 -right-8 w-16 h-16 bg-gradient-to-br from-indigo-200/30 to-purple-200/30 rounded-full blur-lg"></div>
            
            {/* Header */}
            <div className="text-center space-y-6 mb-8">
              <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 leading-tight">
                Transforme sua escola<br />
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  com tecnologia
                </span>
              </h1>
              <p className="text-gray-600 leading-relaxed text-lg lg:text-xl max-w-md mx-auto">
                A gestão moderna que seu dojo merece
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-3 mb-6">
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className="bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-sm hover:shadow-md flex items-start gap-3 transition-all duration-200 border border-white/40 hover:border-blue-200/50"
                >
                  <div className="bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 rounded-lg p-2 flex-shrink-0">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1 text-base">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* School Information Card */}
            <SchoolInfoCard />

            {/* Additional Visual Elements */}
            <div className="space-y-3 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-sm rounded-full border border-white/40 shadow-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-700 font-medium">Sistema 100% online</span>
              </div>
              
              <div className="flex justify-center items-center gap-4 mt-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">500+</div>
                  <div className="text-xs text-gray-600">Academias</div>
                </div>
                <div className="w-px h-8 bg-gray-300"></div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">50k+</div>
                  <div className="text-xs text-gray-600">Alunos</div>
                </div>
                <div className="w-px h-8 bg-gray-300"></div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">99.9%</div>
                  <div className="text-xs text-gray-600">Uptime</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}