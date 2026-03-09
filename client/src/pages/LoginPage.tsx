import { useState } from 'react';
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Eye, EyeOff, Loader2, Mail, Lock, Award, Clock, Users } from "lucide-react";
import AppLoadingScreen from "@/components/loading/AppLoadingScreen";
import bgImage from "@assets/karate-fighters-tatami-fighting-championship_1773070189913.jpg";

interface SchoolConfig {
  config: {
    schoolName?: string;
    welcomeMessage?: string;
    logoUrl?: string;
    logoLightUrl?: string;
    logoDarkUrl?: string;
    address?: string;
    phone?: string;
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

  /* ─── shared form JSX ─────────────────────────────────── */
  const FormContent = (
    <form onSubmit={handleLogin} className="space-y-3 w-full">
      {error && (
        <div className="bg-red-500/20 border border-red-400/30 rounded-2xl px-4 py-3 backdrop-blur-sm">
          <p className="text-red-300 text-sm text-center">{error}</p>
        </div>
      )}

      {/* Email */}
      <div className="relative">
        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50 pointer-events-none" />
        <input
          type="email"
          autoComplete="email"
          value={loginData.username}
          onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
          placeholder="Seu e-mail"
          className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-white placeholder:text-white/50 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#2B54FF]/70 focus:border-transparent transition-all"
        />
      </div>

      {/* Password */}
      <div className="relative">
        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50 pointer-events-none" />
        <input
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          value={loginData.password}
          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
          placeholder="Sua senha"
          className="w-full h-14 pl-12 pr-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-white placeholder:text-white/50 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#2B54FF]/70 focus:border-transparent transition-all"
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
      <div className="text-right">
        <button
          type="button"
          onClick={() => setLocation("/auth/forgot-password")}
          className="text-[13px] text-[#2B54FF] font-semibold hover:underline"
        >
          Esqueceu sua senha?
        </button>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loginMutation.isPending}
        className="w-full h-14 rounded-2xl bg-[#2B54FF] hover:bg-[#1E3FCC] active:scale-[0.97] text-white font-bold text-base shadow-lg shadow-[#2B54FF]/40 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
      >
        {loginMutation.isPending ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Entrando...</>
        ) : "Entrar"}
      </button>

      {/* Register */}
      <div className="pt-1 text-center">
        <span className="text-white/50 text-[13px]">Novo por aqui? </span>
        <button
          type="button"
          onClick={() => setLocation("/onboarding")}
          className="text-[13px] text-white font-bold hover:text-[#2B54FF] transition-colors"
        >
          Matricule-se agora
        </button>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen w-full font-['Inter',sans-serif]">

      {/* ════════════════════════════════════
          MOBILE  (< lg): fullscreen hero
          ════════════════════════════════════ */}
      <div className="lg:hidden fixed inset-0 overflow-hidden">
        <img src={bgImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/85" />

        <div className="relative z-10 flex flex-col h-full">
          {/* Top: school name / logo */}
          <div className="px-7 pt-14 pb-4 flex-shrink-0">
            {logoUrl && logoUrl !== 'default' ? (
              <img src={logoUrl} alt={schoolName} className="h-11 w-auto object-contain drop-shadow-lg"
                onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            ) : (
              <p className="text-2xl font-black text-white tracking-tight drop-shadow-lg">{schoolName}</p>
            )}
          </div>

          {/* Middle: headline */}
          <div className="flex-1 flex flex-col justify-end px-7 pb-8">
            <h1 className="text-[2rem] leading-[1.15] font-black text-white drop-shadow-lg mb-2">
              Sua jornada<br />começa aqui.
            </h1>
            <p className="text-white/65 text-base font-medium">{welcomeMsg}</p>
          </div>

          {/* Bottom: form */}
          <div className="flex-shrink-0 px-7 pb-10">
            {FormContent}
            <p className="text-center text-white/25 text-[11px] mt-6">
              SenseiSystem · Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════
          DESKTOP  (≥ lg): two-column layout
          ════════════════════════════════════ */}
      <div className="hidden lg:flex min-h-screen">

        {/* Left panel – hero image (60%) */}
        <div className="relative w-[60%] flex-shrink-0">
          <img src={bgImage} alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-black/20" />

          <div className="relative z-10 flex flex-col h-full px-14 py-12 justify-between">
            {/* Logo */}
            <div>
              {logoUrl && logoUrl !== 'default' ? (
                <img src={logoUrl} alt={schoolName} className="h-12 w-auto object-contain drop-shadow-lg"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              ) : (
                <p className="text-2xl font-black text-white tracking-tight">{schoolName}</p>
              )}
            </div>

            {/* Headline + features */}
            <div className="max-w-lg">
              <h1 className="text-5xl font-black text-white leading-[1.1] mb-4 drop-shadow-lg">
                Sua jornada<br />começa aqui.
              </h1>
              <p className="text-white/70 text-lg mb-10">{welcomeMsg}</p>

              <div className="space-y-4">
                {[
                  { icon: Award, label: "Controle de graduações e faixas" },
                  { icon: Clock, label: "Presença registrada em tempo real" },
                  { icon: Users, label: "Gestão completa de turmas e alunos" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#2B54FF]/90 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-white/85 text-[15px] font-medium">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <p className="text-white/30 text-xs">SenseiSystem · Todos os direitos reservados.</p>
          </div>
        </div>

        {/* Right panel – form (40%) */}
        <div className="relative flex-1 flex items-center justify-center">
          {/* Right side background = blur of the same image for continuity */}
          <img src={bgImage} alt="" className="absolute inset-0 w-full h-full object-cover object-right" />
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          <div className="relative z-10 w-full max-w-sm px-8">
            {/* Form header */}
            <div className="mb-8">
              <h2 className="text-2xl font-black text-white mb-1">Bem-vindo de volta</h2>
              <p className="text-white/55 text-sm">{welcomeMsg}</p>
            </div>

            {FormContent}
          </div>
        </div>
      </div>
    </div>
  );
}
