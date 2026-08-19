import { create } from 'zustand';
import en from './en.json';
import es from './es.json';

type Language = 'en' | 'es';
type TranslationKeys = typeof en;

const translations: Record<Language, TranslationKeys> = { en, es };

interface I18nState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

function getNestedValue(obj: any, path: string): string {
  return path.split('.').reduce((current, key) => current?.[key], obj) || path;
}

export const useI18n = create<I18nState>((set, get) => ({
  language: (localStorage.getItem('language') as Language) || 'en',

  setLanguage: (lang) => {
    localStorage.setItem('language', lang);
    set({ language: lang });
  },

  t: (key: string) => {
    const { language } = get();
    return getNestedValue(translations[language], key);
  }
}));

export type { Language };
