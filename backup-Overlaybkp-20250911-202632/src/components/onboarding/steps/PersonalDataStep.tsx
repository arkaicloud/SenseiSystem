import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowRight, User } from "lucide-react";

const personalDataSchema = z.object({
  firstName: z.string().min(1, "Nome é obrigatório"),
  lastName: z.string().min(1, "Sobrenome é obrigatório"),
  birthDate: z.string().min(1, "Data de nascimento é obrigatória"),
  email: z.string().email("E-mail inválido"),
});

export type PersonalDataType = z.infer<typeof personalDataSchema>;

interface PersonalDataStepProps {
  onNext: (data: PersonalDataType) => void;
  defaultValues?: Partial<PersonalDataType>;
}

export default function PersonalDataStep({ onNext, defaultValues }: PersonalDataStepProps) {
  const form = useForm<PersonalDataType>({
    resolver: zodResolver(personalDataSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      birthDate: "",
      email: "",
      ...defaultValues,
    },
  });

  const handleSubmit = (data: PersonalDataType) => {
    onNext(data);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
        </div>
        <h3 className="text-xl font-semibold mb-2">Dados Pessoais</h3>
        <p className="text-sm text-muted-foreground px-4">
          Vamos começar com suas informações básicas
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium">Nome *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Seu primeiro nome" 
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
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium">Sobrenome *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Seu sobrenome" 
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
            name="birthDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium">Data de Nascimento *</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    {...field} 
                    max={new Date().toISOString().split('T')[0]}
                    className="h-12 text-base"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium">E-mail *</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder="seu@email.com" 
                    {...field} 
                    className="h-12 text-base"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="pt-4">
            <Button type="submit" className="w-full h-12 text-base font-medium">
              Continuar
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}