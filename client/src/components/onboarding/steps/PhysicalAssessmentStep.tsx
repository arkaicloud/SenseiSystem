import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, ArrowRight, Activity, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const physicalAssessmentSchema = z.object({
  hasHealthIssues: z.boolean().default(false),
  healthIssuesDescription: z.string().optional(),
  takeMedications: z.boolean().default(false),
  medicationsDescription: z.string().optional(),
  hasAllergies: z.boolean().default(false),
  allergiesDescription: z.string().optional(),
  exerciseRegularly: z.boolean().default(false),
  exerciseDescription: z.string().optional(),
  hasInjuries: z.boolean().default(false),
  injuriesDescription: z.string().optional(),
  emergencyMedicalInfo: z.string().optional(),
  doctorClearance: z.boolean().default(false),
});

export type PhysicalAssessmentType = z.infer<typeof physicalAssessmentSchema>;

interface PhysicalAssessmentStepProps {
  onNext: (data: PhysicalAssessmentType) => void;
  onBack: () => void;
  defaultValues?: Partial<PhysicalAssessmentType>;
}

export default function PhysicalAssessmentStep({ onNext, onBack, defaultValues }: PhysicalAssessmentStepProps) {
  const form = useForm<PhysicalAssessmentType>({
    resolver: zodResolver(physicalAssessmentSchema),
    defaultValues: {
      hasHealthIssues: false,
      healthIssuesDescription: "",
      takeMedications: false,
      medicationsDescription: "",
      hasAllergies: false,
      allergiesDescription: "",
      exerciseRegularly: false,
      exerciseDescription: "",
      hasInjuries: false,
      injuriesDescription: "",
      emergencyMedicalInfo: "",
      doctorClearance: false,
      ...defaultValues,
    },
  });

  const handleSubmit = (data: PhysicalAssessmentType) => {
    onNext(data);
  };

  const watchHasHealthIssues = form.watch("hasHealthIssues");
  const watchTakeMedications = form.watch("takeMedications");
  const watchHasAllergies = form.watch("hasAllergies");
  const watchExerciseRegularly = form.watch("exerciseRegularly");
  const watchHasInjuries = form.watch("hasInjuries");

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <div className="flex justify-center mb-2">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Activity className="w-5 h-5 text-blue-600" />
          </div>
        </div>
        <h3 className="text-lg font-semibold mb-1">Avaliação Física</h3>
        <p className="text-sm text-muted-foreground px-2">
          Informações sobre sua saúde e condicionamento físico
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          
          {/* Problemas de Saúde */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Condições de Saúde</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="hasHealthIssues"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-base font-medium">
                        Possui algum problema de saúde ou condição médica?
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {watchHasHealthIssues && (
                <FormField
                  control={form.control}
                  name="healthIssuesDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Descreva os problemas de saúde:</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Ex: Hipertensão, diabetes, problemas cardíacos..."
                          {...field} 
                          className="text-base"
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {/* Medicamentos */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <FormField
                control={form.control}
                name="takeMedications"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-base font-medium">
                        Faz uso regular de medicamentos?
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {watchTakeMedications && (
                <FormField
                  control={form.control}
                  name="medicationsDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Quais medicamentos:</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Liste os medicamentos e dosagens..."
                          {...field} 
                          className="text-base"
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {/* Alergias */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <FormField
                control={form.control}
                name="hasAllergies"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-base font-medium">
                        Possui alergias conhecidas?
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {watchHasAllergies && (
                <FormField
                  control={form.control}
                  name="allergiesDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Descreva as alergias:</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Ex: Amendoim, pólen, medicamentos específicos..."
                          {...field} 
                          className="text-base"
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {/* Exercícios */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <FormField
                control={form.control}
                name="exerciseRegularly"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-base font-medium">
                        Pratica exercícios físicos regularmente?
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {watchExerciseRegularly && (
                <FormField
                  control={form.control}
                  name="exerciseDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Que tipo de exercícios:</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Ex: Corrida 3x/semana, musculação, natação..."
                          {...field} 
                          className="text-base"
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {/* Lesões */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <FormField
                control={form.control}
                name="hasInjuries"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-base font-medium">
                        Possui lesões atuais ou históricas relevantes?
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {watchHasInjuries && (
                <FormField
                  control={form.control}
                  name="injuriesDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Descreva as lesões:</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Ex: Lesão no joelho direito em 2023, cirurgia no ombro..."
                          {...field} 
                          className="text-base"
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {/* Informações de Emergência Médica */}
          <FormField
            control={form.control}
            name="emergencyMedicalInfo"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium">Informações médicas de emergência (opcional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Qualquer informação importante que devemos saber em caso de emergência..."
                    {...field} 
                    className="text-base"
                    rows={3}
                  />
                </FormControl>
                <div className="text-xs text-muted-foreground mt-1">
                  Ex: Tipo sanguíneo, condições críticas, medicamentos de emergência
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Liberação Médica */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <FormField
                control={form.control}
                name="doctorClearance"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-base font-medium text-green-800">
                        Declaro estar apto(a) para a prática de atividades físicas *
                      </FormLabel>
                      <p className="text-xs text-green-700 mt-2">
                        Caso possua alguma condição médica, recomendamos consultar um médico antes de iniciar as atividades.
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex flex-col space-y-3 pt-4">
            <Button 
              type="submit" 
              className="w-full h-12 text-base font-medium"
              disabled={!form.watch("doctorClearance")}
            >
              Continuar
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onBack}
              className="w-full h-12 text-base font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}