import { createContext, useContext, useState, ReactNode } from 'react';
import { Language } from '@/services/languageService';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType>({ lang: 'en', setLang: () => {} });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('afyaroot-lang') as Language) || 'en';
  });

  const handleSetLang = (l: Language) => {
    setLang(l);
    localStorage.setItem('afyaroot-lang', l);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang: handleSetLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
