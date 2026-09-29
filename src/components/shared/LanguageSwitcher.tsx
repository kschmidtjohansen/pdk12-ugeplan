import { useTranslation } from '@/context/TranslationContext';
import { cn } from '@/lib/utils';

/** Dansk flag (Dannebrog) som inline SVG */
const DanishFlag = () => (
  <svg viewBox="0 0 37 28" className="h-5 w-auto rounded-[3px] shadow-sm" aria-hidden>
    <rect width="37" height="28" fill="#C8102E" />
    <rect x="12" width="4" height="28" fill="#FFFFFF" />
    <rect y="12" width="37" height="4" fill="#FFFFFF" />
  </svg>
);

/** Britisk flag (Union Jack) som inline SVG */
const BritishFlag = () => (
  <svg viewBox="0 0 37 28" className="h-5 w-auto rounded-[3px] shadow-sm" aria-hidden>
    <rect width="37" height="28" fill="#012169" />
    <path d="M0,0 L37,28 M37,0 L0,28" stroke="#FFFFFF" strokeWidth="5.6" />
    <path d="M0,0 L37,28 M37,0 L0,28" stroke="#C8102E" strokeWidth="1.9" />
    <rect x="15.5" width="6" height="28" fill="#FFFFFF" />
    <rect y="11" width="37" height="6" fill="#FFFFFF" />
    <rect x="16.9" width="3.2" height="28" fill="#C8102E" />
    <rect y="12.4" width="37" height="3.2" fill="#C8102E" />
  </svg>
);

/**
 * Flag-baseret sprogvælger (Dansk / Engelsk).
 * Bruges bl.a. på login-siden, hvor brugeren endnu ikke er logget ind.
 */
export const LanguageSwitcher = ({ className }: { className?: string }) => {
  const { currentLanguage, setLanguage } = useTranslation();

  const options = [
    { lang: 'da' as const, flag: <DanishFlag />, label: 'Dansk' },
    { lang: 'en' as const, flag: <BritishFlag />, label: 'English' },
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
            'flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200',
            currentLanguage === lang
              ? 'bg-primary/15 ring-2 ring-primary/40 scale-105'
              : 'opacity-50 hover:opacity-100 hover:bg-muted'
          )}
        >
          {flag}
        </button>
      ))}
    </div>
  );
};
