import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowRight, User, Ticket, CheckCircle, XCircle, Loader2, GraduationCap } from "lucide-react";
import { useBeltLevels } from "@/hooks/useBeltLevels";
import { useQuery } from "@tanstack/react-query";

// CPF validation (módulo 11)
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

const formatCPF = (value: string): string => {
  const n = value.replace(/\D/g, "").slice(0, 11);
  return n
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
};

const personalDataSchema = z.object({
  firstName: z.string().min(1, "Nome é obrigatório"),
  lastName: z.string().min(1, "Sobrenome é obrigatório"),
  birthDate: z.string().min(1, "Data de nascimento é obrigatória"),
  sex: z.enum(["M", "F"], { errorMap: () => ({ message: "Selecione o gênero" }) }),
  cpf: z.string()
    .min(1, "CPF é obrigatório")
    .refine(validateCPF, "CPF inválido — verifique os dígitos"),
  rg: z.string().min(1, "RG é obrigatório"),
  beltLevel: z.string().min(1, "Selecione a faixa"),
  stripes: z.number().min(0).max(4),
  paymentPlanId: z.string().optional(),
  couponCode: z.string().optional(),
});

export type PersonalDataType = z.infer<typeof personalDataSchema>;

interface PersonalDataStepProps {
  onNext: (data: PersonalDataType) => void;
  defaultValues?: Partial<PersonalDataType>;
}

const inputCls = "h-14 text-base bg-white/5 border-white/10 text-white placeholder:text-slate-500 rounded-xl focus-visible:ring-[#2B54FF]/50 focus-visible:border-[#2B54FF]/50";
const labelCls = "text-slate-300 text-sm font-medium";
const selectContent = "bg-slate-800 border-white/10 text-white";
const selectItem = "text-white focus:bg-white/10 focus:text-white cursor-pointer";
const nativeSel = "h-14 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2B54FF]/50 focus:border-[#2B54FF]/50 [color-scheme:dark]";

// Componente com estado local para evitar reset ao selecionar parcialmente
function BirthDatePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const initParts = value ? value.split("-") : ["", "", ""];
  const [selYear, setSelYear] = useState(initParts[0] || "");
  const [selMonth, setSelMonth] = useState(initParts[1] || "");
  const [selDay, setSelDay] = useState(initParts[2] || "");

  useEffect(() => {
    if (selDay && selMonth && selYear) {
      onChange(`${selYear}-${selMonth}-${selDay}`);
    }
  }, [selDay, selMonth, selYear]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - 3 - i);
  const months = [
    { value: "01", label: "Janeiro" }, { value: "02", label: "Fevereiro" },
    { value: "03", label: "Março" }, { value: "04", label: "Abril" },
    { value: "05", label: "Maio" }, { value: "06", label: "Junho" },
    { value: "07", label: "Julho" }, { value: "08", label: "Agosto" },
    { value: "09", label: "Setembro" }, { value: "10", label: "Outubro" },
    { value: "11", label: "Novembro" }, { value: "12", label: "Dezembro" },
  ];
  const daysInMonth = selYear && selMonth
    ? new Date(Number(selYear), Number(selMonth), 0).getDate()
    : 31;
  const days = Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, "0"));

  const handleMonthChange = (v: string) => {
    const maxDay = new Date(Number(selYear || 2000), Number(v), 0).getDate();
    if (selDay && Number(selDay) > maxDay) setSelDay(String(maxDay).padStart(2, "0"));
    setSelMonth(v);
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      <select value={selDay} onChange={(e) => setSelDay(e.target.value)} className={nativeSel}>
        <option value="" disabled>Dia</option>
        {days.map((d) => <option key={d} value={d}>{d}</option>)}
      </select>
      <select value={selMonth} onChange={(e) => handleMonthChange(e.target.value)} className={nativeSel}>
        <option value="" disabled>Mês</option>
        {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
      </select>
      <select value={selYear} onChange={(e) => setSelYear(e.target.value)} className={nativeSel}>
        <option value="" disabled>Ano</option>
        {years.map((y) => <option key={y} value={String(y)}>{y}</option>)}
      </select>
    </div>
  );
}

