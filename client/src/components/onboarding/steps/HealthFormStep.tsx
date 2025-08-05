import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, FileText, CheckCircle, Heart, Shield } from "lucide-react";
import { beltLevelEnum } from "@shared/schema";
import { useBeltLevels } from "@/hooks/useBeltLevels";

const healthFormSchema = z.object({
  beltLevel: z.enum(beltLevelEnum.enumValues, { required_error: "Selecione sua graduação atual" }),
  stripes: z.preprocess((val) => (val === "" ? 0 : Number(val)), z.number().min(0).max(4)),
  medicalConditions: z.string().optional(),
  // Health questionnaire fields
  hasHeartProblem: z.enum(["yes", "no"], { required_error: "Resposta obrigatória" }),
  hasChestPain: z.enum(["yes", "no"], { required_error: "Resposta obrigatória" }),
  hasBreathingProblem: z.enum(["yes", "no"], { required_error: "Resposta obrigatória" }),
  hasBloodPressureProblem: z.enum(["yes", "no"], { required_error: "Resposta obrigatória" }),
  hasBoneProblem: z.enum(["yes", "no"], { required_error: "Resposta obrigatória" }),
  hasOtherHealthProblem: z.enum(["yes", "no"], { required_error: "Resposta obrigatória" }),
  takeMedication: z.enum(["yes", "no"], { required_error: "Resposta obrigatória" }),
  doctorRecommendation: z.enum(["yes", "no"], { required_error: "Resposta obrigatória" }),
});

export type HealthFormData = z.infer<typeof healthFormSchema>;

interface HealthFormStepProps {
  onNext: (data: HealthFormData) => void;
  onBack: () => void;
  defaultValues?: Partial<HealthFormData>;
  birthDate?: string | Date; // Add birthDate prop to filter belts by age
}

