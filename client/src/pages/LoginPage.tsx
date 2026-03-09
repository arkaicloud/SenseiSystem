import { useState } from 'react';
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";
import AppLoadingScreen from "@/components/loading/AppLoadingScreen";
import bgImage from "@assets/karate-fighters-tatami-fighting-championship_1773070189913.jpg";

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
  const logoUrl = schoolConfig?.config?.logoDarkUrl || schoolConfig?.config?.logoLightUrl || schoolConfig?.config?.logoUrl;

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
    <div className="fixed inset-0 w-full h-full overflow-hidden font-['Inter',sans-serif]">
      {/* Full-screen background image */}
      <img
        src={bgImage}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />

      {/* Content layer */}
      <div className="relative z-10 flex flex-col h-full w-full">

        {/* ── Top: Logo / School Name ── */}
        <div className="px-7 pt-14 pb-4 flex-shrink-0">
          {logoUrl && logoUrl !== 'default' ? (
            <img
              src={logoUrl}
              alt={schoolName}
              className="h-12 w-auto object-contain drop-shadow-lg"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          ) : (
            <h2 className="text-2xl font-black text-white tracking-tight drop-shadow-lg">
              {schoolName}
            </h2>
          )}
        </div>

        {/* ── Middle: Headline ── */}
        <div className="flex-1 flex flex-col justify-end px-7 pb-8">
          <h1 className="text-[2rem] leading-[1.15] font-black text-white drop-shadow-lg mb-2">
            Sua jornada<br />
            começa aqui.
          </h1>
          <p className="text-white/70 text-base font-medium">
            {welcomeMsg}
          </p>
        </div>

        {/* ── Bottom: Form ── */}
        <div className="flex-shrink-0 px-7 pb-10">
          <form onSubmit={handleLogin} className="space-y-3">
            {error && (
              <div className="bg-red-500/20 border border-red-400/30 rounded-2xl px-4 py-3 backdrop-blur-sm">
                <p className="text-red-200 text-sm text-center">{error}</p>
              </div>
            )}

            {/* Email input – glass pill */}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50 pointer-events-none" />
              <input
                type="email"
                autoComplete="email"
                value={loginData.username}
                onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                placeholder="Seu e-mail"
                className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-white placeholder:text-white/50 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#2B54FF]/60 focus:border-transparent transition-all"
              />
            </div>

            {/* Password input – glass pill */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                placeholder="Sua senha"
                className="w-full h-14 pl-12 pr-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-white placeholder:text-white/50 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#2B54FF]/60 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
                aria-label="Mostrar/ocultar senha"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Forgot password */}
            <div className="text-right pr-1">
              <button
                type="button"
                onClick={() => setLocation("/auth/forgot-password")}
                className="text-[13px] text-[#2B54FF] font-semibold hover:underline"
              >
                Esqueceu sua senha?
              </button>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full h-14 rounded-2xl bg-[#2B54FF] hover:bg-[#1E3FCC] active:scale-[0.97] text-white font-bold text-base shadow-lg shadow-[#2B54FF]/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Entrando...
                </>
              ) : "Entrar"}
            </button>
          </form>

          {/* Register link */}
          <div className="mt-5 text-center">
            <p className="text-white/50 text-[13px] mb-2">Novo por aqui?</p>
            <button
              type="button"
              onClick={() => setLocation("/onboarding")}
              className="text-[#2B54FF] font-bold text-sm hover:underline"
            >
              Matricule-se agora
            </button>
          </div>

          {/* Footer */}
          <p className="text-center text-white/30 text-[11px] mt-6">
            SenseiSystem · Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
