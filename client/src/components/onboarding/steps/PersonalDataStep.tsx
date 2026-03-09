import { useState } from "react";
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

const personalDataSchema = z.object({
  firstName: z.string().min(1, "Nome é obrigatório"),
  lastName: z.string().min(1, "Sobrenome é obrigatório"),
  birthDate: z.string().min(1, "Data de nascimento é obrigatória"),
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

export default function PersonalDataStep({ onNext, defaultValues }: PersonalDataStepProps) {
  const form = useForm<PersonalDataType>({
    resolver: zodResolver(personalDataSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      birthDate: "",
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

        {/* Fields */}
        <div className="px-6 space-y-5">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelCls}>Nome *</FormLabel>
                <FormControl>
                  <Input placeholder="Seu primeiro nome" {...field} className={inputCls} />
                </FormControl>
                <FormMessage className="text-red-400" />
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
                  <Input placeholder="Seu sobrenome" {...field} className={inputCls} />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="birthDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelCls}>Data de Nascimento *</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    max={new Date().toISOString().split('T')[0]}
                    className={`${inputCls} [color-scheme:dark]`}
                  />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="beltLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelCls}>Faixa Atual *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={loadingBelts}>
                  <FormControl>
                    <SelectTrigger className={`${inputCls} data-[placeholder]:text-slate-500`}>
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
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

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
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

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
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
          )}

          {/* Coupon */}
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

          {/* Submit button */}
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
