import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

// Steps
import PersonalDataStep, { type PersonalDataType } from "./steps/PersonalDataStep";
import ContactInfoStep, { type ContactInfoType } from "./steps/ContactInfoStep";
import EmergencyContactStep, { type EmergencyContactType } from "./steps/EmergencyContactStep";
import AddressStep, { type AddressType } from "./steps/AddressStep";
import FinalReviewStep, { type CompleteFormData } from "./steps/FinalReviewStep";
import PhysicalAssessmentStep, { type PhysicalAssessmentType } from "./steps/PhysicalAssessmentStep";

interface MobileStudentOnboardingProps {
  onBack: () => void;
  onSuccess: () => void;
}

export default function MobileStudentOnboarding({ onBack, onSuccess }: MobileStudentOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<CompleteFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const { register, error } = useAuth();

  const totalSteps = 6;
  const progressPercentage = (currentStep / totalSteps) * 100;

  // Step handlers
  const handlePersonalData = (data: PersonalDataType) => {
    setFormData(prev => ({ ...prev, ...data }));
    setCurrentStep(2);
  };

  const handleContactInfo = (data: ContactInfoType) => {
    setFormData(prev => ({ ...prev, ...data }));
    setCurrentStep(3);
  };

  const handleEmergencyContact = (data: EmergencyContactType) => {
    setFormData(prev => ({ ...prev, ...data }));
    setCurrentStep(4);
  };

  const handleAddress = (data: AddressType) => {
    setFormData(prev => ({ ...prev, ...data }));
    setCurrentStep(5);
  };

  const handleFinalReview = (data: CompleteFormData) => {
    setFormData(prev => ({ ...prev, ...data }));
    setCurrentStep(6);
  };

  const handlePhysicalAssessment = (data: PhysicalAssessmentType) => {
    setFormData(prev => ({ ...prev, ...data }));
    // Aqui seguiria para as próximas etapas como no desktop
    handleFinalSubmit({ ...formData, ...data } as CompleteFormData);
  };

  const handleFinalSubmit = async (data: CompleteFormData) => {
    setIsSubmitting(true);
    
    try {
      // Generate username from email
      const username = data.email.split('@')[0].toLowerCase();
      const password = "123456"; // Default password - user can change later
      
      // Create clean data object to avoid circular references
      const cleanData = {
        firstName: String(data.firstName),
        lastName: String(data.lastName),
        username: String(username),
        role: "student" as const,
        phone: String(data.phone || ""),
        emergencyContact: String(data.emergencyContact || ""),
        emergencyPhone: String((data as any).emergencyPhone || ""),
        birthDate: data.birthDate ? String(data.birthDate) : null,
        street: String(data.street || ""),
        number: String(data.number || ""),
        complement: String(data.complement || ""),
        neighborhood: String(data.neighborhood || ""),
        city: String(data.city || ""),
        state: String(data.state || ""),
        zipCode: String(data.zipCode || ""),
        cpf: String((data as any).cpf || ""),
        rg: String((data as any).rg || ""),
        beltLevel: String((data as any).beltLevel || "white"),
        stripes: Number((data as any).stripes || 0),
        medicalConditions: String((data as any).medicalConditions || ""),
        financialResponsibleName: String((data as any).financialResponsibleName || ""),
        financialResponsibleEmail: String((data as any).financialResponsibleEmail || ""),
        financialResponsiblePhone: String((data as any).financialResponsiblePhone || ""),
        financialResponsibleCpf: String((data as any).financialResponsibleCpf || ""),
        financialResponsibleRelationship: String((data as any).financialResponsibleRelationship || "self"),
        paymentPlanId: (data as any).paymentPlanId ? String((data as any).paymentPlanId) : null,
        dueDate: (data as any).dueDate ? String((data as any).dueDate) : null
      };
      
      await register(data.email, password, cleanData);
      
      setSuccess(true);
      setTimeout(() => onSuccess(), 2000);
    } catch (err) {
      console.error("Registration failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const stepTitles = [
    "Dados Pessoais",
    "Contato", 
    "Emergência",
    "Endereço",
    "Revisão",
    "Aptidão Física"
  ];

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Cadastro Realizado!</h3>
          <p className="text-muted-foreground">
            Seu cadastro foi enviado para aprovação. Você receberá um e-mail quando for aprovado.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col safe-area-inset">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="p-1">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Cadastro</h1>
          <div className="w-8" /> {/* Spacer */}
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Etapa {currentStep} de {totalSteps}</span>
            <span>{stepTitles[currentStep - 1]}</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-4 overflow-y-auto mobile-form-container">
        <div className="max-w-md mx-auto pb-6">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card className="border-0 shadow-sm mobile-friendly-card">
            <CardContent className="p-4 sm:p-6 mobile-friendly-form">
              {currentStep === 1 && (
                <PersonalDataStep
                  onNext={handlePersonalData}
                  defaultValues={formData}
                />
              )}

              {currentStep === 2 && (
                <ContactInfoStep
                  onNext={handleContactInfo}
                  onBack={goBack}
                  defaultValues={formData}
                />
              )}

              {currentStep === 3 && (
                <EmergencyContactStep
                  onNext={handleEmergencyContact}
                  onBack={goBack}
                  defaultValues={formData}
                />
              )}

              {currentStep === 4 && (
                <AddressStep
                  onNext={handleAddress}
                  onBack={goBack}
                  defaultValues={formData}
                />
              )}

              {currentStep === 5 && (
                <FinalReviewStep
                  onNext={handleFinalReview}
                  onBack={goBack}
                  formData={formData as CompleteFormData}
                  isSubmitting={false}
                />
              )}

              {currentStep === 6 && (
                <PhysicalAssessmentStep
                  onNext={handlePhysicalAssessment}
                  onBack={goBack}
                  defaultValues={formData as PhysicalAssessmentType}
                  birthDate={formData.birthDate}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}