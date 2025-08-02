import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { beltLevelEnum } from "@shared/schema";

const healthFormSchema = z.object({
  beltLevel: z.enum(beltLevelEnum.enumValues, { required_error: "Selecione sua graduação atual" }),
  stripes: z.preprocess((val) => (val === "" ? 0 : Number(val)), z.number().min(0).max(4)),
  medicalConditions: z.string().optional(),
  emergencyContact: z.string().min(1, "Contato de emergência é obrigatório"),
  emergencyPhone: z.string().min(10, "Telefone de emergência é obrigatório"),
});

type HealthFormData = z.infer<typeof healthFormSchema>;

interface HealthFormStepProps {
  onNext: (data: HealthFormData) => void;
  onBack: () => void;
  defaultValues?: Partial<HealthFormData>;
}

export default function HealthFormStep({ onNext, onBack, defaultValues }: HealthFormStepProps) {
  const form = useForm<HealthFormData>({
    resolver: zodResolver(healthFormSchema),
    defaultValues: {
      beltLevel: undefined,
      stripes: 0,
      medicalConditions: "",
      emergencyContact: "",
      emergencyPhone: "",
      ...defaultValues,
    },
  });

  const handleSubmit = (data: HealthFormData) => {
    onNext(data);
  };

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Informações de saúde e graduação</h3>
        <p className="text-sm text-muted-foreground">
          Essas informações nos ajudam a direcioná-lo para as turmas adequadas e garantir sua segurança.
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="beltLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Graduação Atual *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione sua graduação" />
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
                  <FormLabel>Número de Graus</FormLabel>
                  <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={String(field.value)}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o número de graus" />
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

          <FormField
            control={form.control}
            name="medicalConditions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Condições Médicas ou Restrições</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Descreva qualquer condição médica, lesão ou restrição que devemos conhecer..." 
                    className="min-h-[100px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="emergencyContact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contato de Emergência *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do contato" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="emergencyPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone de Emergência *</FormLabel>
                  <FormControl>
                    <Input placeholder="(11) 99999-9999" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
            </Button>
            <Button type="submit" className="min-w-24">
              Próximo <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}