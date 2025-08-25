import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CheckCircle, User, Heart, FileText, ArrowLeft } from "lucide-react";
import PersonalInfoStep, { type PersonalInfoData } from "@/components/onboarding/steps/PersonalInfoStep";
import HealthFormStep, { type HealthFormData } from "@/components/onboarding/steps/HealthFormStep";
import DocumentsStep from "@/components/onboarding/steps/DocumentsStep";
import ReviewStep from "@/components/onboarding/steps/ReviewStep";
import MobileStudentOnboarding from "@/components/onboarding/MobileStudentOnboarding";
import { beltLevelEnum } from "@shared/schema";

type OnboardingData = PersonalInfoData & HealthFormData & {
  username: string;
  password: string;
  confirmPassword: string;
};

// Chave para o localStorage
const ONBOARDING_CACHE_KEY = "senseisystem_onboarding_cache";
const ONBOARDING_STEP_KEY = "senseisystem_onboarding_step";

export default function OnboardingPage() {
  // Função para limpar cache ao inicializar
  const clearCacheOnInit = () => {
    try {
      localStorage.removeItem(ONBOARDING_CACHE_KEY);
      localStorage.removeItem(ONBOARDING_STEP_KEY);
      console.log('🗑️ Cache limpo ao inicializar novo onboarding');
    } catch (error) {
      console.warn('⚠️ Erro ao limpar cache inicial:', error);
    }
  };

  // Função para carregar dados do cache
  const loadCachedData = (): Partial<OnboardingData> => {
    // Não carregar cache - sempre começar limpo
    return {};
  };

  // Função para carregar step do cache
  const loadCachedStep = (): number => {
    // Sempre começar no step 1 para novos onboardings
    return 1;
  };

  // Limpar cache ao inicializar
  clearCacheOnInit();
  
  const [currentStep, setCurrentStep] = useState(1); // Sempre começar no step 1
  const [onboardingData, setOnboardingData] = useState<Partial<OnboardingData>>({});
  const [success, setSuccess] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [registrationError, setRegistrationError] = useState<string>("");
  const { toast } = useToast();

  // Student registration mutation
  const { mutate: registerStudent, isPending: isSubmitting, error } = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/register-student', data);
    },
    onSuccess: () => {
      // Limpar cache após sucesso
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
      
      // Toast mais específico para email em uso
      if (errorMessage.includes("Email already in use")) {
        toast({
          title: "Email já cadastrado",
          description: "Este email já está em uso. Tente com outro email ou faça login.",
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

  // Cache desabilitado para sempre começar limpo
  // useEffect para salvar dados removido intencionalmente

  // Detectar se é mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Função para limpar cache
  const clearCache = () => {
    try {
      localStorage.removeItem(ONBOARDING_CACHE_KEY);
      localStorage.removeItem(ONBOARDING_STEP_KEY);
      console.log('🗑️ Cache limpo após cadastro concluído');
    } catch (error) {
      console.warn('⚠️ Erro ao limpar cache:', error);
    }
  };

  // Função para resetar email em caso de erro
  const resetEmailField = () => {
    setOnboardingData(prev => ({
      ...prev,
      email: ""
    }));
    setCurrentStep(1);
    setRegistrationError("");
  };

  const handlePersonalInfoSubmit = (data: any) => {
    setOnboardingData(prev => ({ ...prev, ...data }));
    setCurrentStep(2);
    setRegistrationError(""); // Limpar erro anterior
  };

  const handleHealthFormSubmit = (data: any) => {
    setOnboardingData(prev => ({ ...prev, ...data }));
    setCurrentStep(3);
    setRegistrationError(""); // Limpar erro anterior
  };

  const handleDocumentsSubmit = (data: any) => {
    const completeData = { ...onboardingData, ...data } as OnboardingData;
    
    // Create clean data object without File objects or DOM elements to avoid circular JSON structure
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
      // Note: File uploads are handled separately via form data, not in this JSON payload
      documentsCompleted: true
    };
    
    // Submit registration with clean, serializable data
    registerStudent(cleanData);
  };

  const progressPercentage = (currentStep / 3) * 100;

  const steps = [
    { number: 1, title: "Informações Pessoais", icon: User },
    { number: 2, title: "Saúde e Graduação", icon: Heart },
    { number: 3, title: "Documentos", icon: FileText },
  ];

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <ReviewStep />
          <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground">
              Você pode fechar esta aba e retornar à página principal.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Usar versão mobile se for dispositivo móvel
  if (isMobile) {
    return (
      <MobileStudentOnboarding 
        onBack={() => window.close()}
        onSuccess={() => setSuccess(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Compacto e Responsivo */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-primary">Matrícula SenseiSystem</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Complete sua inscrição em apenas 3 etapas</p>
            </div>
            <button 
              onClick={() => window.close()} 
              className="text-muted-foreground hover:text-foreground"
              title="Fechar"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Progress Section - Compacto */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3">
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Etapa {currentStep} de 3</span>
              <span>{Math.round(progressPercentage)}% concluído</span>
            </div>
            <Progress value={progressPercentage} className="w-full h-2" />

            {/* Step Indicators - Compacto */}
            <div className="flex justify-between mt-3">
              {steps.map((step) => {
                const StepIcon = step.icon;
                const isActive = currentStep === step.number;
                const isCompleted = currentStep > step.number;
                
                return (
                  <div key={step.number} className="flex flex-col items-center space-y-1 flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                      isCompleted 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : isActive 
                          ? 'bg-primary border-primary text-white' 
                          : 'bg-muted border-muted-foreground/20 text-muted-foreground'
                    }`}>
                      {isCompleted ? <CheckCircle className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                    </div>
                    <div className="text-center">
                      <div className={`text-xs font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'} px-1`}>
                        {step.title}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Otimizado */}
      <div className="py-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <Card className="shadow-sm border">
            <CardContent className="p-6">
              {/* Erro de registro */}
              {registrationError && (
                <Alert variant="destructive" className="mb-6">
                  <AlertDescription>
                    {registrationError}
                    {registrationError.includes("Email already in use") && (
                      <div className="mt-3 flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={resetEmailField}
                          className="border-red-300 text-red-700 hover:bg-red-50"
                        >
                          Alterar Email
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => window.location.href = '/'}
                          className="border-red-300 text-red-700 hover:bg-red-50"
                        >
                          Fazer Login
                        </Button>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
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
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer - Compacto */}
      <div className="bg-white border-t mt-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3">
          <div className="text-center text-xs text-muted-foreground">
            <p>Dúvidas? Entre em contato conosco através do sistema principal.</p>
          </div>
        </div>
      </div>
    </div>
  );
}