import React from "react";
import { useTranslation } from "react-i18next";
import { useBeltLevels } from '@/hooks/useBeltLevels';

interface BeltBadgeProps {
  beltLevel: string;
  studentName: string;
  size?: "sm" | "md" | "lg";
}

const BeltBadge: React.FC<BeltBadgeProps> = ({ 
  beltLevel, 
  studentName,
  size = "md" 
}) => {
  const { t } = useTranslation();
  const { getBeltName, getBeltColor } = useBeltLevels();
  
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
  
  // Usar cores dinâmicas das faixas cadastradas
  const getBeltStyle = (colorCode: string) => {
    // Converter hex para RGB para determinar se a cor é clara ou escura
    const hex = colorCode.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    const isLight = brightness > 150;
    
    return {
      bg: `bg-[${colorCode}]`,
      border: `border-[${colorCode}]`,
      text: isLight ? "text-gray-800" : "text-white"
    };
  };

  const currentSize = sizes[size];
  const beltColorCode = getBeltColor(beltLevel);
  const beltName = getBeltName(beltLevel);
  const colors = getBeltStyle(beltColorCode);
  
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
        <div 
          className={`${currentSize.belt} border-2 rounded-sm flex items-center justify-center`}
          style={{ 
            backgroundColor: beltColorCode,
            borderColor: beltColorCode
          }}
        >
          <span 
            className={`font-bold ${currentSize.beltText}`}
            style={{ color: colors.text.includes('text-white') ? 'white' : '#1f2937' }}
          >
            {beltName}
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