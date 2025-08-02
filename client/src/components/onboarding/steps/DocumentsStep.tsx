import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, ArrowRight } from "lucide-react";

const documentsSchema = z.object({
  username: z.string().min(3, "Usuário deve ter pelo menos 3 caracteres"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

type DocumentsData = z.infer<typeof documentsSchema>;

interface DocumentsStepProps {
  onNext: (data: DocumentsData) => void;
  onBack: () => void;
  defaultValues?: Partial<DocumentsData>;
  isSubmitting?: boolean;
}

export default function DocumentsStep({ onNext, onBack, defaultValues, isSubmitting }: DocumentsStepProps) {
  const form = useForm<DocumentsData>({
    resolver: zodResolver(documentsSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      ...defaultValues,
    },
  });

  const handleSubmit = (data: DocumentsData) => {
    onNext(data);
  };

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Criar sua conta</h3>
        <p className="text-sm text-muted-foreground">
          Por último, escolha um nome de usuário e senha para acessar o sistema.
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome de Usuário *</FormLabel>
                <FormControl>
                  <Input placeholder="joaosilva" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha *</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar Senha *</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-32">
              {isSubmitting ? "Criando conta..." : "Finalizar Matrícula"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}