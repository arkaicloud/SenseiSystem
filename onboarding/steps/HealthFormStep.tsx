import React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Heart, AlertTriangle, FileText, Shield } from "lucide-react";

interface HealthFormStepProps {
  data: any;
  updateData: (data: any) => void;
  isMinor: boolean;
}

const HealthFormStep: React.FC<HealthFormStepProps> = ({ data, updateData }) => {
  const handleHealthChange = (field: string, value: boolean) => {
    updateData({
      healthForm: {
        ...data.healthForm,
        [field]: value
      }
    });
  };

  const handleTextChange = (field: string, value: string) => {
    updateData({
      healthForm: {
        ...data.healthForm,
        [field]: value
      }
    });
  };

  const healthQuestions = [
    {
      key: "hasCardiacProblems",
      question: "Possui algum problema cardíaco ou respiratório diagnosticado?",
      value: data.healthForm.hasCardiacProblems
    },
    {
      key: "hasInjuries",
      question: "Já sofreu lesões musculares ou ósseas relevantes?",
      value: data.healthForm.hasInjuries
    },
    {
      key: "takingMedication",
      question: "Está em tratamento médico ou faz uso contínuo de medicamentos?",
      value: data.healthForm.takingMedication
    },
    {
      key: "hasPhysicalLimitations",
      question: "Possui alguma limitação física que restrinja a prática esportiva?",
      value: data.healthForm.hasPhysicalLimitations
    },
    {
      key: "hasRecentExams",
      question: "Já realizou exames médicos recentes para atividades físicas?",
      value: data.healthForm.hasRecentExams
    }
  ];

  const hasAnyHealthIssue = healthQuestions.some(q => q.value === true);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-orange-800 dark:text-orange-200">
            <Heart className="w-5 h-5" />
            <span>Formulário de Avaliação de Aptidão Física</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-orange-700 dark:text-orange-300">
            Este formulário é fundamental para garantir sua segurança durante a prática de artes marciais. 
            Responda com sinceridade todas as perguntas abaixo.
          </p>
        </CardContent>
      </Card>

      {/* Health Questions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Condições de Saúde</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {healthQuestions.map((question, index) => (
            <div key={question.key} className="space-y-3">
              <Label className="text-base font-medium">
                {index + 1}. {question.question}
              </Label>
              <RadioGroup
                value={question.value ? "yes" : "no"}
                onValueChange={(value) => handleHealthChange(question.key, value === "yes")}
                className="flex space-x-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id={`${question.key}-yes`} />
                  <Label htmlFor={`${question.key}-yes`} className="text-sm">Sim</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id={`${question.key}-no`} />
                  <Label htmlFor={`${question.key}-no`} className="text-sm">Não</Label>
                </div>
              </RadioGroup>
            </div>
          ))}

          {hasAnyHealthIssue && (
            <div className="space-y-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <Label htmlFor="medicalDetails" className="text-base font-medium">
                Detalhes sobre as condições de saúde marcadas como "Sim":
              </Label>
              <Textarea
                id="medicalDetails"
                value={data.healthForm.medicalDetails}
                onChange={(e) => handleTextChange("medicalDetails", e.target.value)}
                placeholder="Descreva em detalhes as condições médicas, tratamentos, medicamentos ou limitações mencionadas acima..."
                rows={4}
              />
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasMedicalClearance"
                  checked={data.healthForm.hasMedicalClearance}
                  onCheckedChange={(checked) => handleHealthChange("hasMedicalClearance", checked as boolean)}
                />
                <Label htmlFor="hasMedicalClearance" className="text-sm">
                  Possuo atestado médico autorizando a prática de esportes
                </Label>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Important Notice */}
      <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-800 dark:text-red-200">
            <AlertTriangle className="w-5 h-5" />
            <span>Importante</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-red-700 dark:text-red-300">
            <p>
              <strong>Caso tenha marcado "Sim" em alguma das perguntas acima:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>É obrigatório apresentar laudo médico autorizando a prática de esportes</li>
              <li>O laudo deve ser emitido por um médico registrado no CRM</li>
              <li>A prática só será liberada após a apresentação do documento</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* School Information */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-800 dark:text-blue-200">
            <Shield className="w-5 h-5" />
            <span>Informações da Escola</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700 dark:text-blue-300">
            <div>
              <p><strong>Nome da Escola:</strong> SenseiSystem Academia</p>
              <p><strong>CNPJ:</strong> 00.000.000/0001-00</p>
              <p><strong>Modalidades:</strong> Jiu-Jitsu, Judô, Karatê, Muay Thai</p>
            </div>
            <div>
              <p><strong>Endereço:</strong> Rua Exemplo, 123 - Centro</p>
              <p><strong>Responsável Técnico:</strong> Professor João Silva</p>
              <p><strong>Registro CREF:</strong> 000000-G/SP</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HealthFormStep;