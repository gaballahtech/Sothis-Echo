import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import i18n from '../i18n';

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('dancing-with-sar-language') || localStorage.getItem('aura-sar-language') || 'en';
      } catch {
        return 'en';
      }
    }
    return 'en';
  });

  const setLanguage = useCallback((lng) => {
    i18n.changeLanguage(lng);
    setLanguageState(lng);
    try {
      localStorage.setItem('dancing-with-sar-language', lng);
    } catch {
      /* storage may be blocked; the language still applies for this session */
    }
    document.documentElement.setAttribute('dir', lng === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lng);
  }, []);

  useEffect(() => {
    i18n.changeLanguage(language);
    document.documentElement.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', language);
  }, [language]);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  }, [language, setLanguage]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};