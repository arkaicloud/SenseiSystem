import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Plus, Minus, Award, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface BeltProgressionControlsProps {
  studentId: number;
  currentBelt: "white" | "blue" | "purple" | "brown" | "black";
  currentStripes: number;
  studentName: string;
  onProgressUpdate?: () => void;
}

const beltColors = {
  white: "bg-gray-100 border-gray-300 text-gray-800",
  blue: "bg-blue-100 border-blue-300 text-blue-800",
  purple: "bg-purple-100 border-purple-300 text-purple-800",
  brown: "bg-amber-100 border-amber-300 text-amber-800",
  black: "bg-gray-900 border-gray-700 text-white"
};

const beltNames = {
  white: "Faixa Branca",
  blue: "Faixa Azul", 
  purple: "Faixa Roxa",
  brown: "Faixa Marrom",
  black: "Faixa Preta"
};

const beltOrder = ["white", "blue", "purple", "brown", "black"] as const;

const BeltProgressionControls: React.FC<BeltProgressionControlsProps> = ({
  studentId,
  currentBelt,
  currentStripes,
  studentName,
  onProgressUpdate
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
    const currentIndex = beltOrder.indexOf(currentBelt);
    if (currentIndex < beltOrder.length - 1) {
      const nextBelt = beltOrder[currentIndex + 1];
      updateProgressMutation.mutate({ beltLevel: nextBelt, stripes: 0 });
      
      // Mostrar celebração de conquista
      toast({
        title: "🏆 Parabéns!",
        description: `${studentName} foi promovido para ${beltNames[nextBelt]}! Que Deus continue fortalecendo sua jornada. OSS!`,
        duration: 5000,
      });
    }
  };

  const canPromote = currentBelt !== "black" && currentStripes >= 4;
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
            <Badge className={`${beltColors[currentBelt]} text-sm font-medium`}>
              {beltNames[currentBelt]}
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
              Promover para {beltNames[beltOrder[beltOrder.indexOf(currentBelt) + 1]]}
            </Button>
            <p className="text-xs text-center text-gray-600 mt-2">
              Aluno está pronto para a próxima graduação!
            </p>
          </div>
        )}

        {/* Status da Próxima Graduação */}
        {!canPromote && currentBelt !== "black" && (
          <div className="text-center text-sm text-gray-600">
            <p>Próxima graduação: {beltNames[beltOrder[beltOrder.indexOf(currentBelt) + 1]]}</p>
            <p>Faltam {4 - currentStripes} lista{4 - currentStripes > 1 ? 's' : ''}</p>
          </div>
        )}

        {currentBelt === "black" && (
          <div className="text-center text-sm text-gray-600">
            <p className="font-medium">🏆 Graduação máxima alcançada!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BeltProgressionControls;