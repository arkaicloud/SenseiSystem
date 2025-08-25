import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Heart, Activity, FileText, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface HealthFormStepProps {
  onNext: () => void;
  onPrevious: () => void;
  studentId?: number;
}

export interface HealthAnswer {
  key: string;
  question: string;
  value: "yes" | "no" | null;
}

const HEALTH_QUESTIONS: Omit<HealthAnswer, "value">[] = [
  {
    key: "hasHeartProblem",
    question: "Você tem ou já teve algum problema cardíaco?",
  },
  {
    key: "hasChestPain",
    question: "Você sente dores no peito durante atividades físicas?",
  },
  {
    key: "hasBreathingProblem",
    question: "Você tem dificuldades respiratórias ou asma?",
  },
  {
    key: "hasBloodPressureProblem",
    question: "Você tem pressão alta ou problemas de circulação?",
  },
  {
    key: "hasBoneProblem",
    question: "Você tem problemas ósseos, articulares ou musculares?",
  },
  {
    key: "hasOtherHealthProblem",
    question: "Você tem algum outro problema de saúde conhecido?",
  },
  {
    key: "takeMedication",
    question: "Você toma alguma medicação regularmente?",
  },
  {
    key: "doctorRecommendation",
    question: "Algum médico já recomendou que você evite atividades físicas intensas?",
  },
];

export default function HealthFormStep({ onNext, onPrevious, studentId }: HealthFormStepProps) {
  const [answers, setAnswers] = useState<HealthAnswer[]>(
    HEALTH_QUESTIONS.map(q => ({ ...q, value: null }))
  );
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRiskWarning, setShowRiskWarning] = useState(false);
  const [allAnswered, setAllAnswered] = useState(false);
  const { toast } = useToast();

  // Verifica se todas as perguntas foram respondidas
  useEffect(() => {
    const answered = answers.every(answer => answer.value !== null);
    setAllAnswered(answered);
    
    // Verifica se há respostas de risco
    const hasRisk = answers.some(answer => answer.value === "yes");
    setShowRiskWarning(hasRisk);
  }, [answers]);

  const handleAnswerChange = (questionKey: string, value: "yes" | "no") => {
    setAnswers(prev => prev.map(answer => 
      answer.key === questionKey ? { ...answer, value } : answer
    ));
  };

  const handleSubmit = async () => {
    if (!allAnswered) {
      toast({
        title: "Perguntas não respondidas",
        description: "Por favor, responda todas as perguntas antes de continuar.",
        variant: "destructive",
      });
      return;
    }

    if (!agreedToTerms) {
      toast({
        title: "Concordância obrigatória",
        description: "É necessário concordar com os termos para validação jurídica.",
        variant: "destructive",
      });
      return;
    }

    if (!studentId) {
      toast({
        title: "Erro",
        description: "ID do estudante não encontrado.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/students/${studentId}/health-questionnaire`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answers,
          agreedToTerms: true,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Erro ao salvar questionário");
      }

      if (result.risky) {
        toast({
          title: "Atenção - Atestado Médico Necessário",
          description: "Devido às suas respostas, será necessário apresentar um atestado médico para participar das atividades.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Questionário salvo com sucesso!",
          description: "Suas informações de saúde foram registradas.",
        });
      }

      // Avançar para próxima etapa
      onNext();

    } catch (error: any) {
      console.error("Erro ao salvar questionário:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar questionário de saúde.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="health-form-step">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-red-500" />
            Questionário de Saúde (PAR-Q+)
          </CardTitle>
          <CardDescription>
            Este questionário é obrigatório para identificar possíveis riscos à sua saúde durante a prática de artes marciais.
            Todas as informações são confidenciais e protegidas pela Lei Geral de Proteção de Dados (LGPD).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Instruções */}
          <Alert>
            <Activity className="h-4 w-4" />
            <AlertDescription>
              <strong>Importante:</strong> Responda com sinceridade. Estas informações são fundamentais 
              para garantir sua segurança durante as atividades físicas.
            </AlertDescription>
          </Alert>

          {/* Perguntas */}
          <div className="space-y-4">
            {answers.map((answer, index) => (
              <div key={answer.key} className="space-y-3">
                <Label className="text-sm font-medium leading-relaxed">
                  {index + 1}. {answer.question}
                </Label>
                <div className="flex gap-4 ml-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={`${answer.key}-yes`}
                      name={answer.key}
                      value="yes"
                      checked={answer.value === "yes"}
                      onChange={() => handleAnswerChange(answer.key, "yes")}
                      className="text-red-600"
                      data-testid={`radio-${answer.key}-yes`}
                    />
                    <Label htmlFor={`${answer.key}-yes`} className="text-red-600 font-medium">
                      Sim
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={`${answer.key}-no`}
                      name={answer.key}
                      value="no"
                      checked={answer.value === "no"}
                      onChange={() => handleAnswerChange(answer.key, "no")}
                      className="text-green-600"
                      data-testid={`radio-${answer.key}-no`}
                    />
                    <Label htmlFor={`${answer.key}-no`} className="text-green-600 font-medium">
                      Não
                    </Label>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Aviso de risco */}
          {showRiskWarning && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Atenção:</strong> Baseado em suas respostas, recomendamos que você apresente 
                um atestado médico liberando a prática de atividades físicas antes de iniciar as aulas.
              </AlertDescription>
            </Alert>
          )}

          <Separator />

          {/* Termo de concordância */}
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="agree-terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                data-testid="checkbox-agree-terms"
              />
              <div className="grid gap-2 leading-relaxed text-sm">
                <Label htmlFor="agree-terms" className="cursor-pointer">
                  <strong>Declaração e Concordância</strong>
                </Label>
                <p className="text-muted-foreground">
                  Eu declaro que as informações fornecidas são verdadeiras e completas. 
                  Estou ciente de que a omissão ou falsidade de informações pode comprometer 
                  minha segurança durante a prática de atividades físicas. Concordo com o 
                  processamento destes dados conforme a Lei Geral de Proteção de Dados (LGPD), 
                  sendo utilizados exclusivamente para fins de segurança e saúde na prática esportiva.
                </p>
              </div>
            </div>
          </div>

          {/* Progresso */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>
              {answers.filter(a => a.value !== null).length} de {answers.length} perguntas respondidas
            </span>
            {allAnswered && (
              <CheckCircle className="h-4 w-4 text-green-600 ml-2" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Botões de navegação */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={isSubmitting}
          data-testid="button-previous"
        >
          Voltar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!allAnswered || !agreedToTerms || isSubmitting}
          data-testid="button-submit-health"
        >
          {isSubmitting ? "Salvando..." : "Salvar e Continuar"}
        </Button>
      </div>
    </div>
  );
}