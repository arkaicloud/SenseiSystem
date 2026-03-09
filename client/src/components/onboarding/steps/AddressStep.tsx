import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, ArrowRight, MapPin, Loader2 } from "lucide-react";

const addressSchema = z.object({
  zipCode: z.string().min(8, "CEP é obrigatório").max(9, "CEP inválido"),
  street: z.string().min(1, "Logradouro é obrigatório"),
  number: z.string().min(1, "Número é obrigatório"),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, "Bairro é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().min(2, "Estado é obrigatório").max(2, "Estado deve ter 2 caracteres"),
});

export type AddressType = z.infer<typeof addressSchema>;

interface AddressStepProps {
  onNext: (data: AddressType) => void;
  onBack: () => void;
  defaultValues?: Partial<AddressType>;
}

const inputCls = "h-14 text-base bg-white/5 border-white/10 text-white placeholder:text-slate-500 rounded-xl focus-visible:ring-[#2B54FF]/50 focus-visible:border-[#2B54FF]/50";
const labelCls = "text-slate-300 text-sm font-medium";

export default function AddressStep({ onNext, onBack, defaultValues }: AddressStepProps) {
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  const form = useForm<AddressType>({
    resolver: zodResolver(addressSchema),
    defaultValues: { zipCode: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "", ...defaultValues },
  });

  const formatCep = (value: string) => {
    const n = value.replace(/\D/g, "");
    return n.length <= 5 ? n : `${n.slice(0, 5)}-${n.slice(5, 8)}`;
  };

  const handleCepBlur = async (cep: string) => {
    const clean = cep.replace(/\D/g, "");
    if (clean.length === 8) {
      setIsLoadingCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
        const data = await res.json();
        if (!data.erro) {
          form.setValue("street", data.logradouro || "");
          form.setValue("neighborhood", data.bairro || "");
          form.setValue("city", data.localidade || "");
          form.setValue("state", data.uf || "");
        }
      } catch {
      } finally {
        setIsLoadingCep(false);
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onNext)} className="flex flex-col pb-6">
        <div className="px-6 pt-8 pb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#2B54FF]/20 border border-[#2B54FF]/40 flex items-center justify-center mb-4">
            <MapPin className="w-6 h-6 text-[#2B54FF]" />
          </div>
          <h2 className="text-2xl font-bold text-white">Endereço</h2>
          <p className="text-sm text-slate-400 mt-1">Onde você mora? Precisamos do seu endereço completo</p>
        </div>

        <div className="px-6 space-y-5">
          <FormField
            control={form.control}
            name="zipCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelCls}>CEP *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="00000-000"
                      {...field}
                      onChange={(e) => field.onChange(formatCep(e.target.value))}
                      onBlur={(e) => handleCepBlur(e.target.value)}
                      className={`${inputCls} pr-10`}
                      inputMode="numeric"
                    />
                    {isLoadingCep && <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-5 text-slate-400" />}
                  </div>
                </FormControl>
                <p className="text-xs text-slate-500 mt-1">Digite o CEP para preencher o endereço automaticamente</p>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="street"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelCls}>Logradouro *</FormLabel>
                <FormControl>
                  <Input placeholder="Nome da rua, avenida..." {...field} className={inputCls} />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelCls}>Número *</FormLabel>
                  <FormControl>
                    <Input placeholder="123" {...field} className={inputCls} inputMode="numeric" />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="complement"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelCls}>Complemento</FormLabel>
                  <FormControl>
                    <Input placeholder="Apto, casa..." {...field} className={inputCls} />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="neighborhood"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelCls}>Bairro *</FormLabel>
                <FormControl>
                  <Input placeholder="Nome do bairro" {...field} className={inputCls} />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-3 gap-3">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel className={labelCls}>Cidade *</FormLabel>
                  <FormControl>
                    <Input placeholder="Cidade" {...field} className={inputCls} />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelCls}>UF *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="SP"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      maxLength={2}
                      className={inputCls}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
          </div>

          <div className="pt-2 space-y-3">
            <Button type="submit" className="w-full h-14 bg-[#2B54FF] hover:bg-[#2B54FF]/90 text-white font-semibold rounded-2xl text-base">
              Continuar <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button type="button" onClick={onBack} className="w-full h-12 bg-transparent border border-white/15 text-slate-300 hover:bg-white/5 rounded-2xl text-sm">
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
