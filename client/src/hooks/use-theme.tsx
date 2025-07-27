import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { SchoolConfig } from "@shared/schema";
import { useAuth } from "./use-auth";

type Theme = "light" | "dark";

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const { user } = useAuth();

  // Buscar tema padrão da configuração da escola
  const { data: configData } = useQuery<{ config: SchoolConfig }>({
    queryKey: ['/api/school-config'],
  });

  // Buscar personalizações do dashboard
  const { data: dashboardCustomization } = useQuery({
    queryKey: ['/api/dashboard-customization'],
    enabled: !!user?.id,
  });

  // Inicializar tema baseado na personalização, configuração da escola ou localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme;
    const customTheme = dashboardCustomization?.theme as Theme;
    const defaultTheme = configData?.config?.defaultTheme as Theme || "light";
    
    // Prioridade: tema personalizado > tema salvo > tema padrão da escola
    const initialTheme = customTheme && customTheme !== 'auto' ? customTheme : (savedTheme || defaultTheme);
    setThemeState(initialTheme);
    
    // Aplicar o tema no documento
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(initialTheme);
  }, [configData, dashboardCustomization]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme deve ser usado dentro do ThemeProvider");
  }
  return context;
}