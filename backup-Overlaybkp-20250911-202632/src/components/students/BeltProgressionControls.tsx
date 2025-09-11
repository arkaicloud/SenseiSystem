import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Plus, Minus, Award, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useBeltLevels } from '@/hooks/useBeltLevels';

interface BeltProgressionControlsProps {
  studentId: number;
  currentBelt: string;
  currentStripes: number;
  studentName: string;
  onProgressUpdate?: () => void;
}

// Removed hardcoded belt data - now using dynamic belt levels

const BeltProgressionControls: React.FC<BeltProgressionControlsProps> = ({
  studentId,
  currentBelt,
  currentStripes,
  studentName,
  onProgressUpdate
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { 
    getBeltName, 
    getBeltColor, 
    getNextBelt, 
    getPreviousBelt,
    beltOptions 
  } = useBeltLevels();

  const updateProgressMutation = useMutation({
    mutationFn: async ({ beltLevel, stripes }: { beltLevel: string; stripes: number }) => {
      const res = await apiRequest("PATCH", `/api/students/${studentId}`, {
        beltLevel,
        stripes,
        lastPromotionDate: new Date().toISOString()
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      if (onProgressUpdate) onProgressUpdate();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar progresso",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const addStripe = () => {
    if (currentStripes < 4) {
      const newStripes = currentStripes + 1;
      updateProgressMutation.mutate({ beltLevel: currentBelt, stripes: newStripes });
      
      toast({
        title: "Lista adicionada!",
        description: `${studentName} agora tem ${newStripes} lista${newStripes > 1 ? 's' : ''}.`,
      });
    }
  };

  const removeStripe = () => {
    if (currentStripes > 0) {
      const newStripes = currentStripes - 1;
      updateProgressMutation.mutate({ beltLevel: currentBelt, stripes: newStripes });
      
      toast({
        title: "Lista removida",
        description: `${studentName} agora tem ${newStripes} lista${newStripes > 1 ? 's' : ''}.`,
      });
    }
  };

  const promoteToNextBelt = () => {
    const nextBelt = getNextBelt(currentBelt);
    if (nextBelt) {
      updateProgressMutation.mutate({ beltLevel: nextBelt.levelKey, stripes: 0 });
      
      // Mostrar celebração de conquista
      toast({
        title: "🏆 Parabéns!",
        description: `${studentName} foi promovido para ${nextBelt.name}! Que Deus continue fortalecendo sua jornada. OSS!`,
        duration: 5000,
      });
    }
  };

  const nextBelt = getNextBelt(currentBelt);
  const canPromote = nextBelt && currentStripes >= 4;
  const canAddStripe = currentStripes < 4;
  const canRemoveStripe = currentStripes > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-yellow-600" />
          Progresso da Graduação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Faixa Atual */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Graduação Atual:</p>
            <Badge 
              className="text-sm font-medium"
              style={{ 
                backgroundColor: getBeltColor(currentBelt),
                color: 'white'
              }}
            >
              {getBeltName(currentBelt)}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            {Array.from({ length: 4 }, (_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < currentStripes 
                    ? "fill-yellow-400 text-yellow-400" 
                    : "text-gray-300"
                }`}
              />
            ))}
            <span className="ml-2 text-sm text-gray-600">
              {currentStripes}/4 listas
            </span>
          </div>
        </div>

        {/* Controles de Listas */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Gerenciar Listas:</p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={removeStripe}
              disabled={!canRemoveStripe || updateProgressMutation.isPending}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={addStripe}
              disabled={!canAddStripe || updateProgressMutation.isPending}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Botão de Promoção */}
        {canPromote && (
          <div className="pt-4 border-t">
            <Button 
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
              onClick={promoteToNextBelt}
              disabled={updateProgressMutation.isPending}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Promover para {nextBelt?.name || 'Próxima Faixa'}
            </Button>
            <p className="text-xs text-center text-gray-600 mt-2">
              Aluno está pronto para a próxima graduação!
            </p>
          </div>
        )}

        {/* Status da Próxima Graduação */}
        {!canPromote && nextBelt && (
          <div className="text-center text-sm text-gray-600">
            <p>Próxima graduação: {nextBelt.name}</p>
            <p>Faltam {4 - currentStripes} lista{4 - currentStripes > 1 ? 's' : ''}</p>
          </div>
        )}

        {!nextBelt && (
          <div className="text-center text-sm text-gray-600">
            <p className="font-medium">🏆 Graduação máxima alcançada!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BeltProgressionControls;