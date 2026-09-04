import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { EnhancedSecureLoginForm } from '@/components/Auth/EnhancedSecureLoginForm';
import { useTranslation } from '@/context/TranslationContext';
import { CalendarDays, Shield, Users } from 'lucide-react';

const LoginPage = () => {
  const { isAuthenticated, authReady, session, userDataLoaded } = useAuth();
  const navigate = useNavigate();
  const { t, currentLanguage } = useTranslation();
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

  const isDanish = currentLanguage === 'da';

  const features = [
    { icon: CalendarDays, label: isDanish ? 'Ugeplan' : 'Weekly planner' },
    { icon: Users, label: isDanish ? 'Vagter & ferie' : 'Duty & vacation' },
    { icon: Shield, label: isDanish ? 'Adgang pr. afdeling' : 'Access per department' },
  ];

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background flex flex-col">
      {/* Brand-strimmel øverst — solid Polygon-blå farveanker */}
      <div aria-hidden className="h-1.5 w-full bg-polygon-blue shrink-0" />

      {/* Baggrund: blødt blåt glow + diskret kalender-grid mønster (tokens i index.css) */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="login-ambient-glow absolute -top-40 left-1/2 -translate-x-1/2 h-[480px] w-[900px] max-w-[140vw] rounded-full opacity-25 blur-3xl" />
        <div className="login-grid-pattern absolute inset-0" />
      </div>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 sm:px-6 py-10 sm:py-14">
        <div className="w-full max-w-md flex flex-col items-center">
          {/* Logo */}
          <div className="h-12 px-5 rounded-2xl bg-polygon-blue flex items-center justify-center shadow-lg animate-fade-in-down">
            <img
              src="https://www.polygongroup.com/UI/build/svg/polygon-logo.svg"
              alt="Polygon"
              className="h-6 w-auto brightness-0 invert"
              loading="eager"
            />
          </div>

          {/* Overskrift */}
          <div className="mt-6 text-center space-y-1.5 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              {t('login.welcomeMessage')}{firstName ? `, ${firstName}` : ''}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('login.loginSubtext')}
            </p>
            {departmentName && (
              <p className="text-xs text-muted-foreground/70 pt-0.5">
                {departmentName}
              </p>
            )}
          </div>

          {/* Login-formular */}
          <div className="mt-7 w-full animate-fade-in-up" style={{ animationDelay: '160ms' }}>
            <EnhancedSecureLoginForm onSuccess={handleLoginSuccess} />
          </div>

          {/* Feature-piller */}
          <div
            className="mt-7 flex flex-wrap items-center justify-center gap-2 animate-fade-in-up"
            style={{ animationDelay: '260ms' }}
          >
            {features.map((f) => (
              <span
                key={f.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/70 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-muted-foreground"
              >
                <f.icon className="h-3.5 w-3.5 text-polygon-blue" aria-hidden />
                {f.label}
              </span>
            ))}
          </div>

          {/* Footer-linje */}
          <p
            className="mt-8 text-center text-xs text-muted-foreground/70 animate-fade-in-up"
            style={{ animationDelay: '340ms' }}
          >
            © {new Date().getFullYear()} Polygon Group · {isDanish ? 'Internt system' : 'Internal system'}
            {' · '}
            {isDanish ? 'Kontakt jeres administrator for adgang.' : 'Contact your administrator for access.'}
          </p>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
