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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, School, Upload, Save, Award, CreditCard, Mail, TestTube, AlertCircle } from "lucide-react";
import type { SchoolConfig } from "@shared/schema";

// Schema para validação do formulário
const schoolConfigSchema = z.object({
  schoolName: z.string().min(1, "Nome da escola é obrigatório"),
  logoUrl: z.string().optional().refine((val) => {
    if (!val || val === "") return true;
    // Aceita URLs ou dados base64
    return val.startsWith("http") || val.startsWith("data:image/");
  }, "Logo deve ser uma URL válida ou uma imagem"),
  logoLightUrl: z.string().optional(),
  logoDarkUrl: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email deve ser válido").optional().or(z.literal("")),
  website: z.string().url("Website deve ser uma URL válida").optional().or(z.literal("")),
  instagram: z.string().url("Instagram deve ser uma URL válida").optional().or(z.literal("")),
  facebook: z.string().url("Facebook deve ser uma URL válida").optional().or(z.literal("")),
  whatsapp: z.string().optional(),
  youtube: z.string().url("YouTube deve ser uma URL válida").optional().or(z.literal("")),
  tiktok: z.string().url("TikTok deve ser uma URL válida").optional().or(z.literal("")),
  congratsMessage: z.string().optional(),
  welcomeMessage: z.string().optional(),
  defaultTheme: z.enum(["light", "dark"]).default("light"),
  asaasApiKey: z.string().optional(),
  // Configurações SMTP
  smtpEnabled: z.boolean().optional(),
  smtpHost: z.string().optional(),
  smtpPort: z.number().min(1).max(65535).optional().or(z.string().transform(Number)),
  smtpSecure: z.boolean().optional(),
  smtpUser: z.string().optional(),
  smtpPassword: z.string().optional(),
  smtpFromEmail: z.string().email("Email deve ser válido").optional().or(z.literal("")),
  smtpFromName: z.string().optional(),
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
      logoLightUrl: currentConfig?.logoLightUrl || "",
      logoDarkUrl: currentConfig?.logoDarkUrl || "",
      address: currentConfig?.address || "",
      phone: currentConfig?.phone || "",
      email: currentConfig?.email || "",
      website: currentConfig?.website || "",
      instagram: currentConfig?.instagram || "",
      facebook: currentConfig?.facebook || "",
      whatsapp: currentConfig?.whatsapp || "",
      youtube: currentConfig?.youtube || "",
      tiktok: currentConfig?.tiktok || "",
      congratsMessage: currentConfig?.congratsMessage || "",
      welcomeMessage: currentConfig?.welcomeMessage || "",
      asaasApiKey: currentConfig?.asaasApiKey || "",
      // Configurações SMTP
      smtpEnabled: currentConfig?.smtpEnabled || false,
      smtpHost: currentConfig?.smtpHost || "",
      smtpPort: currentConfig?.smtpPort || 587,
      smtpSecure: currentConfig?.smtpSecure || false,
      smtpUser: currentConfig?.smtpUser || "",
      smtpPassword: currentConfig?.smtpPassword || "",
      smtpFromEmail: currentConfig?.smtpFromEmail || "",
      smtpFromName: currentConfig?.smtpFromName || "",
    },
  });

  // Resetar valores do formulário quando dados carregarem
  React.useEffect(() => {
    if (currentConfig) {
      form.reset({
        schoolName: currentConfig.schoolName || "",
        logoUrl: currentConfig.logoUrl || "",
        logoLightUrl: currentConfig.logoLightUrl || "",
        logoDarkUrl: currentConfig.logoDarkUrl || "",
        address: currentConfig.address || "",
        phone: currentConfig.phone || "",
        email: currentConfig.email || "",
        website: currentConfig.website || "",
        instagram: currentConfig.instagram || "",
        facebook: currentConfig.facebook || "",
        whatsapp: currentConfig.whatsapp || "",
        youtube: currentConfig.youtube || "",
        tiktok: currentConfig.tiktok || "",
        congratsMessage: currentConfig.congratsMessage || "",
        welcomeMessage: currentConfig.welcomeMessage || "",
        defaultTheme: (currentConfig.defaultTheme as "light" | "dark") || "light",
        asaasApiKey: currentConfig.asaasApiKey || "",
        // Configurações SMTP
        smtpEnabled: currentConfig.smtpEnabled || false,
        smtpHost: currentConfig.smtpHost || "",
        smtpPort: currentConfig.smtpPort || 587,
        smtpSecure: currentConfig.smtpSecure || false,
        smtpUser: currentConfig.smtpUser || "",
        smtpPassword: currentConfig.smtpPassword || "",
        smtpFromEmail: currentConfig.smtpFromEmail || "",
        smtpFromName: currentConfig.smtpFromName || "",
      });
    }
  }, [currentConfig, form]);

  // Mutation para salvar configurações
  const updateConfigMutation = useMutation({
    mutationFn: async (data: SchoolConfigForm) => {
      const response = await apiRequest("PATCH", "/api/school-config", data);
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
      console.error("School config update error:", error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Erro desconhecido ao salvar configurações",
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
    <div className="max-w-4xl">
      {/* Cabeçalho */}
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          <School className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-gray-900">Configurações da Escola</h1>
        </div>
        <p className="text-gray-600">
          Gerencie as informações básicas da sua academia que aparecerão na tela de login e dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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

                  {/* Logo da Escola */}
                  <FormField
                    control={form.control}
                    name="logoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logo da Escola</FormLabel>
                        <FormControl>
                          <div className="space-y-4">
                            {/* Preview da imagem atual */}
                            {field.value && (
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-gray-700">Preview do Logo:</p>
                                <div className="flex items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                                  <img 
                                    src={field.value} 
                                    alt="Logo preview" 
                                    className="max-w-full max-h-full object-contain rounded-lg"
                                  />
                                </div>
                                <p className="text-xs text-gray-500 text-center">
                                  Visualização em tamanho real (128x128px)
                                </p>
                              </div>
                            )}
                            
                            {/* Upload de arquivo */}
                            <div className="space-y-4">
                              <div className="text-sm font-medium text-gray-700">Opções de Logo:</div>
                              
                              {/* Logo Padrão */}
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="logoOption"
                                  value="default"
                                  checked={!field.value || field.value === 'default'}
                                  onChange={() => field.onChange('default')}
                                  className="text-blue-600"
                                />
                                <span className="text-sm text-gray-600">Usar Logo Padrão SenseiSystem</span>
                              </label>
                              
                              {/* Upload de Logo Personalizado */}
                              <div className="space-y-2">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                  <input
                                    type="radio"
                                    name="logoOption"
                                    value="custom"
                                    checked={field.value && field.value !== 'default' && field.value.startsWith('data:')}
                                    onChange={() => {}}
                                    className="text-blue-600"
                                  />
                                  <span className="text-sm text-gray-600">Upload Logo Personalizado</span>
                                </label>
                                
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      if (file.size > 2 * 1024 * 1024) {
                                        toast({
                                          title: "Arquivo muito grande",
                                          description: "Por favor, selecione uma imagem menor que 2MB",
                                          variant: "destructive",
                                        });
                                        return;
                                      }
                                      const reader = new FileReader();
                                      reader.onload = (event) => {
                                        const base64 = event.target?.result as string;
                                        field.onChange(base64);
                                        toast({
                                          title: "Logo carregado",
                                          description: "Logo personalizado aplicado com sucesso",
                                        });
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                  className="ml-6 text-sm text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                              </div>
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                        <div className="text-sm text-gray-500 space-y-1">
                          <p>• <strong>Logo Padrão:</strong> Usa o nome da escola em destaque no login</p>
                          <p>• <strong>Tema Claro:</strong> Faça upload de um logo otimizado para fundos claros</p>
                          <p>• <strong>Tema Escuro:</strong> Faça upload de um logo otimizado para fundos escuros</p>
                          <p>• <strong>Logo Personalizado:</strong> Um logo único que funciona em qualquer tema</p>
                          <p>• Tamanho máximo: 2MB • Formatos: PNG, JPG, JPEG</p>
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* Logo Tema Claro */}
                  <FormField
                    control={form.control}
                    name="logoLightUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logo Tema Claro</FormLabel>
                        <FormControl>
                          <div className="space-y-4">
                            {/* Preview do logo claro */}
                            {field.value && (
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-gray-700">Preview Logo Claro:</p>
                                <div className="flex items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg bg-white">
                                  <img 
                                    src={field.value} 
                                    alt="Logo claro preview" 
                                    className="max-w-full max-h-full object-contain rounded-lg"
                                  />
                                </div>
                              </div>
                            )}
                            
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  if (file.size > 2 * 1024 * 1024) {
                                    toast({
                                      title: "Arquivo muito grande",
                                      description: "Por favor, selecione uma imagem menor que 2MB",
                                      variant: "destructive",
                                    });
                                    return;
                                  }
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    const base64 = event.target?.result as string;
                                    field.onChange(base64);
                                    toast({
                                      title: "Logo tema claro carregado",
                                      description: "Logo para tema claro aplicado com sucesso",
                                    });
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                        <div className="text-sm text-gray-500">
                          Logo otimizado para fundos claros (tema claro)
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* Logo Tema Escuro */}
                  <FormField
                    control={form.control}
                    name="logoDarkUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logo Tema Escuro</FormLabel>
                        <FormControl>
                          <div className="space-y-4">
                            {/* Preview do logo escuro */}
                            {field.value && (
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-gray-700">Preview Logo Escuro:</p>
                                <div className="flex items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg bg-slate-900">
                                  <img 
                                    src={field.value} 
                                    alt="Logo escuro preview" 
                                    className="max-w-full max-h-full object-contain rounded-lg"
                                  />
                                </div>
                              </div>
                            )}
                            
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  if (file.size > 2 * 1024 * 1024) {
                                    toast({
                                      title: "Arquivo muito grande",
                                      description: "Por favor, selecione uma imagem menor que 2MB",
                                      variant: "destructive",
                                    });
                                    return;
                                  }
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    const base64 = event.target?.result as string;
                                    field.onChange(base64);
                                    toast({
                                      title: "Logo tema escuro carregado",
                                      description: "Logo para tema escuro aplicado com sucesso",
                                    });
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                        <div className="text-sm text-gray-500">
                          Logo otimizado para fundos escuros (tema escuro)
                        </div>
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

                  {/* Mensagem de Parabéns */}
                  <FormField
                    control={form.control}
                    name="congratsMessage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mensagem de Parabéns</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Mensagem personalizada para graduações..."
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-sm text-gray-500">
                          Mensagem que aparecerá quando um aluno for graduado
                        </p>
                      </FormItem>
                    )}
                  />

                  {/* Seção Redes Sociais */}
                  <div className="pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Redes Sociais</h3>
                    <p className="text-sm text-gray-600 mb-6">Configure as redes sociais da academia. Os ícones aparecerão no menu da aplicação.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Instagram */}
                      <FormField
                        control={form.control}
                        name="instagram"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <div className="w-5 h-5 bg-gradient-to-tr from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                </svg>
                              </div>
                              Instagram
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="https://www.instagram.com/suaacademia" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Facebook */}
                      <FormField
                        control={form.control}
                        name="facebook"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <div className="w-5 h-5 bg-blue-600 rounded-lg flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                </svg>
                              </div>
                              Facebook
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="https://www.facebook.com/suaacademia" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* WhatsApp */}
                      <FormField
                        control={form.control}
                        name="whatsapp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <div className="w-5 h-5 bg-green-500 rounded-lg flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.488"/>
                                </svg>
                              </div>
                              WhatsApp
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="(11) 99999-9999" {...field} />
                            </FormControl>
                            <FormMessage />
                            <div className="text-xs text-gray-500">
                              Apenas números com código do país (ex: 5511999999999)
                            </div>
                          </FormItem>
                        )}
                      />

                      {/* YouTube */}
                      <FormField
                        control={form.control}
                        name="youtube"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <div className="w-5 h-5 bg-red-600 rounded-lg flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                </svg>
                              </div>
                              YouTube
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="https://www.youtube.com/@suaacademia" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* TikTok */}
                      <FormField
                        control={form.control}
                        name="tiktok"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <div className="w-5 h-5 bg-black rounded-lg flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                                </svg>
                              </div>
                              TikTok
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="https://www.tiktok.com/@suaacademia" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Seção ASAAS */}
                  <div className="pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Integração ASAAS
                    </h3>
                    <p className="text-sm text-gray-600 mb-6">
                      Configure a integração com ASAAS para automação de cobranças e gestão financeira.
                      A API Key é necessária para criar clientes e cobranças automaticamente quando aprovar alunos.
                    </p>
                    
                    <FormField
                      control={form.control}
                      name="asaasApiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>API Key ASAAS</FormLabel>
                          <FormControl>
                            <Input 
                              type="password"
                              placeholder="Digite sua API Key do ASAAS..." 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                          <div className="text-sm text-gray-500">
                            Encontre sua API Key no painel ASAAS em: Configurações → API Keys
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Seção SMTP Email */}
                  <div className="pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Configurações de Email (SMTP)
                    </h3>
                    <p className="text-sm text-gray-600 mb-6">
                      Configure o servidor SMTP para envio automático de emails como confirmações de matrícula, recuperação de senha e comunicados.
                    </p>
                    
                    {/* Habilitar SMTP */}
                    <div className="mb-6">
                      <FormField
                        control={form.control}
                        name="smtpEnabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Habilitar SMTP</FormLabel>
                              <div className="text-sm text-gray-500">
                                Ativar envio automático de emails via SMTP personalizado
                              </div>
                            </div>
                            <FormControl>
                              <input
                                type="checkbox"
                                data-testid="checkbox-smtp-enabled"
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                checked={field.value}
                                onChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    {form.watch("smtpEnabled") && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Host SMTP */}
                          <FormField
                            control={form.control}
                            name="smtpHost"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Servidor SMTP *</FormLabel>
                                <FormControl>
                                  <Input placeholder="smtp.gmail.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Porta SMTP */}
                          <FormField
                            control={form.control}
                            name="smtpPort"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Porta SMTP *</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="587" 
                                    {...field}
                                    value={field.value || ''}
                                    onChange={(e) => field.onChange(Number(e.target.value) || 587)}
                                  />
                                </FormControl>
                                <FormMessage />
                                <div className="text-xs text-gray-500">
                                  587 (TLS), 465 (SSL), 25 (não criptografado)
                                </div>
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Usuário SMTP */}
                          <FormField
                            control={form.control}
                            name="smtpUser"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Usuário SMTP *</FormLabel>
                                <FormControl>
                                  <Input placeholder="seuemail@gmail.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Senha SMTP */}
                          <FormField
                            control={form.control}
                            name="smtpPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Senha SMTP *</FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="••••••••" {...field} />
                                </FormControl>
                                <FormMessage />
                                <div className="text-xs text-gray-500">
                                  Para Gmail, use "Senha de App" ao invés da senha normal
                                </div>
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Email do Remetente */}
                          <FormField
                            control={form.control}
                            name="smtpFromEmail"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email Remetente</FormLabel>
                                <FormControl>
                                  <Input placeholder="noreply@suaacademia.com.br" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Nome do Remetente */}
                          <FormField
                            control={form.control}
                            name="smtpFromName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nome do Remetente</FormLabel>
                                <FormControl>
                                  <Input placeholder="Sua Academia" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* SSL/TLS */}
                        <FormField
                          control={form.control}
                          name="smtpSecure"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Usar SSL (porta 465)</FormLabel>
                                <div className="text-sm text-gray-500">
                                  Ativar se usar porta 465. Desativar para portas 587 e 25
                                </div>
                              </div>
                              <FormControl>
                                <input
                                  type="checkbox"
                                  data-testid="checkbox-smtp-secure"
                                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                  checked={field.value}
                                  onChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div className="text-sm text-blue-800">
                              <p className="font-medium mb-2">Provedores Comuns:</p>
                              <ul className="text-xs space-y-1">
                                <li><strong>Gmail:</strong> smtp.gmail.com, porta 587, usar "Senha de App"</li>
                                <li><strong>Outlook:</strong> smtp-mail.outlook.com, porta 587</li>
                                <li><strong>SendGrid:</strong> smtp.sendgrid.net, porta 587</li>
                                <li><strong>Mailgun:</strong> smtp.mailgun.org, porta 587</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

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

              {form.watch("congratsMessage") && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-gray-600">{form.watch("congratsMessage")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}