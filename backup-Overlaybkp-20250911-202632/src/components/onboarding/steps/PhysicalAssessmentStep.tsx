import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, ArrowRight, Heart, Shield } from "lucide-react";
import { useBeltLevels } from "@/hooks/useBeltLevels";

const physicalAssessmentSchema = z.object({
  // Health questionnaire fields - same as desktop
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
  birthDate?: string | Date; // Add birthDate prop to filter belts by age
}

export default function PhysicalAssessmentStep({ onNext, onBack, defaultValues, birthDate }: PhysicalAssessmentStepProps) {
  const { beltOptions, ageCategory } = useBeltLevels(birthDate, true); // Use public endpoint
  
  const form = useForm<PhysicalAssessmentType>({
    resolver: zodResolver(physicalAssessmentSchema),
    defaultValues: {
      hasHeartProblem: undefined,
      hasChestPain: undefined,
      hasBreathingProblem: undefined,
      hasBloodPressureProblem: undefined,
      hasBoneProblem: undefined,
      hasOtherHealthProblem: undefined,
      takeMedication: undefined,
      doctorRecommendation: undefined,
      medicalConditions: "",
      ...defaultValues,
    },
  });

  const handleSubmit = (data: PhysicalAssessmentType) => {
    onNext(data);
  };

  // Check if any health question was answered with "yes"
  const hasHealthIssues = form.watch(['hasHeartProblem', 'hasChestPain', 'hasBreathingProblem', 'hasBloodPressureProblem', 'hasBoneProblem', 'hasOtherHealthProblem', 'takeMedication'])
    .some(value => value === 'yes');

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <div className="flex justify-center mb-2">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Heart className="w-5 h-5 text-blue-600" />
          </div>
        </div>
        <h3 className="text-lg font-semibold">Questionário de Saúde</h3>
        <p className="text-sm text-gray-600 px-2">
          Para sua segurança, responda as perguntas sobre sua condição de saúde
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          
          {/* Health Questions */}
          <div className="space-y-5">
            <FormField
              control={form.control}
              name="hasHeartProblem"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">1. Você tem algum problema cardíaco?</FormLabel>
                  <FormControl>
                    <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-2 mt-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="heart-yes-mobile" />
                        <Label htmlFor="heart-yes-mobile" className="text-sm">Sim</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="heart-no-mobile" />
                        <Label htmlFor="heart-no-mobile" className="text-sm">Não</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hasChestPain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">2. Você sente dor no peito durante atividades físicas?</FormLabel>
                  <FormControl>
                    <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-2 mt-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="chest-yes-mobile" />
                        <Label htmlFor="chest-yes-mobile" className="text-sm">Sim</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="chest-no-mobile" />
                        <Label htmlFor="chest-no-mobile" className="text-sm">Não</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hasBreathingProblem"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">3. Você tem problemas respiratórios ou falta de ar?</FormLabel>
                  <FormControl>
                    <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-2 mt-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="breathing-yes-mobile" />
                        <Label htmlFor="breathing-yes-mobile" className="text-sm">Sim</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="breathing-no-mobile" />
                        <Label htmlFor="breathing-no-mobile" className="text-sm">Não</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hasBloodPressureProblem"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">4. Você tem problemas de pressão arterial?</FormLabel>
                  <FormControl>
                    <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-2 mt-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="pressure-yes-mobile" />
                        <Label htmlFor="pressure-yes-mobile" className="text-sm">Sim</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="pressure-no-mobile" />
                        <Label htmlFor="pressure-no-mobile" className="text-sm">Não</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hasBoneProblem"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">5. Você tem problemas ósseos ou articulares?</FormLabel>
                  <FormControl>
                    <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-2 mt-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="bone-yes-mobile" />
                        <Label htmlFor="bone-yes-mobile" className="text-sm">Sim</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="bone-no-mobile" />
                        <Label htmlFor="bone-no-mobile" className="text-sm">Não</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hasOtherHealthProblem"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">6. Você tem algum outro problema de saúde?</FormLabel>
                  <FormControl>
                    <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-2 mt-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="other-yes-mobile" />
                        <Label htmlFor="other-yes-mobile" className="text-sm">Sim</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="other-no-mobile" />
                        <Label htmlFor="other-no-mobile" className="text-sm">Não</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="takeMedication"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">7. Você toma algum medicamento regularmente?</FormLabel>
                  <FormControl>
                    <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-2 mt-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="medication-yes-mobile" />
                        <Label htmlFor="medication-yes-mobile" className="text-sm">Sim</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="medication-no-mobile" />
                        <Label htmlFor="medication-no-mobile" className="text-sm">Não</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="doctorRecommendation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">8. Algum médico já recomendou que você evite exercícios físicos?</FormLabel>
                  <FormControl>
                    <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-2 mt-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="doctor-yes-mobile" />
                        <Label htmlFor="doctor-yes-mobile" className="text-sm">Sim</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="doctor-no-mobile" />
                        <Label htmlFor="doctor-no-mobile" className="text-sm">Não</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {hasHealthIssues && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Como você indicou ter problemas de saúde, recomendamos consultar um médico antes de iniciar as atividades. Descreva seus problemas de saúde no campo abaixo.
              </AlertDescription>
            </Alert>
          )}

          <FormField
            control={form.control}
            name="medicalConditions"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Observações sobre sua saúde (opcional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descreva qualquer condição médica, medicamento ou observação importante..."
                    className="min-h-[80px] text-sm"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-col gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <Button
              type="submit"
              className="w-full"
            >
              Finalizar Matrícula
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}