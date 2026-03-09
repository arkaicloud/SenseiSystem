import { useState } from 'react';
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Eye, EyeOff, Loader2, Mail, Lock, Shield, Clock, Users } from "lucide-react";
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
  instagram?: string | null;
  facebook?: string | null;
  whatsapp?: string | null;
  youtube?: string | null;
  tiktok?: string | null;
}

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordDesktop, setShowPasswordDesktop] = useState(false);
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

  /* ─── Social media icons ─────────────────────────────── */
  const SocialIcons = ({ className = "" }: { className?: string }) => {
    const hasSocial = publicInfo?.instagram || publicInfo?.facebook || publicInfo?.whatsapp || publicInfo?.youtube || publicInfo?.tiktok;
    if (!hasSocial) return null;
    const formatWhatsapp = (num: string) => {
      const n = num.replace(/\D/g, '');
      return n.startsWith('55') ? n : `55${n}`;
    };
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {publicInfo?.instagram && (
          <a href={publicInfo.instagram} target="_blank" rel="noopener noreferrer"
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/15 transition-all" title="Instagram">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
          </a>
        )}
        {publicInfo?.facebook && (
          <a href={publicInfo.facebook} target="_blank" rel="noopener noreferrer"
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/15 transition-all" title="Facebook">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </a>
        )}
        {publicInfo?.whatsapp && (
          <a href={`https://wa.me/${formatWhatsapp(publicInfo.whatsapp)}`} target="_blank" rel="noopener noreferrer"
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/15 transition-all" title="WhatsApp">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.488"/></svg>
          </a>
        )}
        {publicInfo?.youtube && (
          <a href={publicInfo.youtube} target="_blank" rel="noopener noreferrer"
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/15 transition-all" title="YouTube">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
          </a>
        )}
        {publicInfo?.tiktok && (
          <a href={publicInfo.tiktok} target="_blank" rel="noopener noreferrer"
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/15 transition-all" title="TikTok">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
          </a>
        )}
      </div>
    );
  };

  /* ─── Mobile form (glass inputs + icons) ─────────────── */
  const MobileForm = (
    <form onSubmit={handleLogin} className="space-y-3 w-full">
      {error && (
        <div className="bg-red-500/20 border border-red-400/30 rounded-2xl px-4 py-3">
          <p className="text-red-300 text-sm text-center">{error}</p>
        </div>
      )}
      <div className="relative">
        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50 pointer-events-none" />
        <input type="email" autoComplete="email" value={loginData.username}
          onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
          placeholder="Seu e-mail"
          className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-white placeholder:text-white/50 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#2B54FF]/70 focus:border-transparent transition-all" />
      </div>
      <div className="relative">
        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50 pointer-events-none" />
        <input type={showPassword ? "text" : "password"} autoComplete="current-password" value={loginData.password}
          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
          placeholder="Sua senha"
          className="w-full h-14 pl-12 pr-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-white placeholder:text-white/50 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#2B54FF]/70 focus:border-transparent transition-all" />
        <button type="button" onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors">
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
      <div className="text-right">
        <button type="button" onClick={() => setLocation("/auth/forgot-password")}
          className="text-[13px] text-[#2B54FF] font-semibold hover:underline">
          Esqueceu sua senha?
        </button>
      </div>
      <button type="submit" disabled={loginMutation.isPending}
        className="w-full h-14 rounded-2xl bg-[#2B54FF] hover:bg-[#1E3FCC] active:scale-[0.97] text-white font-bold text-base shadow-lg shadow-[#2B54FF]/40 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
        {loginMutation.isPending ? <><Loader2 className="w-5 h-5 animate-spin" /> Entrando...</> : "Entrar"}
      </button>
      <div className="pt-1 text-center">
        <span className="text-white/50 text-[13px]">Novo por aqui? </span>
        <button type="button" onClick={() => setLocation("/onboarding")}
          className="text-[13px] text-white font-bold hover:text-[#2B54FF] transition-colors">
          Matricule-se agora
        </button>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen w-full font-['Inter',sans-serif]">

      {/* ══════════════════════════════════════════════
          MOBILE  (< lg) — estilo VYTA
          ══════════════════════════════════════════════ */}
      <div className="lg:hidden fixed inset-0 overflow-hidden">
        <img src={bgImage} alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
        {/* overlay: topo levemente escuro → base bem escura para legibilidade do form */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.15) 35%, rgba(0,0,0,0.75) 65%, rgba(0,0,0,0.92) 100%)" }} />

        <div className="relative z-10 flex flex-col h-full">

          {/* ── TOPO: nome da escola (estilo "VYTA") ── */}
          <div className="flex-shrink-0 px-6 pt-12">
            {logoUrl && logoUrl !== 'default' ? (
              <img src={logoUrl} alt={schoolName} className="h-10 w-auto object-contain drop-shadow-lg"
                onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            ) : (
              <p className="text-[1.75rem] font-black text-white tracking-tight leading-none drop-shadow-lg">{schoolName}</p>
            )}
          </div>

          {/* ── MEIO: espaço flexível (imagem aparece) ── */}
          <div className="flex-1" />

          {/* ── BASE: headline + form + footer ── */}
          <div className="flex-shrink-0 px-6 pb-8">
            <h1 className="text-[2.1rem] leading-[1.15] font-black text-white drop-shadow-md mb-1">
              Sua jornada<br />começa aqui.
            </h1>
            <p className="text-white/55 text-sm mb-6">{welcomeMsg}</p>

            {MobileForm}

            <SocialIcons className="mt-5 justify-center" />
            <p className="text-center text-white/25 text-[11px] mt-3">
              SenseiSystem · Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          DESKTOP  (≥ lg) — design system layout
          ══════════════════════════════════════════════ */}
      <div className="hidden lg:flex h-screen w-screen overflow-hidden">

        {/* ── Left: hero image panel (55%) ── */}
        <div className="relative w-[55%] flex-shrink-0 h-full">
          <img src={bgImage} alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
          {/* overlay: darker on left for text, fades right */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(10,12,20,0.88) 0%, rgba(10,12,20,0.65) 50%, rgba(10,12,20,0.30) 100%)" }} />

          <div className="relative z-10 flex flex-col h-full px-14 py-12 justify-between">
            {/* School name / logo — small, blue, uppercase */}
            <div>
              {logoUrl && logoUrl !== 'default' ? (
                <img src={logoUrl} alt={schoolName} className="h-10 w-auto object-contain drop-shadow-lg"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              ) : (
                <p className="text-sm font-semibold tracking-widest uppercase text-[#2B54FF]">{schoolName}</p>
              )}
            </div>

            {/* Headline + subtitle + features */}
            <div className="max-w-md">
              <h1 className="text-5xl font-extrabold text-white leading-[1.1] mb-3">
                Sua jornada<br />começa aqui.
              </h1>
              <p className="text-lg text-white/60 mb-10">{welcomeMsg}</p>

              <div className="space-y-5">
                {[
                  { icon: Shield, label: "Controle de graduações e faixas" },
                  { icon: Clock, label: "Presença registrada em tempo real" },
                  { icon: Users, label: "Gestão completa de turmas e alunos" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: "rgba(43,84,255,0.18)" }}>
                      <Icon className="h-5 w-5" style={{ color: "#2B54FF" }} />
                    </div>
                    <span className="text-sm text-white/75">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div>
              <SocialIcons className="mb-4" />
              <p className="text-xs text-white/25">SenseiSystem · Todos os direitos reservados.</p>
            </div>
          </div>
        </div>

        {/* ── Right: solid dark form panel (45%) ── */}
        <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: "#0d1117" }}>
          <div className="w-full max-w-sm px-10">

            {/* Form heading */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Bem-vindo de volta</h2>
              <p className="text-base text-white/45">{welcomeMsg}</p>
            </div>

            {error && (
              <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
                <p className="text-sm text-red-400 text-center">{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <input
                type="email"
                autoComplete="email"
                value={loginData.username}
                onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                placeholder="Seu e-mail"
                className="w-full rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-white/35 outline-none transition focus:ring-2 focus:ring-[#2B54FF]"
                style={{ backgroundColor: "#1c2030", border: "1px solid #2d3348" }}
              />

              {/* Password */}
              <div className="relative">
                <input
                  type={showPasswordDesktop ? "text" : "password"}
                  autoComplete="current-password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  placeholder="Sua senha"
                  className="w-full rounded-xl px-4 py-3.5 pr-12 text-sm text-white placeholder:text-white/35 outline-none transition focus:ring-2 focus:ring-[#2B54FF]"
                  style={{ backgroundColor: "#1c2030", border: "1px solid #2d3348" }}
                />
                <button type="button" onClick={() => setShowPasswordDesktop(!showPasswordDesktop)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
                  {showPasswordDesktop ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Forgot password */}
              <div className="text-right">
                <button type="button" onClick={() => setLocation("/auth/forgot-password")}
                  className="text-sm text-[#2B54FF] hover:underline font-medium">
                  Esqueceu sua senha?
                </button>
              </div>

              {/* Submit — gradient button */}
              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #2B54FF 0%, #4B7BFF 100%)" }}
              >
                {loginMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Entrando...</>
                ) : "Entrar"}
              </button>

              {/* Register */}
              <p className="text-center text-sm text-white/40 pt-1">
                Novo por aqui?{" "}
                <button type="button" onClick={() => setLocation("/onboarding")}
                  className="text-white font-bold hover:text-[#2B54FF] transition-colors">
                  Matricule-se agora
                </button>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
