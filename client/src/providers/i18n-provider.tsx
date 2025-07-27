import React, { createContext, useState, useEffect } from 'react';
import { LanguageContextType } from '../types';
import enUS from '../locales/en-US';
import ptBR from '../locales/pt-BR';

const translations = {
  'en-US': enUS,
  'pt-BR': ptBR
};

export const LanguageContext = createContext<LanguageContextType>({
  locale: 'pt-BR',
  setLocale: () => {},
  t: (key: string) => key
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocale] = useState<'pt-BR' | 'en-US'>('pt-BR');

  useEffect(() => {
    // Check local storage for saved locale
    const savedLocale = localStorage.getItem('locale');
    if (savedLocale === 'pt-BR' || savedLocale === 'en-US') {
      setLocale(savedLocale);
    }
  }, []);

  useEffect(() => {
    // Save to local storage when locale changes
    localStorage.setItem('locale', locale);
  }, [locale]);

  const t = (key: string): string => {
    const keys = key.split('.');
    let result = translations[locale];

    for (const k of keys) {
      if (result[k] === undefined) {
        return key;
      }
      result = result[k];
    }

    return result;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
