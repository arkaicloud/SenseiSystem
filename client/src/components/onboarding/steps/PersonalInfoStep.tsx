import React, { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowRight, ArrowLeft, User, Phone, Users, CreditCard, MapPin, Ticket, CheckCircle, XCircle, Loader2, GraduationCap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { CpfExistsDialog } from "@/components/ui/cpf-exists-dialog";
import AddressForm from "@/components/ui/address-form";

const validateCPF = (input: string): boolean => {
  const cpf = (input || "").replace(/\D+/g, "");
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  const calcDV = (base: string, factorStart: number) => {
    let sum = 0;
    for (let i = 0; i < base.length; i++) sum += Number(base[i]) * (factorStart - i);
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const dv1 = calcDV(cpf.slice(0, 9), 10);
  const dv2 = calcDV(cpf.slice(0, 9) + String(dv1), 11);
  return cpf.endsWith(`${dv1}${dv2}`);
};

const formatCPF = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

const formatPhone = (value: string) => {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 2) return `(${numbers}`;
  if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
};

const personalInfoSchema = z.object({
  fullName: z.string().min(3, "Nome completo é obrigatório").refine(
    (v) => v.trim().split(/\s+/).length >= 2,
    "Informe nome e sobrenome"
  ),
  birthDate: z.string().min(1, "Data de nascimento é obrigatória"),
  sex: z.enum(["M", "F"], { errorMap: () => ({ message: "Selecione o gênero" }) }),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  phone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
  cpf: z.string().min(1, "CPF é obrigatório").refine(validateCPF, "CPF inválido - verifique os dígitos"),
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
  financialResponsibleName: z.string().optional(),
  financialResponsibleEmail: z.string().optional(),
  financialResponsiblePhone: z.string().optional(),
  financialResponsibleCpf: z.string().optional().refine((cpf) => {
    if (!cpf) return true;
    return validateCPF(cpf);
  }, "CPF inválido - verifique os dígitos"),
  financialResponsibleRelationship: z.enum(["self", "parent", "guardian", "spouse"], {
    errorMap: () => ({ message: "Selecione o grau de parentesco" })
  }),
  paymentPlanId: z.string().min(1, "Selecione um plano de pagamento"),
  dueDate: z.string()
    .min(1, "Data de vencimento é obrigatória")
    .refine((value) => {
      const day = Number(value);
      return Number.isInteger(day) && day >= 1 && day <= 31;
    }, "Selecione um dia entre 1 e 31"),
  couponCode: z.string().optional(),
}).refine((data) => {
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

export type PersonalInfoData = z.infer<typeof personalInfoSchema> & {
  firstName: string;
  lastName: string;
};

interface PersonalInfoStepProps {
  onNext: (data: PersonalInfoData) => void;
  defaultValues?: Partial<PersonalInfoData>;
}

// VYTA dark design tokens
const inputCls = "h-12 text-base bg-white/5 border-white/10 text-white placeholder:text-slate-500 rounded-xl focus-visible:ring-[#2B54FF]/50 focus-visible:border-[#2B54FF]/50";
const labelCls = "text-slate-300 text-sm font-medium";
const selectCls = "h-12 w-full rounded-xl border border-white/10 bg-slate-900 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2B54FF]/50 focus:border-[#2B54FF]/50 [color-scheme:dark] appearance-none";

function DarkSelectField({ label, value, onChange, children, error }: {
  label: string; value: string; onChange: (v: string) => void;
  children: React.ReactNode; error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className={labelCls}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={selectCls}>
        {children}
      </select>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}

const stepTitles = [
  "Dados Pessoais",
  "Informações de Contato",
  "Contato de Emergência",
  "Responsável Financeiro e Plano",
  "Endereço Residencial",
];
const stepIcons = [User, Phone, Users, CreditCard, MapPin];

export default function PersonalInfoStep({ onNext, defaultValues }: PersonalInfoStepProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  const [cpfDialogOpen, setCpfDialogOpen] = useState(false);
  const [existingStudent, setExistingStudent] = useState<{ name: string; active: boolean } | null>(null);
  const { toast } = useToast();

  const { data: paymentPlansData } = useQuery<{ plans: Array<{ id: number; name: string; amount: number; description: string }> }>({
    queryKey: ["/api/payment-plans"],
  });
  const paymentPlans = paymentPlansData?.plans || [];

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

  const form = useForm<PersonalInfoData>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      fullName: defaultValues ? [defaultValues.firstName, defaultValues.lastName].filter(Boolean).join(" ") : "",
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
      financialResponsibleName: "",
      financialResponsibleEmail: "",
      financialResponsiblePhone: "",
      financialResponsibleCpf: "",
      financialResponsibleRelationship: "self",
      paymentPlanId: "",
      dueDate: "",
      ...defaultValues,
    },
  });

  const financialRelationship = form.watch("financialResponsibleRelationship");

  const checkCpfExists = useCallback(async (cpf: string) => {
    if (!validateCPF(cpf)) return;
    try {
      const cleanCpf = cpf.replace(/\D/g, '');
      const response = await fetch(`/api/validate-cpf/${cleanCpf}`);
      const result = await response.json();
      if (result.success && result.exists) {
        setExistingStudent({ name: result.student.name, active: result.student.active });
        setCpfDialogOpen(true);
        return true;
      }
      return false;
    } catch {
      toast({ title: "Erro", description: "Não foi possível verificar o CPF.", variant: "destructive" });
      return false;
    }
  }, [toast]);

  const handleGoToLogin = () => {
    setCpfDialogOpen(false);
    window.location.href = "/";
  };

  const handleSubmit = (data: PersonalInfoData) => {
    const parts = (data.fullName || "").trim().split(/\s+/);
    onNext({ ...data, firstName: parts[0] || "", lastName: parts.slice(1).join(" ") || "-" });
  };

  const getFieldsForStep = (step: number): (keyof PersonalInfoData)[] => {
    switch (step) {
      case 1: return ["fullName", "birthDate", "sex", "cpf", "rg"];
      case 2: return ["email", "phone"];
      case 3: return ["emergencyContact", "emergencyPhone"];
      case 4: return ["financialResponsibleRelationship", "paymentPlanId", "dueDate"];
      case 5: return ["zipCode", "street", "number", "neighborhood", "city", "state"];
      default: return [];
    }
  };

  const nextStep = async () => {
    const isValid = await form.trigger(getFieldsForStep(currentStep));
    if (isValid && currentStep < totalSteps) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const StepIcon = stepIcons[currentStep - 1];

  function renderStep1() {
    return (
      <div className="space-y-5">
        <FormField control={form.control} name="fullName" render={({ field }) => (
          <FormItem>
            <FormLabel className={labelCls}>Nome Completo *</FormLabel>
            <FormControl>
              <Input placeholder="Digite seu nome completo" {...field} className={inputCls} />
            </FormControl>
            <FormMessage className="text-red-400 text-xs" />
          </FormItem>
        )} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField control={form.control} name="birthDate" render={({ field }) => (
            <FormItem>
              <FormLabel className={labelCls}>Data de Nascimento *</FormLabel>
              <FormControl>
                <Input type="date" {...field} className={inputCls + " [color-scheme:dark]"} />
              </FormControl>
              <FormMessage className="text-red-400 text-xs" />
            </FormItem>
          )} />
          <FormField control={form.control} name="sex" render={({ field }) => (
            <FormItem>
              <FormLabel className={labelCls}>Gênero *</FormLabel>
              <FormControl>
                <select value={field.value} onChange={(e) => field.onChange(e.target.value)} className={selectCls}>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                </select>
              </FormControl>
              <FormMessage className="text-red-400 text-xs" />
            </FormItem>
          )} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField control={form.control} name="cpf" render={({ field }) => (
            <FormItem>
              <FormLabel className={labelCls}>CPF *</FormLabel>
              <FormControl>
                <Input
                  placeholder="000.000.000-00"
                  {...field}
                  value={formatCPF(field.value || "")}
                  onChange={(e) => field.onChange(formatCPF(e.target.value))}
                  onBlur={async () => { if (field.value && validateCPF(field.value)) await checkCpfExists(field.value); }}
                  maxLength={14}
                  className={inputCls}
                />
              </FormControl>
              <FormMessage className="text-red-400 text-xs" />
            </FormItem>
          )} />
          <FormField control={form.control} name="rg" render={({ field }) => (
            <FormItem>
              <FormLabel className={labelCls}>RG *</FormLabel>
              <FormControl>
                <Input placeholder="00.000.000-0" {...field} className={inputCls} />
              </FormControl>
              <FormMessage className="text-red-400 text-xs" />
            </FormItem>
          )} />
        </div>
      </div>
    );
  }

  function renderStep2() {
    return (
      <div className="space-y-5">
        <div className="bg-[#2B54FF]/10 border border-[#2B54FF]/20 rounded-xl p-3 text-xs text-[#7B9FFF] leading-relaxed">
          <span className="font-semibold">Para menores de idade:</span> o e-mail pode ser deixado em branco. O acesso ao portal será feito pelo e-mail do responsável financeiro.
        </div>
        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem>
            <FormLabel className={labelCls}>E-mail <span className="text-slate-500 font-normal">(opcional para menores)</span></FormLabel>
            <FormControl>
              <Input placeholder="seu@email.com" type="email" {...field} className={inputCls} />
            </FormControl>
            <FormMessage className="text-red-400 text-xs" />
          </FormItem>
        )} />
        <FormField control={form.control} name="phone" render={({ field }) => (
          <FormItem>
            <FormLabel className={labelCls}>WhatsApp *</FormLabel>
            <FormControl>
              <Input
                placeholder="(11) 99999-9999"
                {...field}
                value={formatPhone(field.value || "")}
                onChange={(e) => field.onChange(formatPhone(e.target.value))}
                maxLength={15}
                className={inputCls}
              />
            </FormControl>
            <FormMessage className="text-red-400 text-xs" />
          </FormItem>
        )} />
      </div>
    );
  }

  function renderStep3() {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="emergencyContact" render={({ field }) => (
            <FormItem>
              <FormLabel className={labelCls}>Nome do Contato de Emergência *</FormLabel>
              <FormControl>
                <Input placeholder="Nome completo" {...field} className={inputCls} />
              </FormControl>
              <FormMessage className="text-red-400 text-xs" />
            </FormItem>
          )} />
          <FormField control={form.control} name="emergencyPhone" render={({ field }) => (
            <FormItem>
              <FormLabel className={labelCls}>Telefone de Emergência *</FormLabel>
              <FormControl>
                <Input
                  placeholder="(11) 99999-9999"
                  {...field}
                  value={formatPhone(field.value || "")}
                  onChange={(e) => field.onChange(formatPhone(e.target.value))}
                  maxLength={15}
                  className={inputCls}
                />
              </FormControl>
              <FormMessage className="text-red-400 text-xs" />
            </FormItem>
          )} />
        </div>
      </div>
    );
  }

  function renderStep4() {
    return (
      <div className="space-y-5">
        <FormField control={form.control} name="financialResponsibleRelationship" render={({ field }) => (
          <FormItem>
            <FormLabel className={labelCls}>Grau de Parentesco *</FormLabel>
            <FormControl>
              <select
                value={field.value}
                onChange={(e) => {
                  field.onChange(e.target.value);
                  if (e.target.value === "self") {
                    const d = form.getValues();
                    form.setValue("financialResponsibleName", (d.fullName || "").trim());
                    form.setValue("financialResponsibleEmail", d.email);
                    form.setValue("financialResponsiblePhone", d.phone);
                    form.setValue("financialResponsibleCpf", d.cpf);
                  } else {
                    form.setValue("financialResponsibleName", "");
                    form.setValue("financialResponsibleEmail", "");
                    form.setValue("financialResponsiblePhone", "");
                    form.setValue("financialResponsibleCpf", "");
                  }
                }}
                className={selectCls}
              >
                <option value="self">Eu mesmo(a)</option>
                <option value="parent">Pai/Mãe</option>
                <option value="guardian">Responsável/Tutor</option>
                <option value="spouse">Cônjuge</option>
              </select>
            </FormControl>
            <FormMessage className="text-red-400 text-xs" />
          </FormItem>
        )} />

        {financialRelationship !== "self" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="financialResponsibleName" render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelCls}>Nome Completo do Responsável *</FormLabel>
                  <FormControl><Input {...field} placeholder="Nome completo" className={inputCls} /></FormControl>
                  <FormMessage className="text-red-400 text-xs" />
                </FormItem>
              )} />
              <FormField control={form.control} name="financialResponsibleCpf" render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelCls}>CPF do Responsável *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="000.000.000-00"
                      value={formatCPF(field.value || "")}
                      onChange={(e) => field.onChange(formatCPF(e.target.value))}
                      maxLength={14}
                      className={inputCls}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400 text-xs" />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="financialResponsibleEmail" render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelCls}>E-mail do Responsável *</FormLabel>
                  <FormControl><Input {...field} type="email" placeholder="email@exemplo.com" className={inputCls} /></FormControl>
                  <FormMessage className="text-red-400 text-xs" />
                </FormItem>
              )} />
              <FormField control={form.control} name="financialResponsiblePhone" render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelCls}>Telefone do Responsável *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="(11) 99999-9999"
                      value={formatPhone(field.value || "")}
                      onChange={(e) => field.onChange(formatPhone(e.target.value))}
                      maxLength={15}
                      className={inputCls}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400 text-xs" />
                </FormItem>
              )} />
            </div>
          </div>
        )}

        {financialRelationship === "self" && (
          <div className="bg-[#2B54FF]/10 border border-[#2B54FF]/20 rounded-xl p-4 text-sm text-[#7B9FFF]">
            <p className="font-medium">✓ Responsável financeiro definido</p>
            <p className="text-slate-400 mt-0.5 text-xs">Os dados do responsável serão os mesmos dados pessoais preenchidos acima.</p>
          </div>
        )}

        <div className="space-y-4 pt-2">
          <p className="text-white font-medium text-sm">Plano de Pagamento</p>
          <FormField control={form.control} name="paymentPlanId" render={({ field }) => (
            <FormItem>
              <FormLabel className={labelCls}>Plano de Mensalidade *</FormLabel>
              <FormControl>
                <select value={field.value} onChange={(e) => field.onChange(e.target.value)} className={selectCls}>
                  <option value="">Selecione o plano de pagamento</option>
                  {paymentPlans.map((plan) => (
                    <option key={plan.id} value={plan.id.toString()}>
                      {plan.name} - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plan.amount / 100)}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormMessage className="text-red-400 text-xs" />
            </FormItem>
          )} />
          <FormField control={form.control} name="dueDate" render={({ field }) => (
            <FormItem>
              <FormLabel className={labelCls}>Data de Vencimento Preferida *</FormLabel>
              <p className="text-xs text-slate-500 -mt-1">Dia do mês para vencimento do boleto/Pix:</p>
              <FormControl>
                <select value={field.value} onChange={(event) => field.onChange(event.target.value)} className={selectCls}>
                  {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => (
                    <option key={day} value={String(day)}>Dia {day}</option>
                  ))}
                </select>
              </FormControl>
              <FormMessage className="text-red-400 text-xs" />
            </FormItem>
          )} />

          {/* Coupon */}
          <div className="space-y-2">
            <label className={labelCls}>Cupom de desconto (opcional)</label>
            <div className="flex gap-2">
              <Input
                placeholder="CÓDIGO"
                value={couponInput}
                onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); if (couponStatus) setCouponStatus(null); }}
                className={inputCls + " font-mono uppercase flex-1"}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyCoupon())}
              />
              <button
                type="button"
                onClick={applyCoupon}
                disabled={couponLoading || !couponInput.trim()}
                className="h-12 px-4 rounded-xl border border-white/20 text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 text-sm font-medium shrink-0"
              >
                {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ticket className="w-4 h-4" />}
                Aplicar
              </button>
            </div>
            {couponStatus && (
              couponStatus.valid ? (
                <div className="flex items-start gap-2 rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-400">
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
                <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span>{couponStatus.message}</span>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderStep5() {
    return (
      <div className="space-y-5">
        <AddressForm form={form} dark={true} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Step header */}
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-[#2B54FF]/20 border border-[#2B54FF]/40 flex items-center justify-center mx-auto">
          <StepIcon className="w-7 h-7 text-[#2B54FF]" />
        </div>
        <h2 className="text-2xl font-bold text-white">{stepTitles[currentStep - 1]}</h2>

        {/* Mini progress indicators */}
        <div className="flex items-center justify-center gap-1.5 mt-2">
          {Array.from({ length: totalSteps }, (_, i) => {
            const n = i + 1;
            const isActive = n === currentStep;
            const isDone = n < currentStep;
            return (
              <div key={n} className="flex items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all border ${
                  isDone
                    ? 'bg-[#2B54FF] border-[#2B54FF] text-white'
                    : isActive
                      ? 'bg-[#2B54FF]/20 border-[#2B54FF] text-[#2B54FF]'
                      : 'bg-white/5 border-white/10 text-slate-500'
                }`}>
                  {isDone ? '✓' : n}
                </div>
                {n < totalSteps && (
                  <div className={`w-6 h-px mx-1 ${n < currentStep ? 'bg-[#2B54FF]' : 'bg-white/10'}`} />
                )}
              </div>
            );
          })}
        </div>
        <p className="text-slate-400 text-sm">Etapa {currentStep} de {totalSteps}: {stepTitles[currentStep - 1]}</p>
      </div>

      {/* Form card */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
            {currentStep === 5 && renderStep5()}

            {/* Navigation */}
            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="h-12 px-6 rounded-xl border border-white/20 text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Anterior
              </button>

              {currentStep === totalSteps ? (
                <button
                  type="submit"
                  className="h-12 px-8 rounded-xl bg-[#2B54FF] hover:bg-[#2348db] text-white font-semibold transition-colors flex items-center gap-2"
                >
                  Finalizar
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={nextStep}
                  className="h-12 px-8 rounded-xl bg-[#2B54FF] hover:bg-[#2348db] text-white font-semibold transition-colors flex items-center gap-2"
                >
                  Próximo
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>
        </Form>
      </div>

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
