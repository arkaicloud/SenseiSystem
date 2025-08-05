import React, { useState, useEffect } from "react";
import { Button } from "../client/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../client/src/components/ui/card";
import { Progress } from "../client/src/components/ui/progress";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import PersonalInfoStep from "./steps/PersonalInfoStep";
import HealthFormStep from "./steps/HealthFormStep";
import ResponsiblePartyStep from "./steps/ResponsiblePartyStep";
import DocumentsStep from "./steps/DocumentsStep";
import ReviewStep from "./steps/ReviewStep";
// import { useQuery } from "@tanstack/react-query";
// import type { SchoolConfig } from "../shared/schema";

interface OnboardingData {
  personalInfo: {
    firstName: string;
    lastName: string;
    birthDate: string;
    rg: string;
    cpf: string;
    email: string;
    phone: string;
    address: string;
    martialArt: string;
  };
  healthForm: {
    hasCardiacProblems: boolean;
    hasInjuries: boolean;
    takingMedication: boolean;
    hasPhysicalLimitations: boolean;
    hasRecentExams: boolean;
    medicalDetails: string;
    hasMedicalClearance: boolean;
  };
  responsibleParty?: {
    name: string;
    relationship: string;
    cpf: string;
    emergencyContact: string;
  };
  documents: {
    medicalClearance?: File;
    idDocument?: File;
    proofOfAddress?: File;
  };
  consent: {
    healthDeclaration: boolean;
    riskAwareness: boolean;
    dataProcessing: boolean;
  };
}

