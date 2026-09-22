import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, CheckCircle, Users, Plus, ArrowRight } from "lucide-react";

import PersonalDataStep, { type PersonalDataType } from "./steps/PersonalDataStep";
import ContactInfoStep, { type ContactInfoType } from "./steps/ContactInfoStep";
import EmergencyContactStep, { type EmergencyContactType } from "./steps/EmergencyContactStep";
import AddressStep, { type AddressType } from "./steps/AddressStep";
import PaymentAndResponsibleStep, { type PaymentAndResponsibleType } from "./steps/PaymentAndResponsibleStep";
import FinalReviewStep, { type CompleteFormData } from "./steps/FinalReviewStep";
import PhysicalAssessmentStep, { type PhysicalAssessmentType } from "./steps/PhysicalAssessmentStep";
import ElectronicSignatureStep, { type SignatureData } from "./steps/ElectronicSignatureStep";
import MedicalCertStep, { type MedicalCertData } from "./steps/MedicalCertStep";

interface MobileStudentOnboardingProps {
  onBack: () => void;
  onSuccess: () => void;
}

type FamilyPrefillData = {
  financialResponsibleName: string;
  financialResponsibleCpf: string;
  financialResponsibleEmail: string;
  financialResponsiblePhone: string;
  financialResponsibleRelationship: "other";
  paymentPlanId: string;
  dueDate: string;
  maxStudents: number;
  registeredCount: number;
};

