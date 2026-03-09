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
import ElectronicSignatureStep, { type SignatureData } from "./steps/ElectronicSignatureStep";
import MedicalCertStep, { type MedicalCertData } from "./steps/MedicalCertStep";

interface MobileStudentOnboardingProps {
  onBack: () => void;
  onSuccess: () => void;
}

export default function MobileStudentOnboarding({ onBack, onSuccess }: MobileStudentOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<CompleteFormData>>({});
  const [healthData, setHealthData] = useState<PhysicalAssessmentType | null>(null);
  const [signatureData, setSignatureData] = useState<SignatureData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { register, error } = useAuth();

  const totalSteps = 8;
  const progressPercentage = (currentStep / totalSteps) * 100;

  const requiresMedical = healthData
    ? [
        healthData.hasHeartProblem,
        healthData.hasChestPain,
        healthData.hasBreathingProblem,
        healthData.hasBloodPressureProblem,
        healthData.hasBoneProblem,
        healthData.hasOtherHealthProblem,
        healthData.takeMedication,
        healthData.doctorRecommendation,
      ].some((v) => v === "yes")
    : false;

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
    setHealthData(data);
    setFormData(prev => ({ ...prev, ...data }));
    setCurrentStep(7);
  };

  const handleSignature = (data: SignatureData) => {
    setSignatureData(data);
    setCurrentStep(8);
  };

  const handleMedicalCert = (data: MedicalCertData) => {
    handleFinalSubmit(data);
  };

  const handleFinalSubmit = async (medData?: MedicalCertData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const data = formData as CompleteFormData;
      const email = (data as any).email || "";
      if (!email) {
        throw new Error("Email não encontrado. Por favor, volte e preencha novamente.");
      }
      const username = email.split('@')[0].toLowerCase();

      const cleanData = {
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        email: (data as any).email || "",
        password: undefined,
        username: username,
        role: "student" as const,
        phone: data.phone || "",
        sex: (data as any).sex || null,
        emergencyContact: data.emergencyContact || "",
        emergencyPhone: (data as any).emergencyPhone || "",
        birthDate: data.birthDate || null,
        street: data.street || "",
        number: data.number || "",
        complement: data.complement || "",
        neighborhood: data.neighborhood || "",
        city: data.city || "",
        state: data.state || "",
        zipCode: data.zipCode || "",
        cpf: (data as any).cpf || "",
        rg: (data as any).rg || "",
        beltLevel: (data as any).beltLevel || "white",
        stripes: (data as any).stripes || 0,
        medicalConditions: (data as any).medicalConditions || "",
        financialResponsibleName: (data as any).financialResponsibleName || "",
        financialResponsibleEmail: (data as any).financialResponsibleEmail || "",
        financialResponsiblePhone: (data as any).financialResponsiblePhone || "",
        financialResponsibleCpf: (data as any).financialResponsibleCpf || "",
        financialResponsibleRelationship: (data as any).financialResponsibleRelationship || "self",
        paymentPlanId: (data as any).paymentPlanId || null,
        dueDate: (data as any).dueDate || null,
        couponCode: (data as any).couponCode || null,
        hasHeartProblem: (data as any).hasHeartProblem || "no",
        hasChestPain: (data as any).hasChestPain || "no",
        hasBreathingProblem: (data as any).hasBreathingProblem || "no",
        hasBloodPressureProblem: (data as any).hasBloodPressureProblem || "no",
        hasBoneProblem: (data as any).hasBoneProblem || "no",
        hasOtherHealthProblem: (data as any).hasOtherHealthProblem || "no",
        takeMedication: (data as any).takeMedication || "no",
        doctorRecommendation: (data as any).doctorRecommendation || "no",
        // Signature fields
        signatureData: signatureData?.signatureData || null,
        signatureType: signatureData?.signatureType || null,
        signatureTimestamp: signatureData?.signatureTimestamp || null,
        signatureLatitude: signatureData?.signatureLatitude || null,
        signatureLongitude: signatureData?.signatureLongitude || null,
      };

      const response = await fetch('/api/register-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha no cadastro');
      }

      setSuccess(true);
      setTimeout(() => onSuccess(), 2000);
    } catch (err: any) {
      console.error("Registration failed:", err);
      setSubmitError(err?.message || "Erro ao finalizar cadastro. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const goBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const stepTitles = [
    "Dados Pessoais",
    "Contato",
    "Emergência",
    "Endereço",
    "Revisão",
    "Aptidão Física",
    "Assinatura",
    "Atestado Médico",
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header with progress */}
      <div className="bg-white border-b px-4 pt-4 pb-3 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-2">
          <button onClick={currentStep === 1 ? onBack : goBack} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-500 font-medium">
            {currentStep} de {totalSteps}
          </span>
          <div className="w-5" />
        </div>
        <Progress value={progressPercentage} className="h-1.5" />
        <p className="text-xs text-gray-500 mt-1.5 text-center">{stepTitles[currentStep - 1]}</p>
      </div>

      {/* Error */}
      {submitError && (
        <div className="mx-4 mt-4">
          <Alert variant="destructive">
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Steps */}
      <div className="flex-1">
        {currentStep === 1 && (
          <PersonalDataStep
            onNext={handlePersonalData}
            onBack={onBack}
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
            defaultValues={formData as CompleteFormData}
          />
        )}
        {currentStep === 6 && (
          <PhysicalAssessmentStep
            onNext={handlePhysicalAssessment}
            onBack={goBack}
            defaultValues={formData}
            birthDate={(formData as any)?.birthDate}
          />
        )}
        {currentStep === 7 && (
          <ElectronicSignatureStep
            onNext={handleSignature}
            onBack={goBack}
            isMobile={true}
          />
        )}
        {currentStep === 8 && (
          <MedicalCertStep
            onNext={handleMedicalCert}
            onBack={goBack}
            requiresMedical={requiresMedical}
            isMobile={true}
          />
        )}
      </div>

      {isSubmitting && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <Card className="mx-4 max-w-sm w-full">
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 border-4 border-[#2B54FF] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-medium">Finalizando cadastro...</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
