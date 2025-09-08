import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MARTIAL_QUOTES } from "@/constants/quotes";

type Props = { 
  progress?: number; 
};

export default function AppLoadingScreen({ progress = 0 }: Props) {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [showTimeout, setShowTimeout] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex(v => (v + 1) % MARTIAL_QUOTES.length);
    }, 2800);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Mostrar mensagem de timeout após 8 segundos
    const timeout = setTimeout(() => {
      setShowTimeout(true);
    }, 8000);
    
    return () => clearTimeout(timeout);
  }, []);

  const quote = useMemo(() => MARTIAL_QUOTES[quoteIndex], [quoteIndex]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900 text-slate-100 px-6">
      {/* Logo / Marca */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="mb-8 flex items-center gap-3"
        role="status" 
        aria-live="polite"
      >
        <div className="h-12 w-12 rounded-2xl bg-slate-800/70 backdrop-blur flex items-center justify-center text-2xl">
          🥋
        </div>
        <div className="text-2xl font-semibold tracking-tight">SenseiSystem</div>
      </motion.div>

      {/* Spinner / Micro animação */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative h-16 w-16 mb-6"
      >
        <div className="absolute inset-0 rounded-full border-4 border-slate-700 border-t-slate-200 animate-spin" />
        <div className="absolute inset-2 rounded-full border-2 border-slate-800 border-b-slate-400 animate-spin animate-reverse" 
             style={{ animationDuration: '1.5s' }} />
      </motion.div>

      {/* Barra de progresso */}
      <div className="w-full max-w-md mb-6">
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
        className="max-w-xl text-center min-h-[3rem] flex items-center justify-center"
      >
        <p className="text-slate-300 text-sm leading-relaxed italic">
          {quote}
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
    </div>
  );
}