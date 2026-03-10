import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, CheckCircle } from "lucide-react";

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

  const handleFinalSubmit = async (_medData?: MedicalCertData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const data = formData as CompleteFormData;
      const email = (data as any).email || "";
      if (!email) throw new Error("Email não encontrado. Por favor, volte e preencha novamente.");

      const username = email.split('@')[0].toLowerCase();

      const cleanData = {
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        email,
        password: undefined,
        username,
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
        dueDate: signatureData?.dueDate || (data as any).dueDate || null,
        couponCode: (data as any).couponCode || null,
        hasHeartProblem: (data as any).hasHeartProblem || "no",
        hasChestPain: (data as any).hasChestPain || "no",
        hasBreathingProblem: (data as any).hasBreathingProblem || "no",
        hasBloodPressureProblem: (data as any).hasBloodPressureProblem || "no",
        hasBoneProblem: (data as any).hasBoneProblem || "no",
        hasOtherHealthProblem: (data as any).hasOtherHealthProblem || "no",
        takeMedication: (data as any).takeMedication || "no",
        doctorRecommendation: (data as any).doctorRecommendation || "no",
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
        const err = await response.json();
        throw new Error(err.message || 'Falha no cadastro');
      }

      setSuccess(true);
      setTimeout(() => onSuccess(), 2500);
    } catch (err: any) {
      setSubmitError(err?.message || "Erro ao finalizar cadastro. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const goBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const stepTitles = ["Dados Pessoais", "Contato", "Emergência", "Endereço", "Revisão", "Saúde", "Assinatura", "Atestado Médico"];

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Cadastro Enviado!</h3>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">
            Seu cadastro foi enviado para aprovação. Você receberá um e-mail com as credenciais de acesso quando for aprovado.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-slate-900/80 backdrop-blur-md border-b border-white/10 px-4 pt-safe-top pt-3 pb-3">
        <div className="flex items-center justify-between mb-2.5">
          <button
            onClick={currentStep === 1 ? onBack : goBack}
            className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="text-center">
            <p className="text-xs text-slate-400 font-medium">{stepTitles[currentStep - 1]}</p>
          </div>
          <div className="text-xs text-slate-500 font-medium w-9 text-right">
            {currentStep}/{totalSteps}
          </div>
        </div>
        <Progress
          value={progressPercentage}
          className="h-1 bg-white/10 [&>div]:bg-[#2B54FF]"
        />
      </div>

      {/* Error */}
      {submitError && (
        <div className="px-4 pt-4">
          <Alert variant="destructive" className="bg-red-500/10 border-red-500/30">
            <AlertDescription className="text-red-400">{submitError}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Steps */}
      <div className="flex-1">
        {currentStep === 1 && (
          <PersonalDataStep onNext={handlePersonalData} defaultValues={formData} />
        )}
        {currentStep === 2 && (
          <ContactInfoStep onNext={handleContactInfo} onBack={goBack} defaultValues={formData} />
        )}
        {currentStep === 3 && (
          <EmergencyContactStep onNext={handleEmergencyContact} onBack={goBack} defaultValues={formData} />
        )}
        {currentStep === 4 && (
          <AddressStep onNext={handleAddress} onBack={goBack} defaultValues={formData} />
        )}
        {currentStep === 5 && (
          <FinalReviewStep
            onNext={handleFinalReview}
            onBack={goBack}
            formData={formData as CompleteFormData}
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
          <ElectronicSignatureStep onNext={handleSignature} onBack={goBack} isMobile={true} formData={formData as Record<string, any>} />
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

      {/* Loading overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6 text-center">
            <div className="w-12 h-12 border-2 border-[#2B54FF] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-white text-sm font-medium">Finalizando cadastro...</p>
          </div>
        </div>
      )}
    </div>
  );
}
