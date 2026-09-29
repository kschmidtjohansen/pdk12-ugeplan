import { useTranslation } from '@/context/TranslationContext';
import { cn } from '@/lib/utils';

/**
 * Flag-baseret sprogvælger (Dansk / Engelsk).
 * Bruges bl.a. på login-siden, hvor brugeren endnu ikke er logget ind.
 */
export const LanguageSwitcher = ({ className }: { className?: string }) => {
  const { currentLanguage, setLanguage } = useTranslation();

  const options = [
    { lang: 'da' as const, flag: '🇩🇰', label: 'Dansk' },
    { lang: 'en' as const, flag: '🇬🇧', label: 'English' },
  ];

  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded-full border border-border/50 bg-card/80 backdrop-blur-xl p-1 shadow-lg',
        className
      )}
      role="group"
      aria-label="Vælg sprog / Choose language"
    >
      {options.map(({ lang, flag, label }) => (
        <button
          key={lang}
          type="button"
          onClick={() => setLanguage(lang)}
          aria-pressed={currentLanguage === lang}
          aria-label={label}
          title={label}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-full text-xl transition-all duration-200',
            currentLanguage === lang
              ? 'bg-primary/15 ring-2 ring-primary/40 scale-105'
              : 'opacity-50 hover:opacity-100 hover:bg-muted'
          )}
        >
          <span aria-hidden>{flag}</span>
        </button>
      ))}
    </div>
  );
};
