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

export default function AddressStep({ onNext, onBack, defaultValues }: AddressStepProps) {
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  
  const form = useForm<AddressType>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      zipCode: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      ...defaultValues,
    },
  });

  const handleSubmit = (data: AddressType) => {
    onNext(data);
  };

  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 5) {
      return numbers;
    } else {
      return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
    }
  };

  const handleCepBlur = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length === 8) {
      setIsLoadingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          form.setValue("street", data.logradouro || "");
          form.setValue("neighborhood", data.bairro || "");
          form.setValue("city", data.localidade || "");
          form.setValue("state", data.uf || "");
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      } finally {
        setIsLoadingCep(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <MapPin className="w-6 h-6 text-primary" />
          </div>
        </div>
        <h3 className="text-xl font-semibold mb-2">Endereço</h3>
        <p className="text-sm text-muted-foreground px-4">
          Onde você mora? Precisamos do seu endereço completo
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="zipCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium">CEP *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      placeholder="00000-000" 
                      {...field}
                      onChange={(e) => {
                        const formatted = formatCep(e.target.value);
                        field.onChange(formatted);
                      }}
                      onBlur={(e) => handleCepBlur(e.target.value)}
                      className="h-12 text-base pr-10"
                    />
                    {isLoadingCep && (
                      <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-4" />
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="street"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium">Logradouro *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Nome da rua, avenida..." 
                    {...field} 
                    className="h-12 text-base"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">Número *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="123" 
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
              name="complement"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">Complemento</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Apto, casa..." 
                      {...field} 
                      className="h-12 text-base"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="neighborhood"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium">Bairro *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Nome do bairro" 
                    {...field} 
                    className="h-12 text-base"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">Cidade *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Cidade" 
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
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">Estado *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="SP" 
                      {...field}
                      onChange={(e) => {
                        field.onChange(e.target.value.toUpperCase());
                      }}
                      maxLength={2}
                      className="h-12 text-base"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

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