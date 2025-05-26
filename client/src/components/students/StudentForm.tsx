import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BeltWithLabel } from "@/components/ui/belt";
import { useQuery } from "@tanstack/react-query";

// Extend the user schema for student creation
const studentFormSchema = insertUserSchema.extend({
  beltLevel: z.enum(["white", "blue", "purple", "brown", "black"]).default("white"),
  stripes: z.number().min(0).max(4).default(0),
  emergencyContact: z.string().optional(),
  notes: z.string().optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  complement: z.string().optional(),
  paymentPlanId: z.number().optional(),
});

type StudentFormValues = z.infer<typeof studentFormSchema>;

interface StudentFormProps {
  defaultValues?: Partial<StudentFormValues>;
  onSubmit: (data: StudentFormValues) => void;
  isLoading?: boolean;
}

const StudentForm: React.FC<StudentFormProps> = ({
  defaultValues,
  onSubmit,
  isLoading = false,
}) => {
  // Fetch payment plans
  const { data: plansData } = useQuery({
    queryKey: ['/api/payment-plans'],
  });

  const paymentPlans = plansData?.plans || [];

  // Helper function to format currency
  const formatCurrency = (amountInCents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amountInCents / 100);
  };

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      username: "",
      password: "",
      role: "student",
      beltLevel: "white",
      stripes: 0,
      emergencyContact: "",
      notes: "",
      phone: "",
      mobile: "",
      street: "",
      city: "",
      state: "",
      zipCode: "",
      complement: "",
      paymentPlanId: undefined,
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="personal">Dados Pessoais</TabsTrigger>
            <TabsTrigger value="contact">Contato</TabsTrigger>
            <TabsTrigger value="address">Endereço</TabsTrigger>
            <TabsTrigger value="belt">Graduação</TabsTrigger>
            <TabsTrigger value="plan">Plano</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="João" {...field} />
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
                    <FormLabel>Sobrenome</FormLabel>
                    <FormControl>
                      <Input placeholder="Silva" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="joao.silva@exemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome de Usuário</FormLabel>
                    <FormControl>
                      <Input placeholder="joaosilva" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="contact" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(11) 9999-9999" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Celular</FormLabel>
                    <FormControl>
                      <Input placeholder="(11) 99999-9999" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="emergencyContact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contato de Emergência</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome: (11) 99999-9999" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="address" className="space-y-4 mt-6">
            <FormField
              control={form.control}
              name="street"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rua/Avenida</FormLabel>
                  <FormControl>
                    <Input placeholder="Rua das Flores, 123" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input placeholder="São Paulo" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <FormControl>
                      <Input placeholder="SP" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="zipCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP</FormLabel>
                    <FormControl>
                      <Input placeholder="01234-567" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="complement"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Complemento</FormLabel>
                  <FormControl>
                    <Input placeholder="Apto 45, Bloco B" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="belt" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="beltLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nível da Faixa</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a faixa" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="white">
                          <BeltWithLabel level="white" />
                        </SelectItem>
                        <SelectItem value="blue">
                          <BeltWithLabel level="blue" />
                        </SelectItem>
                        <SelectItem value="purple">
                          <BeltWithLabel level="purple" />
                        </SelectItem>
                        <SelectItem value="brown">
                          <BeltWithLabel level="brown" />
                        </SelectItem>
                        <SelectItem value="black">
                          <BeltWithLabel level="black" />
                        </SelectItem>
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
                    <FormLabel>Listras</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione as listras" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">0 Listras</SelectItem>
                        <SelectItem value="1">1 Listra</SelectItem>
                        <SelectItem value="2">2 Listras</SelectItem>
                        <SelectItem value="3">3 Listras</SelectItem>
                        <SelectItem value="4">4 Listras</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Input placeholder="Informações adicionais" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="plan" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="paymentPlanId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plano de Pagamento</FormLabel>
                    <FormControl>
                      <Select value={field.value?.toString() || ""} onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um plano" />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentPlans.map((plan: any) => (
                            <SelectItem key={plan.id} value={plan.id.toString()}>
                              {plan.name} - {formatCurrency(plan.amount)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />



              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <span className="material-icons text-blue-600 text-sm">info</span>
                  </div>
                  <div className="ml-2">
                    <h4 className="font-medium text-sm text-blue-800">Nota Importante</h4>
                    <p className="text-sm text-blue-600 mt-1">
                      O plano pode ser alterado a qualquer momento. Mudanças entram em vigor no próximo ciclo de cobrança.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-6 border-t">
          <Button type="submit" className="bg-secondary hover:bg-secondary-dark" disabled={isLoading}>
            {isLoading ? "Salvando..." : "Salvar Aluno"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default StudentForm;