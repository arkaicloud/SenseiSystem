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
import { ArrowLeft, ArrowRight, FileText, CheckCircle } from "lucide-react";
import { beltLevelEnum } from "@shared/schema";
import { DocusealForm } from '@docuseal/react';

const healthFormSchema = z.object({
  beltLevel: z.enum(beltLevelEnum.enumValues, { required_error: "Selecione sua graduação atual" }),
  stripes: z.preprocess((val) => (val === "" ? 0 : Number(val)), z.number().min(0).max(4)),
  medicalConditions: z.string().optional(),
});

export type HealthFormData = z.infer<typeof healthFormSchema>;

interface HealthFormStepProps {
  onNext: (data: HealthFormData) => void;
  onBack: () => void;
  defaultValues?: Partial<HealthFormData>;
}

export default function HealthFormStep({ onNext, onBack, defaultValues }: HealthFormStepProps) {
  const [documentCompleted, setDocumentCompleted] = useState(false);
  
  const form = useForm<HealthFormData>({
    resolver: zodResolver(healthFormSchema),
    defaultValues: {
      beltLevel: undefined,
      stripes: 0,
      medicalConditions: "",
      ...defaultValues,
    },
  });

  const handleSubmit = (data: HealthFormData) => {
    onNext(data);
  };

  const handleDocumentComplete = () => {
    setDocumentCompleted(true);
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Informações de saúde e graduação</h3>
        <p className="text-sm text-muted-foreground">
          Complete o questionário de saúde e informe sua graduação atual.
        </p>
      </div>

      {/* Documento de Saúde - DocuSeal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-base">
            <FileText className="mr-2 h-5 w-5" />
            Questionário de Saúde
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!documentCompleted ? (
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Complete o questionário de saúde obrigatório abaixo:
              </p>
              <div className="border rounded-lg overflow-hidden">
                <DocusealForm
                  src="https://sign.arkaicloud.com.br/d/VMPk9dCNbCHyoE"
                  onCompleted={handleDocumentComplete}
                  className="w-full min-h-[500px]"
                />
              </div>
            </div>
          ) : (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Questionário de saúde concluído com sucesso!
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Informações de Graduação */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Graduação Atual</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
                          <SelectItem value="white">Faixa Branca</SelectItem>
                          <SelectItem value="blue">Faixa Azul</SelectItem>
                          <SelectItem value="purple">Faixa Roxa</SelectItem>
                          <SelectItem value="brown">Faixa Marrom</SelectItem>
                          <SelectItem value="black">Faixa Preta</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stripes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Graus/Listras</FormLabel>
                      <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione os graus" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">0 graus</SelectItem>
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

              <FormField
                control={form.control}
                name="medicalConditions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações médicas adicionais</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Alguma informação adicional sobre condições médicas ou lesões..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-between pt-6">
                <Button type="button" variant="outline" onClick={onBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
                <Button 
                  type="submit" 
                  disabled={!documentCompleted}
                  className="min-w-[120px]"
                >
                  Continuar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}