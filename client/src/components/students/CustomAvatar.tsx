import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormLabel } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Camera, ImageOff, Loader2 } from "lucide-react";

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
  showActionLabel?: boolean;
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
  editable = true,
  showActionLabel = true,
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
      avatarStyle: "initials",
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
    onSave({ ...data, avatarStyle: "initials", avatarColor });
    setIsDialogOpen(false);
    toast({
      title: "Avatar atualizado",
      description: "Seu avatar foi personalizado com sucesso."
    });
  };

  // Sem foto, o avatar usa sempre iniciais em formato circular.
  const renderAvatarContent = () => {
    if (photoPreview) {
      return (
        <Avatar className={sizeClasses[size]}>
          <AvatarImage src={photoPreview} alt={`${firstName} ${lastName}`} className="object-cover" />
          <AvatarFallback className={selectedColor.text}>{initials}</AvatarFallback>
        </Avatar>
      );
    }

    return (
      <Avatar className={cn(sizeClasses[size], selectedColor.bg)}>
        <AvatarFallback className={selectedColor.text}>{initials}</AvatarFallback>
      </Avatar>
    );
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative inline-block">
        {renderAvatarContent()}
        {editable && (
          <button
            type="button"
            className="absolute -bottom-0.5 -right-0.5 flex size-6 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-sm transition-transform hover:scale-105"
            onClick={() => setIsDialogOpen(true)}
            aria-label="Editar foto e avatar"
          >
            <Camera className="size-3" />
          </button>
        )}
      </div>

      {editable && showActionLabel && (
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
                <DialogTitle className="text-xl font-bold tracking-tight">Foto de perfil</DialogTitle>
                <p className="mt-0.5 text-sm text-muted-foreground">Use uma foto ou mantenha suas iniciais.</p>
              </div>
            </div>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="space-y-5 px-5 py-5">
              {studentId && (
                <section className="space-y-3">
                  <div>
                    <FormLabel className="text-base font-bold">Foto do perfil</FormLabel>
                    <p className="mt-0.5 text-xs text-muted-foreground">Adicione uma foto ou mantenha seu avatar com iniciais.</p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-card px-4 py-5 text-center shadow-sm">
                    <div className="relative mx-auto w-fit">
                      <Avatar className="size-28 border-4 border-background shadow-md">
                        <AvatarImage src={photoPreview || undefined} alt={`${firstName} ${lastName}`} className="object-cover" />
                        <AvatarFallback className={cn(selectedColor.bg, selectedColor.text, "text-2xl font-bold")}>{initials}</AvatarFallback>
                      </Avatar>
                      <label className="absolute bottom-0 right-0 flex size-9 cursor-pointer items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-md transition-transform hover:scale-105">
                        {isUploadingPhoto ? <Loader2 className="size-3.5 animate-spin" /> : <Camera className="size-3.5" />}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          capture="user"
                          onChange={handlePhotoUpload}
                          disabled={isUploadingPhoto || isRemovingPhoto}
                          className="sr-only"
                          aria-label="Selecionar ou tirar foto do perfil"
                        />
                      </label>
                    </div>
                    <p className="mt-3 font-semibold text-foreground">{firstName} {lastName}</p>
                    <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                      <Button type="button" variant="outline" size="sm" className="relative h-9 rounded-xl px-4 text-xs font-semibold" disabled={isUploadingPhoto || isRemovingPhoto}>
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
                        <Button type="button" variant="ghost" size="sm" className="h-9 rounded-xl px-3 text-xs text-muted-foreground" onClick={handlePhotoRemoval} disabled={isUploadingPhoto || isRemovingPhoto}>
                          {isRemovingPhoto ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : <ImageOff className="mr-1.5 size-3.5" />}
                          Remover
                        </Button>
                      )}
                    </div>
                    <p className="mt-2 text-[11px] leading-4 text-muted-foreground">JPEG, PNG ou WebP · até 5 MB</p>
                  </div>
                </section>
              )}

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