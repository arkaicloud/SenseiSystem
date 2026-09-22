import { useState, useEffect } from "react";
import { useGuardian, ManagedStudent } from "@/contexts/guardian-context";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { X, Check, ArrowLeftRight, UserRound } from "lucide-react";

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

function Avatar({ student, size = 36 }: { student: ManagedStudent; size?: number }) {
  const initials = `${student.firstName[0]}${student.lastName[0]}`.toUpperCase();
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: student.avatarColor || "#2B54FF",
        fontSize: size * 0.36,
      }}
    >
      {initials}
    </div>
  );
}

export function GuardianMobileSwitcher() {
  const { managedStudents, activeStudent, setActiveStudent, isGuardianMode } = useGuardian();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!isGuardianMode || managedStudents.length === 0) return null;

  function handleSwitch(s: ManagedStudent) {
    setActiveStudent(s);
    setOpen(false);
    setLocation("/dashboard");
  }

  function handleSwitchToSelf() {
    setActiveStudent(null);
    setOpen(false);
    setLocation("/dashboard");
  }

  const ownInitials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase();
  const canUseOwnProfile = user?.role === "student";

  return (
    <>
      {/* Trigger button — floating top-right avatar pill */}
      <button
        type="button"
        data-testid="button-guardian-switcher-mobile"
        onClick={() => setOpen(true)}
        className="relative w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        style={{
          background: "rgba(255,255,255,0.18)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          border: "1.5px solid rgba(255,255,255,0.35)",
        }}
        aria-label="Trocar perfil de aluno"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {activeStudent ? (
          <Avatar student={activeStudent} size={38} />
        ) : (
          <div className="w-[38px] h-[38px] rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white">
            {ownInitials || <UserRound className="w-4 h-4" />}
          </div>
        )}
        <span className="absolute -right-0.5 -bottom-0.5 w-5 h-5 rounded-full bg-card flex items-center justify-center shadow-sm border border-border">
          <ArrowLeftRight className="w-3 h-3 text-primary" strokeWidth={2.5} />
        </span>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          style={{ zIndex: 200, animation: "fadeIn 0.15s ease" }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Bottom sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Trocar perfil de aluno"
        className="fixed bottom-0 left-0 right-0 rounded-t-3xl bg-card"
        style={{
          zIndex: 201,
          transform: open ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 90px)",
          boxShadow: "0 -4px 32px rgba(0,0,0,0.14)",
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-3 pb-4">
          <div>
            <h2 className="text-base font-bold text-foreground font-inter">Trocar perfil</h2>
            <p className="text-xs text-muted-foreground mt-0.5 font-inter">
              Selecione quem vai visualizar e confirmar as aulas
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
            aria-label="Fechar"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Student list */}
        <div className="px-4 space-y-2 max-h-72 overflow-y-auto pb-2">
          {canUseOwnProfile && (
            <button
              type="button"
              data-testid="guardian-switch-self-mobile"
              onClick={handleSwitchToSelf}
              className="w-full flex items-center gap-3 rounded-2xl p-4 transition-all active:scale-[0.98] text-left"
              style={{
                background: !activeStudent ? "#EEF1FF" : "#F8F9FF",
                border: !activeStudent ? "1.5px solid #2B54FF" : "1.5px solid #EAEDF5",
              }}
            >
              <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                {ownInitials || <UserRound className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm font-inter truncate ${!activeStudent ? "text-primary" : "text-[#1A1A2E]"}`}>
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-muted-foreground font-inter mt-1">Meu perfil</p>
              </div>
              {!activeStudent && (
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                </div>
              )}
            </button>
          )}

          {managedStudents.map((s) => {
            const isActive = activeStudent?.studentId === s.studentId;
            const beltColor = BELT_COLORS[s.beltLevel] ?? "#fff";
            const beltName = BELT_NAMES[s.beltLevel] ?? s.beltLevel;
            const isLightBelt = ["white", "grey_white", "yellow_white", "orange_white"].includes(s.beltLevel);

            return (
              <button
                type="button"
                key={s.studentId}
                data-testid={`guardian-switch-${s.studentId}`}
                onClick={() => handleSwitch(s)}
                className="w-full flex items-center gap-3 rounded-2xl p-4 transition-all active:scale-[0.98] text-left"
                style={{
                  background: isActive ? "#EEF1FF" : "#F8F9FF",
                  border: isActive ? "1.5px solid #2B54FF" : "1.5px solid #EAEDF5",
                }}
              >
                <Avatar student={s} size={44} />

                <div className="flex-1 min-w-0">
                  <p
                    className="font-semibold text-sm font-inter truncate"
                    style={{ color: isActive ? "#2B54FF" : "#1A1A2E" }}
                  >
                    {s.firstName} {s.lastName}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div
                      className="w-3.5 h-3.5 rounded-[3px] flex-shrink-0"
                      style={{
                        backgroundColor: beltColor,
                        border: isLightBelt ? "1px solid #D0D5E8" : "none",
                      }}
                    />
                    <span className="text-xs text-muted-foreground font-inter">
                      Faixa {beltName}
                      {s.stripes > 0 && ` · ${s.stripes} ${s.stripes === 1 ? "grau" : "graus"}`}
                    </span>
                  </div>
                </div>

                {isActive && (
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "#2B54FF" }}
                  >
                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
