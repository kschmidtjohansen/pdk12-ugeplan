
import React, { createContext, useContext, useState, useEffect } from 'react';
import translations, { languageNames } from '../translations';

// Available languages
export type Language = 'en' | 'da';

interface TranslationContextType {
  currentLanguage: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, any>) => string;
  languageNames: Record<string, string>;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default language is Danish
  const [currentLanguage, setCurrentLanguage] = useState<Language>('da');
  
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
  
  // Translation function with improved error handling and less console noise
  const t = (key: string, params?: Record<string, any>) => {
    try {
      // Use the imported translations object
      const translationSet = translations[currentLanguage];
      
      // Split key by dots to access nested properties
      const keyParts = key.split('.');
      let translation: any = translationSet;
      
      for (const part of keyParts) {
        if (translation && typeof translation === 'object' && part in translation) {
          translation = translation[part];
        } else {
          // Only log missing translations in development mode
          if (process.env.NODE_ENV === 'development') {
            console.warn(`Missing translation key: ${key} in ${currentLanguage}`);
          }
          return key; // Return key if translation not found
        }
      }
      
      // Return the translation if it's a string
      if (typeof translation === 'string') {
        // Replace parameters
        if (params) {
          let result = translation;
          // Iterate over each parameter key and replace it in the string
          for (const paramKey in params) {
            if (Object.prototype.hasOwnProperty.call(params, paramKey)) {
              const value = params[paramKey];
              const placeholder = `{${paramKey}}`;
              result = result.replace(new RegExp(placeholder, 'g'), String(value));
            }
          }
          return result;
        }
        return translation;
      }
      
      return key;
    } catch (error) {
      // Only log errors in development mode
      if (process.env.NODE_ENV === 'development') {
        console.error(`Error in translation for key: ${key}`, error);
      }
      return key;
    }
  };
  
  return (
    <TranslationContext.Provider
      value={{
        currentLanguage,
        setLanguage,
        t,
        languageNames
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
