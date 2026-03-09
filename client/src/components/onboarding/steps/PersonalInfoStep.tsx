import React, { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, ArrowLeft, User, Phone, Users, Calendar, CreditCard, MapPin, Ticket, CheckCircle, XCircle, Loader2, GraduationCap } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { CpfExistsDialog } from "@/components/ui/cpf-exists-dialog";
import AddressForm from "@/components/ui/address-form";

// Função para validar CPF brasileiro - Algoritmo oficial módulo 11
const validateCPF = (input: string): boolean => {
  const cpf = (input || "").replace(/\D+/g, "");
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false; // todos iguais

  const calcDV = (base: string, factorStart: number) => {
    let sum = 0;
    for (let i = 0; i < base.length; i++) {
      sum += Number(base[i]) * (factorStart - i);
    }
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };

  const dv1 = calcDV(cpf.slice(0, 9), 10);
  const dv2 = calcDV(cpf.slice(0, 9) + String(dv1), 11);

  return cpf.endsWith(`${dv1}${dv2}`);
};

// Função para formatar CPF
const formatCPF = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

const personalInfoSchema = z.object({
  firstName: z.string().min(1, "Nome é obrigatório"),
  lastName: z.string().min(1, "Sobrenome é obrigatório"),
  birthDate: z.string().min(1, "Data de nascimento é obrigatória"),
  sex: z.enum(["M", "F"], {
    errorMap: () => ({ message: "Selecione o gênero" })
  }),
  email: z.string().email("E-mail inválido"),
  phone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
  cpf: z.string()
    .min(1, "CPF é obrigatório")
    .refine(validateCPF, "CPF inválido - verifique os dígitos"),
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
  financialResponsibleName: z.string().optional(),
  financialResponsibleEmail: z.string().optional(),
  financialResponsiblePhone: z.string().optional(),
  financialResponsibleCpf: z.string()
    .optional()
    .refine((cpf) => {
      if (!cpf) return true; // Campo opcional
      return validateCPF(cpf);
    }, "CPF inválido - verifique os dígitos"),
  financialResponsibleRelationship: z.enum(["self", "parent", "guardian", "spouse"], {
    errorMap: () => ({ message: "Selecione o grau de parentesco" })
  }),
  // Payment plan and due date
  paymentPlanId: z.string().min(1, "Selecione um plano de pagamento"),
  dueDate: z.string().min(1, "Data de vencimento é obrigatória"),
  couponCode: z.string().optional(),
}).refine((data) => {
  // Se não for "self", os campos do responsável financeiro são obrigatórios
  if (data.financialResponsibleRelationship !== "self") {
    return data.financialResponsibleName && 
           data.financialResponsibleEmail && 
           data.financialResponsiblePhone && 
           data.financialResponsibleCpf;
  }
  return true;
}, {
  message: "Dados do responsável financeiro são obrigatórios",
  path: ["financialResponsibleName"]
});

export type PersonalInfoData = z.infer<typeof personalInfoSchema>;

interface PersonalInfoStepProps {
  onNext: (data: PersonalInfoData) => void;
  defaultValues?: Partial<PersonalInfoData>;
}

