import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, ArrowRight } from "lucide-react";

const responsiblePartySchema = z.object({
  responsibleName: z.string().min(1, "Nome do responsável é obrigatório"),
  responsibleCpf: z.string().min(11, "CPF deve ter 11 dígitos"),
  responsiblePhone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
  relationship: z.string().min(1, "Parentesco é obrigatório"),
});

type ResponsiblePartyData = z.infer<typeof responsiblePartySchema>;

interface ResponsiblePartyStepProps {
  onNext: (data: ResponsiblePartyData) => void;
  onBack: () => void;
  defaultValues?: Partial<ResponsiblePartyData>;
}

export default function ResponsiblePartyStep({ onNext, onBack, defaultValues }: ResponsiblePartyStepProps) {
  const form = useForm<ResponsiblePartyData>({
    resolver: zodResolver(responsiblePartySchema),
    defaultValues: {
      responsibleName: "",
      responsibleCpf: "",
      responsiblePhone: "",
      relationship: "",
      ...defaultValues,
    },
  });

  const handleSubmit = (data: ResponsiblePartyData) => {
    onNext(data);
  };

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Dados do Responsável</h3>
        <p className="text-sm text-muted-foreground">
          Para menores de idade, precisamos dos dados do responsável legal.
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="responsibleName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Completo do Responsável *</FormLabel>
                <FormControl>
                  <Input placeholder="Maria Silva Santos" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="responsibleCpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF do Responsável *</FormLabel>
                  <FormControl>
                    <Input placeholder="000.000.000-00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="relationship"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parentesco *</FormLabel>
                  <FormControl>
                    <Input placeholder="Mãe, Pai, Tutor..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="responsiblePhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone do Responsável *</FormLabel>
                <FormControl>
                  <Input placeholder="(11) 99999-9999" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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