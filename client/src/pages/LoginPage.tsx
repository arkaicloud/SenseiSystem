import { useState } from 'react';
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import AppLoadingScreen from "@/components/loading/AppLoadingScreen";
import bannerImg from "@assets/karate-fighters_1773070189914.jpg";

interface SchoolConfig {
  config: {
    schoolName?: string;
    welcomeMessage?: string;
    logoUrl?: string;
    logoLightUrl?: string;
    logoDarkUrl?: string;
  };
}

interface PublicInfo {
  schoolName?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const { data: schoolConfig } = useQuery<SchoolConfig>({
    queryKey: ['/api/school-config'],
    retry: false,
  });

  const { data: publicInfo } = useQuery<PublicInfo>({
    queryKey: ['/api/school/public-info'],
    retry: false,
  });

  const schoolName = publicInfo?.schoolName || schoolConfig?.config?.schoolName || "SenseiSystem";
  const welcomeMsg = schoolConfig?.config?.welcomeMessage || "Acesse sua conta para continuar";

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: credentials.username, password: credentials.password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Email ou senha incorretos");
      return data;
    },
    onSuccess: () => {
      localStorage.setItem('token', 'authenticated');
      localStorage.setItem('fromLogin', 'true');
      setShowLoadingScreen(true);
      setLoadingProgress(10);
      setTimeout(() => setLoadingProgress(30), 50);
      setTimeout(() => setLoadingProgress(60), 150);
      setTimeout(() => setLoadingProgress(85), 250);
      setTimeout(() => setLoadingProgress(100), 350);
      setTimeout(() => { window.location.href = "/dashboard"; }, 450);
    },
    onError: (err: any) => {
      setShowLoadingScreen(false);
      setLoadingProgress(0);
      setError(err.message || "Email ou senha incorretos");
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!loginData.username || !loginData.password) {
      setError("Por favor, preencha todos os campos");
      return;
    }
    loginMutation.mutate(loginData);
  };

  if (showLoadingScreen) {
    return <AppLoadingScreen progress={loadingProgress} />;
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white font-['Inter',sans-serif]">

      {/* ── LEFT / TOP: Hero Banner ── */}
      <div className="relative lg:w-1/2 flex-shrink-0 min-h-[280px] lg:min-h-screen overflow-hidden">
        <img
          src={bannerImg}
          alt="Jiu-Jitsu"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80 lg:bg-gradient-to-r lg:from-black/75 lg:via-black/55 lg:to-black/40" />

        <div className="relative z-10 flex flex-col justify-between h-full p-8 lg:p-12">
          {/* Logo / Name */}
          <div className="flex items-center gap-3">
            {schoolConfig?.config?.logoDarkUrl || schoolConfig?.config?.logoLightUrl ? (
              <img
                src={schoolConfig.config.logoDarkUrl || schoolConfig.config.logoLightUrl}
                alt={schoolName}
                className="h-10 w-auto object-contain"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-[#2B54FF] flex items-center justify-center shadow-lg">
                <span className="text-white text-lg font-black">S</span>
              </div>
            )}
            <span className="text-white text-xl font-bold tracking-tight">{schoolName}</span>
          </div>

          {/* Headline (visible on mobile too) */}
          <div className="mt-auto lg:mt-0 lg:flex lg:flex-col lg:justify-center lg:flex-1 lg:pt-16">
            <h1 className="text-3xl lg:text-5xl font-black text-white leading-tight mb-4">
              Transforme sua escola<br />
              <span className="text-[#2B54FF]">com tecnologia</span>
            </h1>
            <p className="text-white/80 text-base lg:text-lg max-w-md">
              A gestão moderna que seu dojo merece
            </p>

            {/* Feature pills – desktop only */}
            <div className="hidden lg:flex flex-col gap-3 mt-10">
              {[
                "Controle de Presença em tempo real",
                "Gestão de Graduações e Faixas",
                "Turmas, Horários e Pagamentos",
              ].map((f) => (
                <div key={f} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#2B54FF] flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-white/90 text-sm font-medium">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT / BOTTOM: Login Form ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 lg:py-0 bg-white">
        <div className="w-full max-w-sm">

          {/* Form Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-black text-gray-900 mb-1">Bem-vindo de volta</h2>
            <p className="text-gray-500 text-sm">{welcomeMsg}</p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-5 rounded-xl">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700" htmlFor="email">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={loginData.username}
                onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                placeholder="Digite seu e-mail"
                className="w-full h-12 px-4 rounded-2xl border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B54FF]/30 focus:border-[#2B54FF] transition-all"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700" htmlFor="password">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  placeholder="Digite sua senha"
                  className="w-full h-12 px-4 pr-12 rounded-2xl border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B54FF]/30 focus:border-[#2B54FF] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Mostrar/ocultar senha"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div className="text-right">
              <button
                type="button"
                onClick={() => setLocation("/auth/forgot-password")}
                className="text-sm text-[#2B54FF] font-semibold hover:underline transition-all"
              >
                Esqueceu sua senha?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full h-12 rounded-2xl bg-[#2B54FF] hover:bg-[#1E3FCC] active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-[#2B54FF]/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Entrando...
                </>
              ) : "Entrar"}
            </button>

            {/* Divider */}
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-gray-400">Ainda não tem acesso?</span>
              </div>
            </div>

            {/* Register */}
            <button
              type="button"
              onClick={() => setLocation("/onboarding")}
              className="w-full h-12 rounded-2xl border-2 border-[#2B54FF] text-[#2B54FF] font-bold text-sm hover:bg-[#2B54FF]/5 active:scale-[0.98] transition-all"
            >
              Matricule-se Agora
            </button>
          </form>

          {/* Footer brand */}
          <div className="mt-10 flex items-center justify-center gap-2">
            <div className="w-5 h-5 rounded-md bg-[#2B54FF] flex items-center justify-center">
              <span className="text-white text-[10px] font-black">S</span>
            </div>
            <span className="text-xs text-gray-400 font-medium">SenseiSystem · Gestão para artes marciais</span>
          </div>
        </div>
      </div>
    </div>
  );
}
