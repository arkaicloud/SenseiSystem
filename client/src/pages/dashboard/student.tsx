import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "@/hooks/use-translations";
import { useAuth } from "@/hooks/use-auth";
import { useGuardian } from "@/contexts/guardian-context";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ChartNoAxesColumnIncreasing, ReceiptText, UserRound } from "lucide-react";
import { TodayClasses } from "@/components/student/TodayClasses";
import { NoticesBlock } from "@/components/student/NoticesBlock";
import { GuardianMobileSwitcher } from "@/components/guardian/GuardianMobileSwitcher";
import MedicalCertificateUpload from "@/components/students/MedicalCertificateUpload";
import { Link } from "wouter";
const beltImg = "/dashboard-assets/training-card.webp";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function StudentDashboard() {
  const { t } = useTranslations();
  const { user } = useAuth();
  const { isGuardianMode, activeStudent } = useGuardian();

  const isViewingManagedStudent = isGuardianMode && !!activeStudent;

  // A selected dependent uses their own student profile; otherwise an adult
  // student continues to use their independent profile.
  const profileQueryKey = isViewingManagedStudent
    ? [`/api/student/profile/${activeStudent.userId}`]
    : ["/api/student/profile"];

  const { data: profileRaw, isLoading: isStudentLoading } = useQuery({
    queryKey: profileQueryKey,
    enabled: isViewingManagedStudent ? !!activeStudent?.userId : !!user?.id,
  });

  // Normalize data: guardian gets { student: {...} }, student gets { id, beltLevel, stripes, ... }
  const studentData = isViewingManagedStudent
    ? (profileRaw as any)?.student
    : profileRaw;

  // Display name: guardian shows active student's name, student shows their own
  const displayFirstName = isViewingManagedStudent
    ? activeStudent.firstName
    : user?.firstName;

  const classesTodayKey = isViewingManagedStudent
    ? [`/api/classes/today?studentUserId=${activeStudent.userId}`]
    : ["/api/classes/today"];

  const { data: todayClasses, isLoading: isClassesLoading } = useQuery({
    queryKey: classesTodayKey,
    enabled: isViewingManagedStudent ? !!activeStudent?.userId : !!user?.id,
  });

  const { data: schoolInfo } = useQuery<{ schoolName: string }>({
    queryKey: ["/api/school/public-info"],
  });

  const { data: financialSummary } = useQuery<{
    isFinancialResponsible: boolean;
    hasOverdue: boolean;
    overdueCount: number;
  }>({
    queryKey: ["/api/student/financial"],
    enabled: !!user?.id,
  });

  if (isStudentLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/20"></div>
          <div className="h-4 w-32 bg-muted dark:bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  const getBeltColor = (beltLevel: string) => {
    const colors: Record<string, string> = {
      white: "#FFFFFF", blue: "#0066CC", purple: "#800080",
      brown: "#8B4513", black: "#000000",
    };
    return colors[beltLevel] || "#FFFFFF";
  };

  const formatBelt = (beltLevel: string, stripes: number) => {
    const beltNames: Record<string, string> = {
      white: "Branca", blue: "Azul", purple: "Roxa",
      brown: "Marrom", black: "Preta",
    };
    const stripesText = stripes > 0 ? ` (${stripes} ${stripes === 1 ? "grau" : "graus"})` : "";
    return `${beltNames[beltLevel] || beltLevel}${stripesText}`;
  };

  const beltLevel = (studentData as any)?.beltLevel || "white";
  const stripes = (studentData as any)?.stripes || 0;

  return (
    <div className="font-inter -mx-3 -mt-3 md:mx-0 md:mt-0">
      <div className="relative overflow-hidden bg-[#1726b8] px-5 pb-20 pt-6 md:rounded-2xl">
        <div className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-36 -left-20 size-72 rounded-full bg-[#0d188e]/70" />
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">
                {schoolInfo?.schoolName?.split(" ")[0] ?? "HUIOS"}
              </span>
              <p className="mt-5 text-sm text-white/70">Seu perfil</p>
              <h1 className="mt-1 text-2xl font-bold leading-tight text-white">
                {displayFirstName}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Avatar className="size-16 border-2 border-white/70 shadow-lg">
                <AvatarImage
                  src={(studentData as any)?.avatarImage || undefined}
                  alt={displayFirstName || "Aluno"}
                  className="object-cover"
                />
                <AvatarFallback className="bg-white/20 text-lg font-bold text-white">
                  {(displayFirstName || "?").charAt(0).toUpperCase()}
                  {(user?.lastName || "").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="md:hidden">
                <GuardianMobileSwitcher />
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <div className="relative">
              <div
                className={`h-4 w-16 rounded-sm shadow-lg ${beltLevel === "white" ? "border border-white/60" : ""}`}
                style={{ backgroundColor: getBeltColor(beltLevel) }}
              />
              {stripes > 0 && (
                <div className="absolute inset-0 flex items-center justify-end gap-0.5 pr-1">
                  {Array.from({ length: stripes }, (_, i) => (
                    <div key={i} className="h-3 w-0.5 rounded-full bg-card" />
                  ))}
                </div>
              )}
            </div>
            <span className="text-xs font-medium text-white/80">
              Faixa {formatBelt(beltLevel, stripes)}
            </span>
          </div>
        </div>
      </div>

      <div className="relative z-20 -mt-12 space-y-5 px-4 pb-24 md:px-5">
        <div className="rounded-3xl border border-border/60 bg-card p-3 shadow-xl shadow-slate-900/10">
          <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Acesso rápido
          </p>
          <div className={`grid gap-2 ${
            financialSummary?.isFinancialResponsible ? "grid-cols-4" : "grid-cols-3"
          }`}>
            <Link href="/student/week-agenda" className="group flex min-w-0 flex-col items-center gap-1.5 rounded-2xl px-1 py-2 transition-colors hover:bg-primary/5">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:-translate-y-0.5">
                <Calendar className="size-4" />
              </div>
              <span className="text-center text-[11px] font-semibold text-foreground">Agenda</span>
            </Link>

            <Link href="/student/attendance-stats" className="group flex min-w-0 flex-col items-center gap-1.5 rounded-2xl px-1 py-2 transition-colors hover:bg-primary/5">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:-translate-y-0.5">
                <ChartNoAxesColumnIncreasing className="size-4" />
              </div>
              <span className="text-center text-[11px] font-semibold text-foreground">Presenças</span>
            </Link>

            {financialSummary?.isFinancialResponsible && (
              <Link href="/payments" className="group flex min-w-0 flex-col items-center gap-1.5 rounded-2xl px-1 py-2 transition-colors hover:bg-primary/5">
                <div className="relative flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:-translate-y-0.5">
                  <ReceiptText className="size-4" />
                  {financialSummary.hasOverdue && (
                    <span className="absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full border-2 border-card bg-red-500 px-1 text-[9px] font-bold leading-3 text-white">
                      {financialSummary.overdueCount}
                    </span>
                  )}
                </div>
                <span className="text-center text-[11px] font-semibold text-foreground">Pagamentos</span>
              </Link>
            )}

            <Link href="/settings" className="group flex min-w-0 flex-col items-center gap-1.5 rounded-2xl px-1 py-2 transition-colors hover:bg-primary/5">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:-translate-y-0.5">
                <UserRound className="size-4" />
              </div>
              <span className="text-center text-[11px] font-semibold text-foreground">Perfil</span>
            </Link>
          </div>
        </div>

        {(studentData as any)?.id &&
          (
            (studentData as any)?.requiresMedicalCertificate === true ||
            ["PENDING", "UPLOADED", "RECEIVED"].includes((studentData as any)?.medicalCertificateStatus)
          ) && (
            <MedicalCertificateUpload
              studentId={(studentData as any).id}
              required={(studentData as any).requiresMedicalCertificate}
              status={(studentData as any).medicalCertificateStatus}
            />
          )}

        <div className="vyta-card-hero">
          <img
            src={beltImg}
            alt="Treino"
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: 'center 30%' }}
          />
          <div className="vyta-card-hero-gradient" />
          <div className="vyta-card-hero-content">
            <span className="vyta-pill mb-2">
              <Calendar className="w-3 h-3" />
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long' })}
            </span>
            <h3 className="text-lg font-bold text-white font-inter mt-1">Aulas de Hoje</h3>
            <p className="text-sm text-white/70 font-inter">Confirme sua presença nas aulas</p>
          </div>
        </div>

        {(studentData as any)?.id && (
          <TodayClasses
            classes={
              Array.isArray((todayClasses as any)?.classes)
                ? (todayClasses as any).classes
                : []
            }
            studentId={(studentData as any)?.id}
            primaryColor="#2B54FF"
            isLoading={isClassesLoading}
          />
        )}

        {(studentData as any)?.id && (
          <NoticesBlock
            studentId={(studentData as any)?.id}
            primaryColor="#2B54FF"
            limit={3}
          />
        )}

      </div>
    </div>
  );
}
