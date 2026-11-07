import { useEffect, useState } from 'react';
import { CalendarDays, Phone, Palmtree, Car, ShieldCheck } from 'lucide-react';
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
  const [loginBusy, setLoginBusy] = useState(false);
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
    <div className="login-workspace min-h-dvh w-full bg-background flex flex-col lg:flex-row">
      {/* Brand-panel — kun bred skærm. Flad, mørk brand-flade uden glow/glas. */}
      <aside
        aria-hidden
        className="hidden lg:flex lg:w-[44%] xl:w-[46%] flex-col justify-between bg-brand-deep text-brand-deep-foreground p-10 xl:p-14"
      >
        <div className="flex items-center justify-between gap-3">
          <img
            src={ORG_LOGO_URL}
            data-brand="polygon-group-logo"
            alt=""
            className="h-5 w-auto brightness-0 invert"
            loading="eager"
            draggable={false}
          />
          <span className="flex items-center gap-2 text-xs text-brand-deep-muted">
            <ShieldCheck className="h-4 w-4 text-primary" />
            {t('login.button')}
          </span>
        </div>

        <div className="max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-deep-muted">
            {ORG_NAME}
          </p>
          <div className="mt-3 flex items-center gap-4">
            <PolyPlanMark size={40} decorative />
          <h1 className="text-4xl xl:text-5xl font-semibold text-brand-deep-foreground">
              {PRODUCT_NAME}
            </h1>
          </div>
          <p className="mt-4 text-base leading-relaxed text-brand-deep-muted">
            {PRODUCT_TAGLINE_DA} — ugeplan, vagter, ferie, biler og lager samlet i ét roligt arbejdsredskab.
          </p>

          <ul className="mt-10 grid grid-cols-2 gap-3 text-sm">
            {[
              { label: t('navigation.planner'), icon: CalendarDays },
              { label: t('navigation.duty'), icon: Phone },
              { label: t('navigation.vacation'), icon: Palmtree },
              { label: t('navigation.cars'), icon: Car },
            ].map(({ label, icon: Icon }) => (
              <li key={label} className="login-module flex items-center gap-3 rounded-lg border border-brand-deep-foreground/10 bg-brand-deep-foreground/5 p-4">
                <Icon className="h-4 w-4 shrink-0 text-primary" />
                <span className="text-brand-deep-foreground/90">{label}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-brand-deep-muted">© {year} {ORG_NAME}</p>
      </aside>

      {/* Form-panel */}
      <main className="relative isolate flex flex-1 items-center justify-center px-4 sm:px-6 py-16">
        <div className="login-dot-pattern pointer-events-none absolute inset-0 -z-10" aria-hidden />
        <LanguageSwitcher className="absolute top-4 right-4 sm:top-6 sm:right-6" />

        <div className="w-full max-w-[400px]">
          {/* Kompakt brand-lockup (mobil + form-panel) */}
          <div className="mb-8 flex flex-col items-center text-center lg:items-start lg:text-left">
            <PolyPlanBrand size={36} wordmarkClassName="text-xl" />
            <p className="mt-1.5 text-xs text-muted-foreground">{ORG_NAME}</p>
          </div>

          <div className={`spotlight login-surface rounded-xl border border-border bg-card shadow-md p-6 sm:p-8 ${loginBusy ? 'border-beam' : ''}`}>
            <div className="relative z-10">
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

            <EnhancedSecureLoginForm onSuccess={handleLoginSuccess} onBusyChange={setLoginBusy} />
            </div>
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