export default function HealthFormStep({ onNext, onBack, defaultValues, birthDate }: HealthFormStepProps) {
  const { beltOptions, ageCategory } = useBeltLevels(birthDate, true); // Use public endpoint
  
  // Calculate age for display
  const getAge = () => {
    if (!birthDate) return null;
    const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    return monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate()) ? age - 1 : age;
  };

  const age = getAge();
  
  const form = useForm<HealthFormData>({
    resolver: zodResolver(healthFormSchema),
    defaultValues: {
      beltLevel: undefined,
      stripes: 0,
      medicalConditions: "",
      hasHeartProblem: undefined,
      hasChestPain: undefined,
      hasBreathingProblem: undefined,
      hasBloodPressureProblem: undefined,
      hasBoneProblem: undefined,
      hasOtherHealthProblem: undefined,
      takeMedication: undefined,
      doctorRecommendation: undefined,
      ...defaultValues,
    },
  });

  const handleSubmit = (data: HealthFormData) => {
    onNext(data);
  };

  // Check if any health question was answered with "yes"
  const hasHealthIssues = form.watch(['hasHeartProblem', 'hasChestPain', 'hasBreathingProblem', 'hasBloodPressureProblem', 'hasBoneProblem', 'hasOtherHealthProblem', 'takeMedication'])
    .some(value => value === 'yes');

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Informações de saúde e graduação</h3>
        <p className="text-sm text-muted-foreground">
          Complete o questionário de saúde e informe sua graduação atual.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Questionário de Saúde */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-base">
                <Heart className="mr-2 h-5 w-5" />
                Questionário de Saúde
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <p className="text-sm text-muted-foreground">
                  Para sua segurança, responda as perguntas abaixo sobre sua condição de saúde:
                </p>

                {/* Health Questions */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="hasHeartProblem"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>1. Você tem algum problema cardíaco?</FormLabel>
                        <FormControl>
                          <RadioGroup onValueChange={field.onChange} value={field.value}>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="yes" id="heart-yes" />
                              <Label htmlFor="heart-yes">Sim</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="no" id="heart-no" />
                              <Label htmlFor="heart-no">Não</Label>
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
                        <FormLabel>2. Você sente dor no peito durante atividades físicas?</FormLabel>
                        <FormControl>
                          <RadioGroup onValueChange={field.onChange} value={field.value}>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="yes" id="chest-yes" />
                              <Label htmlFor="chest-yes">Sim</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="no" id="chest-no" />
                              <Label htmlFor="chest-no">Não</Label>
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
                        <FormLabel>3. Você tem problemas respiratórios ou falta de ar?</FormLabel>
                        <FormControl>
                          <RadioGroup onValueChange={field.onChange} value={field.value}>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="yes" id="breathing-yes" />
                              <Label htmlFor="breathing-yes">Sim</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="no" id="breathing-no" />
                              <Label htmlFor="breathing-no">Não</Label>
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
                        <FormLabel>4. Você tem problemas de pressão arterial?</FormLabel>
                        <FormControl>
                          <RadioGroup onValueChange={field.onChange} value={field.value}>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="yes" id="pressure-yes" />
                              <Label htmlFor="pressure-yes">Sim</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="no" id="pressure-no" />
                              <Label htmlFor="pressure-no">Não</Label>
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
                        <FormLabel>5. Você tem problemas ósseos ou articulares?</FormLabel>
                        <FormControl>
                          <RadioGroup onValueChange={field.onChange} value={field.value}>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="yes" id="bone-yes" />
                              <Label htmlFor="bone-yes">Sim</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="no" id="bone-no" />
                              <Label htmlFor="bone-no">Não</Label>
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
                        <FormLabel>6. Você tem algum outro problema de saúde?</FormLabel>
                        <FormControl>
                          <RadioGroup onValueChange={field.onChange} value={field.value}>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="yes" id="other-yes" />
                              <Label htmlFor="other-yes">Sim</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="no" id="other-no" />
                              <Label htmlFor="other-no">Não</Label>
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
                        <FormLabel>7. Você toma algum medicamento regularmente?</FormLabel>
                        <FormControl>
                          <RadioGroup onValueChange={field.onChange} value={field.value}>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="yes" id="medication-yes" />
                              <Label htmlFor="medication-yes">Sim</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="no" id="medication-no" />
                              <Label htmlFor="medication-no">Não</Label>
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
                        <FormLabel>8. Algum médico já recomendou que você evite exercícios físicos?</FormLabel>
                        <FormControl>
                          <RadioGroup onValueChange={field.onChange} value={field.value}>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="yes" id="doctor-yes" />
                              <Label htmlFor="doctor-yes">Sim</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="no" id="doctor-no" />
                              <Label htmlFor="doctor-no">Não</Label>
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
                    <AlertDescription>
                      Como você indicou ter problemas de saúde, recomendamos consultar um médico antes de iniciar as atividades. Descreva seus problemas de saúde no campo abaixo.
                    </AlertDescription>
                  </Alert>
                )}

                <FormField
                  control={form.control}
                  name="medicalConditions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações sobre sua saúde (opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva qualquer condição médica, medicamento ou observação importante..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Informações de Graduação */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Graduação Atual</CardTitle>
              {age && ageCategory && (
                <div className="text-sm text-muted-foreground">
                  Idade: {age} anos - Categoria: {ageCategory === 'adult' ? 'Adulto' : 'Infantil'}
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="beltLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Graduação atual *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione sua faixa" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {beltOptions.map((belt) => (
                            <SelectItem key={belt.value} value={belt.value}>
                              {belt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {beltOptions.length === 0 && (
                        <div className="text-sm text-muted-foreground mt-1">
                          Carregando graduações...
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stripes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Graus (listras)</FormLabel>
                      <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione os graus" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">Sem graus</SelectItem>
                          <SelectItem value="1">1 grau</SelectItem>
                          <SelectItem value="2">2 graus</SelectItem>
                          <SelectItem value="3">3 graus</SelectItem>
                          <SelectItem value="4">4 graus</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="flex-1 sm:flex-none"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <Button
              type="submit"
              className="flex-1 sm:flex-none"
            >
              Continuar
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}