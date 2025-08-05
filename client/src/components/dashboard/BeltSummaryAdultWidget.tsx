import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useTranslations } from '@/hooks/use-translations';

interface BeltStat {
  levelKey: string;
  name: string;
  color: string;
  category: string;
  count: number;
  order: number;
}

// Helper function to determine text color based on background color
const getTextColor = (hexColor: string): string => {
  // Remove # if present
  const color = hexColor.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return white for dark colors, black for light colors
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

export function BeltSummaryAdultWidget() {
  const { t } = useTranslations();

  const { data: beltStats, isLoading, error } = useQuery<BeltStat[]>({
    queryKey: ['/api/admin/stats/belts'],
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Faixas Adulto</CardTitle>
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
          <CardTitle className="text-base font-semibold">Faixas Adulto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Erro ao carregar estatísticas das faixas
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter only adult belts with students (hide empty belts for cleaner interface)
  const adultBelts = beltStats.filter(belt => belt.category === 'adult' && belt.count > 0);
  const totalStudents = adultBelts.reduce((sum, belt) => sum + belt.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          👨 Faixas Adulto
          <Badge variant="secondary" className="text-xs">
            {totalStudents} alunos
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {adultBelts.map((belt) => {
          const percentage = totalStudents > 0 ? (belt.count / totalStudents * 100).toFixed(1) : '0';
          const textColor = getTextColor(belt.color);
          
          return (
            <div 
              key={belt.levelKey}
              className="flex items-center justify-between p-3 rounded-lg border transition-all hover:shadow-sm"
              style={{ 
                backgroundColor: belt.color + '15', // Add 15% opacity
                borderColor: belt.color + '30' // Add 30% opacity to border
              }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold"
                  style={{ 
                    backgroundColor: belt.color,
                    borderColor: belt.color,
                    color: textColor
                  }}
                >
                  🥋
                </div>
                <span className="font-medium text-sm">{belt.name}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="font-bold text-lg">
                    {belt.count}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {percentage}%
                  </div>
                </div>
                <div 
                  className="w-3 h-8 rounded-sm"
                  style={{ 
                    backgroundColor: belt.color,
                    opacity: belt.count > 0 ? 0.8 : 0.2
                  }}
                />
              </div>
            </div>
          );
        })}
        
        {adultBelts.length === 0 && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Nenhum aluno adulto encontrado
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default BeltSummaryAdultWidget;