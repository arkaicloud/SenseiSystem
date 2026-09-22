import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  onBack: () => void;
  defaultValues?: any;
}

export interface HealthAnswer {
  key: string;
  question: string;
  value: "yes" | "no" | null;
}

const HEALTH_QUESTIONS: Omit<HealthAnswer, "value">[] = [
  { key: "hasHeartProblem", question: "Você tem ou já teve algum problema cardíaco?" },
  { key: "hasChestPain", question: "Você sente dores no peito durante atividades físicas?" },
  { key: "hasBreathingProblem", question: "Você tem dificuldades respiratórias ou asma?" },
  { key: "hasBloodPressureProblem", question: "Você tem pressão alta ou problemas de circulação?" },
  { key: "hasBoneProblem", question: "Você tem problemas ósseos, articulares ou musculares?" },
  { key: "hasOtherHealthProblem", question: "Você tem algum outro problema de saúde conhecido?" },
  { key: "takeMedication", question: "Você toma alguma medicação regularmente?" },
  { key: "doctorRecommendation", question: "Algum médico já recomendou que você evite atividades físicas intensas?" },
];

const selectCls = "h-12 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 [color-scheme:dark]";

export default function HealthFormStep({ onNext, onBack, defaultValues }: HealthFormStepProps) {
  const [answers, setAnswers] = useState<HealthAnswer[]>(
    HEALTH_QUESTIONS.map(q => ({
      ...q,
      value: defaultValues?.healthAnswers?.find((a: HealthAnswer) => a.key === q.key)?.value || null,
    }))
  );
  const [agreedToTerms, setAgreedToTerms] = useState(defaultValues?.agreedToHealthTerms || false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRiskWarning, setShowRiskWarning] = useState(false);
  const [allAnswered, setAllAnswered] = useState(false);
  const [selectedBeltLevel, setSelectedBeltLevel] = useState<string>(defaultValues?.beltLevel || 'white');
  const [selectedStripes, setSelectedStripes] = useState<number>(defaultValues?.stripes || 0);

  const { toast } = useToast();
  const { beltOptions, isLoading: loadingBelts } = useBeltLevels(undefined, true);

  useEffect(() => {
    setAllAnswered(answers.every(a => a.value !== null));
    setShowRiskWarning(answers.some(a => a.value === "yes"));
  }, [answers]);

  const handleAnswerChange = (questionKey: string, value: "yes" | "no") => {
    setAnswers(prev => prev.map(a => a.key === questionKey ? { ...a, value } : a));
  };

  const handleSubmit = async () => {
    if (!allAnswered) {
      toast({ title: "Perguntas não respondidas", description: "Responda todas as perguntas antes de continuar.", variant: "destructive" });
      return;
    }
    if (!agreedToTerms) {
      toast({ title: "Concordância obrigatória", description: "É necessário concordar com os termos para validação jurídica.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const healthTermsAgreedAt = new Date().toISOString();
      const hasRisk = answers.some(a => a.value === "yes");
      if (hasRisk) {
        toast({ title: "Atenção - Atestado Médico Necessário", description: "Será necessário apresentar um atestado médico para participar das atividades.", variant: "destructive" });
      } else {
        toast({ title: "Questionário preenchido!", description: "Suas informações de saúde foram registradas. Continue para finalizar." });
      }
      onNext({ healthAnswers: answers, agreedToHealthTerms: true, healthTermsAgreedAt, beltLevel: selectedBeltLevel, stripes: selectedStripes });
    } catch {
      toast({ title: "Erro", description: "Erro ao processar questionário de saúde.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const answeredCount = answers.filter(a => a.value !== null).length;

  return (
    <div className="max-w-2xl mx-auto space-y-6" data-testid="health-form-step">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center mx-auto">
          <Heart className="w-7 h-7 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-white">Saúde e Graduação</h2>
        <p className="text-muted-foreground text-sm">Questionário de saúde PAR-Q+ e sua graduação atual</p>
      </div>

      {/* Info banner */}
      <div className="bg-primary/10 border border-[#2B54FF]/20 rounded-xl p-4 flex items-start gap-3">
        <Activity className="w-5 h-5 text-[#7B9FFF] mt-0.5 shrink-0" />
        <p className="text-sm text-[#7B9FFF] leading-relaxed">
          <strong className="text-white">Importante:</strong> Responda com sinceridade. Estas informações são fundamentais para garantir sua segurança durante as atividades físicas. Dados protegidos pela LGPD.
        </p>
      </div>

      {/* Questions */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-white font-semibold">Questionário de Saúde</h3>
          <span className="text-xs text-muted-foreground">{answeredCount}/{answers.length} respondidas</span>
        </div>

        {answers.map((answer, index) => (
          <div key={answer.key} className="space-y-2.5 pb-4 border-b border-white/5 last:border-0 last:pb-0">
            <p className="text-muted-foreground text-sm font-medium leading-relaxed">
              {index + 1}. {answer.question}
            </p>
            <div className="flex gap-3 ml-2">
              {(["yes", "no"] as const).map((opt) => (
                <label
                  key={opt}
                  className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border transition-all text-sm font-medium ${
                    answer.value === opt
                      ? opt === "yes"
                        ? "bg-red-500/20 border-red-500/50 text-red-400"
                        : "bg-green-500/20 border-green-500/50 text-green-400"
                      : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
                  }`}
                >
                  <input
                    type="radio"
                    name={answer.key}
                    value={opt}
                    checked={answer.value === opt}
                    onChange={() => handleAnswerChange(answer.key, opt)}
                    className="hidden"
                    data-testid={`radio-${answer.key}-${opt}`}
                  />
                  {opt === "yes" ? "Sim" : "Não"}
                </label>
              ))}
            </div>
          </div>
        ))}

        {/* Progress bar */}
        <div className="pt-2">
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${(answeredCount / answers.length) * 100}%` }}
            />
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <FileText className="w-3.5 h-3.5" />
            {answeredCount} de {answers.length} perguntas respondidas
            {allAnswered && <CheckCircle className="w-3.5 h-3.5 text-green-400 ml-1" />}
          </div>
        </div>
      </div>

      {/* Risk warning */}
      {showRiskWarning && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5 shrink-0" />
          <p className="text-sm text-orange-300 leading-relaxed">
            <strong>Atenção:</strong> Com base em suas respostas, recomendamos que você apresente um atestado médico liberando a prática de atividades físicas antes de iniciar as aulas.
          </p>
        </div>
      )}

      {/* Belt section */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-primary/20 border border-[#2B54FF]/40 flex items-center justify-center">
            <Award className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Graduação Atual</h3>
            <p className="text-muted-foreground text-xs">Informe sua faixa e grau no Jiu-Jitsu</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-muted-foreground text-sm font-medium">Faixa Atual *</label>
            <Select
              value={loadingBelts ? undefined : selectedBeltLevel}
              onValueChange={setSelectedBeltLevel}
              disabled={loadingBelts}
            >
              <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white rounded-xl">
                <SelectValue placeholder={loadingBelts ? "Carregando faixas..." : "Selecione sua faixa"} />
              </SelectTrigger>
              <SelectContent className="bg-secondary border-white/10 text-white">
                {loadingBelts ? null : beltOptions.length > 0 ? (
                  beltOptions.map((belt) => (
                    <SelectItem key={belt.value} value={belt.value} className="text-white focus:bg-white/10 focus:text-white">
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded border border-white/20" style={{ backgroundColor: belt.color }} />
                        {belt.label}
                      </span>
                    </SelectItem>
                  ))
                ) : (
                  <>
                    <SelectItem value="white" className="text-white focus:bg-white/10 focus:text-white">Faixa Branca</SelectItem>
                    <SelectItem value="blue" className="text-white focus:bg-white/10 focus:text-white">Faixa Azul</SelectItem>
                    <SelectItem value="purple" className="text-white focus:bg-white/10 focus:text-white">Faixa Roxa</SelectItem>
                    <SelectItem value="brown" className="text-white focus:bg-white/10 focus:text-white">Faixa Marrom</SelectItem>
                    <SelectItem value="black" className="text-white focus:bg-white/10 focus:text-white">Faixa Preta</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-muted-foreground text-sm font-medium">Grau (Listras)</label>
            <select
              value={selectedStripes.toString()}
              onChange={(e) => setSelectedStripes(Number(e.target.value))}
              className={selectCls}
            >
              {[0, 1, 2, 3, 4].map((stripe) => (
                <option key={stripe} value={stripe.toString()}>
                  {stripe} {stripe === 1 ? 'listra' : 'listras'}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-primary/10 border border-[#2B54FF]/20 rounded-xl p-3 flex items-start gap-2 text-xs text-[#7B9FFF]">
          <Activity className="w-4 h-4 mt-0.5 shrink-0" />
          <span><strong className="text-white">Iniciante?</strong> Se nunca praticou Jiu-Jitsu, mantenha "Faixa Branca" com "0 listras".</span>
        </div>
      </div>

      {/* Terms */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <label className="flex items-start gap-4 cursor-pointer group">
          <div
            onClick={() => setAgreedToTerms(!agreedToTerms)}
            className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
              agreedToTerms ? 'bg-primary border-[#2B54FF]' : 'bg-white/5 border-white/20 group-hover:border-[#2B54FF]/50'
            }`}
            data-testid="checkbox-agree-terms"
          >
            {agreedToTerms && <CheckCircle className="w-4 h-4 text-white" />}
          </div>
          <div>
            <p className="text-white font-medium text-sm">Declaração e Concordância</p>
            <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
              Eu declaro que as informações fornecidas são verdadeiras e completas. Estou ciente de que a omissão ou falsidade de informações pode comprometer minha segurança durante a prática de atividades físicas. Concordo com o processamento destes dados conforme a LGPD, sendo utilizados exclusivamente para fins de segurança e saúde na prática esportiva.
            </p>
          </div>
        </label>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="h-12 px-6 rounded-xl border border-white/20 text-white hover:bg-white/10 disabled:opacity-50 transition-colors flex items-center gap-2 font-medium"
          data-testid="button-previous"
        >
          ← Voltar
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!allAnswered || !agreedToTerms || isSubmitting}
          className="h-12 px-8 rounded-xl bg-primary hover:bg-[#2348db] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors"
          data-testid="button-submit-health"
        >
          {isSubmitting ? "Salvando..." : "Salvar e Continuar →"}
        </button>
      </div>
    </div>
  );
}
