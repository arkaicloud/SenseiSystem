import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/analytics";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CheckCircle, User, Heart, FileText, ArrowLeft, Plus, Home } from "lucide-react";
import PersonalInfoStep, { type PersonalInfoData } from "@/components/onboarding/steps/PersonalInfoStep";
import HealthFormStep from "@/components/onboarding/steps/HealthFormStep";
import DocumentsStep from "@/components/onboarding/steps/DocumentsStep";
import MobileStudentOnboarding from "@/components/onboarding/MobileStudentOnboarding";

type OnboardingData = PersonalInfoData & {
  username: string;
  password: string;
  confirmPassword: string;
  medicalConditions?: string;
  documentsCompleted?: boolean;
};

const ONBOARDING_CACHE_KEY = "senseisystem_onboarding_cache";
const ONBOARDING_STEP_KEY = "senseisystem_onboarding_step";

export default function OnboardingPage() {
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: schoolConfig } = useQuery<{ config: { schoolName: string } }>({
    queryKey: ['/api/school-config'],
    retry: false,
  });

  const clearCacheOnInit = () => {
    try {
      localStorage.removeItem(ONBOARDING_CACHE_KEY);
      localStorage.removeItem(ONBOARDING_STEP_KEY);
      console.log('🗑️ Cache limpo ao inicializar novo onboarding');
    } catch (error) {
      console.warn('⚠️ Erro ao limpar cache inicial:', error);
    }
  };

  clearCacheOnInit();

  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState<Partial<OnboardingData>>({});
  const [success, setSuccess] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [registrationError, setRegistrationError] = useState<string>("");

  const { mutate: registerStudent, isPending: isSubmitting } = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/register-student', data);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Erro ao processar cadastro' }));
        throw new Error(errorData.message || `Erro ${res.status}`);
      }
      return res;
    },
    onSuccess: () => {
      trackEvent("student_registration_submitted", {
        has_plan: Boolean(onboardingData.paymentPlanId),
        has_coupon: Boolean((onboardingData as any).couponCode),
      });
      clearCache();
      setSuccess(true);
      toast({
        title: "Cadastro Realizado com Sucesso!",
        description: "Sua solicitação de matrícula foi enviada e está aguardando aprovação.",
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message || error.toString();
      setRegistrationError(errorMessage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (errorMessage.includes("já foi utilizado") || errorMessage.includes("Email already in use")) {
        toast({
          title: "E-mail já cadastrado",
          description: "Este e-mail já foi utilizado. Por favor, informe outro ou faça login.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro no Cadastro",
          description: `Falha ao processar sua matrícula: ${errorMessage}`,
          variant: "destructive",
        });
      }
    },
  });

  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 768);
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const clearCache = () => {
    try {
      localStorage.removeItem(ONBOARDING_CACHE_KEY);
      localStorage.removeItem(ONBOARDING_STEP_KEY);
    } catch {}
  };

  const resetEmailField = () => {
    setOnboardingData((prev) => ({ ...prev, email: "" }));
    setCurrentStep(1);
    setRegistrationError("");
  };

  const handlePersonalInfoSubmit = (data: PersonalInfoData) => {
    setOnboardingData((prev) => ({ ...prev, ...data }));
    setCurrentStep(2);
    setRegistrationError("");
  };

  const handleHealthFormSubmit = (healthData: {
    healthAnswers: any[];
    agreedToHealthTerms: boolean;
    healthTermsAgreedAt: string;
  }) => {
    setOnboardingData((prev) => ({ ...prev, ...healthData }));
    setCurrentStep(3);
    setRegistrationError("");
  };

  const handleDocumentsSubmit = (data: any) => {
    const completeData = { ...onboardingData, ...data } as OnboardingData;
    const cleanData = {
      firstName: completeData.firstName || "",
      lastName: completeData.lastName || "",
      username: completeData.username || "",
      email: completeData.email || "",
      password: completeData.password || "",
      role: "student" as const,
      phone: completeData.phone || "",
      emergencyContact: completeData.emergencyContact || "",
      emergencyPhone: completeData.emergencyPhone || "",
      birthDate: completeData.birthDate || null,
      street: completeData.street || "",
      number: completeData.number || "",
      complement: completeData.complement || "",
      neighborhood: completeData.neighborhood || "",
      city: completeData.city || "",
      state: completeData.state || "",
      zipCode: completeData.zipCode || "",
      cpf: completeData.cpf || "",
      rg: completeData.rg || "",
      beltLevel: completeData.beltLevel || "white",
      stripes: completeData.stripes || 0,
      medicalConditions: completeData.medicalConditions || "",
      financialResponsibleName: completeData.financialResponsibleName || "",
      financialResponsibleEmail: completeData.financialResponsibleEmail || "",
      financialResponsiblePhone: completeData.financialResponsiblePhone || "",
      financialResponsibleCpf: completeData.financialResponsibleCpf || "",
      financialResponsibleRelationship: completeData.financialResponsibleRelationship || "self",
      paymentPlanId: completeData.paymentPlanId || null,
      dueDate: completeData.dueDate || null,
      couponCode: (completeData as any).couponCode || null,
      isScholarship: (completeData as any).isScholarship || false,
      sex: (completeData as any).sex || null,
      healthAnswers: (completeData as any).healthAnswers || [],
      agreedToHealthTerms: (completeData as any).agreedToHealthTerms || false,
      healthTermsAgreedAt: (completeData as any).healthTermsAgreedAt || null,
      documentsCompleted: true,
    };
    registerStudent(cleanData);
  };

  const progressPercentage = (currentStep / 3) * 100;

  const steps = [
    { number: 1, title: "Informações Pessoais", icon: User },
    { number: 2, title: "Saúde e Graduação", icon: Heart },
    { number: 3, title: "Documentos", icon: FileText },
  ];

  // Success screen — dark VYTA
  if (success) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="w-24 h-24 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Cadastro Enviado!</h2>
          <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
            Sua solicitação foi enviada para aprovação. Você receberá um e-mail quando for aprovado.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => { setSuccess(false); setCurrentStep(1); setOnboardingData({} as any); }}
              className="w-full h-12 rounded-xl border border-white/20 text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <Plus className="w-4 h-4" />
              Nova matrícula
            </button>
            <button
              onClick={() => { window.location.href = "/"; }}
              className="w-full h-12 rounded-xl bg-primary hover:bg-[#2348db] text-white transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <Home className="w-4 h-4" />
              Voltar ao menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleMobileBack = () => {
    if (user && user.role === 'admin') {
      window.location.href = '/dashboard';
    } else {
      window.close();
    }
  };

  if (isMobile) {
    return (
      <MobileStudentOnboarding
        onBack={handleMobileBack}
        onSuccess={() => setSuccess(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F1E] flex flex-col">
      {/* Header */}
      <header className="bg-[#0F1729] border-b border-white/10 flex-shrink-0">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-lg font-bold text-white">
                Matrícula{" "}
                <span className="text-primary">
                  {schoolConfig?.config?.schoolName || "SenseiSystem"}
                </span>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">Complete sua inscrição em apenas 3 etapas</p>
            </div>
            <button
              onClick={() => window.location.href = '/'}
              className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Voltar ao Login</span>
            </button>
          </div>
        </div>
      </header>

      {/* Progress Section */}
      <div className="bg-[#0F1729] border-b border-white/10 flex-shrink-0">
        <div className="max-w-4xl mx-auto px-6 py-4">
          {/* Bar */}
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Etapa {currentStep} de 3</span>
            <span>{Math.round(progressPercentage)}% concluído</span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-0">
            {steps.map((step, idx) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              return (
                <div key={step.number} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      isCompleted
                        ? 'bg-primary border-[#2B54FF]'
                        : isActive
                          ? 'bg-primary/20 border-[#2B54FF]'
                          : 'bg-white/5 border-white/10'
                    }`}>
                      {isCompleted
                        ? <CheckCircle className="w-5 h-5 text-white" />
                        : <StepIcon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                      }
                    </div>
                    <span className={`text-xs mt-1 font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                      {step.title}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`w-16 sm:w-24 h-px mx-2 mb-4 ${currentStep > step.number ? 'bg-primary' : 'bg-white/10'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 py-6 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Error alert */}
          {registrationError && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
              <p className="font-medium mb-1">Erro no cadastro</p>
              <p>{registrationError}</p>
              {(registrationError.includes("já foi utilizado") || registrationError.includes("Email already in use")) && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={resetEmailField}
                    className="px-3 py-1.5 rounded-lg border border-red-400/40 text-red-400 hover:bg-red-400/10 text-xs transition-colors"
                  >
                    Alterar E-mail
                  </button>
                  <button
                    onClick={() => window.location.href = '/'}
                    className="px-3 py-1.5 rounded-lg border border-red-400/40 text-red-400 hover:bg-red-400/10 text-xs transition-colors"
                  >
                    Fazer Login
                  </button>
                </div>
              )}
            </div>
          )}

          {currentStep === 1 && (
            <PersonalInfoStep
              onNext={handlePersonalInfoSubmit}
              defaultValues={onboardingData}
            />
          )}
          {currentStep === 2 && (
            <HealthFormStep
              onNext={handleHealthFormSubmit}
              onBack={() => setCurrentStep(1)}
              defaultValues={onboardingData}
            />
          )}
          {currentStep === 3 && (
            <DocumentsStep
              onNext={handleDocumentsSubmit}
              onBack={() => setCurrentStep(2)}
              defaultValues={onboardingData}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#0F1729] border-t border-white/10 flex-shrink-0 py-3">
        <p className="text-center text-xs text-secondary-foreground">
          Dúvidas? Entre em contato conosco através do sistema principal.
        </p>
      </footer>
    </div>
  );
}