export default function MobileStudentOnboarding({ onBack, onSuccess }: MobileStudentOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<CompleteFormData>>({});
  const [healthData, setHealthData] = useState<PhysicalAssessmentType | null>(null);
  const [signatureData, setSignatureData] = useState<SignatureData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Family plan state
  const [familyPrefill, setFamilyPrefill] = useState<FamilyPrefillData | null>(null);
  const [lastSubmittedName, setLastSubmittedName] = useState<string>("");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [currentStep]);

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

  // Steps: 1=Personal, 2=Contact, 3=Emergency, 4=Address, 5=Payment, 6=Review, 7=Health, 8=Signature, 9=MedicalCert(if needed)
  const totalSteps = requiresMedical ? 9 : 8;

  const stepTitles = [
    "Dados Pessoais",
    "Contato",
    "Emergência",
    "Endereço",
    "Pagamento",
    "Revisão",
    "Saúde",
    "Assinatura",
    "Atestado Médico",
  ];
  const progressPercentage = (currentStep / totalSteps) * 100;

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
  const handlePayment = (data: PaymentAndResponsibleType) => {
    setFormData(prev => ({ ...prev, ...data }));
    setCurrentStep(6);
  };
  const handleFinalReview = (data: CompleteFormData) => {
    setFormData(prev => ({ ...prev, ...data }));
    setCurrentStep(7);
  };
  const handlePhysicalAssessment = (data: PhysicalAssessmentType) => {
    setHealthData(data);
    setFormData(prev => ({ ...prev, ...data }));
    setCurrentStep(8);
  };
  const handleSignature = (data: SignatureData) => {
    setSignatureData(data);
    if (requiresMedical) {
      setCurrentStep(9);
    } else {
      handleFinalSubmit(undefined, data);
    }
  };
  const handleMedicalCert = (data: MedicalCertData) => {
    handleFinalSubmit(data);
  };

  const handleFinalSubmit = async (_medData?: MedicalCertData, sigData?: SignatureData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    const usedSignature = sigData || signatureData;

    try {
      const data = formData as CompleteFormData;
      const email = (data.email || "").trim();

      // If no email (minor/child), backend will auto-generate a placeholder
      const username = email
        ? email.split('@')[0].toLowerCase()
        : `${data.firstName || "aluno"}.${data.lastName || ""}`.toLowerCase().replace(/[^a-z0-9.]/g, "");

      const cleanData = {
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        email,
        password: undefined,
        username,
        role: "student" as const,
        phone: data.phone || "",
        sex: data.sex || null,
        emergencyContact: data.emergencyContact || "",
        emergencyPhone: data.emergencyPhone || "",
        birthDate: data.birthDate || null,
        street: data.street || "",
        number: data.number || "",
        complement: data.complement || "",
        neighborhood: data.neighborhood || "",
        city: data.city || "",
        state: data.state || "",
        zipCode: data.zipCode || "",
        cpf: data.cpf || "",
        rg: data.rg || "",
        beltLevel: data.beltLevel || "white",
        stripes: data.stripes || 0,
        medicalConditions: data.medicalConditions || "",
        financialResponsibleName: data.financialResponsibleName || "",
        financialResponsibleEmail: data.financialResponsibleEmail || "",
        financialResponsiblePhone: data.financialResponsiblePhone || "",
        financialResponsibleCpf: data.financialResponsibleCpf || "",
        financialResponsibleRelationship: data.financialResponsibleRelationship === "other" ? "other" : "self",
        paymentPlanId: data.paymentPlanId || null,
        dueDate: data.dueDate || null,
        couponCode: data.couponCode || null,
        hasHeartProblem: data.hasHeartProblem || "no",
        hasChestPain: data.hasChestPain || "no",
        hasBreathingProblem: data.hasBreathingProblem || "no",
        hasBloodPressureProblem: data.hasBloodPressureProblem || "no",
        hasBoneProblem: data.hasBoneProblem || "no",
        hasOtherHealthProblem: data.hasOtherHealthProblem || "no",
        takeMedication: data.takeMedication || "no",
        doctorRecommendation: data.doctorRecommendation || "no",
        signatureData: usedSignature?.signatureData || null,
        signatureType: usedSignature?.signatureType || null,
        signatureTimestamp: usedSignature?.signatureTimestamp || null,
        signatureLatitude: usedSignature?.signatureLatitude || null,
        signatureLongitude: usedSignature?.signatureLongitude || null,
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

      // Track submitted name for family flow screen
      setLastSubmittedName(`${data.firstName || ""} ${data.lastName || ""}`.trim() || "Aluno");

      // Check if this was a family plan
      const isFamily = !!(data as any).isFamily;
      const maxStudents = (data as any).maxStudents || 2;
      const currentRegisteredCount = (familyPrefill?.registeredCount || 0) + 1;

      if (isFamily && currentRegisteredCount < maxStudents) {
        // Prepare prefill data for the next student in the family
        setFamilyPrefill({
          financialResponsibleName: data.financialResponsibleName || "",
          financialResponsibleCpf: data.financialResponsibleCpf || "",
          financialResponsibleEmail: data.financialResponsibleEmail || "",
          financialResponsiblePhone: data.financialResponsiblePhone || "",
          financialResponsibleRelationship: "other",
          paymentPlanId: data.paymentPlanId || "",
          dueDate: data.dueDate || "5",
          maxStudents,
          registeredCount: currentRegisteredCount,
        });
      } else {
        setFamilyPrefill(null);
      }

      setSuccess(true);
    } catch (err: any) {
      setSubmitError(err?.message || "Erro ao finalizar cadastro. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const goBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const startNextFamilyStudent = () => {
    if (!familyPrefill) return;
    // Reset form for next student, keep responsible/payment prefilled
    setFormData({});
    setHealthData(null);
    setSignatureData(null);
    setSubmitError(null);
    setSuccess(false);
    setCurrentStep(1);
  };

  const handleDone = () => {
    setFamilyPrefill(null);
    window.location.href = "/";
  };


  // Success screen
  if (success) {
    const canAddMore = familyPrefill !== null;
    const registeredCount = familyPrefill?.registeredCount || 1;
    const maxStudents = familyPrefill?.maxStudents || 2;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Cadastro Enviado!</h3>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
              O cadastro de <span className="text-white font-medium">{lastSubmittedName}</span> foi enviado para aprovação. Um e-mail será enviado quando aprovado.
            </p>
          </div>

          {canAddMore && (
            <div className="bg-primary/10 border border-primary/30 rounded-2xl p-5 mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 border border-[#2B54FF]/30 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Plano Família</p>
                  <p className="text-muted-foreground text-xs">
                    {registeredCount} de {maxStudents} alunos cadastrados
                  </p>
                </div>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5 mb-4">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all"
                  style={{ width: `${(registeredCount / maxStudents) * 100}%` }}
                />
              </div>
              <button
                onClick={startNextFamilyStudent}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Adicionar outro aluno
              </button>
            </div>
          )}

          {/* Nova matrícula (always visible, secondary) */}
          <button
            onClick={() => { setSuccess(false); setFamilyPrefill(null); setFormData({}); setHealthData(null); setSignatureData(null); setSubmitError(null); setCurrentStep(1); }}
            className="w-full h-12 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/10 mb-3"
          >
            <Plus className="w-4 h-4" />
            Nova matrícula
          </button>

          <button
            onClick={handleDone}
            className="w-full h-12 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao menu
          </button>
        </div>
      </div>
    );
  }

  // Family plan prefill for payment step
  const paymentDefaultValues = familyPrefill ? {
    financialResponsibleName: familyPrefill.financialResponsibleName,
    financialResponsibleCpf: familyPrefill.financialResponsibleCpf,
    financialResponsibleEmail: familyPrefill.financialResponsibleEmail,
    financialResponsiblePhone: familyPrefill.financialResponsiblePhone,
    financialResponsibleRelationship: familyPrefill.financialResponsibleRelationship,
    paymentPlanId: familyPrefill.paymentPlanId,
    dueDate: familyPrefill.dueDate,
  } : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-white/10 px-4 pt-safe-top pt-3 pb-3">
        {familyPrefill && (
          <div className="flex items-center gap-2 mb-2 bg-primary/10 border border-[#2B54FF]/20 rounded-lg px-3 py-1.5">
            <Users className="w-3.5 h-3.5 text-primary shrink-0" />
            <p className="text-xs text-[#7B9FFF]">
              Plano Família — aluno {familyPrefill.registeredCount + 1} de {familyPrefill.maxStudents}
            </p>
          </div>
        )}
        <div className="flex items-center justify-between mb-2.5">
          <button
            onClick={currentStep === 1 ? onBack : goBack}
            className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="text-center">
            <p className="text-xs text-muted-foreground font-medium">{stepTitles[currentStep - 1]}</p>
          </div>
          <div className="text-xs text-muted-foreground font-medium w-9 text-right">
            {currentStep}/{totalSteps}
          </div>
        </div>
        <Progress value={progressPercentage} className="h-1 bg-white/10 [&>div]:bg-primary" />
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
          <PaymentAndResponsibleStep
            onNext={handlePayment}
            onBack={goBack}
            defaultValues={paymentDefaultValues || formData}
          />
        )}
        {currentStep === 6 && (
          <FinalReviewStep
            onNext={handleFinalReview}
            onBack={goBack}
            formData={formData as CompleteFormData}
          />
        )}
        {currentStep === 7 && (
          <PhysicalAssessmentStep
            onNext={handlePhysicalAssessment}
            onBack={goBack}
            defaultValues={formData}
            birthDate={(formData as any)?.birthDate}
          />
        )}
        {currentStep === 8 && (
          <ElectronicSignatureStep
            onNext={handleSignature}
            onBack={goBack}
            isMobile={true}
            formData={formData as Record<string, any>}
          />
        )}
        {currentStep === 9 && (
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
        <div className="fixed inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6 text-center">
            <div className="w-12 h-12 border-2 border-[#2B54FF] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-white text-sm font-medium">Finalizando cadastro...</p>
          </div>
        </div>
      )}
    </div>
  );
}
