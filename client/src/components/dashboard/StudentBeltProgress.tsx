import React from "react";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "react-i18next";

interface BeltProgressProps {
  beltLevel: "white" | "blue" | "purple" | "brown" | "black";
  stripes: number;
  attendanceRate?: number;
}

const BELT_COLORS = {
  white: {
    bg: "bg-gray-100",
    text: "text-gray-800",
    border: "border-gray-300",
    progressBg: "bg-gray-200",
    progressFill: "bg-gray-500"
  },
  blue: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    border: "border-blue-300",
    progressBg: "bg-blue-200",
    progressFill: "bg-blue-600"
  },
  purple: {
    bg: "bg-purple-100",
    text: "text-purple-800",
    border: "border-purple-300",
    progressBg: "bg-purple-200",
    progressFill: "bg-purple-600"
  },
  brown: {
    bg: "bg-amber-100",
    text: "text-amber-800",
    border: "border-amber-300",
    progressBg: "bg-amber-200",
    progressFill: "bg-amber-600"
  },
  black: {
    bg: "bg-gray-800",
    text: "text-white",
    border: "border-gray-900",
    progressBg: "bg-gray-700",
    progressFill: "bg-gray-400"
  }
};

const MAX_STRIPES = 4;
const STRIPE_PROGRESS_VALUE = 100 / MAX_STRIPES;

const StudentBeltProgress: React.FC<BeltProgressProps> = ({
  beltLevel,
  stripes,
  attendanceRate = 0
}) => {
  const { t } = useTranslation();
  const colors = BELT_COLORS[beltLevel];
  
  // Calcular a porcentagem de progresso baseada nas faixas
  const progressValue = (stripes / MAX_STRIPES) * 100;
  
  // Próxima faixa/grau
  const getNextBelt = () => {
    if (stripes < MAX_STRIPES) {
      return `${t(beltLevel)} ${t('com')} ${stripes + 1} ${t('stripe', { count: stripes + 1 })}`;
    }
    
    switch(beltLevel) {
      case "white": return t('blue_belt');
      case "blue": return t('purple_belt');
      case "purple": return t('brown_belt');
      case "brown": return t('black_belt');
      case "black": return `${t('black_belt')} (${t('proximo_dan')})`;
      default: return "";
    }
  };

  return (
    <div className={`rounded-lg p-6 shadow-sm ${colors.bg} ${colors.text} mb-6`}>
      <h3 className="text-lg font-semibold mb-2">{t('sua_faixa')}</h3>
      
      <div className="flex items-center mb-4">
        <div className={`w-24 h-8 rounded ${colors.bg} ${colors.border} border-2 flex justify-center items-center`}>
          <span className="font-bold">{t(beltLevel)}</span>
        </div>
        <div className="ml-4">
          <div className="flex items-center">
            {Array.from({ length: MAX_STRIPES }).map((_, index) => (
              <div 
                key={index}
                className={`w-4 h-4 rounded-full mx-1 ${index < stripes ? "bg-yellow-400" : "bg-gray-300"}`}
              />
            ))}
          </div>
          <div className="text-sm mt-1">
            {stripes} {t('stripe', { count: stripes })}
          </div>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <span className="text-sm">{t('progresso_proxima_graduacao')}</span>
          <span className="text-sm font-medium">{Math.round(progressValue)}%</span>
        </div>
        <Progress 
          value={progressValue} 
          className={`h-2 ${colors.progressBg}`} 
          indicatorClassName={`${colors.progressFill}`}
        />
      </div>
      
      <div className="border-t border-opacity-20 pt-4 mt-4">
        <div className="flex justify-between">
          <div>
            <div className="text-sm opacity-75">{t('proxima_graduacao')}</div>
            <div className="font-medium">{getNextBelt()}</div>
          </div>
          <div>
            <div className="text-sm opacity-75">{t('taxa_presenca')}</div>
            <div className="font-medium">{attendanceRate}%</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentBeltProgress;