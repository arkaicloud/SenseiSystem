import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, ArrowRight, Users } from "lucide-react";

const emergencyContactSchema = z.object({
  emergencyContact: z.string().min(1, "Nome do contato de emergência é obrigatório"),
  emergencyPhone: z.string().min(10, "Telefone de emergência deve ter pelo menos 10 dígitos"),
  relationship: z.string().min(1, "Parentesco é obrigatório"),
});

export type EmergencyContactType = z.infer<typeof emergencyContactSchema>;

interface EmergencyContactStepProps {
  onNext: (data: EmergencyContactType) => void;
  onBack: () => void;
  defaultValues?: Partial<EmergencyContactType>;
}

export default function EmergencyContactStep({ onNext, onBack, defaultValues }: EmergencyContactStepProps) {
  const form = useForm<EmergencyContactType>({
    resolver: zodResolver(emergencyContactSchema),
    defaultValues: {
      emergencyContact: "",
      emergencyPhone: "",
      relationship: "",
      ...defaultValues,
    },
  });

  const handleSubmit = (data: EmergencyContactType) => {
    onNext(data);
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) {
      return `(${numbers}`;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Users className="w-6 h-6 text-primary" />
          </div>
        </div>
        <h3 className="text-xl font-semibold mb-2">Contato de Emergência</h3>
        <p className="text-sm text-muted-foreground px-4">
          Pessoa para contato em caso de emergência
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="emergencyContact"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium">Nome *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Nome do responsável" 
                    {...field} 
                    className="h-12 text-base"
                  />
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
                <FormLabel className="text-base font-medium">Parentesco *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ex: Pai, Mãe, Cônjuge, Irmão(ã)" 
                    {...field} 
                    className="h-12 text-base"
                  />
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
                <FormLabel className="text-base font-medium">Telefone *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="(11) 99999-9999" 
                    {...field}
                    onChange={(e) => {
                      const formatted = formatPhone(e.target.value);
                      field.onChange(formatted);
                    }}
                    className="h-12 text-base"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-col space-y-3 pt-4">
            <Button type="submit" className="w-full h-12 text-base font-medium">
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