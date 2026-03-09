import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, ArrowRight, Phone } from "lucide-react";

const contactInfoSchema = z.object({
  email: z.string().email("E-mail inválido"),
  phone: z.string().min(10, "WhatsApp deve ter pelo menos 10 dígitos"),
});

export type ContactInfoType = z.infer<typeof contactInfoSchema>;

interface ContactInfoStepProps {
  onNext: (data: ContactInfoType) => void;
  onBack: () => void;
  defaultValues?: Partial<ContactInfoType>;
}

export default function ContactInfoStep({ onNext, onBack, defaultValues }: ContactInfoStepProps) {
  const form = useForm<ContactInfoType>({
    resolver: zodResolver(contactInfoSchema),
    defaultValues: {
      email: "",
      phone: "",
      ...defaultValues,
    },
  });

  const handleSubmit = (data: ContactInfoType) => {
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
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Phone className="w-6 h-6 text-primary" />
          </div>
        </div>
        <h3 className="text-xl font-semibold mb-2">Contato</h3>
        <p className="text-sm text-muted-foreground px-4">
          Como podemos entrar em contato com você?
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium">E-mail *</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    {...field}
                    className="h-12 text-base"
                  />
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
                <FormLabel className="text-base font-medium">WhatsApp *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="(11) 99999-9999"
                    {...field}
                    onChange={(e) => {
                      const formatted = formatPhone(e.target.value);
                      field.onChange(formatted);
                    }}
                    className="h-12 text-base"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-col space-y-3 pt-4">
            <Button type="submit" className="w-full h-12 text-base font-medium">
              Continuar
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="w-full h-12 text-base font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
