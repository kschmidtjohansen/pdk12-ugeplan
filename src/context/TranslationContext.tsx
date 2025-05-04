
import React, { createContext, useContext, useState, useEffect } from 'react';
import translations from '../translations';

// Available languages
export type Language = 'en' | 'da';

interface TranslationContextType {
  currentLanguage: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, any>) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');
  
  // Load saved language preference on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('polygonLanguage') as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'da')) {
      setCurrentLanguage(savedLanguage);
    }
  }, []);
  
  // Save language preference when it changes
  const setLanguage = (lang: Language) => {
    setCurrentLanguage(lang);
    localStorage.setItem('polygonLanguage', lang);
  };
  
  // Translation function
  const t = (key: string, params?: Record<string, any>) => {
    // Use the imported translations object instead of require
    const translationSet = translations[currentLanguage];
    
    // Split key by dots to access nested properties
    const keyParts = key.split('.');
    let translation = translationSet;
    
    for (const part of keyParts) {
      if (translation && typeof translation === 'object' && part in translation) {
        translation = translation[part];
      } else {
        return key; // Return key if translation not found
      }
    }
    
    // Return the translation if it's a string
    if (typeof translation === 'string') {
      // Replace parameters
      if (params) {
        return Object.entries(params).reduce((str, entry) => {
          const [param, value] = entry;
          return str.replace(`{${param}}`, String(value));
        }, translation);
      }
      return translation;
    }
    
    return key;
  };
  
  return (
    <TranslationContext.Provider
      value={{
        currentLanguage,
        setLanguage,
        t
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};
