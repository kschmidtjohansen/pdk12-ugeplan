import { da, enGB } from 'date-fns/locale';
import { useTranslation } from '@/context/TranslationContext';

/**
 * Returns the date-fns locale matching the user's selected language,
 * so dates and relative times follow the UI language (DA/EN).
 */
export const useDateLocale = () => {
  const { currentLanguage } = useTranslation();
  return currentLanguage === 'da' ? da : enGB;
};

export default useDateLocale;
