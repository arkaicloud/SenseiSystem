import { useContext } from 'react';
import { LanguageContext } from '../providers/i18n-provider';

export const useTranslations = () => {
  const context = useContext(LanguageContext);
  
  if (!context) {
    throw new Error('useTranslations must be used within a LanguageProvider');
  }
  
  return context;
};

// Hook alias
export const useTranslation = useTranslations;

// Default export for easier importing
export default useTranslations;
