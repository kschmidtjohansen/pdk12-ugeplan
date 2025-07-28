
import React, { createContext, useContext, useState, useEffect } from 'react';
import translations, { languageNames } from '../translations';

// Available languages
export type Language = 'en' | 'da';

interface TranslationContextType {
  currentLanguage: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, any>) => string;
  languageNames: Record<string, string>;
  isInitialized: boolean;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export { TranslationContext };

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default language is Danish
  const [currentLanguage, setCurrentLanguage] = useState<Language>('da');
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Load saved language preference on mount
  useEffect(() => {
    try {
      const savedLanguage = localStorage.getItem('polygonLanguage') as Language;
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'da')) {
        setCurrentLanguage(savedLanguage);
      }
    } catch (error) {
      console.warn('Failed to load language preference:', error);
    }
    setIsInitialized(true);
  }, []);
  
  // Save language preference when it changes
  const setLanguage = (lang: Language) => {
    setCurrentLanguage(lang);
    localStorage.setItem('polygonLanguage', lang);
  };
  
  // IMPROVED: Enhanced translation function with better error handling and dev warnings
  const t = (key: string, params?: Record<string, any>) => {
    try {
      // Provide fallback if not initialized yet
      if (!isInitialized && process.env.NODE_ENV === 'development') {
        console.warn(`Translation called before initialization: ${key}`);
      }
      
      // Use the imported translations object
      const translationSet = translations[currentLanguage];
      
      // Split key by dots to access nested properties
      const keyParts = key.split('.');
      let translation: any = translationSet;
      
      for (const part of keyParts) {
        if (translation && typeof translation === 'object' && part in translation) {
          translation = translation[part];
        } else {
          // IMPROVED: Add development warnings for missing keys
          if (process.env.NODE_ENV === 'development') {
            console.warn(`Translation key "${key}" not found for language "${currentLanguage}"`);
          }
          return key;
        }
      }
      
      // Return the translation if it's a string
      if (typeof translation === 'string') {
        // Replace parameters with improved error handling
        if (params) {
          let result = translation;
          // Iterate over each parameter key and replace it in the string
          for (const paramKey in params) {
            if (Object.prototype.hasOwnProperty.call(params, paramKey)) {
              const value = params[paramKey];
              const placeholder = `{${paramKey}}`;
              // IMPROVED: Better parameter replacement with validation
              if (typeof value !== 'undefined' && value !== null) {
                result = result.replace(new RegExp(placeholder, 'g'), String(value));
              } else if (process.env.NODE_ENV === 'development') {
                console.warn(`Parameter "${paramKey}" is undefined for translation key "${key}"`);
              }
            }
          }
          return result;
        }
        return translation;
      }
      
      // IMPROVED: Better fallback handling
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Translation key "${key}" exists but is not a string for language "${currentLanguage}"`);
      }
      return key;
    } catch (error) {
      // IMPROVED: Better error logging in development
      if (process.env.NODE_ENV === 'development') {
        console.error(`Error processing translation key "${key}":`, error);
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
        languageNames,
        isInitialized
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
