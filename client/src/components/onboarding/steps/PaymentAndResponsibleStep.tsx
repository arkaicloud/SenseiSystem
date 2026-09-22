import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, ArrowRight, CreditCard, User, Users, GraduationCap, CheckCircle, XCircle, Loader2, Ticket, Home } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const DUE_DATE_OPTIONS = Array.from({ length: 31 }, (_, index) => index + 1);

const validateCPF = (input: string): boolean => {
  const cpf = (input || "").replace(/\D+/g, "");
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  const calcDV = (base: string, start: number) => {
    let sum = 0;
    for (let i = 0; i < base.length; i++) sum += Number(base[i]) * (start - i);
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const dv1 = calcDV(cpf.slice(0, 9), 10);
  const dv2 = calcDV(cpf.slice(0, 9) + String(dv1), 11);
  return cpf.endsWith(`${dv1}${dv2}`);
};

const formatCPF = (v: string) => {
  const n = v.replace(/\D/g, "").slice(0, 11);
  return n
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
};

const formatPhone = (v: string) => {
  const n = v.replace(/\D/g, "").slice(0, 11);
  if (n.length <= 10) return n.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  return n.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
};

const paymentSchema = z.object({
  paymentPlanId: z.string().optional(),
  couponCode: z.string().optional(),
  isScholarship: z.boolean().default(false),
  dueDate: z.string()
    .default("5")
    .refine((value) => {
      const day = Number(value);
      return Number.isInteger(day) && day >= 1 && day <= 31;
    }, "Selecione um dia entre 1 e 31"),
  financialResponsibleRelationship: z.enum(["self", "other"]).default("self"),
  financialResponsibleName: z.string().optional(),
  financialResponsibleCpf: z.string().optional(),
  financialResponsibleEmail: z.string().optional(),
  financialResponsiblePhone: z.string().optional(),
}).superRefine((data, ctx) => {
  if (!data.isScholarship && !data.paymentPlanId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Selecione um plano de mensalidade", path: ["paymentPlanId"] });
  }
  if (!data.isScholarship && data.financialResponsibleRelationship === "other") {
    if (!data.financialResponsibleName?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Nome do responsável é obrigatório", path: ["financialResponsibleName"] });
    }
    if (!data.financialResponsibleCpf || !validateCPF(data.financialResponsibleCpf)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "CPF do responsável inválido", path: ["financialResponsibleCpf"] });
    }
    if (!data.financialResponsiblePhone?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Telefone do responsável é obrigatório", path: ["financialResponsiblePhone"] });
    }
  }
});

export type PaymentAndResponsibleType = z.infer<typeof paymentSchema> & {
  isFamily?: boolean;
  maxStudents?: number;
};

interface Props {
  onNext: (data: PaymentAndResponsibleType) => void;
  onBack: () => void;
  defaultValues?: Partial<PaymentAndResponsibleType>;
}

const inputCls = "h-14 text-base bg-white/5 border-white/10 text-white placeholder:text-muted-foreground rounded-xl focus-visible:ring-[#2B54FF]/50 focus-visible:border-[#2B54FF]/50";
const labelCls = "text-muted-foreground text-sm font-medium";

