import React from 'react';
import { useTranslations } from '@/hooks/use-translations';
import { Button } from '@/components/ui/button';
import { LocaleOption } from '@/types';

const localeOptions: LocaleOption[] = [
  { value: 'pt-BR', label: 'PT', flag: '🇧🇷' },
  { value: 'en-US', label: 'EN', flag: '🇺🇸' }
];

export const LanguageSwitcher = () => {
  const { locale, setLocale } = useTranslations();
  
  return (
    <div className="flex items-center bg-gray-800 rounded-lg p-1">
      {localeOptions.map((option) => (
        <Button
          key={option.value}
          variant={locale === option.value ? 'default' : 'ghost'}
          size="sm"
          className={`px-3 py-1 ${locale === option.value ? 'bg-primary text-white' : 'text-gray-300'}`}
          onClick={() => setLocale(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
