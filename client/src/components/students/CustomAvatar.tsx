import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Edit } from "lucide-react";

// Estilos de avatar disponíveis
const AVATAR_STYLES = [
  { id: "initials", name: "Iniciais" },
  { id: "circle", name: "Círculo" },
  { id: "square", name: "Quadrado" },
];

// Cores de avatar disponíveis
const AVATAR_COLORS = [
  { id: "slate", name: "Cinza", bg: "bg-slate-500", text: "text-white" },
  { id: "red", name: "Vermelho", bg: "bg-red-500", text: "text-white" },
  { id: "orange", name: "Laranja", bg: "bg-orange-500", text: "text-white" },
  { id: "amber", name: "Âmbar", bg: "bg-amber-500", text: "text-white" },
  { id: "yellow", name: "Amarelo", bg: "bg-yellow-500", text: "text-black" },
  { id: "lime", name: "Lima", bg: "bg-lime-500", text: "text-black" },
  { id: "green", name: "Verde", bg: "bg-green-500", text: "text-white" },
  { id: "emerald", name: "Esmeralda", bg: "bg-emerald-500", text: "text-white" },
  { id: "teal", name: "Turquesa", bg: "bg-teal-500", text: "text-white" },
  { id: "cyan", name: "Ciano", bg: "bg-cyan-500", text: "text-white" },
  { id: "sky", name: "Céu", bg: "bg-sky-500", text: "text-white" },
  { id: "blue", name: "Azul", bg: "bg-blue-500", text: "text-white" },
  { id: "indigo", name: "Índigo", bg: "bg-indigo-500", text: "text-white" },
  { id: "violet", name: "Violeta", bg: "bg-violet-500", text: "text-white" },
  { id: "purple", name: "Roxo", bg: "bg-purple-500", text: "text-white" },
  { id: "fuchsia", name: "Fúcsia", bg: "bg-fuchsia-500", text: "text-white" },
  { id: "pink", name: "Rosa", bg: "bg-pink-500", text: "text-white" },
  { id: "rose", name: "Rosado", bg: "bg-rose-500", text: "text-white" },
];

export interface AvatarData {
  avatarStyle: string;
  avatarColor: string;
  avatarImage?: string;
}

interface CustomAvatarProps {
  firstName: string;
  lastName: string;
  avatarStyle: string;
  avatarColor: string;
  avatarImage?: string;
  onSave: (data: AvatarData) => void;
  size?: "sm" | "md" | "lg";
  editable?: boolean;
}

export default function CustomAvatar({
  firstName,
  lastName,
  avatarStyle,
  avatarColor,
  avatarImage,
  onSave,
  size = "md",
  editable = true
}: CustomAvatarProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  // Configuração do tamanho do avatar
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-12 w-12 text-base",
    lg: "h-20 w-20 text-2xl"
  };

  // Encontrar a cor selecionada
  const selectedColor = AVATAR_COLORS.find(color => color.id === avatarColor) || AVATAR_COLORS[0];

  // Configuração do formulário
  const form = useForm<AvatarData>({
    defaultValues: {
      avatarStyle,
      avatarColor,
      avatarImage
    }
  });

  const onSubmit = (data: AvatarData) => {
    onSave(data);
    setIsDialogOpen(false);
    toast({
      title: "Avatar atualizado",
      description: "Seu avatar foi personalizado com sucesso."
    });
  };

  // Renderização do avatar com base no estilo
  const renderAvatarContent = () => {
    if (avatarImage) {
      return (
        <Avatar className={sizeClasses[size]}>
          <img src={avatarImage} alt={`${firstName} ${lastName}`} className="h-full w-full object-cover" />
        </Avatar>
      );
    }

    if (avatarStyle === "initials") {
      return (
        <Avatar className={cn(sizeClasses[size], selectedColor.bg)}>
          <AvatarFallback className={selectedColor.text}>{initials}</AvatarFallback>
        </Avatar>
      );
    }

    if (avatarStyle === "circle") {
      return (
        <div className={cn("rounded-full flex items-center justify-center", sizeClasses[size], selectedColor.bg)}>
          <span className={selectedColor.text}>{initials}</span>
        </div>
      );
    }

    if (avatarStyle === "square") {
      return (
        <div className={cn("rounded-md flex items-center justify-center", sizeClasses[size], selectedColor.bg)}>
          <span className={selectedColor.text}>{initials}</span>
        </div>
      );
    }

    // Fallback para iniciais
    return (
      <Avatar className={cn(sizeClasses[size], "bg-slate-500")}>
        <AvatarFallback className="text-white">{initials}</AvatarFallback>
      </Avatar>
    );
  };

  return (
    <div className="relative inline-block">
      {renderAvatarContent()}
      
      {editable && (
        <Button
          variant="outline"
          size="icon"
          className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-background shadow"
          onClick={() => setIsDialogOpen(true)}
        >
          <Edit className="h-3 w-3" />
        </Button>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Personalize seu avatar</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Estilo do Avatar */}
              <FormField
                control={form.control}
                name="avatarStyle"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Estilo</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-wrap gap-4"
                      >
                        {AVATAR_STYLES.map((style) => (
                          <FormItem key={style.id} className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value={style.id} />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              {style.name}
                            </FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Cor do Avatar */}
              <FormField
                control={form.control}
                name="avatarColor"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Cor</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-6 gap-4"
                      >
                        {AVATAR_COLORS.map((color) => (
                          <FormItem key={color.id} className="flex flex-col items-center space-y-2">
                            <FormControl>
                              <RadioGroupItem 
                                value={color.id} 
                                id={`color-${color.id}`}
                                className="sr-only"
                              />
                            </FormControl>
                            <label
                              htmlFor={`color-${color.id}`}
                              className={cn(
                                "h-8 w-8 rounded-full cursor-pointer ring-offset-background transition-all",
                                color.bg,
                                field.value === color.id && "ring-2 ring-ring ring-offset-2"
                              )}
                            />
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Prévia do Avatar */}
              <div className="flex flex-col items-center justify-center space-y-2 py-4">
                <p className="text-sm text-muted-foreground">Prévia:</p>
                <div className="p-4 bg-muted rounded-lg">
                  {form.watch("avatarStyle") === "initials" && (
                    <Avatar className="h-16 w-16 text-xl">
                      <AvatarFallback className={
                        cn(
                          AVATAR_COLORS.find(color => color.id === form.watch("avatarColor"))?.bg || "bg-slate-500",
                          AVATAR_COLORS.find(color => color.id === form.watch("avatarColor"))?.text || "text-white"
                        )
                      }>
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  {form.watch("avatarStyle") === "circle" && (
                    <div className={cn(
                      "h-16 w-16 text-xl rounded-full flex items-center justify-center",
                      AVATAR_COLORS.find(color => color.id === form.watch("avatarColor"))?.bg || "bg-slate-500",
                      AVATAR_COLORS.find(color => color.id === form.watch("avatarColor"))?.text || "text-white"
                    )}>
                      {initials}
                    </div>
                  )}
                  {form.watch("avatarStyle") === "square" && (
                    <div className={cn(
                      "h-16 w-16 text-xl rounded-md flex items-center justify-center",
                      AVATAR_COLORS.find(color => color.id === form.watch("avatarColor"))?.bg || "bg-slate-500",
                      AVATAR_COLORS.find(color => color.id === form.watch("avatarColor"))?.text || "text-white"
                    )}>
                      {initials}
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}