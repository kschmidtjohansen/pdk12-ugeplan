import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/context/TranslationContext';

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const { currentLanguage } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const isDanish = currentLanguage === 'da';

  useEffect(() => {
    let active = true;

    const handle = async () => {
      try {
        const url = new URL(window.location.href);
        const errParam = url.searchParams.get('error') || url.searchParams.get('error_description');
        if (errParam) {
          if (active) setError(errParam);
          return;
        }

        // exchangeCodeForSession reads ?code from window.location
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (exchangeError) {
          if (active) setError(exchangeError.message);
          return;
        }

        if (active) navigate('/dashboard', { replace: true });
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'Unknown error');
      }
    };

    handle();
    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-4 max-w-md p-6">
        {error ? (
          <>
            <h1 className="text-xl font-semibold text-foreground">
              {isDanish ? 'Login mislykkedes' : 'Sign-in failed'}
            </h1>
            <p className="text-sm text-muted-foreground break-words">{error}</p>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="text-sm text-primary underline hover:no-underline"
            >
              {isDanish ? 'Tilbage til login' : 'Back to login'}
            </button>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary mx-auto" />
            <p className="text-muted-foreground">
              {isDanish ? 'Færdiggør Microsoft-login…' : 'Finishing Microsoft sign-in…'}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallbackPage;
