import { useGuardian, ManagedStudent } from "@/contexts/guardian-context";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { ChevronDown, Users, ArrowLeftRight } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const BELT_COLORS: Record<string, string> = {
  white: "#FFFFFF", blue: "#2563EB", purple: "#7C3AED",
  brown: "#92400E", black: "#111827", coral: "#E85D4A",
  red_white: "#DC2626", red: "#DC2626",
  grey_white: "#D1D5DB", grey: "#6B7280", grey_black: "#374151",
  yellow_white: "#FEF3C7", yellow: "#D97706", yellow_black: "#92400E",
  orange_white: "#FED7AA", orange: "#EA580C", orange_black: "#7C2D12",
  green_white: "#D1FAE5", green: "#16A34A", green_black: "#14532D",
};

function MiniAvatar({ student, size = 32 }: { student: ManagedStudent; size?: number }) {
  const initials = `${student.firstName[0]}${student.lastName[0]}`.toUpperCase();
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
      style={{ width: size, height: size, backgroundColor: student.avatarColor || "#2B54FF", fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  );
}

export function StudentSwitcher() {
  const { user } = useAuth();
  const { managedStudents, activeStudent, setActiveStudent, isGuardianMode } = useGuardian();
  const [, setLocation] = useLocation();

  if (!isGuardianMode || managedStudents.length === 0) return null;

  const displayStudent = activeStudent;
  const ownName = user ? `${user.firstName}` : "Eu";

  function handleSwitch(s: ManagedStudent) {
    setActiveStudent(s);
    setLocation("/dashboard");
  }

  function handleSwitchToSelf() {
    setActiveStudent(null);
    setLocation("/dashboard");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          data-testid="button-student-switcher"
          className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium transition-colors hover:bg-[#EEF1FF] focus:outline-none"
          style={{ border: "1px solid #E0E5FF" }}
        >
          {displayStudent ? (
            <>
              <MiniAvatar student={displayStudent} size={24} />
              <span className="max-w-[100px] truncate text-foreground">
                {displayStudent.firstName}
              </span>
            </>
          ) : (
            <>
              <ArrowLeftRight className="w-4 h-4 text-primary" />
              <span className="text-secondary-foreground">Meu perfil</span>
            </>
          )}
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-52">
        <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
          <Users className="w-3 h-3" />
          Gerenciar como
        </div>
        <DropdownMenuSeparator />

        {/* Own profile (only for students who also have dependents) */}
        {user?.role === "student" && (
          <DropdownMenuItem
            data-testid="switcher-option-self"
            onClick={handleSwitchToSelf}
            className={`flex items-center gap-3 ${!displayStudent ? "bg-[#F0F3FF]" : ""}`}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ backgroundColor: "#2B54FF" }}
            >
              {user.firstName[0]}{user.lastName?.[0] ?? ""}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{ownName} (eu)</p>
              <p className="text-xs text-muted-foreground">Meu próprio perfil</p>
            </div>
            {!displayStudent && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
          </DropdownMenuItem>
        )}

        {managedStudents.map((s) => (
          <DropdownMenuItem
            key={s.studentId}
            data-testid={`switcher-option-${s.studentId}`}
            onClick={() => handleSwitch(s)}
            className={`flex items-center gap-3 ${displayStudent?.studentId === s.studentId ? "bg-[#F0F3FF]" : ""}`}
          >
            <MiniAvatar student={s} size={28} />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{s.firstName} {s.lastName}</p>
              <div className="flex items-center gap-1">
                <div
                  className="w-3 h-3 rounded-sm border border-border flex-shrink-0"
                  style={{ backgroundColor: BELT_COLORS[s.beltLevel] ?? "#fff" }}
                />
                <span className="text-xs text-muted-foreground truncate">{s.beltLevel}</span>
              </div>
            </div>
            {displayStudent?.studentId === s.studentId && (
              <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
            )}
          </DropdownMenuItem>
        ))}

        {managedStudents.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              data-testid="switcher-manage-all"
              onClick={() => setLocation("/guardian/select")}
              className="text-primary text-sm"
            >
              <Users className="w-4 h-4 mr-2" />
              Ver todos os alunos
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
