import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useTranslations } from '@/hooks/use-translations';

interface BeltStats {
  white: number;
  blue: number;
  purple: number;
  brown: number;
  black: number;
}

const beltConfig = {
  white: {
    name: 'Faixa Branca',
    color: '#FFFFFF',
    borderColor: '#000000',
    textColor: '#000000',
    emoji: '🥋'
  },
  blue: {
    name: 'Faixa Azul',
    color: '#0000FF',
    borderColor: '#0000FF',
    textColor: '#FFFFFF',
    emoji: '🥋'
  },
  purple: {
    name: 'Faixa Roxa',
    color: '#800080',
    borderColor: '#800080',
    textColor: '#FFFFFF',
    emoji: '🥋'
  },
  brown: {
    name: 'Faixa Marrom',
    color: '#964B00',
    borderColor: '#964B00',
    textColor: '#FFFFFF',
    emoji: '🥋'
  },
  black: {
    name: 'Faixa Preta',
    color: '#000000',
    borderColor: '#000000',
    textColor: '#FFFFFF',
    emoji: '🥇'
  }
};

export function BeltSummaryWidget() {
  const { t } = useTranslations();

  const { data: beltStats, isLoading, error } = useQuery<BeltStats>({
    queryKey: ['/api/admin/stats/belts'],
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Total por Faixa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !beltStats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Total por Faixa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Erro ao carregar estatísticas das faixas
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalStudents = Object.values(beltStats || {}).reduce((sum, count) => sum + count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          🥋 Total por Faixa
          <Badge variant="secondary" className="text-xs">
            {totalStudents} alunos
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {Object.entries(beltConfig).map(([beltKey, config]) => {
          const count = beltStats?.[beltKey as keyof BeltStats] || 0;
          const percentage = totalStudents > 0 ? (count / totalStudents * 100).toFixed(1) : '0';
          
          return (
            <div 
              key={beltKey}
              className="flex items-center justify-between p-3 rounded-lg border transition-all hover:shadow-sm"
              style={{ 
                backgroundColor: config.color + '15', // Add 15% opacity
                borderColor: config.borderColor + '30' // Add 30% opacity to border
              }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold"
                  style={{ 
                    backgroundColor: config.color,
                    borderColor: config.borderColor,
                    color: config.textColor
                  }}
                >
                  {config.emoji}
                </div>
                <span className="font-medium text-sm">{config.name}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="font-bold text-lg">
                    {count}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {percentage}%
                  </div>
                </div>
                <div 
                  className="w-3 h-8 rounded-sm"
                  style={{ 
                    backgroundColor: config.color,
                    opacity: count > 0 ? 0.8 : 0.2
                  }}
                />
              </div>
            </div>
          );
        })}
        
        {totalStudents === 0 && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Nenhum aluno ativo encontrado
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default BeltSummaryWidget;