export default function PersonalDataStep({ onNext, defaultValues }: PersonalDataStepProps) {
  const form = useForm<PersonalDataType>({
    resolver: zodResolver(personalDataSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      birthDate: "",
      sex: "M",
      cpf: "",
      rg: "",
      beltLevel: "white",
      stripes: 0,
      paymentPlanId: "",
      couponCode: "",
      ...defaultValues,
    },
  });

  const watchedBirthDate = form.watch("birthDate");
  const { beltOptions, isLoading: loadingBelts } = useBeltLevels(watchedBirthDate || undefined, true);

  const { data: paymentPlansData } = useQuery<{ plans: Array<{ id: number; name: string; amount: number; description: string }> }>({
    queryKey: ["/api/payment-plans"],
  });
  const paymentPlans = paymentPlansData?.plans || [];

  const [couponInput, setCouponInput] = useState(defaultValues?.couponCode || "");
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onNext)} className="flex flex-col pb-6">
        {/* Step header */}
        <div className="px-6 pt-8 pb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#2B54FF]/20 border border-[#2B54FF]/40 flex items-center justify-center mb-4">
            <User className="w-6 h-6 text-[#2B54FF]" />
          </div>
          <h2 className="text-2xl font-bold text-white">Dados Pessoais</h2>
          <p className="text-sm text-slate-400 mt-1">Vamos começar com suas informações básicas</p>
        </div>

        <div className="px-6 space-y-5">
          {/* Nome + Sobrenome */}
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelCls}>Nome *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome" {...field} className={inputCls} />
                  </FormControl>
                  <FormMessage className="text-red-400 text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelCls}>Sobrenome *</FormLabel>
                  <FormControl>
                    <Input placeholder="Sobrenome" {...field} className={inputCls} />
                  </FormControl>
                  <FormMessage className="text-red-400 text-xs" />
                </FormItem>
              )}
            />
          </div>

          {/* Nascimento */}
          <FormField
            control={form.control}
            name="birthDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelCls}>Data de Nascimento *</FormLabel>
                <BirthDatePicker value={field.value || ""} onChange={field.onChange} />
                <FormMessage className="text-red-400 text-xs" />
              </FormItem>
            )}
          />

          {/* Gênero */}
          <FormField
            control={form.control}
            name="sex"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelCls}>Gênero *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className={inputCls}>
                      <SelectValue placeholder="Selecione o gênero" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className={selectContent}>
                    <SelectItem value="M" className={selectItem}>Masculino</SelectItem>
                    <SelectItem value="F" className={selectItem}>Feminino</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage className="text-red-400 text-xs" />
              </FormItem>
            )}
          />

          {/* CPF */}
          <FormField
            control={form.control}
            name="cpf"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelCls}>CPF *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="000.000.000-00"
                    {...field}
                    value={formatCPF(field.value || "")}
                    onChange={(e) => field.onChange(formatCPF(e.target.value))}
                    maxLength={14}
                    inputMode="numeric"
                    className={inputCls}
                  />
                </FormControl>
                <FormMessage className="text-red-400 text-xs" />
              </FormItem>
            )}
          />

          {/* RG */}
          <FormField
            control={form.control}
            name="rg"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelCls}>RG *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="00.000.000-0"
                    {...field}
                    inputMode="numeric"
                    className={inputCls}
                  />
                </FormControl>
                <FormMessage className="text-red-400 text-xs" />
              </FormItem>
            )}
          />

          {/* Faixa */}
          <FormField
            control={form.control}
            name="beltLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelCls}>Faixa Atual *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={loadingBelts}>
                  <FormControl>
                    <SelectTrigger className={inputCls}>
                      <SelectValue placeholder={loadingBelts ? "Carregando..." : "Selecione sua faixa"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className={selectContent}>
                    {beltOptions.length > 0
                      ? beltOptions.map((belt) => (
                          <SelectItem key={belt.value} value={belt.value} className={selectItem}>
                            <div className="flex items-center gap-2">
                              <span className="inline-block w-4 h-4 rounded-sm border border-black/10 shrink-0" style={{ backgroundColor: belt.color }} />
                              {belt.label}
                            </div>
                          </SelectItem>
                        ))
                      : (
                        <>
                          <SelectItem value="white" className={selectItem}>Faixa Branca</SelectItem>
                          <SelectItem value="blue" className={selectItem}>Faixa Azul</SelectItem>
                          <SelectItem value="purple" className={selectItem}>Faixa Roxa</SelectItem>
                          <SelectItem value="brown" className={selectItem}>Faixa Marrom</SelectItem>
                          <SelectItem value="black" className={selectItem}>Faixa Preta</SelectItem>
                        </>
                      )}
                  </SelectContent>
                </Select>
                <FormMessage className="text-red-400 text-xs" />
              </FormItem>
            )}
          />

          {/* Grau */}
          <FormField
            control={form.control}
            name="stripes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelCls}>Grau (Listras)</FormLabel>
                <Select value={field.value.toString()} onValueChange={(v) => field.onChange(Number(v))}>
                  <FormControl>
                    <SelectTrigger className={inputCls}>
                      <SelectValue placeholder="Selecione o grau" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className={selectContent}>
                    {[0, 1, 2, 3, 4].map((n) => (
                      <SelectItem key={n} value={n.toString()} className={selectItem}>
                        {n === 0 ? "Sem grau" : `${n} ${n === 1 ? "grau" : "graus"}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500 mt-1">Iniciante? Mantenha "Sem grau" com Faixa Branca.</p>
                <FormMessage className="text-red-400 text-xs" />
              </FormItem>
            )}
          />

          {/* Plano de Mensalidade */}
          {paymentPlans.length > 0 && (
            <FormField
              control={form.control}
              name="paymentPlanId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelCls}>Plano de Mensalidade</FormLabel>
                  <Select value={field.value || ""} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className={inputCls}>
                        <SelectValue placeholder="Selecione o plano" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className={selectContent}>
                      {paymentPlans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id.toString()} className={selectItem}>
                          {plan.name} — {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plan.amount / 100)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-400 text-xs" />
                </FormItem>
              )}
            />
          )}

          {/* Cupom */}
          <div className="space-y-2">
            <label className={labelCls}>Cupom de desconto (opcional)</label>
            <div className="flex gap-2">
              <Input
                placeholder="CÓDIGO"
                value={couponInput}
                onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); if (couponStatus) setCouponStatus(null); }}
                className={`${inputCls} font-mono uppercase flex-1`}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyCoupon())}
              />
              <Button
                type="button"
                onClick={applyCoupon}
                disabled={couponLoading || !couponInput.trim()}
                className="h-14 px-4 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-xl shrink-0"
              >
                {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ticket className="w-4 h-4" />}
                <span className="ml-1.5 text-sm">Aplicar</span>
              </Button>
            </div>
            {couponStatus && (
              couponStatus.valid ? (
                <div className="flex items-start gap-2 rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-400">
                  {couponStatus.discountPercent === 100
                    ? <GraduationCap className="w-4 h-4 mt-0.5 shrink-0" />
                    : <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />}
                  <div>
                    {couponStatus.discountPercent === 100
                      ? <p className="font-semibold">Bolsista — acesso gratuito!</p>
                      : <p className="font-semibold">{couponStatus.discountPercent}% de desconto aplicado!</p>}
                    {couponStatus.description && <p className="text-xs mt-0.5 opacity-75">{couponStatus.description}</p>}
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

          <div className="pt-2 pb-2">
            <Button type="submit" className="w-full h-14 bg-[#2B54FF] hover:bg-[#2B54FF]/90 text-white font-semibold rounded-2xl text-base">
              Continuar
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
