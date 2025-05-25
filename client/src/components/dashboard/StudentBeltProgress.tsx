import React, { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "react-i18next";
import { Award, Star, Zap, Trophy, Target } from "lucide-react";

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
    progressFill: "bg-gray-500",
    actualBelt: "bg-white",
    actualBorder: "border-gray-400",
  },
  blue: {
    bg: "bg-blue-50",
    text: "text-blue-800",
    border: "border-blue-300",
    progressBg: "bg-blue-100",
    progressFill: "bg-blue-500",
    actualBelt: "bg-blue-500",
    actualBorder: "border-blue-600",
  },
  purple: {
    bg: "bg-purple-50",
    text: "text-purple-800",
    border: "border-purple-300",
    progressBg: "bg-purple-100",
    progressFill: "bg-purple-500",
    actualBelt: "bg-purple-500",
    actualBorder: "border-purple-600",
  },
  brown: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-300",
    progressBg: "bg-amber-100",
    progressFill: "bg-amber-700",
    actualBelt: "bg-amber-700",
    actualBorder: "border-amber-800",
  },
  black: {
    bg: "bg-gray-100",
    text: "text-gray-800",
    border: "border-gray-400",
    progressBg: "bg-gray-200",
    progressFill: "bg-gray-900",
    actualBelt: "bg-gray-900",
    actualBorder: "border-black",
  }
};

// Ordem das faixas para progressão
const BELT_ORDER = ["white", "blue", "purple", "brown", "black"];

const MAX_STRIPES = 4;

