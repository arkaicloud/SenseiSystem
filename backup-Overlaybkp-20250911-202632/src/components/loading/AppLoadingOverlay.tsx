import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MARTIAL_QUOTES } from "@/constants/quotes";

interface AppLoadingOverlayProps {
  visible: boolean;
  progress?: number;
  quote?: string;
}

export function AppLoadingOverlay({ visible, progress = 0, quote }: AppLoadingOverlayProps) {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [showTimeout, setShowTimeout] = useState(false);

  useEffect(() => {
    if (!visible) return;
    
    const interval = setInterval(() => {
      setQuoteIndex(v => (v + 1) % MARTIAL_QUOTES.length);
    }, 2800);
    
    return () => clearInterval(interval);
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    
    // Mostrar mensagem de timeout após 8 segundos
    const timeout = setTimeout(() => {
      setShowTimeout(true);
    }, 8000);
    
    return () => clearTimeout(timeout);
  }, [visible]);

  const currentQuote = quote || MARTIAL_QUOTES[quoteIndex];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="overlay"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900 text-slate-100 px-4 sm:px-6"
          role="status" 
          aria-live="polite"
        >
          {/* Logo / Marca */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="mb-6 sm:mb-8 flex items-center gap-3"
          >
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-slate-800/70 backdrop-blur flex items-center justify-center text-xl sm:text-2xl">
              🥋
            </div>
            <div className="text-xl sm:text-2xl font-semibold tracking-tight">SenseiSystem</div>
          </motion.div>

          {/* Spinner / Micro animação */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="relative h-12 w-12 sm:h-16 sm:w-16 mb-4 sm:mb-6"
          >
            <div className="absolute inset-0 rounded-full border-4 border-slate-700 border-t-slate-200 animate-spin" />
            <div className="absolute inset-2 rounded-full border-2 border-slate-800 border-b-slate-400 animate-spin animate-reverse" 
                 style={{ animationDuration: '1.5s' }} />
          </motion.div>

          {/* Barra de progresso */}
          <div className="w-full max-w-sm sm:max-w-md mb-4 sm:mb-6 px-2 sm:px-0">
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progress, 100)}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </div>
            <div className="mt-3 flex justify-between items-center text-sm text-slate-300">
              <span>Carregando...</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
          </div>

          {/* Frase rotativa */}
          <motion.div
            key={quoteIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
            className="max-w-sm sm:max-w-xl text-center min-h-[2rem] sm:min-h-[3rem] flex items-center justify-center px-2 sm:px-0"
          >
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed italic">
              {currentQuote}
            </p>
          </motion.div>

          {/* Mensagem de timeout */}
          {showTimeout && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-center"
            >
              <p className="text-slate-400 text-sm">
                Quase lá... Preparando seu ambiente de treino
              </p>
            </motion.div>
          )}

          {/* Texto para screen readers */}
          <p className="sr-only">
            Carregando seu painel do SenseiSystem. Progresso: {Math.round(progress)}%
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}