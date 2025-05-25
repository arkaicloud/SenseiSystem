import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, School, Upload, Save } from "lucide-react";
import type { SchoolConfig } from "@shared/schema";

// Schema para validação do formulário
const schoolConfigSchema = z.object({
  schoolName: z.string().min(1, "Nome da escola é obrigatório"),
  logoUrl: z.string().url("URL deve ser válida").optional().or(z.literal("")),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email deve ser válido").optional().or(z.literal("")),
  website: z.string().url("Website deve ser uma URL válida").optional().or(z.literal("")),
  description: z.string().optional(),
});

type SchoolConfigForm = z.infer<typeof schoolConfigSchema>;

export default function SchoolConfigPage() {
  const { toast } = useToast();

  // Carregar configurações atuais
  const { data: configData, isLoading } = useQuery<{ config: SchoolConfig }>({
    queryKey: ['/api/school-config'],
  });

  const currentConfig = configData?.config;

  // Configurar formulário
  const form = useForm<SchoolConfigForm>({
    resolver: zodResolver(schoolConfigSchema),
    defaultValues: {
      schoolName: currentConfig?.schoolName || "",
      logoUrl: currentConfig?.logoUrl || "",
      address: currentConfig?.address || "",
      phone: currentConfig?.phone || "",
      email: currentConfig?.email || "",
      website: currentConfig?.website || "",
      description: currentConfig?.description || "",
    },
  });

  // Resetar valores do formulário quando dados carregarem
  React.useEffect(() => {
    if (currentConfig) {
      form.reset({
        schoolName: currentConfig.schoolName || "",
        logoUrl: currentConfig.logoUrl || "",
        address: currentConfig.address || "",
        phone: currentConfig.phone || "",
        email: currentConfig.email || "",
        website: currentConfig.website || "",
        description: currentConfig.description || "",
      });
    }
  }, [currentConfig, form]);

  // Mutation para salvar configurações
  const updateConfigMutation = useMutation({
    mutationFn: async (data: SchoolConfigForm) => {
      const response = await apiRequest("PUT", "/api/school-config", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school-config"] });
      toast({
        title: "Configurações salvas",
        description: "As configurações da escola foram atualizadas com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SchoolConfigForm) => {
    updateConfigMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Cabeçalho */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <School className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-gray-900">Configurações da Escola</h1>
        </div>
        <p className="text-gray-600">
          Gerencie as informações básicas da sua academia que aparecerão na tela de login e dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Escola</CardTitle>
              <CardDescription>
                Configure os dados básicos da sua academia de Jiu-Jitsu.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Nome da Escola */}
                  <FormField
                    control={form.control}
                    name="schoolName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Escola *</FormLabel>
                        <FormControl>
                          <Input placeholder="Academia de Jiu-Jitsu" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* URL do Logo */}
                  <FormField
                    control={form.control}
                    name="logoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL do Logo</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://exemplo.com/logo.png" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-sm text-gray-500">
                          URL da imagem do logo que aparecerá na tela de login
                        </p>
                      </FormItem>
                    )}
                  />

                  {/* Endereço */}
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endereço</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Rua das Artes Marciais, 123 - Centro"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Telefone */}
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input placeholder="(11) 99999-9999" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Email */}
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="contato@academia.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Website */}
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input placeholder="https://www.academia.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Descrição */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descrição da academia..."
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Botão de Salvar */}
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={updateConfigMutation.isPending}
                  >
                    {updateConfigMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Configurações
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Pré-visualização</CardTitle>
              <CardDescription>
                Como as informações aparecerão na aplicação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Preview do Logo */}
              {form.watch("logoUrl") && (
                <div className="text-center">
                  <img 
                    src={form.watch("logoUrl")} 
                    alt="Logo"
                    className="max-h-20 w-auto mx-auto object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Preview do Nome */}
              <div className="text-center">
                <h3 className="text-xl font-bold text-primary">
                  {form.watch("schoolName") || "Nome da Escola"}
                </h3>
              </div>

              {/* Preview das Informações */}
              <div className="space-y-2 text-sm">
                {form.watch("address") && (
                  <p className="text-gray-600">📍 {form.watch("address")}</p>
                )}
                {form.watch("phone") && (
                  <p className="text-gray-600">📞 {form.watch("phone")}</p>
                )}
                {form.watch("email") && (
                  <p className="text-gray-600">📧 {form.watch("email")}</p>
                )}
                {form.watch("website") && (
                  <p className="text-gray-600">🌐 {form.watch("website")}</p>
                )}
              </div>

              {form.watch("description") && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-gray-600">{form.watch("description")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}