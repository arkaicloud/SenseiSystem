import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, ArrowRight, Heart, AlertTriangle } from "lucide-react";

const physicalAssessmentSchema = z.object({
  hasHeartProblem: z.enum(["yes", "no"], { required_error: "Resposta obrigatória" }),
  hasChestPain: z.enum(["yes", "no"], { required_error: "Resposta obrigatória" }),
  hasBreathingProblem: z.enum(["yes", "no"], { required_error: "Resposta obrigatória" }),
  hasBloodPressureProblem: z.enum(["yes", "no"], { required_error: "Resposta obrigatória" }),
  hasBoneProblem: z.enum(["yes", "no"], { required_error: "Resposta obrigatória" }),
  hasOtherHealthProblem: z.enum(["yes", "no"], { required_error: "Resposta obrigatória" }),
  takeMedication: z.enum(["yes", "no"], { required_error: "Resposta obrigatória" }),
  doctorRecommendation: z.enum(["yes", "no"], { required_error: "Resposta obrigatória" }),
  medicalConditions: z.string().optional(),
});

export type PhysicalAssessmentType = z.infer<typeof physicalAssessmentSchema>;

interface PhysicalAssessmentStepProps {
  onNext: (data: PhysicalAssessmentType) => void;
  onBack: () => void;
  defaultValues?: Partial<PhysicalAssessmentType>;
  birthDate?: string | Date;
}

const QUESTIONS = [
  { name: "hasHeartProblem", label: "Você tem algum problema cardíaco?" },
  { name: "hasChestPain", label: "Você sente dor no peito durante atividades físicas?" },
  { name: "hasBreathingProblem", label: "Você tem problemas respiratórios ou falta de ar?" },
  { name: "hasBloodPressureProblem", label: "Você tem problemas de pressão arterial?" },
  { name: "hasBoneProblem", label: "Você tem problemas ósseos ou articulares?" },
  { name: "hasOtherHealthProblem", label: "Você tem algum outro problema de saúde?" },
  { name: "takeMedication", label: "Você toma algum medicamento regularmente?" },
  { name: "doctorRecommendation", label: "Algum médico já recomendou que você evite exercícios físicos?" },
] as const;

const labelCls = "text-slate-300 text-sm font-medium leading-relaxed";
const inputCls = "bg-white/5 border-white/10 text-white placeholder:text-slate-500 rounded-xl focus-visible:ring-[#2B54FF]/50 focus-visible:border-[#2B54FF]/50";

function YesNoToggle({ value, onChange, id }: { value?: string; onChange: (v: "yes" | "no") => void; id: string }) {
  return (
    <div className="flex gap-2 mt-2">
      <button
        type="button"
        id={`${id}-no`}
        onClick={() => onChange("no")}
        className={`flex-1 h-11 rounded-xl border text-sm font-medium transition-all ${
          value === "no"
            ? "bg-[#2B54FF] border-[#2B54FF] text-white"
            : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20"
        }`}
      >
        Não
      </button>
      <button
        type="button"
        id={`${id}-yes`}
        onClick={() => onChange("yes")}
        className={`flex-1 h-11 rounded-xl border text-sm font-medium transition-all ${
          value === "yes"
            ? "bg-orange-500 border-orange-500 text-white"
            : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20"
        }`}
      >
        Sim
      </button>
    </div>
  );
}

export default function PhysicalAssessmentStep({ onNext, onBack, defaultValues }: PhysicalAssessmentStepProps) {
  const form = useForm<PhysicalAssessmentType>({
    resolver: zodResolver(physicalAssessmentSchema),
    defaultValues: {
      medicalConditions: "",
      ...defaultValues,
      // Sem defaults para as perguntas — usuário deve selecionar explicitamente
    },
  });

  const watchedFields = form.watch(QUESTIONS.map((q) => q.name) as any);
  const hasHealthIssues = Object.values(watchedFields as Record<string, string>).some((v) => v === "yes");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onNext)} className="flex flex-col pb-6">
        <div className="px-6 pt-8 pb-6">
          <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center mb-4">
            <Heart className="w-6 h-6 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Questionário de Saúde</h2>
          <p className="text-sm text-slate-400 mt-1">Para sua segurança, responda todas as perguntas abaixo</p>
        </div>

        <div className="px-6 space-y-5">
          {QUESTIONS.map((q, i) => (
            <FormField
              key={q.name}
              control={form.control}
              name={q.name}
              render={({ field }) => (
                <FormItem className={`rounded-2xl p-4 border transition-colors ${
                  field.value
                    ? field.value === "yes"
                      ? "bg-orange-500/10 border-orange-500/30"
                      : "bg-white/5 border-white/10"
                    : "bg-white/5 border-white/20"
                }`}>
                  <FormLabel className={labelCls}>
                    <span className="text-[#2B54FF] font-bold mr-1">{i + 1}.</span> {q.label}
                  </FormLabel>
                  <FormControl>
                    <YesNoToggle
                      value={field.value}
                      onChange={field.onChange}
                      id={`q-${q.name}`}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400 text-xs mt-1" />
                </FormItem>
              )}
            />
          ))}

          {hasHealthIssues && (
            <Alert className="border-orange-500/30 bg-orange-500/10">
              <AlertTriangle className="h-4 w-4 text-orange-400" />
              <AlertDescription className="text-orange-300 text-sm">
                Como você indicou ter problemas de saúde, recomendamos consultar um médico antes de iniciar as atividades. Um atestado médico será necessário.
              </AlertDescription>
            </Alert>
          )}

          <FormField
            control={form.control}
            name="medicalConditions"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelCls}>Observações sobre sua saúde (opcional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descreva qualquer condição médica, medicamento ou observação importante..."
                    className={`min-h-[80px] text-sm resize-none ${inputCls}`}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-red-400 text-xs" />
              </FormItem>
            )}
          />

          <div className="pt-2 space-y-3">
            <Button type="submit" className="w-full h-14 bg-[#2B54FF] hover:bg-[#2B54FF]/90 text-white font-semibold rounded-2xl text-base">
              Continuar <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button type="button" onClick={onBack} className="w-full h-12 bg-transparent border border-white/15 text-slate-300 hover:bg-white/5 rounded-2xl text-sm">
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
