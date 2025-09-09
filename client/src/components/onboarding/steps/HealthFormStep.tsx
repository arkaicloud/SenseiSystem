import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Heart, Activity, FileText, AlertTriangle, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useBeltLevels } from "@/hooks/useBeltLevels";

interface HealthFormStepProps {
  onNext: (healthData: {
    healthAnswers: HealthAnswer[];
    agreedToHealthTerms: boolean;
    healthTermsAgreedAt: string;
    beltLevel?: string;
    stripes?: number;
  }) => void;
  onPrevious: () => void;
  defaultValues?: any;
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

export default function HealthFormStep({ onNext, onPrevious, defaultValues }: HealthFormStepProps) {
  const [answers, setAnswers] = useState<HealthAnswer[]>(
    HEALTH_QUESTIONS.map(q => ({ 
      ...q, 
      value: defaultValues?.healthAnswers?.find((a: HealthAnswer) => a.key === q.key)?.value || null 
    }))
  );
  const [agreedToTerms, setAgreedToTerms] = useState(defaultValues?.agreedToHealthTerms || false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRiskWarning, setShowRiskWarning] = useState(false);
  const [allAnswered, setAllAnswered] = useState(false);
  
  // Belt level states
  const [selectedBeltLevel, setSelectedBeltLevel] = useState<string>(defaultValues?.beltLevel || 'white');
  const [selectedStripes, setSelectedStripes] = useState<number>(defaultValues?.stripes || 0);
  
  const { toast } = useToast();
  const { beltOptions, isLoading: loadingBelts } = useBeltLevels(undefined, true);

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

    setIsSubmitting(true);

    try {
      // Gerar timestamp da assinatura eletrônica
      const healthTermsAgreedAt = new Date().toISOString();

      // Preparar dados do questionário para serem salvos com o registro do aluno
      const healthData = {
        healthAnswers: answers,
        agreedToHealthTerms: true,
        healthTermsAgreedAt,
        beltLevel: selectedBeltLevel,
        stripes: selectedStripes
      };

      // Verificar se há respostas de risco para mostrar aviso
      const hasRisk = answers.some(answer => answer.value === "yes");
      
      if (hasRisk) {
        toast({
          title: "Atenção - Atestado Médico Necessário",
          description: "Devido às suas respostas, será necessário apresentar um atestado médico para participar das atividades.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Questionário preenchido com sucesso!",
          description: "Suas informações de saúde foram registradas. Continue para finalizar sua matrícula.",
        });
      }

      // Passar dados para próxima etapa (serão salvos no registro final)
      onNext(healthData);

    } catch (error: any) {
      console.error("Erro ao processar questionário:", error);
      toast({
        title: "Erro",
        description: "Erro ao processar questionário de saúde.",
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

          {/* Seção de Graduação */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Award className="h-5 w-5" />
                Graduação Atual
              </CardTitle>
              <CardDescription className="text-blue-600">
                Informe sua graduação atual no Jiu-Jitsu (faixa e grau)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="belt-level" className="text-sm font-medium">
                    Faixa Atual *
                  </Label>
                  <Select 
                    value={selectedBeltLevel} 
                    onValueChange={setSelectedBeltLevel}
                    disabled={loadingBelts}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione sua faixa" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingBelts ? (
                        <SelectItem value="loading" disabled>
                          Carregando faixas...
                        </SelectItem>
                      ) : (
                        beltOptions.map((belt) => (
                          <SelectItem key={belt.value} value={belt.value}>
                            <span className="flex items-center gap-2">
                              <div 
                                className="w-4 h-4 rounded border border-gray-300" 
                                style={{ backgroundColor: belt.color }}
                              />
                              {belt.label}
                            </span>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stripes" className="text-sm font-medium">
                    Grau (Listras)
                  </Label>
                  <Select 
                    value={selectedStripes.toString()} 
                    onValueChange={(value) => setSelectedStripes(Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Número de listras" />
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2, 3, 4].map((stripe) => (
                        <SelectItem key={stripe} value={stripe.toString()}>
                          {stripe} {stripe === 1 ? 'listra' : 'listras'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Alert>
                <Activity className="h-4 w-4" />
                <AlertDescription>
                  <strong>Iniciante?</strong> Se você nunca praticou Jiu-Jitsu, mantenha selecionado "Faixa Branca" com "0 listras".
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

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