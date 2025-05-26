import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Settings, Palette, Layout, Eye, Sparkles, Save, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import type { DashboardCustomization, InsertDashboardCustomization } from "@shared/schema";

interface DashboardCustomizationWizardProps {
  children?: React.ReactNode;
}

const DashboardCustomizationWizard: React.FC<DashboardCustomizationWizardProps> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch existing customization
  const { data: customization, isLoading } = useQuery({
    queryKey: ['/api/dashboard-customization'],
    enabled: !!user?.id && isOpen,
  });

  // Form state
  const [formData, setFormData] = useState<Partial<InsertDashboardCustomization>>({
    layout: 'default',
    theme: 'light',
    widgetOrder: ['stats', 'notifications', 'attendance', 'events'],
    hiddenWidgets: [],
    showWelcomeMessage: true,
    compactMode: false,
    showQuickActions: true,
    backgroundColor: '#ffffff',
    accentColor: '#3b82f6',
  });

  // Update form data when customization loads
  React.useEffect(() => {
    if (customization) {
      setFormData({
        layout: customization.layout,
        theme: customization.theme,
        widgetOrder: customization.widgetOrder,
        hiddenWidgets: customization.hiddenWidgets,
        showWelcomeMessage: customization.showWelcomeMessage,
        compactMode: customization.compactMode,
        showQuickActions: customization.showQuickActions,
        backgroundColor: customization.backgroundColor || '#ffffff',
        accentColor: customization.accentColor || '#3b82f6',
      });
    }
  }, [customization]);

  // Save customization mutation
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<InsertDashboardCustomization>) => {
      const endpoint = customization 
        ? '/api/dashboard-customization' 
        : '/api/dashboard-customization';
      const method = customization ? 'PATCH' : 'POST';
      
      const res = await apiRequest(method, endpoint, {
        ...data,
        userId: user?.id,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard-customization'] });
      toast({
        title: "Personalização Salva",
        description: "Suas preferências de dashboard foram atualizadas com sucesso.",
      });
      setIsOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao Salvar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const steps = [
    {
      title: "Layout do Dashboard",
      description: "Escolha como organizar seu painel",
      icon: <Layout className="h-5 w-5" />,
    },
    {
      title: "Tema e Cores",
      description: "Personalize a aparência visual",
      icon: <Palette className="h-5 w-5" />,
    },
    {
      title: "Widgets e Conteúdo",
      description: "Configure quais informações exibir",
      icon: <Eye className="h-5 w-5" />,
    },
    {
      title: "Finalizar",
      description: "Revise e salve suas configurações",
      icon: <Sparkles className="h-5 w-5" />,
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  const handleReset = () => {
    setFormData({
      layout: 'default',
      theme: 'light',
      widgetOrder: ['stats', 'notifications', 'attendance', 'events'],
      hiddenWidgets: [],
      showWelcomeMessage: true,
      compactMode: false,
      showQuickActions: true,
      backgroundColor: '#ffffff',
      accentColor: '#3b82f6',
    });
    toast({
      title: "Configurações Resetadas",
      description: "As configurações foram restauradas para os valores padrão.",
    });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-medium">Estilo do Layout</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                {[
                  { value: 'default', name: 'Padrão', desc: 'Layout tradicional com widgets organizados' },
                  { value: 'compact', name: 'Compacto', desc: 'Mais informação em menos espaço' },
                  { value: 'minimal', name: 'Minimalista', desc: 'Design limpo e simplificado' },
                ].map((layout) => (
                  <Card 
                    key={layout.value}
                    className={`cursor-pointer transition-all ${
                      formData.layout === layout.value 
                        ? 'ring-2 ring-primary bg-primary/5' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setFormData({ ...formData, layout: layout.value as any })}
                  >
                    <CardContent className="p-4">
                      <div className="font-medium">{layout.name}</div>
                      <div className="text-sm text-gray-600 mt-1">{layout.desc}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="compact-mode" className="text-base font-medium">
                Modo Compacto
              </Label>
              <Switch
                id="compact-mode"
                checked={formData.compactMode}
                onCheckedChange={(checked) => setFormData({ ...formData, compactMode: checked })}
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-medium">Tema</Label>
              <Select
                value={formData.theme}
                onValueChange={(value) => setFormData({ ...formData, theme: value as any })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Claro</SelectItem>
                  <SelectItem value="dark">Escuro</SelectItem>
                  <SelectItem value="auto">Automático (sistema)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-base font-medium">Cor de Destaque</Label>
              <div className="grid grid-cols-6 gap-2 mt-3">
                {[
                  '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
                  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
                ].map((color) => (
                  <button
                    key={color}
                    className={`w-12 h-12 rounded-lg border-2 transition-all ${
                      formData.accentColor === color 
                        ? 'border-gray-800 scale-110' 
                        : 'border-gray-300 hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, accentColor: color })}
                  />
                ))}
              </div>
            </div>

            <div>
              <Label className="text-base font-medium">Cor de Fundo</Label>
              <div className="grid grid-cols-4 gap-2 mt-3">
                {[
                  { color: '#ffffff', name: 'Branco' },
                  { color: '#f8fafc', name: 'Cinza Claro' },
                  { color: '#f1f5f9', name: 'Azul Claro' },
                  { color: '#fefce8', name: 'Amarelo Claro' },
                ].map((bg) => (
                  <Card
                    key={bg.color}
                    className={`cursor-pointer transition-all ${
                      formData.backgroundColor === bg.color 
                        ? 'ring-2 ring-primary' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setFormData({ ...formData, backgroundColor: bg.color })}
                  >
                    <CardContent className="p-3">
                      <div 
                        className="w-full h-8 rounded mb-2 border"
                        style={{ backgroundColor: bg.color }}
                      />
                      <div className="text-sm font-medium text-center">{bg.name}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="welcome-message" className="text-base font-medium">
                Mostrar Mensagem de Boas-vindas
              </Label>
              <Switch
                id="welcome-message"
                checked={formData.showWelcomeMessage}
                onCheckedChange={(checked) => setFormData({ ...formData, showWelcomeMessage: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="quick-actions" className="text-base font-medium">
                Mostrar Ações Rápidas
              </Label>
              <Switch
                id="quick-actions"
                checked={formData.showQuickActions}
                onCheckedChange={(checked) => setFormData({ ...formData, showQuickActions: checked })}
              />
            </div>

            <div>
              <Label className="text-base font-medium">Widgets Visíveis</Label>
              <div className="space-y-3 mt-3">
                {[
                  { id: 'stats', name: 'Estatísticas', desc: 'Números gerais e métricas' },
                  { id: 'notifications', name: 'Notificações', desc: 'Avisos e alertas importantes' },
                  { id: 'attendance', name: 'Presença', desc: 'Informações de frequência' },
                  { id: 'events', name: 'Eventos', desc: 'Próximos eventos e atividades' },
                ].map((widget) => (
                  <div key={widget.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{widget.name}</div>
                      <div className="text-sm text-gray-600">{widget.desc}</div>
                    </div>
                    <Switch
                      checked={!formData.hiddenWidgets?.includes(widget.id)}
                      onCheckedChange={(checked) => {
                        const hiddenWidgets = formData.hiddenWidgets || [];
                        if (checked) {
                          setFormData({
                            ...formData,
                            hiddenWidgets: hiddenWidgets.filter(id => id !== widget.id)
                          });
                        } else {
                          setFormData({
                            ...formData,
                            hiddenWidgets: [...hiddenWidgets, widget.id]
                          });
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Sparkles className="h-16 w-16 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Configuração Quase Pronta!</h3>
              <p className="text-gray-600 mt-2">
                Revise suas configurações e clique em salvar para aplicar as mudanças.
              </p>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Resumo das Configurações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Layout:</span>
                    <Badge variant="secondary">
                      {formData.layout === 'default' ? 'Padrão' : 
                       formData.layout === 'compact' ? 'Compacto' : 'Minimalista'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tema:</span>
                    <Badge variant="secondary">
                      {formData.theme === 'light' ? 'Claro' : 
                       formData.theme === 'dark' ? 'Escuro' : 'Automático'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Modo Compacto:</span>
                    <Badge variant={formData.compactMode ? "default" : "secondary"}>
                      {formData.compactMode ? 'Ativado' : 'Desativado'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Widgets Visíveis:</span>
                    <Badge variant="secondary">
                      {4 - (formData.hiddenWidgets?.length || 0)} de 4
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="flex-1"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Resetar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                  className="flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Personalizar Dashboard
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Assistente de Personalização
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Progress indicators */}
            <div className="flex justify-between mb-6">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`flex flex-col items-center space-y-2 ${
                    index <= currentStep ? 'text-primary' : 'text-gray-400'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${
                      index <= currentStep
                        ? 'border-primary bg-primary text-white'
                        : 'border-gray-300'
                    }`}
                  >
                    {step.icon}
                  </div>
                  <div className="text-xs text-center max-w-20">
                    <div className="font-medium">{step.title}</div>
                  </div>
                </div>
              ))}
            </div>

            <Separator className="mb-6" />

            {/* Step content */}
            <div className="mb-8">
              <div className="mb-4">
                <h3 className="text-lg font-semibold">{steps[currentStep].title}</h3>
                <p className="text-gray-600">{steps[currentStep].description}</p>
              </div>
              {renderStepContent()}
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
              >
                Anterior
              </Button>
              {currentStep < steps.length - 1 ? (
                <Button onClick={handleNext}>
                  Próximo
                </Button>
              ) : null}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DashboardCustomizationWizard;