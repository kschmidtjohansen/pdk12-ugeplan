import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { EnhancedSecureLoginForm } from '@/components/Auth/EnhancedSecureLoginForm';
import { useTranslation } from '@/context/TranslationContext';
import { PwaInstallButton } from '@/components/Pwa/PwaInstallButton';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { ORG_NAME, ORG_LOGO_URL } from '@/config/product';
import PolyPlanBrand from '@/components/branding/PolyPlanBrand';
import { getLoginDestination } from '@/utils/loginDestination';

const DAYS_DA = ['søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag'];
const DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** "Godmorgen. Klar til fredag?" – hilsen efter tid på dagen, som på lærredet. */
const greeting = (da: boolean, firstName: string, now = new Date()) => {
  const h = now.getHours();
  const hello = da
    ? (h < 5 ? 'Godnat' : h < 10 ? 'Godmorgen' : h < 12 ? 'God formiddag' : h < 18 ? 'God eftermiddag' : 'Godaften')
    : (h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening');
  const name = firstName ? `, ${firstName}` : '';
  const day = (da ? DAYS_DA : DAYS_EN)[now.getDay()];
  return da ? `${hello}${name}. Klar til ${day}?` : `${hello}${name}. Ready for ${day}?`;
};

/** Lærredets login: lys himmel med glasflader, budskabet til venstre og login-kortet i glas til højre. */
const LoginPage = () => {
  const { isAuthenticated, authReady, session, userDataLoaded } = useAuth();
  const navigate = useNavigate();
  const { search } = useLocation();
  const destination = getLoginDestination(search);
  const { currentLanguage } = useTranslation();
  const da = currentLanguage !== 'en';
  const [loginBusy, setLoginBusy] = useState(false);
  const departmentName = localStorage.getItem('selected_department_name');
  const lastUserName = typeof window !== 'undefined' ? localStorage.getItem('last_user_name') : null;
  const firstName = lastUserName ? lastUserName.split(' ')[0].trim() : '';

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('[LoginPage] Auth state:', { isAuthenticated, authReady, session: !!session, userDataLoaded });
    }
    if (authReady && isAuthenticated && session && userDataLoaded) {
      if (destination === '/dashboard') navigate(destination, { replace: true });
      else window.location.replace(destination);
    }
  }, [isAuthenticated, authReady, session, userDataLoaded, navigate, destination]);

  const handleLoginSuccess = () => {
    // Navigation handled by the useEffect when session is available
  };

  return (
    <div className="login-workspace login-sky relative isolate flex min-h-dvh w-full flex-col overflow-hidden lg:flex-row">
      {/* Lys og glas – kun pynt */}
      <span aria-hidden className="login-glow pointer-events-none absolute -left-40 -top-56 -z-10 h-[700px] w-[900px]" />
      <span aria-hidden className="login-glow pointer-events-none absolute left-[44%] top-[420px] -z-10 h-[620px] w-[760px] opacity-75" />
      <span aria-hidden className="login-glass-shape pointer-events-none absolute left-[36%] top-[120px] -z-10 hidden h-[300px] w-[300px] rotate-[14deg] rounded-[40px] lg:block" />
      <span aria-hidden className="login-glass-shape pointer-events-none absolute left-[50%] top-[520px] -z-10 hidden h-[180px] w-[180px] -rotate-[10deg] rounded-[30px] lg:block" />

      <LanguageSwitcher className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6" />

      {/* Budskab */}
      <section className="relative flex flex-col px-6 pb-2 pt-8 sm:px-10 lg:flex-1 lg:px-20 lg:py-16">
        <PolyPlanBrand size={40} className="gap-3" wordmarkClassName="font-display text-[22px] font-bold" />
        <div className="mt-8 flex max-w-[560px] flex-col gap-3 lg:my-auto lg:gap-5">
          <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-[-0.035em] text-brand-ink sm:text-5xl lg:text-[64px] lg:leading-[66px]">
            {da ? 'Hele dagen.' : 'The whole day.'}<br />
            <span className="text-primary-strong">{da ? 'Ét overblik.' : 'One overview.'}</span>
          </h1>
          <p className="max-w-[30rem] text-base text-muted-foreground lg:text-lg lg:leading-7">
            {da
              ? 'Planlægning af Polygons servicemedarbejdere, biler og vagter. Fra kontoret og fra marken.'
              : "Planning Polygon's service staff, vehicles and on-call duty. From the office and from the field."}
          </p>
        </div>
        <span className="mt-auto hidden items-center gap-2.5 text-[13px] text-muted-foreground lg:flex">
          <img src={ORG_LOGO_URL} data-brand="polygon-group-logo" alt={ORG_NAME} className="h-5 w-auto" loading="eager" draggable={false} />
          {da ? 'Et værktøj fra Polygon' : 'A tool from Polygon'}
        </span>
      </section>

      {/* Login-kort */}
      <main className="relative flex flex-1 items-start justify-center px-4 pb-10 pt-6 sm:px-6 lg:flex-none lg:basis-[520px] lg:items-center lg:p-10">
        <div className="w-full max-w-[420px]">
          <section aria-labelledby="login-title" className={`login-glass-card rounded-[28px] p-6 sm:p-9 ${loginBusy ? 'border-beam' : ''}`}>
            <div className="mb-5 space-y-1">
              <h2 id="login-title" className="font-display text-[28px] font-bold leading-[34px] tracking-[-0.02em] text-foreground">{da ? 'Log ind' : 'Sign in'}</h2>
              <p className="text-sm text-muted-foreground">{greeting(da, firstName)}</p>
              {departmentName && <p className="pt-0.5 text-xs text-muted-foreground/80">{departmentName}</p>}
            </div>
            <EnhancedSecureLoginForm onSuccess={handleLoginSuccess} onBusyChange={setLoginBusy} />
          </section>

          <div className="lg:hidden">
            <PwaInstallButton />
          </div>

          <p className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground lg:hidden">
            <img src={ORG_LOGO_URL} data-brand="polygon-group-logo" alt={ORG_NAME} className="h-4 w-auto" loading="lazy" draggable={false} />
            {da ? 'Et værktøj fra Polygon' : 'A tool from Polygon'}
          </p>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
