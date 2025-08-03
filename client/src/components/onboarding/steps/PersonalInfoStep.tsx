import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, User, Phone, Users, Calendar, CreditCard } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import AddressForm from "@/components/ui/address-form";

const personalInfoSchema = z.object({
  firstName: z.string().min(1, "Nome é obrigatório"),
  lastName: z.string().min(1, "Sobrenome é obrigatório"),
  birthDate: z.string().min(1, "Data de nascimento é obrigatória"),
  email: z.string().email("E-mail inválido"),
  phone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
  cpf: z.string().min(11, "CPF é obrigatório"),
  rg: z.string().min(1, "RG é obrigatório"),
  emergencyContact: z.string().min(1, "Contato de emergência é obrigatório"),
  emergencyPhone: z.string().min(10, "Telefone de emergência deve ter pelo menos 10 dígitos"),
  zipCode: z.string().min(8, "CEP é obrigatório"),
  street: z.string().min(1, "Logradouro é obrigatório"),
  number: z.string().min(1, "Número é obrigatório"),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, "Bairro é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().min(2, "Estado é obrigatório").max(2, "Estado deve ter 2 caracteres"),
  // Financial responsibility fields
  financialResponsibleName: z.string().min(1, "Nome do responsável financeiro é obrigatório"),
  financialResponsibleEmail: z.string().email("E-mail do responsável financeiro inválido"),
  financialResponsiblePhone: z.string().min(10, "Telefone do responsável financeiro deve ter pelo menos 10 dígitos"),
  financialResponsibleCpf: z.string().min(11, "CPF do responsável financeiro é obrigatório"),
  financialResponsibleRelationship: z.enum(["self", "parent", "guardian", "spouse"], {
    errorMap: () => ({ message: "Selecione o grau de parentesco" })
  }),
  // Payment plan and due date
  paymentPlanId: z.string().min(1, "Selecione um plano de pagamento"),
  dueDate: z.string().min(1, "Data de vencimento é obrigatória"),
});

export type PersonalInfoData = z.infer<typeof personalInfoSchema>;

interface PersonalInfoStepProps {
  onNext: (data: PersonalInfoData) => void;
  defaultValues?: Partial<PersonalInfoData>;
}

export default function PersonalInfoStep({ onNext, defaultValues }: PersonalInfoStepProps) {
  // Fetch payment plans
  const { data: paymentPlansData } = useQuery<{ plans: Array<{ id: number; name: string; amount: number; description: string }> }>({
    queryKey: ["/api/payment-plans"],
  });

  const paymentPlans = paymentPlansData?.plans || [];

  const form = useForm<PersonalInfoData>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      birthDate: "",
      email: "",
      phone: "",
      cpf: "",
      rg: "",
      emergencyContact: "",
      emergencyPhone: "",
      zipCode: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      // Financial responsibility defaults
      financialResponsibleName: "",
      financialResponsibleEmail: "",
      financialResponsiblePhone: "",
      financialResponsibleCpf: "",
      financialResponsibleRelationship: "self",
      // Payment defaults
      paymentPlanId: "",
      dueDate: "",
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF *</FormLabel>
                    <FormControl>
                      <Input placeholder="000.000.000-00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RG *</FormLabel>
                    <FormControl>
                      <Input placeholder="00.000.000-0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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

          {/* Responsável Financeiro */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-primary" />
              <h4 className="font-medium">Responsável Financeiro</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Dados da pessoa responsável pelos pagamentos da mensalidade.
            </p>

            <FormField
              control={form.control}
              name="financialResponsibleRelationship"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grau de Parentesco *</FormLabel>
                  <Select onValueChange={(value) => {
                    field.onChange(value);
                    // Se for "self", preencher automaticamente os dados
                    if (value === "self") {
                      const currentData = form.getValues();
                      form.setValue("financialResponsibleName", `${currentData.firstName} ${currentData.lastName}`.trim());
                      form.setValue("financialResponsibleEmail", currentData.email);
                      form.setValue("financialResponsiblePhone", currentData.phone);
                      form.setValue("financialResponsibleCpf", currentData.cpf);
                    } else {
                      // Limpar campos quando não for "self"
                      form.setValue("financialResponsibleName", "");
                      form.setValue("financialResponsibleEmail", "");
                      form.setValue("financialResponsiblePhone", "");
                      form.setValue("financialResponsibleCpf", "");
                    }
                  }} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o grau de parentesco" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="self">Eu mesmo(a)</SelectItem>
                      <SelectItem value="parent">Pai/Mãe</SelectItem>
                      <SelectItem value="guardian">Responsável/Tutor</SelectItem>
                      <SelectItem value="spouse">Cônjuge</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="financialResponsibleName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo do Responsável *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nome completo" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="financialResponsibleCpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF do Responsável *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="000.000.000-00"
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          const formattedValue = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
                          field.onChange(formattedValue);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="financialResponsibleEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail do Responsável *</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="email@exemplo.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="financialResponsiblePhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone do Responsável *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="(11) 99999-9999"
                        onChange={(e) => {
                          const formatted = formatPhone(e.target.value);
                          field.onChange(formatted);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4 mt-6">
              <h5 className="font-medium">Plano de Pagamento</h5>
              
              <FormField
                control={form.control}
                name="paymentPlanId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plano de Mensalidade *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o plano de pagamento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paymentPlans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id.toString()}>
                            {plan.name} - R$ {(plan.amount / 100).toFixed(2).replace('.', ',')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Vencimento Preferida *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o dia do vencimento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                          <SelectItem key={day} value={day.toString()}>
                            Todo dia {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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