export default function PaymentAndResponsibleStep({ onNext, onBack, defaultValues }: Props) {
  const form = useForm<PaymentAndResponsibleType>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paymentPlanId: "",
      couponCode: "",
      isScholarship: false,
      dueDate: "5",
      financialResponsibleRelationship: "self",
      financialResponsibleName: "",
      financialResponsibleCpf: "",
      financialResponsibleEmail: "",
      financialResponsiblePhone: "",
      ...defaultValues,
    },
  });

  const isScholarship = form.watch("isScholarship");
  const relationship = form.watch("financialResponsibleRelationship");

  const { data: plansData } = useQuery<{ plans: Array<{ id: number; name: string; amount: number; description: string; isFamily?: boolean; maxStudents?: number }> }>({
    queryKey: ["/api/payment-plans"],
  });
  const plans = (plansData?.plans || []).filter(p => !(p as any).isScholarship);

  const selectedPlanObj = plans.find(p => p.id.toString() === form.watch("paymentPlanId"));
  const selectedIsFamily = selectedPlanObj?.isFamily ?? false;

  const [couponInput, setCouponInput] = useState(defaultValues?.couponCode || "");
  const [couponStatus, setCouponStatus] = useState<null | { valid: boolean; discountPercent?: number; description?: string | null; message?: string }>(
    defaultValues?.isScholarship ? { valid: true, discountPercent: 100 } : null
  );
  const [couponLoading, setCouponLoading] = useState(false);

  const applyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponStatus(null);
    try {
      const res = await fetch(`/api/coupons/validate/${encodeURIComponent(couponInput.trim().toUpperCase())}`);
      const data = await res.json();
      if (res.ok && data.valid) {
        const discount = data.coupon.discountPercent;
        const isScholar = discount === 100;
        setCouponStatus({ valid: true, discountPercent: discount, description: data.coupon.description });
        form.setValue("couponCode", couponInput.trim().toUpperCase());
        form.setValue("isScholarship", isScholar);
        if (isScholar) {
          form.setValue("paymentPlanId", "");
          form.setValue("financialResponsibleRelationship", "self");
        }
      } else {
        setCouponStatus({ valid: false, message: data.message || "Cupom inválido" });
        form.setValue("couponCode", "");
        form.setValue("isScholarship", false);
      }
    } catch {
      setCouponStatus({ valid: false, message: "Erro ao validar cupom" });
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setCouponInput("");
    setCouponStatus(null);
    form.setValue("couponCode", "");
    form.setValue("isScholarship", false);
  };

  const handleSubmit = (data: PaymentAndResponsibleType) => {
    const planObj = plans.find(p => p.id.toString() === data.paymentPlanId);
    onNext({
      ...data,
      isFamily: planObj?.isFamily ?? false,
      maxStudents: planObj?.maxStudents ?? 1,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col pb-6">
        <div className="px-6 pt-8 pb-6">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-[#2B54FF]/40 flex items-center justify-center mb-4">
            <CreditCard className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-white">Pagamento</h2>
          <p className="text-sm text-muted-foreground mt-1">Escolha seu plano e informe o responsável financeiro</p>
        </div>

        <div className="px-6 space-y-5">

          {/* ── Cupom ── */}
          <div className="space-y-2">
            <label className={labelCls}>Cupom de desconto (opcional)</label>
            {couponStatus?.valid ? (
              <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  {isScholarship ? <GraduationCap className="w-5 h-5 text-green-400" /> : <CheckCircle className="w-5 h-5 text-green-400" />}
                  <div>
                    <p className="text-sm font-semibold text-green-400">
                      {isScholarship ? "Bolsista — acesso gratuito!" : `${couponStatus.discountPercent}% de desconto`}
                    </p>
                    {couponStatus.description && <p className="text-xs text-green-300/70 mt-0.5">{couponStatus.description}</p>}
                  </div>
                </div>
                <button type="button" onClick={removeCoupon} className="text-xs text-muted-foreground hover:text-red-400 underline ml-2">Remover</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="CÓDIGO"
                  value={couponInput}
                  onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); if (couponStatus) setCouponStatus(null); }}
                  className={`${inputCls} font-mono uppercase flex-1`}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyCoupon())}
                />
                <Button type="button" onClick={applyCoupon} disabled={couponLoading || !couponInput.trim()}
                  className="h-14 px-4 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-xl shrink-0">
                  {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ticket className="w-4 h-4" />}
                  <span className="ml-1.5 text-sm">Aplicar</span>
                </Button>
              </div>
            )}
            {couponStatus && !couponStatus.valid && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                <XCircle className="w-4 h-4 shrink-0" />
                <span>{couponStatus.message}</span>
              </div>
            )}
          </div>

          {/* ── Plano + Vencimento (somente se não bolsista) ── */}
          {!isScholarship && (
            <>
              <FormField
                control={form.control}
                name="paymentPlanId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelCls}>Plano de Mensalidade *</FormLabel>
                    <div className="space-y-2">
                      {plans.length === 0 ? (
                        <p className="text-muted-foreground text-sm">Carregando planos...</p>
                      ) : (
                        plans.map((plan) => (
                          <button
                            key={plan.id}
                            type="button"
                            onClick={() => field.onChange(plan.id.toString())}
                            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border text-left transition-all ${
                              field.value === plan.id.toString()
                                ? "bg-primary/15 border-[#2B54FF]/50"
                                : "bg-white/5 border-white/10 hover:border-white/20"
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <p className={`text-sm font-semibold ${field.value === plan.id.toString() ? "text-white" : "text-muted-foreground"}`}>{plan.name}</p>
                                {plan.isFamily && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/20 text-[#7B9FFF]">
                                    <Home className="w-2.5 h-2.5" />
                                    Até {plan.maxStudents || 2} alunos
                                  </span>
                                )}
                              </div>
                              {plan.description && <p className="text-xs text-muted-foreground mt-0.5">{plan.description}</p>}
                              {plan.isFamily && field.value === plan.id.toString() && (
                                <p className="text-xs text-[#7B9FFF] mt-1">Você poderá adicionar até {plan.maxStudents || 2} alunos neste plano</p>
                              )}
                            </div>
                            <div className="text-right ml-3 shrink-0">
                              <p className={`text-base font-bold ${field.value === plan.id.toString() ? "text-primary" : "text-muted-foreground"}`}>
                                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(plan.amount / 100)}
                              </p>
                              <p className="text-xs text-muted-foreground">/ mês</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                    <FormMessage className="text-red-400 text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelCls}>Data de Vencimento *</FormLabel>
                    <p className="text-xs text-muted-foreground -mt-1">Dia do mês para vencimento do boleto/Pix:</p>
                    <FormControl>
                      <select
                        value={field.value}
                        onChange={(event) => field.onChange(event.target.value)}
                        className="h-12 w-full appearance-none rounded-xl border border-white/10 bg-background px-3 text-sm text-white focus:border-[#2B54FF]/50 focus:outline-none focus:ring-2 focus:ring-ring/50 [color-scheme:dark]"
                      >
                        {DUE_DATE_OPTIONS.map((day) => (
                          <option key={day} value={String(day)}>Dia {day}</option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage className="text-red-400 text-xs" />
                  </FormItem>
                )}
              />
            </>
          )}

          {/* ── Responsável Financeiro (somente se não bolsista) ── */}
          {!isScholarship && (
            <div className="space-y-3">
              <label className={labelCls}>Responsável Financeiro *</label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => form.setValue("financialResponsibleRelationship", "self")}
                  className={`flex flex-col items-center gap-2 py-4 px-3 rounded-xl border transition-all ${
                    relationship === "self"
                      ? "bg-primary/15 border-[#2B54FF]/50"
                      : "bg-white/5 border-white/10 hover:border-white/20"
                  }`}
                >
                  <User className={`w-5 h-5 ${relationship === "self" ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-sm font-medium ${relationship === "self" ? "text-white" : "text-muted-foreground"}`}>Eu mesmo</span>
                  <span className={`text-xs ${relationship === "self" ? "text-muted-foreground" : "text-muted-foreground"}`}>Sou o responsável</span>
                </button>
                <button
                  type="button"
                  onClick={() => form.setValue("financialResponsibleRelationship", "other")}
                  className={`flex flex-col items-center gap-2 py-4 px-3 rounded-xl border transition-all ${
                    relationship === "other"
                      ? "bg-primary/15 border-[#2B54FF]/50"
                      : "bg-white/5 border-white/10 hover:border-white/20"
                  }`}
                >
                  <Users className={`w-5 h-5 ${relationship === "other" ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-sm font-medium ${relationship === "other" ? "text-white" : "text-muted-foreground"}`}>Outra pessoa</span>
                  <span className={`text-xs ${relationship === "other" ? "text-muted-foreground" : "text-muted-foreground"}`}>Pais / tutor</span>
                </button>
              </div>

              {relationship === "other" && (
                <div className="space-y-4 pt-1">
                  <div className="h-px bg-white/10" />
                  <p className="text-xs text-muted-foreground">Preencha os dados de quem é o responsável financeiro:</p>

                  <FormField control={form.control} name="financialResponsibleName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelCls}>Nome completo *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do responsável" {...field} className={inputCls} />
                        </FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField control={form.control} name="financialResponsibleCpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelCls}>CPF *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="000.000.000-00"
                            inputMode="numeric"
                            value={formatCPF(field.value || "")}
                            onChange={(e) => field.onChange(formatCPF(e.target.value))}
                            maxLength={14}
                            className={inputCls}
                          />
                        </FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField control={form.control} name="financialResponsiblePhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelCls}>Telefone *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="(11) 99999-9999"
                            inputMode="numeric"
                            value={formatPhone(field.value || "")}
                            onChange={(e) => field.onChange(formatPhone(e.target.value))}
                            maxLength={15}
                            className={inputCls}
                          />
                        </FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField control={form.control} name="financialResponsibleEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelCls}>E-mail (opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="email@exemplo.com" type="email" {...field} className={inputCls} />
                        </FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>
          )}

          {isScholarship && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 flex items-start gap-3">
              <GraduationCap className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-400">Bolsista — cadastro simplificado</p>
                <p className="text-xs text-green-300/70 mt-1 leading-relaxed">
                  Como bolsista, não é necessário informar plano de mensalidade ou responsável financeiro. Sua matrícula será gratuita conforme o cupom aplicado.
                </p>
              </div>
            </div>
          )}

          <div className="pt-2 space-y-3">
            <Button type="submit" className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-semibold rounded-2xl text-base">
              Continuar <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button type="button" onClick={onBack} className="w-full h-12 bg-transparent border border-white/15 text-muted-foreground hover:bg-white/5 rounded-2xl text-sm">
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