export default function PersonalInfoStep({ onNext, defaultValues }: PersonalInfoStepProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  const [cpfDialogOpen, setCpfDialogOpen] = useState(false);
  const [existingStudent, setExistingStudent] = useState<{ name: string; active: boolean } | null>(null);
  const { toast } = useToast();

  // Fetch payment plans
  const { data: paymentPlansData } = useQuery<{ plans: Array<{ id: number; name: string; amount: number; description: string }> }>({
    queryKey: ["/api/payment-plans"],
  });

  const paymentPlans = paymentPlansData?.plans || [];

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [couponStatus, setCouponStatus] = useState<null | { valid: boolean; discountPercent?: number; description?: string | null; message?: string }>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const applyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponStatus(null);
    try {
      const res = await fetch(`/api/coupons/validate/${encodeURIComponent(couponInput.trim().toUpperCase())}`);
      const data = await res.json();
      if (res.ok && data.valid) {
        setCouponStatus({ valid: true, discountPercent: data.coupon.discountPercent, description: data.coupon.description });
        form.setValue("couponCode", couponInput.trim().toUpperCase());
      } else {
        setCouponStatus({ valid: false, message: data.message || "Cupom inválido" });
        form.setValue("couponCode", "");
      }
    } catch {
      setCouponStatus({ valid: false, message: "Erro ao validar cupom" });
    } finally {
      setCouponLoading(false);
    }
  };

  // Títulos das etapas
  const stepTitles = [
    "Dados Pessoais",
    "Informações de Contato", 
    "Contato de Emergência",
    "Responsável Financeiro e Plano",
    "Endereço Residencial"
  ];

  // Ícones das etapas
  const stepIcons = [User, Phone, Users, CreditCard, MapPin];

  const form = useForm<PersonalInfoData>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      birthDate: "",
      sex: "M" as "M" | "F",
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

  // Watch the financial responsible relationship to show/hide fields
  const financialRelationship = form.watch("financialResponsibleRelationship");

  // Função para validar CPF no servidor
  const checkCpfExists = useCallback(async (cpf: string) => {
    if (!validateCPF(cpf)) return; // Só verifica se o CPF é válido

    try {
      const cleanCpf = cpf.replace(/\D/g, '');
      const response = await fetch(`/api/validate-cpf/${cleanCpf}`);
      const result = await response.json();

      if (result.success && result.exists) {
        setExistingStudent({
          name: result.student.name,
          active: result.student.active
        });
        setCpfDialogOpen(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Erro ao verificar CPF:", error);
      toast({
        title: "Erro",
        description: "Não foi possível verificar o CPF. Tente novamente.",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  // Handler para redirecionar ao login
  const handleGoToLogin = () => {
    setCpfDialogOpen(false);
    // Redirecionar para a página de login
    window.location.href = "/";
  };

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

  // Navegação entre etapas
  const nextStep = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Validação da etapa atual
  const validateCurrentStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    return await form.trigger(fieldsToValidate);
  };

  // Campos por etapa
  const getFieldsForStep = (step: number): (keyof PersonalInfoData)[] => {
    switch (step) {
      case 1: return ["firstName", "lastName", "birthDate", "sex", "cpf", "rg"];
      case 2: return ["email", "phone"];
      case 3: return ["emergencyContact", "emergencyPhone"];
      case 4: return ["financialResponsibleRelationship", "paymentPlanId", "dueDate"];
      case 5: return ["zipCode", "street", "number", "neighborhood", "city", "state"];
      default: return [];
    }
  };

  // Etapa 1: Dados Pessoais
  function renderStep1() {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <h4 className="font-medium text-lg">Dados Pessoais</h4>
          <p className="text-sm text-muted-foreground">
            Informe seus dados pessoais de identificação.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite seu nome" {...field} />
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
                    <Input placeholder="Digite seu sobrenome" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
            <FormField
              control={form.control}
              name="sex"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gênero *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="M">Masculino</SelectItem>
                      <SelectItem value="F">Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="000.000.000-00" 
                      {...field}
                      value={formatCPF(field.value || "")}
                      onChange={(e) => {
                        const formatted = formatCPF(e.target.value);
                        field.onChange(formatted);
                      }}
                      onBlur={async () => {
                        if (field.value && validateCPF(field.value)) {
                          await checkCpfExists(field.value);
                        }
                      }}
                      maxLength={14}
                    />
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
      </div>
    );
  }

  // Etapa 2: Contato
  function renderStep2() {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <h4 className="font-medium text-lg">Informações de Contato</h4>
          <p className="text-sm text-muted-foreground">
            Como podemos entrar em contato com você?
          </p>

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
      </div>
    );
  }

  // Etapa 3: Contato de Emergência
  function renderStep3() {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <h4 className="font-medium text-lg">Contato de Emergência</h4>
          <p className="text-sm text-muted-foreground">
            Pessoa para contatar em caso de emergência.
          </p>

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
      </div>
    );
  }

  // Etapa 4: Responsável Financeiro e Plano
  function renderStep4() {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <h4 className="font-medium text-lg">Responsável Financeiro e Plano</h4>
          <p className="text-sm text-muted-foreground">
            Dados da pessoa responsável pelos pagamentos e plano escolhido.
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

          {financialRelationship !== "self" && (
            <div className="space-y-4">
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
                          value={formatCPF(field.value || "")}
                          onChange={(e) => {
                            const formatted = formatCPF(e.target.value);
                            field.onChange(formatted);
                          }}
                          maxLength={14}
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
          )}

          {financialRelationship === "self" && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
              <p className="font-medium">✓ Responsável financeiro definido</p>
              <p>Os dados do responsável financeiro serão os mesmos dados pessoais preenchidos acima.</p>
            </div>
          )}

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
                          {plan.name} - {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(plan.amount / 100)}
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


            {/* Coupon */}
            <div className="space-y-2 mt-2">
              <label className="text-sm font-medium">Cupom de desconto (opcional)</label>
              <div className="flex gap-2">
                <Input
                  placeholder=""
                  value={couponInput}
                  onChange={(e) => {
                    setCouponInput(e.target.value.toUpperCase());
                    if (couponStatus) setCouponStatus(null);
                  }}
                  className="font-mono uppercase flex-1"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyCoupon())}
                />
                <Button type="button" variant="outline" onClick={applyCoupon} disabled={couponLoading || !couponInput.trim()} className="gap-1 shrink-0">
                  {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ticket className="w-4 h-4" />}
                  Aplicar
                </Button>
              </div>
              {couponStatus && (
                couponStatus.valid ? (
                  <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                    {couponStatus.discountPercent === 100
                      ? <GraduationCap className="w-4 h-4 mt-0.5 shrink-0" />
                      : <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />}
                    <div>
                      {couponStatus.discountPercent === 100
                        ? <p className="font-semibold">Bolsista — acesso gratuito aplicado!</p>
                        : <p className="font-semibold">{couponStatus.discountPercent}% de desconto aplicado!</p>}
                      {couponStatus.description && <p className="text-xs mt-0.5 opacity-80">{couponStatus.description}</p>}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <XCircle className="w-4 h-4 shrink-0" />
                    <span>{couponStatus.message}</span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Etapa 5: Endereço
  function renderStep5() {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <h4 className="font-medium text-lg">Endereço Residencial</h4>
          <p className="text-sm text-muted-foreground">
            Informe seu endereço completo.
          </p>

          <AddressForm form={form} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      {/* Header com progresso */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2 mb-4">
          {React.createElement(stepIcons[currentStep - 1], { className: "w-6 h-6 text-primary" })}
          <h2 className="text-2xl font-bold">{stepTitles[currentStep - 1]}</h2>
        </div>
        
        {/* Indicador de progresso */}
        <div className="flex items-center justify-center space-x-2 mb-6">
          {Array.from({ length: totalSteps }, (_, i) => {
            const stepNumber = i + 1;
            const isActive = stepNumber === currentStep;
            const isCompleted = stepNumber < currentStep;
            
            return (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-primary text-white' 
                    : isCompleted 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {isCompleted ? '✓' : stepNumber}
                </div>
                {stepNumber < totalSteps && (
                  <div className={`w-8 h-0.5 mx-2 ${
                    stepNumber < currentStep ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
        
        <p className="text-muted-foreground">
          Etapa {currentStep} de {totalSteps}: {stepTitles[currentStep - 1]}
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          {/* Renderizar conteúdo da etapa atual */}
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}

          {/* Navegação */}
          <div className="flex justify-between pt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>

            {currentStep === totalSteps ? (
              <Button type="submit" className="min-w-24">
                Finalizar
              </Button>
            ) : (
              <Button type="button" onClick={nextStep} className="min-w-24">
                Próximo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </form>
      </Form>
      
      {/* Dialog de CPF existente */}
      <CpfExistsDialog
        open={cpfDialogOpen}
        onClose={() => setCpfDialogOpen(false)}
        onGoToLogin={handleGoToLogin}
        studentName={existingStudent?.name}
        isActive={existingStudent?.active}
      />
    </div>
  );
}