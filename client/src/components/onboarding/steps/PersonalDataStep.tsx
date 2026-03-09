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
  email: z.string().email("E-mail inválido"),
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

export default function PersonalDataStep({ onNext, defaultValues }: PersonalDataStepProps) {
  const form = useForm<PersonalDataType>({
    resolver: zodResolver(personalDataSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      birthDate: "",
      email: "",
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
                  <Input placeholder="Seu primeiro nome" {...field} className="h-12 text-base" />
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
                  <Input placeholder="Seu sobrenome" {...field} className="h-12 text-base" />
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
                  <Input type="email" placeholder="seu@email.com" {...field} className="h-12 text-base" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Belt Level */}
          <FormField
            control={form.control}
            name="beltLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium">Faixa Atual *</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={loadingBelts}
                >
                  <FormControl>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder={loadingBelts ? "Carregando faixas..." : "Selecione sua faixa"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {loadingBelts ? (
                      <SelectItem value="loading" disabled>Carregando...</SelectItem>
                    ) : beltOptions.length > 0 ? (
                      beltOptions.map((belt) => (
                        <SelectItem key={belt.value} value={belt.value}>
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-block w-4 h-4 rounded-sm border border-black/10 flex-shrink-0"
                              style={{ backgroundColor: belt.color }}
                            />
                            {belt.label}
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="white">Faixa Branca</SelectItem>
                        <SelectItem value="blue">Faixa Azul</SelectItem>
                        <SelectItem value="purple">Faixa Roxa</SelectItem>
                        <SelectItem value="brown">Faixa Marrom</SelectItem>
                        <SelectItem value="black">Faixa Preta</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Stripes */}
          <FormField
            control={form.control}
            name="stripes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium">Grau (Listras)</FormLabel>
                <Select
                  value={field.value.toString()}
                  onValueChange={(val) => field.onChange(Number(val))}
                >
                  <FormControl>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Selecione o grau" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {[0, 1, 2, 3, 4].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n === 0 ? "Sem grau" : `${n} ${n === 1 ? "grau" : "graus"}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Iniciante? Mantenha "Sem grau" com Faixa Branca.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Payment Plan */}
          {paymentPlans.length > 0 && (
            <FormField
              control={form.control}
              name="paymentPlanId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">Plano de Mensalidade</FormLabel>
                  <Select value={field.value || ""} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder="Selecione o plano" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {paymentPlans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id.toString()}>
                          {plan.name} — {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plan.amount / 100)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Coupon */}
          <div className="space-y-2">
            <label className="text-base font-medium">Cupom de desconto (opcional)</label>
            <div className="flex gap-2">
              <Input
                placeholder="Informe seu cupom de desconto"
                value={couponInput}
                onChange={(e) => {
                  setCouponInput(e.target.value.toUpperCase());
                  if (couponStatus) setCouponStatus(null);
                }}
                className="h-12 text-base font-mono uppercase flex-1"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyCoupon())}
              />
              <Button
                type="button"
                variant="outline"
                onClick={applyCoupon}
                disabled={couponLoading || !couponInput.trim()}
                className="h-12 gap-1 shrink-0"
              >
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
                    {couponStatus.description && <p className="text-xs mt-0.5 opacity-75">{couponStatus.description}</p>}
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
