
import enTranslations from './en';
import daTranslations from './da';
import { Language } from '../context/TranslationContext';

export const translations = {
  en: enTranslations,
  da: daTranslations
};

export const languageNames = {
  en: 'English',
  da: 'Dansk'
};

export const getLanguageName = (code: Language): string => {
  return languageNames[code];
};

export default translations;
