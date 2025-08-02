import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, User, Phone, Users, Calendar } from "lucide-react";
import AddressForm from "@/components/ui/address-form";

const personalInfoSchema = z.object({
  firstName: z.string().min(1, "Nome é obrigatório"),
  lastName: z.string().min(1, "Sobrenome é obrigatório"),
  birthDate: z.string().min(1, "Data de nascimento é obrigatória"),
  email: z.string().email("E-mail inválido"),
  phone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
  emergencyContact: z.string().min(1, "Contato de emergência é obrigatório"),
  emergencyPhone: z.string().min(10, "Telefone de emergência deve ter pelo menos 10 dígitos"),
  zipCode: z.string().min(8, "CEP é obrigatório"),
  street: z.string().min(1, "Logradouro é obrigatório"),
  number: z.string().min(1, "Número é obrigatório"),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, "Bairro é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().min(2, "Estado é obrigatório").max(2, "Estado deve ter 2 caracteres"),
});

export type PersonalInfoData = z.infer<typeof personalInfoSchema>;

interface PersonalInfoStepProps {
  onNext: (data: PersonalInfoData) => void;
  defaultValues?: Partial<PersonalInfoData>;
}

export default function PersonalInfoStep({ onNext, defaultValues }: PersonalInfoStepProps) {
  const form = useForm<PersonalInfoData>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      birthDate: "",
      email: "",
      phone: "",
      emergencyContact: "",
      emergencyPhone: "",
      zipCode: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      ...defaultValues,
    },
  });

  const handleSubmit = (data: PersonalInfoData) => {
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
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Informações Pessoais</h3>
        <p className="text-sm text-muted-foreground">
          Dados básicos do aluno para criar a conta e facilitar o processo de matrícula.
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Dados Pessoais */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-primary" />
              <h4 className="font-medium">Dados Pessoais</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu primeiro nome" {...field} />
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
                    <FormLabel>Sobrenome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu sobrenome" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="birthDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Nascimento *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          {/* Contato */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-primary" />
              <h4 className="font-medium">Contato</h4>
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail *</FormLabel>
                  <FormControl>
                    <Input placeholder="seu@email.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone/Celular *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="(11) 99999-9999"
                      {...field}
                      value={formatPhone(field.value || "")}
                      onChange={(e) => {
                        const formatted = formatPhone(e.target.value);
                        field.onChange(formatted);
                      }}
                      maxLength={15}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          {/* Contato de Emergência */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-primary" />
              <h4 className="font-medium">Contato de Emergência</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="emergencyContact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Responsável/Emergência *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo" {...field} />
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
                      <Input
                        placeholder="(11) 99999-9999"
                        {...field}
                        value={formatPhone(field.value || "")}
                        onChange={(e) => {
                          const formatted = formatPhone(e.target.value);
                          field.onChange(formatted);
                        }}
                        maxLength={15}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Separator />

          {/* Endereço com ViaCEP */}
          <AddressForm form={form} />

          <div className="flex justify-end pt-6">
            <Button type="submit" className="min-w-24">
              Próximo <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}