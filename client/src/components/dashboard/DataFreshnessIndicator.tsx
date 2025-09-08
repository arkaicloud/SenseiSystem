import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { RefreshCw, Clock, AlertTriangle } from "lucide-react";
import { businessRules, uiConfig } from "@/config/businessRules";

interface DataFreshnessIndicatorProps {
  lastUpdated: Date | null;
  isLoading?: boolean;
  onRefresh?: () => void;
  className?: string;
}

export function DataFreshnessIndicator({ 
  lastUpdated, 
  isLoading = false, 
  onRefresh,
  className = ""
}: DataFreshnessIndicatorProps) {
  if (!lastUpdated) {
    return null;
  }

  const now = Date.now();
  const lastUpdatedTime = lastUpdated.getTime();
  const timeSinceUpdate = now - lastUpdatedTime;
  
  // Calculate freshness status
  const isStale = timeSinceUpdate > businessRules.cache.dataFreshnessThreshold;
  const isVeryStale = timeSinceUpdate > (businessRules.cache.dataFreshnessThreshold * 2);
  
  // Format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Format relative time
  const formatRelativeTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    
    if (minutes > 0) {
      return `${minutes}min atrás`;
    }
    return `${seconds}s atrás`;
  };

  const getVariant = () => {
    if (isVeryStale) return "destructive";
    if (isStale) return "secondary";
    return "outline";
  };

  const getIcon = () => {
    if (isVeryStale) return AlertTriangle;
    if (isStale) return Clock;
    return Clock;
  };

  const Icon = getIcon();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant={getVariant()} className="flex items-center gap-1 cursor-help">
              <Icon className="h-3 w-3" />
              <span className="text-xs">
                Atualizado às {formatTime(lastUpdated)}
              </span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <div>Última atualização: {formatTime(lastUpdated)}</div>
              <div>Há {formatRelativeTime(timeSinceUpdate)}</div>
              {isStale && (
                <div className="text-orange-600 mt-1">
                  Dados podem estar desatualizados
                </div>
              )}
              {isVeryStale && (
                <div className="text-red-600 mt-1">
                  Recomendado atualizar manualmente
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {(isStale || onRefresh) && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
                className="h-6 w-6 p-0"
              >
                <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <span>Atualizar dados</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}