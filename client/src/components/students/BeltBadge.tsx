import React from "react";
import { useTranslation } from "react-i18next";

interface BeltBadgeProps {
  beltLevel: "white" | "blue" | "purple" | "brown" | "black";
  studentName: string;
  size?: "sm" | "md" | "lg";
}

const BeltBadge: React.FC<BeltBadgeProps> = ({ 
  beltLevel, 
  studentName,
  size = "md" 
}) => {
  const { t } = useTranslation();
  
  // Configurações de tamanho
  const sizes = {
    sm: {
      container: "w-28 h-28",
      belt: "w-20 h-5",
      nameText: "text-sm",
      beltText: "text-xs"
    },
    md: {
      container: "w-40 h-40",
      belt: "w-28 h-7",
      nameText: "text-base",
      beltText: "text-sm"
    },
    lg: {
      container: "w-56 h-56",
      belt: "w-40 h-9",
      nameText: "text-xl",
      beltText: "text-base"
    }
  };
  
  // Cores para cada faixa
  const beltColors = {
    white: {
      bg: "bg-gray-50",
      border: "border-gray-200",
      text: "text-gray-800"
    },
    blue: {
      bg: "bg-blue-500",
      border: "border-blue-600",
      text: "text-white"
    },
    purple: {
      bg: "bg-purple-500",
      border: "border-purple-600",
      text: "text-white"
    },
    brown: {
      bg: "bg-amber-700",
      border: "border-amber-800",
      text: "text-white"
    },
    black: {
      bg: "bg-gray-900",
      border: "border-black",
      text: "text-white"
    }
  };

  const currentSize = sizes[size];
  const colors = beltColors[beltLevel];
  
  return (
    <div className="flex flex-col items-center justify-center">
      {/* Brasão circular */}
      <div className={`${currentSize.container} rounded-full border-4 border-gray-300 flex flex-col items-center justify-center p-2 bg-white shadow-md mb-3`}>
        {/* Símbolo da academia (exemplo) */}
        <div className="flex flex-col items-center justify-center mb-2">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-1">
            <span className="material-icons text-primary text-2xl">sports_martial_arts</span>
          </div>
          <div className="text-center">
            <span className="text-xs text-gray-700">SENSEI</span>
            <span className="block text-xs text-gray-700">SYSTEM</span>
          </div>
        </div>
        
        {/* Faixa */}
        <div className={`${currentSize.belt} ${colors.bg} ${colors.border} border-2 rounded-sm flex items-center justify-center`}>
          <span className={`${colors.text} font-bold ${currentSize.beltText}`}>
            {t(beltLevel)}
          </span>
        </div>
      </div>
      
      {/* Nome do aluno */}
      <div className="text-center">
        <h3 className={`font-bold ${currentSize.nameText}`}>{studentName}</h3>
      </div>
    </div>
  );
};

export default BeltBadge;