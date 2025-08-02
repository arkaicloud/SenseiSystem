import React, { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import StudentOnboarding from "@/components/onboarding/StudentOnboarding";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const OnboardingPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isComplete, setIsComplete] = useState(false);
  const [studentData, setStudentData] = useState<any>(null);

  // Student registration mutation
  const { mutate: registerStudent, isPending } = useMutation({
    mutationFn: async (data: any) => {
      // Transform onboarding data to student registration format
      const studentRegistration = {
        // User data
        firstName: data.personalInfo.firstName,
        lastName: data.personalInfo.lastName,
        email: data.personalInfo.email,
        phone: data.personalInfo.phone,
        birthDate: data.personalInfo.birthDate,

        // Student specific data
        beltLevel: "white", // New students start with white belt
        stripes: 0,
        notes: data.healthForm.medicalDetails || "",

        // Address info
        address: data.personalInfo.address || "",

        // Additional personal info
        rg: data.personalInfo.rg,
        cpf: data.personalInfo.cpf,

        // Health information
        healthInfo: {
          hasCardiacProblems: data.healthForm.hasCardiacProblems,
          hasInjuries: data.healthForm.hasInjuries,
          takingMedication: data.healthForm.takingMedication,
          hasPhysicalLimitations: data.healthForm.hasPhysicalLimitations,
          hasRecentExams: data.healthForm.hasRecentExams,
          medicalDetails: data.healthForm.medicalDetails,
          hasMedicalClearance: data.healthForm.hasMedicalClearance
        },

        // Responsible party (if minor)
        responsibleParty: data.responsibleParty || null,

        // Consent information
        consent: data.consent,

        // Martial art preference
        martialArt: data.personalInfo.martialArt,

        // Registration metadata
        registrationDate: new Date().toISOString(),
        registrationMethod: "onboarding",
        status: "pending_approval" // Admin needs to approve
      };

      const res = await apiRequest('POST', '/api/students/register', studentRegistration);
      return res.json();
    },
    onSuccess: (data) => {
      setStudentData(data);
      setIsComplete(true);
      toast({
        title: "Cadastro Realizado com Sucesso!",
        description: "Sua solicitação de matrícula foi enviada e está aguardando aprovação.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro no Cadastro",
        description: `Falha ao processar sua matrícula: ${error.message || error}`,
        variant: "destructive",
      });
    },
  });

  const handleOnboardingComplete = (data: any) => {
    registerStudent(data);
  };

  const handleCancel = () => {
    setLocation("/");
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardContent className="pt-6 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Cadastro Realizado com Sucesso!
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Sua solicitação de matrícula foi enviada e está sendo processada.
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                Próximos Passos:
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 text-left">
                <li>• Nossa equipe irá revisar sua solicitação em até 24 horas</li>
                <li>• Você receberá um e-mail com o status da aprovação</li>
                <li>• Após aprovação, você receberá as informações de pagamento</li>
                <li>• Em caso de dúvidas, entre em contato conosco</li>
              </ul>
            </div>

            {studentData && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Número da Solicitação:</strong> #{studentData.id}
                  <br />
                  <strong>Nome:</strong> {studentData.user?.firstName} {studentData.user?.lastName}
                  <br />
                  <strong>E-mail:</strong> {studentData.user?.email}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <Button
                onClick={() => setLocation("/")}
                className="w-full"
              >
                Voltar à Página Inicial
              </Button>

              <Button
                variant="outline"
                onClick={() => setLocation("/")}
                className="w-full"
              >
                Entrar em Contato
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </Button>
        </div>

        <StudentOnboarding
          onBack={handleCancel}
          onSuccess={() => setLocation("/")}
        />
      </div>
    </div>
  );
};

export default OnboardingPage;