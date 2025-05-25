import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { getInitials } from "@/lib/utils";

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

export interface AvatarData {
  avatarStyle: string;
  avatarColor: string;
  avatarImage?: string;
}

const CustomAvatar: React.FC<CustomAvatarProps> = ({
  firstName,
  lastName,
  avatarStyle = "initials",
  avatarColor = "#3b82f6",
  avatarImage,
  onSave,
  size = "md",
  editable = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const { register, handleSubmit, watch } = useForm<AvatarData>({
    defaultValues: {
      avatarStyle,
      avatarColor,
      avatarImage,
    },
  });

  const currentStyle = watch("avatarStyle");
  const currentColor = watch("avatarColor");
  
  const dimensions = {
    sm: "w-10 h-10 text-sm",
    md: "w-16 h-16 text-lg",
    lg: "w-24 h-24 text-2xl",
  };

  const initials = getInitials(firstName, lastName);

  const renderAvatar = (style: string, color: string, image?: string) => {
    if (style === "image" && image) {
      return (
        <div 
          className={`rounded-full overflow-hidden ${dimensions[size]}`}
          style={{ backgroundColor: color }}
        >
          <img src={image} alt={initials} className="w-full h-full object-cover" />
        </div>
      );
    } else {
      return (
        <div 
          className={`flex items-center justify-center rounded-full font-bold text-white ${dimensions[size]}`}
          style={{ backgroundColor: color }}
        >
          {initials}
        </div>
      );
    }
  };

  const onSubmit = (data: AvatarData) => {
    onSave(data);
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col items-center">
      {renderAvatar(currentStyle, currentColor, avatarImage)}
      
      {editable && !isEditing && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="mt-2 text-xs"
          onClick={() => setIsEditing(true)}
        >
          Personalizar
        </Button>
      )}

      {editable && isEditing && (
        <div className="mt-4 border rounded-lg p-4 w-full max-w-xs">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div>
                <Label>Estilo do Avatar</Label>
                <RadioGroup 
                  defaultValue={avatarStyle} 
                  className="flex space-x-4 mt-2"
                  {...register("avatarStyle")}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="initials" id="initials" />
                    <Label htmlFor="initials">Iniciais</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="image" id="image" />
                    <Label htmlFor="image">Imagem</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label>Cor</Label>
                <Input 
                  type="color" 
                  {...register("avatarColor")}
                  className="w-full h-10 cursor-pointer" 
                />
              </div>

              {currentStyle === "image" && (
                <div>
                  <Label>URL da Imagem</Label>
                  <Input 
                    type="text" 
                    placeholder="https://exemplo.com/imagem.jpg" 
                    {...register("avatarImage")}
                  />
                </div>
              )}

              <div className="flex space-x-2">
                <Button type="submit" className="w-full">Salvar</Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setIsEditing(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CustomAvatar;