interface OnboardingWizardProps {
  onComplete: (data: OnboardingData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  registrationError?: string;
  onRetryWithNewEmail?: () => void;
}

// Chave para o localStorage
const ONBOARDING_CACHE_KEY = "senseisystem_onboarding_cache";

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  onComplete,
  onCancel,
  isLoading = false,
  registrationError,
  onRetryWithNewEmail
}) => {
  // Configuração padrão da escola (sem dependência de API)
  const schoolConfig = {
    schoolName: "SenseiSystem Academia",
    logoUrl: null
  };

  // Função para carregar dados do localStorage
  const loadCachedData = (): OnboardingData => {
    try {
      const cached = localStorage.getItem(ONBOARDING_CACHE_KEY);
      if (cached) {
        const parsedData = JSON.parse(cached);
        console.log('📥 Dados carregados do cache:', parsedData);
        return parsedData;
      }
    } catch (error) {
      console.warn('⚠️ Erro ao carregar cache:', error);
    }
    
    // Dados padrão se não houver cache
    return {
      personalInfo: {
        firstName: "",
        lastName: "",
        birthDate: "",
        rg: "",
        cpf: "",
        email: "",
        phone: "",
        address: "",
        martialArt: "jiu-jitsu"
      },
      healthForm: {
        hasCardiacProblems: false,
        hasInjuries: false,
        takingMedication: false,
        hasPhysicalLimitations: false,
        hasRecentExams: false,
        medicalDetails: "",
        hasMedicalClearance: false
      },
      documents: {},
      consent: {
        healthDeclaration: false,
        riskAwareness: false,
        dataProcessing: false
      }
    };
  };

  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(loadCachedData());

  // Salvar dados no localStorage sempre que houver mudança
  useEffect(() => {
    try {
      localStorage.setItem(ONBOARDING_CACHE_KEY, JSON.stringify(data));
      console.log('💾 Dados salvos no cache');
    } catch (error) {
      console.warn('⚠️ Erro ao salvar cache:', error);
    }
  }, [data]);

  // Função para limpar cache após cadastro bem-sucedido
  const clearCache = () => {
    try {
      localStorage.removeItem(ONBOARDING_CACHE_KEY);
      console.log('🗑️ Cache limpo após cadastro concluído');
    } catch (error) {
      console.warn('⚠️ Erro ao limpar cache:', error);
    }
  };

  const steps = [
    {
      id: "personal",
      title: "Informações Pessoais",
      description: "Dados básicos do aluno",
      component: PersonalInfoStep
    },
    {
      id: "health",
      title: "Avaliação de Saúde",
      description: "Formulário de aptidão física",
      component: HealthFormStep
    },
    {
      id: "responsible",
      title: "Responsável Legal",
      description: "Para menores de 18 anos",
      component: ResponsiblePartyStep
    },
    {
      id: "documents",
      title: "Documentos",
      description: "Upload de documentos necessários",
      component: DocumentsStep
    },
    {
      id: "review",
      title: "Revisão e Confirmação",
      description: "Confirme seus dados",
      component: ReviewStep
    }
  ];

  const isMinor = () => {
    if (!data.personalInfo.birthDate) return false;
    const birthDate = new Date(data.personalInfo.birthDate);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    return age < 18;
  };

  const getVisibleSteps = () => {
    if (isMinor()) {
      return steps;
    }
    return steps.filter(step => step.id !== "responsible");
  };

  const visibleSteps = getVisibleSteps();
  const progressPercentage = ((currentStep + 1) / visibleSteps.length) * 100;

  const updateData = (stepData: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...stepData }));
  };

  // Função para resetar email específico em caso de erro
  const resetEmailField = () => {
    setData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        email: ""
      }
    }));
    setCurrentStep(0); // Volta para o primeiro passo
  };

  const goNext = () => {
    if (currentStep < visibleSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    const currentStepId = visibleSteps[currentStep].id;
    
    switch (currentStepId) {
      case "personal":
        return data.personalInfo.firstName && 
               data.personalInfo.lastName && 
               data.personalInfo.birthDate &&
               data.personalInfo.cpf &&
               data.personalInfo.email &&
               data.personalInfo.phone;
      
      case "health":
        return true; // Health form can be partially filled
      
      case "responsible":
        return !isMinor() || (data.responsibleParty?.name && data.responsibleParty?.cpf);
      
      case "documents":
        return true; // Documents are optional but recommended
      
      case "review":
        return data.consent.healthDeclaration && 
               data.consent.riskAwareness && 
               data.consent.dataProcessing;
      
      default:
        return true;
    }
  };

  const handleComplete = () => {
    // Limpar cache após envio bem-sucedido
    clearCache();
    onComplete(data);
  };

  const CurrentStepComponent = visibleSteps[currentStep].component;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        {/* Logo da escola */}
        {schoolConfig.logoUrl && (
          <div className="flex justify-center">
            <img 
              src={schoolConfig.logoUrl} 
              alt="Logo da escola"
              className="max-h-20 w-auto object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}
        
        {/* Nome da escola e mensagem de boas-vindas */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-primary">
            Bem-vindo à {schoolConfig.schoolName}!
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Complete seu cadastro em algumas etapas simples
          </p>
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
              <span>Etapa {currentStep + 1} de {visibleSteps.length}</span>
              <span>{Math.round(progressPercentage)}% completo</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            
            {/* Step indicators */}
            <div className="flex justify-between">
              {visibleSteps.map((step, index) => (
                <div key={step.id} className="flex flex-col items-center space-y-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index < currentStep 
                      ? "bg-green-500 text-white" 
                      : index === currentStep 
                        ? "bg-primary text-white" 
                        : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                  }`}>
                    {index < currentStep ? <Check className="w-4 h-4" /> : index + 1}
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-medium">{step.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{step.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Erro de registro */}
      {registrationError && (
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <div className="text-red-600 dark:text-red-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Erro no cadastro
                </h3>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                  {registrationError}
                </p>
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
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{visibleSteps[currentStep].title}</CardTitle>
        </CardHeader>
        <CardContent>
          <CurrentStepComponent 
            data={data}
            updateData={updateData}
            isMinor={isMinor()}
          />
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          {currentStep > 0 && (
            <Button 
              variant="outline" 
              onClick={goBack}
              disabled={isLoading}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Voltar
            </Button>
          )}
        </div>

        <div>
          {currentStep < visibleSteps.length - 1 ? (
            <Button 
              onClick={goNext}
              disabled={!canProceed() || isLoading}
            >
              Próximo
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button 
              onClick={handleComplete}
              disabled={!canProceed() || isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? "Processando..." : "Finalizar Cadastro"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;