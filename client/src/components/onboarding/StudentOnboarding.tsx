import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, User, Heart, FileText, ArrowLeft } from "lucide-react";
import PersonalInfoStep, { type PersonalInfoData } from "./steps/PersonalInfoStep";
import HealthFormStep, { type HealthFormData } from "./steps/HealthFormStep";
import DocumentsStep from "./steps/DocumentsStep";
import ReviewStep from "./steps/ReviewStep";
import { beltLevelEnum } from "@shared/schema";

type OnboardingData = PersonalInfoData & HealthFormData & {
  username: string;
  password: string;
  confirmPassword: string;
};

interface StudentOnboardingProps {
  onBack: () => void;
  onSuccess: () => void;
}

export default function StudentOnboarding({ onBack, onSuccess }: StudentOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState<Partial<OnboardingData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const { register, error } = useAuth();

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
      // Create clean data object to avoid circular references
      const cleanData = {
        firstName: String(completeData.firstName),
        lastName: String(completeData.lastName),
        username: String(completeData.username),
        role: "student" as const,
        phone: String(completeData.phone || ""),
        beltLevel: String(completeData.beltLevel || "white"),
        stripes: Number(completeData.stripes || 0),
        emergencyContact: String(completeData.emergencyContact || ""),
        birthDate: completeData.birthDate ? String(completeData.birthDate) : null,
        street: String(completeData.street || ""),
        number: String(completeData.number || ""),
        complement: String(completeData.complement || ""),
        neighborhood: String(completeData.neighborhood || ""),
        city: String(completeData.city || ""),
        state: String(completeData.state || ""),
        zipCode: String(completeData.zipCode || ""),
      };

      await register(completeData.email, completeData.password, cleanData);
      setSuccess(true);
      setTimeout(() => onSuccess(), 2000);
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
    return <ReviewStep />;
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header com progresso */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Matrícula na Academia</h2>
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Etapa {currentStep} de 3</span>
            <span>{Math.round(progressPercentage)}% concluído</span>
          </div>
          <Progress value={progressPercentage} className="w-full" />
        </div>

        {/* Indicadores de etapas */}
        <div className="flex justify-between mt-4">
          {steps.map((step) => {
            const StepIcon = step.icon;
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;
            
            return (
              <div key={step.number} className="flex flex-col items-center space-y-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isCompleted 
                    ? 'bg-green-500 text-white' 
                    : isActive 
                      ? 'bg-primary text-white' 
                      : 'bg-muted text-muted-foreground'
                }`}>
                  {isCompleted ? <CheckCircle className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                </div>
                <span className={`text-xs text-center ${isActive ? 'font-medium' : 'text-muted-foreground'}`}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Conteúdo das etapas */}
      <Card>
        <CardContent className="pt-6">
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
              birthDate={onboardingData.birthDate}
            />
          )}

          {currentStep === 3 && (
            <DocumentsStep 
              onNext={() => handleDocumentsSubmit({})}
              onBack={() => setCurrentStep(2)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}