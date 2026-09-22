import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "@/hooks/use-translations";
import { useAuth } from "@/hooks/use-auth";
import { useGuardian } from "@/contexts/guardian-context";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CreditCard, ChevronRight } from "lucide-react";
import { TodayClasses } from "@/components/student/TodayClasses";
import { NoticesBlock } from "@/components/student/NoticesBlock";
import { GuardianMobileSwitcher } from "@/components/guardian/GuardianMobileSwitcher";
import MedicalCertificateUpload from "@/components/students/MedicalCertificateUpload";
import { Link } from "wouter";
import heroImg from "@assets/Gemini_Generated_Image_p01ttdp01ttdp01t_1773260928824.png";
import beltImg from "@assets/Gemini_Generated_Image_5i9ge55i9ge55i9g_1773260928823.png";

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
      <div className="vyta-hero h-[280px] md:h-[220px] md:rounded-2xl">
        <img
          src={heroImg}
          alt="BJJ Training"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: 'center 20%' }}
        />
        <div className="vyta-hero-gradient" />
        <div className="vyta-hero-content flex flex-col justify-between h-full p-5 pt-6">
          <div className="flex items-center justify-between">
            <span className="text-[22px] font-bold text-white tracking-[2px] font-inter">
              {schoolInfo?.schoolName?.split(' ')[0]?.toUpperCase() ?? "HUIOS"}
            </span>
            {/* Guardian profile switcher — only visible for guardians on mobile */}
            <div className="md:hidden">
              <GuardianMobileSwitcher />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-[28px] font-bold text-white leading-[34px] font-inter">
              Fala, {displayFirstName}!
            </h1>
            <p className="text-[15px] text-white/80 font-inter">
              Bora treinar hoje?
            </p>
            {(studentData as any)?.beltLevel && (
              <div className="flex items-center gap-3 mt-3">
                <div className="relative">
                  <div
                    className={`w-20 h-5 rounded-sm shadow-lg ${beltLevel === "white" ? "border border-white/50" : ""}`}
                    style={{ backgroundColor: getBeltColor(beltLevel) }}
                  />
                  {stripes > 0 && (
                    <div className="absolute inset-0 flex justify-end items-center pr-1 space-x-0.5">
                      {Array.from({ length: stripes }, (_, i) => (
                        <div key={i} className="w-0.5 h-3 rounded-full bg-card" />
                      ))}
                    </div>
                  )}
                </div>
                <span className="vyta-pill">
                  Faixa {formatBelt(beltLevel, stripes)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-5 pt-6 pb-24 space-y-6">
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
          <img src={beltImg} alt="Treino" className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: 'center 30%' }} />
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link href="/student/week-agenda" className="flex-1">
            <div className="vyta-card p-4 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EEF1FF] flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <span className="font-semibold text-sm font-inter">Agenda</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#B0B0B0]" />
            </div>
          </Link>
          <Link href="/student/attendance-stats" className="flex-1">
            <div className="vyta-card p-4 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EEF1FF] flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
                <span className="font-semibold text-sm font-inter">Presenças</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#B0B0B0]" />
            </div>
          </Link>
          {financialSummary?.isFinancialResponsible && (
            <Link href="/payments" className="flex-1">
              <div className={`vyta-card p-4 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer ${
                financialSummary.hasOverdue ? "border border-amber-300 bg-amber-50/60" : ""
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    financialSummary.hasOverdue ? "bg-amber-100" : "bg-[#EEF1FF]"
                  }`}>
                    <CreditCard className={`w-5 h-5 ${
                      financialSummary.hasOverdue ? "text-amber-600" : "text-primary"
                    }`} />
                  </div>
                  <div>
                    <span className="font-semibold text-sm font-inter block">Pagamentos</span>
                    {financialSummary.hasOverdue && (
                      <span className="text-xs text-amber-700">
                        {financialSummary.overdueCount} em atraso
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#B0B0B0]" />
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
