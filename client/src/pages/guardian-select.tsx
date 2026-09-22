import { useGuardian, ManagedStudent } from "@/contexts/guardian-context";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Users, ChevronRight, LogOut, ShieldCheck } from "lucide-react";

const BELT_COLORS: Record<string, string> = {
  white: "#FFFFFF", blue: "#2563EB", purple: "#7C3AED",
  brown: "#92400E", black: "#111827", coral: "#E85D4A",
  red_white: "#DC2626", red: "#DC2626",
  grey_white: "#D1D5DB", grey: "#6B7280", grey_black: "#374151",
  yellow_white: "#FEF3C7", yellow: "#D97706", yellow_black: "#92400E",
  orange_white: "#FED7AA", orange: "#EA580C", orange_black: "#7C2D12",
  green_white: "#D1FAE5", green: "#16A34A", green_black: "#14532D",
};

const BELT_NAMES: Record<string, string> = {
  white: "Branca", blue: "Azul", purple: "Roxa", brown: "Marrom",
  black: "Preta", coral: "Coral", red_white: "Vermelha/Branca", red: "Vermelha",
  grey_white: "Cinza/Branca", grey: "Cinza", grey_black: "Cinza/Preta",
  yellow_white: "Amarela/Branca", yellow: "Amarela", yellow_black: "Amarela/Preta",
  orange_white: "Laranja/Branca", orange: "Laranja", orange_black: "Laranja/Preta",
  green_white: "Verde/Branca", green: "Verde", green_black: "Verde/Preta",
};

function StudentCard({ student, onSelect }: { student: ManagedStudent; onSelect: () => void }) {
  const beltColor = BELT_COLORS[student.beltLevel] ?? "#FFFFFF";
  const beltName = BELT_NAMES[student.beltLevel] ?? student.beltLevel;
  const initials = `${student.firstName?.[0] ?? ""}${student.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <button
      onClick={onSelect}
      data-testid={`card-student-${student.studentId}`}
      className="w-full text-left rounded-2xl p-4 sm:p-5 flex items-center gap-4 transition-all duration-150 active:scale-[0.98] hover:shadow-md hover:border-[#2B54FF]"
      style={{ backgroundColor: "#F5F7FF", border: "1.5px solid #E0E5FF" }}
    >
      <div
        className="w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 shadow"
        style={{
          width: 52, height: 52,
          backgroundColor: student.avatarColor || "#2B54FF",
          color: "#fff",
        }}
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground truncate text-base">
          {student.firstName} {student.lastName}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <div
            className="w-4 h-4 rounded-sm border border-border flex-shrink-0"
            style={{ backgroundColor: beltColor }}
          />
          <span className="text-sm text-muted-foreground">
            {beltName}
            {student.stripes > 0 && ` · ${student.stripes} ${student.stripes === 1 ? "grau" : "graus"}`}
          </span>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-primary flex-shrink-0" />
    </button>
  );
}

export default function GuardianSelectPage() {
  const { user, logout } = useAuth();
  const { managedStudents, setActiveStudent, isLoadingDependents } = useGuardian();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!user) setLocation("/login");
  }, [user]);

  function handleSelect(student: ManagedStudent) {
    setActiveStudent(student);
    setLocation("/dashboard");
  }

  return (
    <div
      className="min-h-screen flex items-start sm:items-center justify-center font-inter"
      style={{ background: "linear-gradient(160deg, #1A2F99 0%, #2B54FF 40%, #1A3FCC 100%)" }}
    >
      {/* Card container — full screen on mobile, floating card on desktop */}
      <div
        className="w-full sm:max-w-md sm:rounded-3xl sm:shadow-2xl overflow-hidden flex flex-col"
        style={{
          minHeight: "100svh",
          // On sm+ browsers override minHeight to auto via CSS
        }}
      >
        {/* Header */}
        <div
          className="px-6 pt-14 sm:pt-10 pb-8 text-white flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #2B54FF 0%, #1A3FCC 100%)" }}
        >
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
              >
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white/70 text-xs font-medium">Portal Responsável</p>
              </div>
            </div>
            <button
              onClick={logout}
              data-testid="button-logout-guardian"
              className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm mt-1 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">Sair</span>
            </button>
          </div>

          <h1 className="text-2xl font-bold leading-tight">
            Olá, {user?.firstName}!
          </h1>
          <p className="text-white/70 text-sm mt-1">
            Selecione qual aluno deseja acompanhar
          </p>

          <div className="flex items-center gap-2 mt-4">
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
            >
              <Users className="w-3.5 h-3.5" />
              {managedStudents.length === 1
                ? "1 aluno vinculado"
                : `${managedStudents.length} alunos vinculados`}
            </div>
          </div>
        </div>

        {/* Content */}
        <div
          className="flex-1 px-5 py-6"
          style={{ backgroundColor: "#F8F9FF" }}
        >
          {isLoadingDependents ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : managedStudents.length === 0 ? (
            <div className="text-center py-16">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: "#EEF1FF" }}
              >
                <Users className="w-8 h-8 text-primary" />
              </div>
              <p className="text-secondary-foreground font-semibold text-base">Nenhum aluno vinculado</p>
              <p className="text-muted-foreground text-sm mt-1 leading-relaxed">
                Peça ao administrador para vincular<br />alunos à sua conta.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {managedStudents.map((s) => (
                <StudentCard key={s.studentId} student={s} onSelect={() => handleSelect(s)} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-5 pb-8 pt-3 text-center flex-shrink-0"
          style={{ backgroundColor: "#F8F9FF" }}
        >
          <p className="text-xs text-muted-foreground">
            Você pode trocar de aluno a qualquer momento durante a sessão
          </p>
        </div>
      </div>
    </div>
  );
}
