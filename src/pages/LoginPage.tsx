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
    <div className="relative min-h-screen w-full overflow-hidden bg-background flex items-center justify-center">
      {/* Baggrund: bløde brand-blå glow-felter + fint dot-grid (tokens i index.css) */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="login-ambient-glow absolute -top-[10%] -left-[10%] w-[45%] h-[45%] rounded-full opacity-30 blur-[120px]" />
        <div className="login-ambient-glow absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full opacity-20 blur-[120px]" />
        <div className="login-dot-pattern absolute inset-0" />
      </div>

      <main className="relative z-10 w-full max-w-[480px] px-4 sm:px-6 py-12">
        {/* Flydende logo-chip der overlapper kortet */}
        <div className="flex justify-center -mb-7 relative z-20 animate-fade-in-down">
          <div className="bg-card px-6 py-3.5 rounded-2xl shadow-xl border border-border/50 flex items-center justify-center transition-transform duration-500 hover:scale-105">
            <div className="h-9 px-4 rounded-xl bg-polygon-blue flex items-center justify-center">
              <img
                src="https://www.polygongroup.com/UI/build/svg/polygon-logo.svg"
                alt="Polygon"
                className="h-5 w-auto brightness-0 invert"
                loading="eager"
              />
            </div>
          </div>
        </div>

        {/* Login-kort */}
        <div
          className="relative overflow-hidden bg-card/80 backdrop-blur-xl rounded-[2.5rem] border border-card shadow-[0_32px_64px_-16px_hsl(var(--primary)/0.15)] pt-14 pb-8 px-6 sm:px-10 animate-fade-in-up"
          style={{ animationDelay: '80ms' }}
        >
          {/* Brand-blå accentlinje øverst i kortet */}
          <div aria-hidden className="absolute top-0 left-0 right-0 h-1.5 bg-polygon-blue" />

          {/* Overskrift */}
          <div className="text-center mb-8 space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
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
          <EnhancedSecureLoginForm onSuccess={handleLoginSuccess} />

          {/* Feature-piller */}
          <div className="mt-8 pt-6 border-t border-border/60">
            <div className="flex flex-wrap justify-center gap-2">
              {features.map((f) => (
                <span
                  key={f.label}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-muted/50 rounded-full border border-border/60 text-xs font-semibold text-muted-foreground transition-colors hover:bg-primary/5 hover:text-primary cursor-default"
                >
                  <f.icon className="h-3.5 w-3.5 text-polygon-blue" aria-hidden />
                  {f.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer-linje */}
        <p
          className="mt-8 text-center text-xs text-muted-foreground/70 tracking-wide animate-fade-in-up"
          style={{ animationDelay: '200ms' }}
        >
          © {new Date().getFullYear()} Polygon Group · {isDanish ? 'Internt system' : 'Internal system'}
          {' · '}
          {isDanish ? 'Kontakt jeres administrator for adgang.' : 'Contact your administrator for access.'}
        </p>
      </main>
    </div>
  );
};

export default LoginPage;
