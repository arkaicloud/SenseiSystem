import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { warmUpDashboard } from "@/services/loaders";

interface TransitionGateProps {
  to?: string;
  text?: string;
  userRole: string;
  onComplete?: () => void;
}

export default function TransitionGate({
  to = "/dashboard",
  text = "Preparando seu painel...",
  userRole,
  onComplete
}: TransitionGateProps) {
  const [, setLocation] = useLocation();
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let mounted = true;
    
    const loadDashboard = async () => {
      try {
        setProgress(20);
        
        // Simular progresso durante o carregamento
        const progressInterval = setInterval(() => {
          setProgress(prev => Math.min(prev + 5, 85));
        }, 100);
        
        // Carregar bundle + dados em background
        await warmUpDashboard(userRole);
        
        clearInterval(progressInterval);
        
        if (!mounted) return;
        
        setProgress(100);
        
        // Aguardar um pouco para mostrar 100% antes de navegar
        setTimeout(() => {
          if (!mounted) return;
          setLocation(to, { replace: true });
          
          // Pequeno delay para evitar flash
          setTimeout(() => {
            if (mounted) {
              setVisible(false);
              onComplete?.();
            }
          }, 200);
        }, 300);
        
      } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        // Em caso de erro, navegar mesmo assim
        if (mounted) {
          setLocation(to, { replace: true });
          setVisible(false);
          onComplete?.();
        }
      }
    };

    loadDashboard();
    
    return () => { 
      mounted = false; 
    };
  }, [setLocation, to, userRole, onComplete]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-[rgba(10,12,18,.92)] backdrop-blur-md">
      <div className="rounded-2xl p-6 text-white shadow-xl w-[min(92vw,420px)]">
        <div className="mb-4 flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-sm font-bold">S</span>
          </div>
          <strong className="text-lg">SenseiSystem</strong>
        </div>
        
        <div className="h-1.5 w-full rounded bg-white/10 overflow-hidden mb-3">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <p className="text-sm opacity-80">{text}</p>
        <p className="text-xs opacity-60 mt-1">{progress}% carregado</p>
      </div>
    </div>
  );
}