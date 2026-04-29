import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { EnhancedSecureLoginForm } from '@/components/Auth/EnhancedSecureLoginForm';
import { useTranslation } from '@/context/TranslationContext';
import { CalendarDays, Shield, Users, Quote } from 'lucide-react';

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
    // Navigation will be handled by the useEffect above when session is available
  };

  const isDanish = currentLanguage === 'da';

  const tagline = isDanish
    ? 'Planlæg jeres uge på minutter — ikke timer.'
    : 'Plan your week in minutes — not hours.';
  const subTagline = isDanish
    ? 'Den moderne ugeplan til skadeservice. Bygget til skadeledere, medarbejdere og biler i felten.'
    : 'The modern weekly planner for restoration services. Built for case managers, employees and vehicles in the field.';

  const features = [
    {
      icon: CalendarDays,
      title: isDanish ? 'Smart planlægger' : 'Smart planner',
      desc: isDanish ? 'Træk-og-slip opgaver, kopiér dage, bulk-publicér.' : 'Drag-and-drop tasks, copy days, bulk publish.',
    },
    {
      icon: Users,
      title: isDanish ? 'Vagter & ferie' : 'Duty & vacation',
      desc: isDanish ? 'Hold styr på vagter og fravær på tværs af afdelinger.' : 'Manage duty and absence across departments.',
    },
    {
      icon: Shield,
      title: isDanish ? 'Sikker pr. afdeling' : 'Secure by department',
      desc: isDanish ? 'Streng multi-tenant isolation og rollestyring.' : 'Strict multi-tenant isolation and role control.',
    },
  ];

  const quote = isDanish
    ? 'Vi sparer flere timer hver mandag morgen — og fejlbookninger er stort set væk.'
    : 'We save several hours every Monday morning — and double-bookings are basically gone.';
  const quoteAuthor = isDanish ? 'Skadeleder, Polygon DK' : 'Case manager, Polygon DK';

  return (
    <div className="min-h-screen w-full bg-background grid lg:grid-cols-2">
      {/* LEFT — animated brand panel */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden text-white p-10 xl:p-14">
        {/* Base solid */}
        <div aria-hidden className="absolute inset-0 bg-primary" />

        {/* Animated mesh blobs */}
        <div aria-hidden className="absolute inset-0 overflow-hidden">
          <div
            className="absolute -top-32 -left-24 w-[60%] h-[60%] rounded-full blur-3xl opacity-70 animate-mesh-drift"
            style={{ background: 'radial-gradient(circle at center, hsl(190 100% 70%) 0%, transparent 60%)' }}
          />
          <div
            className="absolute top-1/3 -right-24 w-[55%] h-[55%] rounded-full blur-3xl opacity-60 animate-mesh-drift-alt"
            style={{ background: 'radial-gradient(circle at center, hsl(210 100% 60%) 0%, transparent 60%)' }}
          />
          <div
            className="absolute -bottom-24 left-1/4 w-[55%] h-[55%] rounded-full blur-3xl opacity-50 animate-mesh-drift"
            style={{ background: 'radial-gradient(circle at center, hsl(170 100% 65%) 0%, transparent 60%)', animationDelay: '-6s' }}
          />
        </div>

        {/* Subtle grid overlay */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Top — logo */}
        <div className="relative z-10 flex items-center gap-3 animate-fade-in-up">
          <div className="h-10 w-10 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center animate-logo-shimmer">
            <span className="font-bold text-lg tracking-tight">P</span>
          </div>
          <span className="text-lg font-semibold tracking-tight">Polygon Ugeplan</span>
        </div>

        {/* Middle — tagline + features */}
        <div className="relative z-10 max-w-lg space-y-8 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
          <div className="space-y-4">
            <h2 className="text-4xl xl:text-5xl font-semibold leading-[1.05] tracking-tight">
              {tagline}
            </h2>
            <p className="text-base text-white/85 leading-relaxed max-w-md">
              {subTagline}
            </p>
          </div>

          <ul className="space-y-3">
            {features.map((f, i) => (
              <li
                key={f.title}
                className="flex items-start gap-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 p-3 animate-fade-in-up"
                style={{ animationDelay: `${160 + i * 80}ms` }}
              >
                <div className="h-9 w-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                  <f.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight">{f.title}</p>
                  <p className="text-xs text-white/75 leading-snug mt-0.5">{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom — testimonial */}
        <figure
          className="relative z-10 max-w-lg rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-5 animate-fade-in-up"
          style={{ animationDelay: '480ms' }}
        >
          <Quote className="h-5 w-5 text-white/70 mb-2" aria-hidden />
          <blockquote className="text-sm text-white/95 leading-relaxed">
            "{quote}"
          </blockquote>
          <figcaption className="mt-3 text-xs text-white/70">— {quoteAuthor}</figcaption>
        </figure>
      </aside>

      {/* RIGHT — login form */}
      <main className="flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo (left panel hidden under lg) */}
          <div className="lg:hidden flex flex-col items-center text-center">
            <img
              src="https://www.polygongroup.com/UI/build/svg/polygon-logo.svg"
              alt="Polygon"
              className="h-12 mb-4"
              width="180"
              height="48"
            />
          </div>

          <div className="text-center lg:text-left space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {t('login.welcomeMessage')}{firstName ? `, ${firstName}` : ''}
            </h1>
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

          <p className="text-center lg:text-left text-xs text-muted-foreground/70">
            © {new Date().getFullYear()} Polygon Group · {isDanish ? 'Alle rettigheder forbeholdes' : 'All rights reserved'}
          </p>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
