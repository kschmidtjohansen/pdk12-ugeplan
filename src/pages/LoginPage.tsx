import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { EnhancedSecureLoginForm } from '@/components/Auth/EnhancedSecureLoginForm';
import { useTranslation } from '@/context/TranslationContext';
import { PwaInstallButton } from '@/components/Pwa/PwaInstallButton';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { PRODUCT_NAME, ORG_NAME, PRODUCT_TAGLINE_DA, ORG_LOGO_URL } from '@/config/product';
import PolyPlanBrand from '@/components/branding/PolyPlanBrand';
import PolyPlanMark from '@/components/branding/PolyPlanMark';

const LoginPage = () => {
  const { isAuthenticated, authReady, session, userDataLoaded } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const departmentName = localStorage.getItem('selected_department_name');
  const lastUserName = typeof window !== 'undefined' ? localStorage.getItem('last_user_name') : null;
  const firstName = lastUserName ? lastUserName.split(' ')[0].trim() : '';

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('[LoginPage] Auth state:', { isAuthenticated, authReady, session: !!session, userDataLoaded });
    }
    if (authReady && isAuthenticated && session && userDataLoaded) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, authReady, session, userDataLoaded, navigate]);

  const handleLoginSuccess = () => {
    // Navigation handled by the useEffect when session is available
  };

  const year = new Date().getFullYear();

  return (
    <div className="min-h-dvh w-full bg-background flex flex-col lg:flex-row">
      {/* Brand-panel — kun bred skærm. Flad, mørk brand-flade uden glow/glas. */}
      <aside
        aria-hidden
        className="hidden lg:flex lg:w-[44%] xl:w-[46%] flex-col justify-between bg-brand-deep text-brand-deep-foreground p-10 xl:p-14"
      >
        <div className="flex items-center gap-3">
          <img
            src={ORG_LOGO_URL}
            data-brand="polygon-group-logo"
            alt=""
            className="h-5 w-auto brightness-0 invert"
            loading="eager"
            draggable={false}
          />
        </div>

        <div className="max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-deep-muted">
            {ORG_NAME}
          </p>
          <div className="mt-3 flex items-center gap-4">
            <PolyPlanMark size={40} decorative />
            <h1 className="text-4xl xl:text-5xl font-semibold tracking-tight text-brand-deep-foreground">
              {PRODUCT_NAME}
            </h1>
          </div>
          <p className="mt-4 text-base leading-relaxed text-brand-deep-muted">
            {PRODUCT_TAGLINE_DA} — ugeplan, vagter, ferie, biler og lager samlet i ét roligt arbejdsredskab.
          </p>

          <ul className="mt-10 divide-y divide-brand-deep-foreground/10 border-y border-brand-deep-foreground/10 text-sm">
            {[
              t('navigation.planner'),
              t('navigation.duty'),
              t('navigation.vacation'),
              t('navigation.cars'),
            ].map((label) => (
              <li key={label} className="flex items-center gap-3 py-3">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="text-brand-deep-foreground/90">{label}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-brand-deep-muted">© {year} {ORG_NAME}</p>
      </aside>

      {/* Form-panel */}
      <main className="relative flex flex-1 items-center justify-center px-4 sm:px-6 py-10">
        <LanguageSwitcher className="absolute top-4 right-4 sm:top-6 sm:right-6" />

        <div className="w-full max-w-[400px]">
          {/* Kompakt brand-lockup (mobil + form-panel) */}
          <div className="mb-8 flex flex-col items-center text-center lg:items-start lg:text-left">
            <PolyPlanBrand size={36} wordmarkClassName="text-xl" />
            <p className="mt-1.5 text-xs text-muted-foreground">{PRODUCT_NAME} · {ORG_NAME}</p>
          </div>

          <div className="rounded-xl border border-border bg-card shadow-xs p-6 sm:p-8">
            <div className="mb-6 space-y-1.5 text-center lg:text-left">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                {t('login.welcomeMessage')}{firstName ? `, ${firstName}` : ''}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t('login.loginSubtext')}
              </p>
              {departmentName && (
                <p className="text-xs text-muted-foreground/70 pt-0.5">
                  {departmentName}
                </p>
              )}
            </div>

            <EnhancedSecureLoginForm onSuccess={handleLoginSuccess} />
          </div>

          {/* Installer som app - kun mobil/tablet */}
          <div className="lg:hidden">
            <PwaInstallButton />
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground/70 tracking-wide lg:hidden">
            © {year} {ORG_NAME}
          </p>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
