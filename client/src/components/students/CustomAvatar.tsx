import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Camera, Edit, ImageOff, Loader2 } from "lucide-react";

// Estilos de avatar disponíveis
const AVATAR_STYLES = [
  { id: "initials", name: "Iniciais" },
  { id: "circle", name: "Círculo" },
  { id: "square", name: "Quadrado" },
];

// Cores de avatar disponíveis
const AVATAR_COLORS = [
  { id: "slate", name: "Cinza", bg: "bg-secondary", text: "text-white" },
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
  { id: "blue", name: "Azul", bg: "bg-primary", text: "text-white" },
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
  studentId?: number;
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
  studentId,
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
  const [photoPreview, setPhotoPreview] = useState(avatarImage || "");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isRemovingPhoto, setIsRemovingPhoto] = useState(false);
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

  useEffect(() => {
    const nextImage = avatarImage || "";
    setPhotoPreview(nextImage);
    form.setValue("avatarImage", nextImage);
  }, [avatarImage, form]);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !studentId) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast({
        title: "Formato inválido",
        description: "Escolha uma imagem JPEG, PNG ou WebP.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Imagem muito grande",
        description: "A foto deve ter no máximo 5 MB.",
        variant: "destructive",
      });
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPhotoPreview(localPreview);
    setIsUploadingPhoto(true);

    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch(`/api/students/${studentId}/avatar/photo`, {
        method: "POST",
        body,
        credentials: "include",
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || "Não foi possível enviar a foto.");

      URL.revokeObjectURL(localPreview);
      setPhotoPreview(result.avatarImage);
      form.setValue("avatarImage", result.avatarImage);
      onSave({ ...form.getValues(), avatarImage: result.avatarImage });
      toast({ title: "Foto atualizada", description: "Sua nova foto de perfil foi salva." });
    } catch (error) {
      URL.revokeObjectURL(localPreview);
      setPhotoPreview(avatarImage || "");
      toast({
        title: "Erro ao enviar foto",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handlePhotoRemoval = async () => {
    if (!studentId) return;
    setIsRemovingPhoto(true);
    try {
      const response = await fetch(`/api/students/${studentId}/avatar/photo`, {
        method: "DELETE",
        credentials: "include",
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || "Não foi possível remover a foto.");

      setPhotoPreview("");
      form.setValue("avatarImage", "");
      onSave({ ...form.getValues(), avatarImage: "" });
      toast({ title: "Foto removida", description: "O avatar voltou a usar suas iniciais." });
    } catch (error) {
      toast({
        title: "Erro ao remover foto",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsRemovingPhoto(false);
    }
  };

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
    if (photoPreview) {
      return (
        <Avatar className={sizeClasses[size]}>
          <AvatarImage src={photoPreview} alt={`${firstName} ${lastName}`} className="object-cover" />
          <AvatarFallback className={selectedColor.text}>{initials}</AvatarFallback>
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
      <Avatar className={cn(sizeClasses[size], "bg-secondary")}>
        <AvatarFallback className="text-white">{initials}</AvatarFallback>
      </Avatar>
    );
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative inline-block">
        {renderAvatarContent()}
        {editable && (
          <Button
            variant="outline"
            size="icon"
            className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-background shadow"
            onClick={() => setIsDialogOpen(true)}
            aria-label="Editar foto e avatar"
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {editable && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 text-primary hover:text-primary"
          onClick={() => setIsDialogOpen(true)}
        >
          <Camera className="mr-2 h-4 w-4" />
          {photoPreview ? "Alterar foto" : "Adicionar foto"}
        </Button>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] overflow-y-auto rounded-[28px] p-0 sm:max-w-lg">
          <DialogHeader className="border-b border-border/70 px-5 pb-4 pt-5 text-left">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10">
                <Camera className="size-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight">Foto e avatar</DialogTitle>
                <p className="mt-0.5 text-sm text-muted-foreground">Escolha como seu perfil será exibido.</p>
              </div>
            </div>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="space-y-6 px-5 py-5">
              {studentId && (
                <div className="space-y-3">
                  <div>
                    <FormLabel className="text-sm font-semibold">Foto do perfil</FormLabel>
                    <p className="mt-0.5 text-xs text-muted-foreground">Use uma foto nítida ou mantenha seu avatar personalizado.</p>
                  </div>
                  <div className="flex items-center gap-4 rounded-2xl border border-border/70 bg-muted/30 p-4">
                    <Avatar className="size-20 shrink-0 border-4 border-background shadow-md">
                      <AvatarImage src={photoPreview || undefined} alt={`${firstName} ${lastName}`} className="object-cover" />
                      <AvatarFallback className={cn(selectedColor.bg, selectedColor.text, "text-xl")}>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <Button type="button" variant="outline" className="relative w-full justify-center rounded-xl" disabled={isUploadingPhoto || isRemovingPhoto}>
                        {isUploadingPhoto ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
                        {photoPreview ? "Trocar foto" : "Adicionar foto"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          capture="user"
                          onChange={handlePhotoUpload}
                          disabled={isUploadingPhoto || isRemovingPhoto}
                          className="absolute inset-0 cursor-pointer opacity-0"
                          aria-label="Selecionar ou tirar foto do perfil"
                        />
                      </Button>
                      {photoPreview && (
                        <Button type="button" variant="ghost" size="sm" className="w-full rounded-xl text-muted-foreground" onClick={handlePhotoRemoval} disabled={isUploadingPhoto || isRemovingPhoto}>
                          {isRemovingPhoto ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageOff className="mr-2 h-4 w-4" />}
                          Remover foto
                        </Button>
                      )}
                      <p className="text-center text-[11px] leading-4 text-muted-foreground">JPEG, PNG ou WebP · até 5 MB</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Estilo do Avatar */}
              <FormField
                control={form.control}
                name="avatarStyle"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                      <div>
                        <FormLabel className="text-sm font-semibold">Formato do avatar</FormLabel>
                        <p className="mt-0.5 text-xs text-muted-foreground">Escolha um formato para quando não houver foto.</p>
                      </div>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                          value={field.value}
                          className="grid grid-cols-3 gap-2"
                      >
                        {AVATAR_STYLES.map((style) => (
                            <FormItem key={style.id} className="space-y-0">
                            <FormControl>
                                <RadioGroupItem value={style.id} id={`style-${style.id}`} className="sr-only" />
                            </FormControl>
                              <label
                                htmlFor={`style-${style.id}`}
                                className={cn(
                                  "flex cursor-pointer flex-col items-center gap-2 rounded-2xl border px-2 py-3 text-center transition-all",
                                  field.value === style.id
                                    ? "border-primary bg-primary/5 text-primary shadow-sm ring-1 ring-primary/20"
                                    : "border-border/70 bg-card text-muted-foreground hover:border-primary/30 hover:bg-muted/40",
                                )}
                              >
                                <span className={cn(
                                  "flex size-9 items-center justify-center border-2 border-current text-xs font-bold",
                                  style.id === "square" ? "rounded-lg" : "rounded-full",
                                  style.id === "initials" && "bg-primary text-primary-foreground border-primary",
                                )}>
                                  {style.id === "circle" ? "" : initials}
                                </span>
                                <span className="text-xs font-semibold">{style.name}</span>
                              </label>
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
                      <div className="flex items-end justify-between gap-3">
                        <div>
                          <FormLabel className="text-sm font-semibold">Cor do avatar</FormLabel>
                          <p className="mt-0.5 text-xs text-muted-foreground">Toque em uma cor para visualizar.</p>
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">
                          {AVATAR_COLORS.find(color => color.id === field.value)?.name}
                        </span>
                      </div>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                          value={field.value}
                          className="grid grid-cols-6 gap-2 rounded-2xl border border-border/70 bg-muted/20 p-3"
                      >
                        {AVATAR_COLORS.map((color) => (
                            <FormItem key={color.id} className="flex items-center justify-center space-y-0">
                            <FormControl>
                              <RadioGroupItem 
                                value={color.id} 
                                id={`color-${color.id}`}
                                className="sr-only"
                              />
                            </FormControl>
                            <label
                              htmlFor={`color-${color.id}`}
                              aria-label={color.name}
                              title={color.name}
                              className={cn(
                                "size-9 cursor-pointer rounded-full border-2 border-background shadow-sm ring-offset-background transition-all hover:scale-110",
                                color.bg,
                                field.value === color.id && "scale-110 ring-2 ring-primary ring-offset-2"
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
              <div className="flex items-center gap-4 rounded-2xl border border-primary/15 bg-primary/5 p-4">
                <div className="shrink-0 rounded-2xl bg-background p-2 shadow-sm">
                  {form.watch("avatarStyle") === "initials" && (
                    <Avatar className="size-16 text-xl">
                      <AvatarFallback className={
                        cn(
                          AVATAR_COLORS.find(color => color.id === form.watch("avatarColor"))?.bg || "bg-secondary",
                          AVATAR_COLORS.find(color => color.id === form.watch("avatarColor"))?.text || "text-white"
                        )
                      }>
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  {form.watch("avatarStyle") === "circle" && (
                    <div className={cn(
                      "size-16 text-xl rounded-full flex items-center justify-center",
                      AVATAR_COLORS.find(color => color.id === form.watch("avatarColor"))?.bg || "bg-secondary",
                      AVATAR_COLORS.find(color => color.id === form.watch("avatarColor"))?.text || "text-white"
                    )}>
                      {initials}
                    </div>
                  )}
                  {form.watch("avatarStyle") === "square" && (
                    <div className={cn(
                      "size-16 text-xl rounded-xl flex items-center justify-center",
                      AVATAR_COLORS.find(color => color.id === form.watch("avatarColor"))?.bg || "bg-secondary",
                      AVATAR_COLORS.find(color => color.id === form.watch("avatarColor"))?.text || "text-white"
                    )}>
                      {initials}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">Prévia</p>
                  <p className="mt-1 font-semibold text-foreground">{firstName} {lastName}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Assim seu avatar aparecerá no aplicativo.</p>
                </div>
              </div>
              </div>

              <DialogFooter className="sticky bottom-0 flex-row gap-2 border-t border-border/70 bg-background/95 px-5 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/85">
                <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 rounded-xl shadow-md shadow-primary/20">Salvar alterações</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}