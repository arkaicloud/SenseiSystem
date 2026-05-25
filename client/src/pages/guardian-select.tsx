import { useGuardian, ManagedStudent } from "@/contexts/guardian-context";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Users, ChevronRight, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const initials = `${student.firstName[0]}${student.lastName[0]}`.toUpperCase();
  const isLight = ["white", "grey_white", "yellow_white", "orange_white", "green_white", "yellow"].includes(student.beltLevel);

  return (
    <button
      onClick={onSelect}
      data-testid={`card-student-${student.studentId}`}
      className="w-full text-left rounded-2xl p-5 flex items-center gap-4 transition-all active:scale-[0.98]"
      style={{ backgroundColor: "#F5F7FF", border: "1.5px solid #E0E5FF" }}
    >
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 shadow"
        style={{ backgroundColor: student.avatarColor || "#2B54FF", color: "#fff" }}
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate text-base">
          {student.firstName} {student.lastName}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <div
            className="w-4 h-4 rounded-sm border border-gray-300 flex-shrink-0"
            style={{ backgroundColor: beltColor }}
          />
          <span className="text-sm text-gray-500">
            {beltName}
            {student.stripes > 0 && ` · ${student.stripes} ${student.stripes === 1 ? "grau" : "graus"}`}
          </span>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-[#2B54FF] flex-shrink-0" />
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
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F8F9FF" }}>
      {/* Header */}
      <div
        className="px-6 pt-12 pb-8 text-white"
        style={{ background: "linear-gradient(135deg, #2B54FF 0%, #1A3FCC 100%)" }}
      >
        <div className="flex justify-between items-start">
          <div>
            <p className="text-white/70 text-sm font-medium mb-1">Bem-vindo,</p>
            <h1 className="text-2xl font-bold">{user?.firstName} {user?.lastName}</h1>
          </div>
          <button
            onClick={logout}
            data-testid="button-logout-guardian"
            className="flex items-center gap-1 text-white/70 hover:text-white text-sm mt-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-white/80" />
          <p className="text-white/80 text-sm">
            {managedStudents.length === 1
              ? "1 aluno vinculado"
              : `${managedStudents.length} alunos vinculados`}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 py-6">
        <h2 className="text-base font-semibold text-gray-700 mb-4">
          Escolha qual aluno deseja gerenciar:
        </h2>

        {isLoadingDependents ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : managedStudents.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Nenhum aluno vinculado</p>
            <p className="text-gray-400 text-sm mt-1">
              Peça ao administrador para vincular alunos à sua conta.
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
    </div>
  );
}
