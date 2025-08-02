import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState<Partial<OnboardingData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { register, error } = useAuth();

  // Detectar se é mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const handlePersonalInfoSubmit = (data: any) => {
    setOnboardingData(prev => ({ ...prev, ...data }));
    setCurrentStep(2);
  };

  const handleHealthFormSubmit = (data: any) => {
    setOnboardingData(prev => ({ ...prev, ...data }));
    setCurrentStep(3);
  };

  const handleDocumentsSubmit = async (data: any) => {
    const completeData = { ...onboardingData, ...data } as OnboardingData;
    setIsSubmitting(true);

    try {
      await register(completeData.email, completeData.password, {
        firstName: completeData.firstName,
        lastName: completeData.lastName,
        username: completeData.username,
        role: "student" as const,
        phone: completeData.phone,
        beltLevel: completeData.beltLevel,
        stripes: completeData.stripes,
        emergencyContact: completeData.emergencyContact || "",
        birthDate: completeData.birthDate,
        street: completeData.street,
        number: completeData.number,
        complement: completeData.complement || "",
        neighborhood: completeData.neighborhood,
        city: completeData.city,
        state: completeData.state,
        zipCode: completeData.zipCode,
      });
      setSuccess(true);
    } catch (err) {
      console.error("Registration failed:", err);
    } finally {
      setIsSubmitting(false);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      {/* Header - Responsivo */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-primary">Matrícula SenseiSystem</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Complete sua inscrição em apenas 3 etapas</p>
            </div>
            <button 
              onClick={() => window.close()} 
              className="text-muted-foreground hover:text-foreground self-end sm:self-auto"
              title="Fechar"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Progress Section - Responsivo */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="space-y-4">
            <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
              <span>Etapa {currentStep} de 3</span>
              <span>{Math.round(progressPercentage)}% concluído</span>
            </div>
            <Progress value={progressPercentage} className="w-full h-2" />

            {/* Step Indicators - Responsivo */}
            <div className="flex justify-between mt-4 sm:mt-6 overflow-x-auto">
              {steps.map((step) => {
                const StepIcon = step.icon;
                const isActive = currentStep === step.number;
                const isCompleted = currentStep > step.number;
                
                return (
                  <div key={step.number} className="flex flex-col items-center space-y-1 sm:space-y-2 min-w-0 flex-1">
                    <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 transition-colors ${
                      isCompleted 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : isActive 
                          ? 'bg-primary border-primary text-white' 
                          : 'bg-muted border-muted-foreground/20 text-muted-foreground'
                    }`}>
                      {isCompleted ? <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6" /> : <StepIcon className="w-4 h-4 sm:w-6 sm:h-6" />}
                    </div>
                    <div className="text-center">
                      <div className={`text-xs sm:text-sm font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'} px-1 text-center`}>
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

      {/* Main Content - Responsivo */}
      <div className="flex-1 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6 sm:pt-8 pb-4 sm:pb-6">
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertDescription>{error}</AlertDescription>
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

      {/* Footer - Responsivo */}
      <div className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="text-center text-xs sm:text-sm text-muted-foreground">
            <p>Dúvidas? Entre em contato conosco através do sistema principal.</p>
          </div>
        </div>
      </div>
    </div>
  );
}