const StudentBeltProgress: React.FC<BeltProgressProps> = ({
  beltLevel,
  stripes,
  attendanceRate = 0
}) => {
  const { t } = useTranslation();
  const colors = BELT_COLORS[beltLevel];
  const [animateProgress, setAnimateProgress] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  
  // Próxima faixa no caminho
  const nextBeltIndex = BELT_ORDER.indexOf(beltLevel) + 1;
  const nextBelt = nextBeltIndex < BELT_ORDER.length ? BELT_ORDER[nextBeltIndex] : null;
  
  // Calcular a porcentagem de progresso baseada nas faixas
  const progressValue = (stripes / MAX_STRIPES) * 100;
  
  // Animar o progresso
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimateProgress(progressValue);
    }, 500);
    
    // Mostrar celebração se tiver 4 stripes (pronto para próxima faixa)
    if (stripes === MAX_STRIPES) {
      const celebrationTimer = setTimeout(() => {
        setShowCelebration(true);
      }, 1000);
      
      return () => {
        clearTimeout(timer);
        clearTimeout(celebrationTimer);
      };
    }
    
    return () => clearTimeout(timer);
  }, [progressValue, stripes]);
  
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

  // Calcular mensagem motivacional baseada no progresso
  const getMotivationalMessage = () => {
    if (stripes === MAX_STRIPES) {
      return t('pronto_para_proxima_faixa');
    } else if (stripes >= 3) {
      return t('quase_la');
    } else if (stripes >= 2) {
      return t('bom_progresso');
    } else if (stripes >= 1) {
      return t('continue_treinando');
    } else {
      return t('comece_jornada');
    }
  };

  return (
    <div className={`rounded-lg p-6 shadow-sm ${colors.bg} ${colors.text} mb-6 relative overflow-hidden`}>
      {/* Título com ícone de troféu */}
      <div className="flex items-center mb-4">
        <Trophy className="w-6 h-6 mr-2 text-yellow-500" />
        <h3 className="text-lg font-semibold">{t('sua_progressao')}</h3>
      </div>
      
      {/* Exibição da faixa atual com animação */}
      <div className="flex flex-col items-center mb-6">
        {/* Faixa atual como um cinto animado */}
        <div className="relative w-full max-w-xs h-16 mb-4">
          <div className={`absolute inset-0 rounded-md ${colors.actualBelt} ${colors.actualBorder} border-2 shadow-md transition-all duration-700 transform hover:scale-105`}>
            {/* Círculo decorativo no centro da faixa */}
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white flex items-center justify-center border-2 border-gray-300">
              <span className="material-icons text-primary text-sm">sports_martial_arts</span>
            </div>
            
            {/* Listras da faixa */}
            <div className="absolute left-0 top-0 bottom-0 w-16 flex flex-col justify-center items-center px-2">
              {Array.from({ length: stripes }).map((_, i) => (
                <div key={i} className="w-full h-1 bg-yellow-400 my-0.5 rounded-full" />
              ))}
            </div>
          </div>
        </div>
        
        <div className="text-center mb-2">
          <span className="font-bold text-lg">{t(beltLevel)}</span>
          <span className="ml-2">•</span>
          <span className="ml-2">{stripes} {t('stripe', { count: stripes })}</span>
        </div>
        
        {/* Mensagem motivacional */}
        <div className="text-center text-sm opacity-80 italic">
          "{getMotivationalMessage()}"
        </div>
      </div>
      
      {/* Barra de progresso animada */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <div className="flex items-center">
            <Target className="w-4 h-4 mr-1 text-primary" />
            <span className="text-sm font-medium">{t('progresso_proxima_graduacao')}</span>
          </div>
          <span className="text-sm font-bold">{Math.round(animateProgress)}%</span>
        </div>
        
        <div className={`w-full h-4 ${colors.progressBg} rounded-full overflow-hidden relative`}>
          <div 
            className={`h-full ${colors.progressFill} rounded-full transition-all duration-1000 ease-out`}
            style={{ width: `${animateProgress}%` }}
          />
          
          {/* Marcadores de stripe na barra de progresso */}
          <div className="absolute inset-0 flex justify-between px-1 items-center">
            {Array.from({ length: MAX_STRIPES }).map((_, i) => {
              const markerPosition = ((i + 1) * 100) / MAX_STRIPES;
              const isAchieved = (i + 1) <= stripes;
              
              return (
                <div 
                  key={i} 
                  className={`w-3 h-3 rounded-full border-2 ${
                    isAchieved 
                      ? 'bg-yellow-400 border-yellow-500 animate-pulse' 
                      : 'bg-gray-300 border-gray-400'
                  } z-10`}
                />
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Informações adicionais */}
      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200 border-opacity-40">
        {/* Próxima graduação */}
        <div className="bg-white bg-opacity-50 rounded-lg p-3 shadow-sm">
          <div className="flex items-center mb-1">
            <Star className="w-4 h-4 mr-1 text-yellow-500" />
            <span className="text-sm font-medium">{t('proxima_graduacao')}</span>
          </div>
          <div className="font-semibold">
            {getNextBelt()}
          </div>
        </div>
        
        {/* Taxa de presença */}
        <div className="bg-white bg-opacity-50 rounded-lg p-3 shadow-sm">
          <div className="flex items-center mb-1">
            <Zap className="w-4 h-4 mr-1 text-green-500" />
            <span className="text-sm font-medium">{t('taxa_presenca')}</span>
          </div>
          <div className="font-semibold">
            {attendanceRate}%
          </div>
        </div>
      </div>
      
      {/* Celebração quando estiver pronto para próxima faixa */}
      {showCelebration && stripes === MAX_STRIPES && (
        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center z-10 animate-fadeIn">
          <div className="bg-white rounded-xl p-6 shadow-lg transform animate-bounce-small text-center">
            <Award className="w-12 h-12 mx-auto mb-2 text-yellow-500" />
            <h3 className="text-xl font-bold text-gray-800 mb-1">{t('parabens')}</h3>
            <p className="text-gray-600 mb-3">{t('ready_for_next_belt')}</p>
            <div className="flex justify-center">
              <div className={`w-20 h-5 rounded ${BELT_COLORS[nextBelt || 'black'].actualBelt}`}></div>
            </div>
          </div>
        </div>
      )}
      
      {/* Efeitos de fundo */}
      <div className="absolute top-0 right-0 h-16 w-16 opacity-10">
        <span className="material-icons text-6xl">sports_martial_arts</span>
      </div>
    </div>
  );
};

export default StudentBeltProgress;