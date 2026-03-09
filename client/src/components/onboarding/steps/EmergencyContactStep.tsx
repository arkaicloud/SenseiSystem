import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, ArrowRight, Users } from "lucide-react";

const emergencyContactSchema = z.object({
  emergencyContact: z.string().min(1, "Nome do contato é obrigatório"),
  emergencyPhone: z.string().min(10, "Telefone de emergência deve ter pelo menos 10 dígitos"),
  relationship: z.string().min(1, "Parentesco é obrigatório"),
});

export type EmergencyContactType = z.infer<typeof emergencyContactSchema>;

interface EmergencyContactStepProps {
  onNext: (data: EmergencyContactType) => void;
  onBack: () => void;
  defaultValues?: Partial<EmergencyContactType>;
}

const inputCls = "h-14 text-base bg-white/5 border-white/10 text-white placeholder:text-slate-500 rounded-xl focus-visible:ring-[#2B54FF]/50 focus-visible:border-[#2B54FF]/50";
const labelCls = "text-slate-300 text-sm font-medium";

export default function EmergencyContactStep({ onNext, onBack, defaultValues }: EmergencyContactStepProps) {
  const form = useForm<EmergencyContactType>({
    resolver: zodResolver(emergencyContactSchema),
    defaultValues: { emergencyContact: "", emergencyPhone: "", relationship: "", ...defaultValues },
  });

  const formatPhone = (value: string) => {
    const n = value.replace(/\D/g, "");
    if (n.length <= 2) return `(${n}`;
    if (n.length <= 7) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
    return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7, 11)}`;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onNext)} className="flex flex-col pb-6">
        <div className="px-6 pt-8 pb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#2B54FF]/20 border border-[#2B54FF]/40 flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-[#2B54FF]" />
          </div>
          <h2 className="text-2xl font-bold text-white">Contato de Emergência</h2>
          <p className="text-sm text-slate-400 mt-1">Pessoa para contato em caso de emergência</p>
        </div>

        <div className="px-6 space-y-5">
          <FormField
            control={form.control}
            name="emergencyContact"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelCls}>Nome *</FormLabel>
                <FormControl>
                  <Input placeholder="Nome do responsável" {...field} className={inputCls} />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="relationship"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelCls}>Parentesco *</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Pai, Mãe, Cônjuge, Irmão(ã)" {...field} className={inputCls} />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="emergencyPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelCls}>Telefone *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="(11) 99999-9999"
                    {...field}
                    onChange={(e) => field.onChange(formatPhone(e.target.value))}
                    className={inputCls}
                    inputMode="tel"
                  />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

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
