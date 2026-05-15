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

  // Internt system — neutral, beskrivende tone (ingen salgs-pitch)
  const headline = isDanish ? 'Polygon Ugeplan' : 'Polygon Weekly Planner';
  const subHeadline = isDanish
    ? 'Internt planlægningssystem for skadeservice.'
    : 'Internal planning system for restoration services.';

  const sections = [
    {
      icon: CalendarDays,
      title: isDanish ? 'Ugeplan' : 'Weekly planner',
      desc: isDanish ? 'Opgaver pr. dag og uge.' : 'Tasks per day and week.',
    },
    {
      icon: Users,
      title: isDanish ? 'Vagter & ferie' : 'Duty & vacation',
      desc: isDanish ? 'Vagtplan og fravær samlet.' : 'Duty and absence in one view.',
    },
    {
      icon: Shield,
      title: isDanish ? 'Adgang pr. afdeling' : 'Access per department',
      desc: isDanish ? 'Isoleret pr. afdeling og rolle.' : 'Isolated per department and role.',
    },
  ];

  // Solid Polygon brand-blå baggrund — bruges både i venstre brand-panel (lg+) og i mobil-toppen
  const BrandBackground = () => (
    <div aria-hidden className="absolute inset-0 bg-polygon-blue" />
  );

  return (
    <div className="min-h-screen w-full bg-background lg:grid lg:grid-cols-2">
      {/* MOBILE/TABLET — top brand-banner med samme animerede gradient (lg: skjules, vises i venstre panel) */}
      <header
        className="relative lg:hidden text-white overflow-hidden px-6 pt-10 pb-12 animate-fade-in-down"
        aria-label={headline}
      >
        <BrandBackground />
        <div className="relative z-10 flex flex-col items-center text-center space-y-3 animate-fade-in-up">
          <div className="h-12 px-4 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center ">
            <img
              src="https://www.polygongroup.com/UI/build/svg/polygon-logo.svg"
              alt="Polygon"
              className="h-6 w-auto brightness-0 invert"
              loading="eager"
            />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{headline}</h1>
            <p className="text-xs text-white/80 mt-1">{subHeadline}</p>
          </div>
        </div>
      </header>

      {/* DESKTOP — venstre brand-panel */}
      <aside
        className="relative hidden lg:flex flex-col justify-between overflow-hidden text-white p-10 xl:p-14"
        aria-label={headline}
      >
        <BrandBackground />

        {/* Top — logo + system-navn */}
        <div className="relative z-10 flex items-center gap-3 animate-fade-in-up">
          <div className="h-10 px-3 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center ">
            <img
              src="https://www.polygongroup.com/UI/build/svg/polygon-logo.svg"
              alt="Polygon"
              className="h-5 w-auto brightness-0 invert"
              loading="eager"
            />
          </div>
          
        </div>

        {/* Middle — neutral systembeskrivelse */}
        <div className="relative z-10 max-w-lg space-y-6 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
          <h2 className="text-3xl xl:text-4xl font-semibold leading-tight tracking-tight text-white drop-shadow-sm">
            {isDanish ? 'Planlæg ugen — ét samlet overblik.' : 'Plan the week — one shared view.'}
          </h2>

          <ul className="space-y-2">
            {sections.map((s, i) => (
              <li
                key={s.title}
                className="flex items-start gap-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 p-3 animate-fade-in-up"
                style={{ animationDelay: `${160 + i * 80}ms` }}
              >
                <div className="h-9 w-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                  <s.icon className="h-4 w-4" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight">{s.title}</p>
                  <p className="text-xs text-white/75 leading-snug mt-0.5">{s.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom — versionslinje, intern */}
        <div
          className="relative z-10 text-xs text-white/70 animate-fade-in-up"
          style={{ animationDelay: '420ms' }}
        >
          {isDanish
            ? 'Kontakt jeres administrator for adgang.'
            : 'Contact your administrator for access.'}
        </div>
      </aside>

      {/* RIGHT — login form */}
      <main
        className="flex items-start lg:items-center justify-center px-4 sm:px-6 lg:px-8 pt-8 pb-12 lg:py-12 animate-fade-in"
        // Pull form-card a bit up under mobile banner for a smooth overlap
      >
        <div className="w-full max-w-md space-y-6 -mt-10 lg:mt-0">
          <div className="text-center lg:text-left space-y-1 px-1">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              {t('login.welcomeMessage')}{firstName ? `, ${firstName}` : ''}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t('login.loginSubtext')}
            </p>
            {departmentName && (
              <p className="text-xs text-muted-foreground/70 pt-1">
                {departmentName}
              </p>
            )}
          </div>

          <EnhancedSecureLoginForm onSuccess={handleLoginSuccess} />

          <p className="text-center lg:text-left text-xs text-muted-foreground/70 px-1">
            © {new Date().getFullYear()} Polygon Group · {isDanish ? 'Internt system' : 'Internal system'}
          </p>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
