import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from '../types/index.ts';
import { Translations } from './types.ts';
import { enTranslations } from './en.ts';
import { hiTranslations } from './hi.ts';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  formatMinutesAgo: (minutes: number) => string;
  formatCurrency: (minorAmount: number) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'aaspass_preferred_language';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'hi' || saved === 'en') return saved;
      // Auto-detect Hindi browser preference
      if (typeof navigator !== 'undefined' && navigator.language && navigator.language.startsWith('hi')) {
        return 'hi';
      }
    } catch {
      // localStorage unavailable (sandboxed iframe)
    }
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Ignore storage errors in restricted contexts
    }
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = language === 'hi' ? hiTranslations : enTranslations;

  const formatMinutesAgo = (minutes: number): string => {
    if (minutes < 60) {
      return t.common.freshnessMinutes.replace('{m}', String(minutes));
    }
    const hours = Math.floor(minutes / 60);
    return t.common.freshnessHours.replace('{h}', String(hours));
  };

  const formatCurrency = (minorAmount: number): string => {
    const rupees = (minorAmount / 100).toFixed(minorAmount % 100 === 0 ? 0 : 2);
    return `${t.common.currencySymbol}${rupees}`;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, formatMinutesAgo, formatCurrency }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
