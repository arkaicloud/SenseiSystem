import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, CheckCircle2, Clock, User, MapPin, Eye, EyeOff, Mail, Lock, QrCode, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

interface CheckinClass {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  duration: number;
  instructorName: string;
  location: string | null;
  alreadyCheckedIn: boolean;
}

interface CheckinResponse {
  classes: CheckinClass[];
  currentTime: string;
}

function InlineLoginForm({ onSuccess }: { onSuccess: () => void }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Preencha todos os campos"); return; }
    setIsPending(true);
    try {
      await login(email, password);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Email ou senha incorretos");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm mx-auto">
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      <div className="relative">
        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Seu e-mail"
          data-testid="input-checkin-email"
          className="w-full h-12 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
        />
      </div>
      <div className="relative">
        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Sua senha"
          data-testid="input-checkin-password"
          className="w-full h-12 pl-10 pr-12 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      <button
        type="submit"
        disabled={isPending}
        data-testid="button-checkin-login"
        className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-semibold text-sm shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Entrando...</> : "Entrar"}
      </button>
    </form>
  );
}

function ClassCard({ cls, onCheckin, isPending }: {
  cls: CheckinClass;
  onCheckin: (id: number) => void;
  isPending: boolean;
}) {
  if (cls.alreadyCheckedIn) {
    return (
      <div
        data-testid={`card-class-checkedin-${cls.id}`}
        className="rounded-2xl border border-green-200 bg-green-50 p-5 flex items-center justify-between gap-4"
      >
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-green-800 text-base leading-tight">{cls.name}</p>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="flex items-center gap-1.5 text-sm text-green-700">
              <Clock className="w-3.5 h-3.5" />
              {cls.startTime} – {cls.endTime}
            </span>
            <span className="flex items-center gap-1.5 text-sm text-green-700">
              <User className="w-3.5 h-3.5" />
              {cls.instructorName}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
          <span className="text-xs text-green-600 font-medium">Confirmado</span>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid={`card-class-${cls.id}`}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between gap-4"
    >
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-800 text-base leading-tight">{cls.name}</p>
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          <span className="flex items-center gap-1.5 text-sm text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            {cls.startTime} – {cls.endTime}
          </span>
          <span className="flex items-center gap-1.5 text-sm text-slate-500">
            <User className="w-3.5 h-3.5" />
            {cls.instructorName}
          </span>
          {cls.location && (
            <span className="flex items-center gap-1.5 text-sm text-slate-500">
              <MapPin className="w-3.5 h-3.5" />
              {cls.location}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={() => onCheckin(cls.id)}
        disabled={isPending}
        data-testid={`button-checkin-class-${cls.id}`}
        className="flex-shrink-0 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.97] text-white text-sm font-semibold shadow-md shadow-indigo-200 transition-all disabled:opacity-60 flex items-center gap-2"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Check-in"}
      </button>
    </div>
  );
}

function SuccessScreen({ className, checkInTime, onDone }: { className: string; checkInTime: Date | null; onDone: () => void }) {
  const timeLabel = checkInTime
    ? new Date(checkInTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
      <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
        <CheckCircle2 className="w-14 h-14 text-green-500" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Check-in realizado!</h2>
        <p className="text-slate-500 mt-1">
          Sua presença em <span className="font-semibold text-slate-700">{className}</span> foi registrada.
        </p>
        {timeLabel && (
          <p className="text-slate-400 text-sm mt-1 flex items-center justify-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Registrado às {timeLabel}
          </p>
        )}
      </div>
      <button
        onClick={onDone}
        data-testid="button-checkin-done"
        className="mt-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors"
      >
        Feito
      </button>
    </div>
  );
}

export default function CheckinPage() {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [successState, setSuccessState] = useState<{ className: string; checkInTime: Date | null } | null>(null);
  const [pendingClassId, setPendingClassId] = useState<number | null>(null);

  const {
    data,
    isLoading: classesLoading,
    refetch,
    error: classesError,
  } = useQuery<CheckinResponse>({
    queryKey: ["/api/checkin/classes"],
    enabled: !!user && user.role === "student",
    staleTime: 0,
    refetchInterval: 60_000,
  });

  const checkinMutation = useMutation({
    mutationFn: async (classId: number) => {
      const res = await fetch(`/api/checkin/${classId}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao realizar check-in");
      return json;
    },
    onSuccess: (data) => {
      setSuccessState({ className: data.className, checkInTime: data.checkInTime ?? null });
      queryClient.invalidateQueries({ queryKey: ["/api/checkin/classes"] });
    },
  });

  const handleCheckin = (classId: number) => {
    setPendingClassId(classId);
    checkinMutation.mutate(classId, {
      onSettled: () => setPendingClassId(null),
    });
  };

  const handleLoginSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    window.location.reload();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
          <QrCode className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-slate-800 text-lg leading-tight">Check-in por QR Code</h1>
          <p className="text-xs text-slate-500">Confirme sua presença</p>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">

        {/* Not logged in → inline login */}
        {!user && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-slate-800">Entre na sua conta</h2>
              <p className="text-slate-500 text-sm mt-1">Faça login para confirmar sua presença na aula</p>
            </div>
            <InlineLoginForm onSuccess={handleLoginSuccess} />
          </div>
        )}

        {/* Admin/instructor → info */}
        {user && user.role !== "student" && (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800">Acesso reservado a alunos</h2>
            <p className="text-slate-500 text-sm max-w-xs">
              O check-in por QR code é exclusivo para alunos. Para gerar ou imprimir o QR code, acesse o painel administrativo.
            </p>
          </div>
        )}

        {/* Student — success state */}
        {user && user.role === "student" && successState && (
          <SuccessScreen
            className={successState.className}
            checkInTime={successState.checkInTime}
            onDone={() => { setSuccessState(null); refetch(); }}
          />
        )}

        {/* Student — class list */}
        {user && user.role === "student" && !successState && (
          <div className="space-y-4">
            {/* Current time */}
            {data?.currentTime && (
              <p className="text-sm text-slate-500 text-center">
                Horário atual: <span className="font-semibold text-slate-700">{data.currentTime}</span>
              </p>
            )}

            {classesLoading && (
              <div className="flex flex-col items-center gap-3 py-12">
                <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
                <p className="text-sm text-slate-500">Buscando aulas disponíveis...</p>
              </div>
            )}

            {classesError && (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <AlertCircle className="w-8 h-8 text-red-400" />
                <p className="text-slate-600 font-medium">Erro ao carregar aulas</p>
                <button
                  onClick={() => refetch()}
                  data-testid="button-checkin-retry"
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors"
                >
                  Tentar novamente
                </button>
              </div>
            )}

            {!classesLoading && !classesError && data && data.classes.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <Clock className="w-8 h-8 text-slate-400" />
                </div>
                <h2 className="text-lg font-semibold text-slate-700">Nenhuma aula em andamento</h2>
                <p className="text-slate-500 text-sm max-w-xs">
                  No momento não há aulas disponíveis para check-in. Volte quando sua aula estiver prestes a começar.
                </p>
              </div>
            )}

            {!classesLoading && !classesError && data && data.classes.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Aulas disponíveis agora</h2>
                {checkinMutation.isError && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-600">{(checkinMutation.error as Error)?.message}</p>
                  </div>
                )}
                {data.classes.map((cls) => (
                  <ClassCard
                    key={cls.id}
                    cls={cls}
                    onCheckin={handleCheckin}
                    isPending={checkinMutation.isPending && pendingClassId === cls.id}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
