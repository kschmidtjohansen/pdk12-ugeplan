import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, LogOut } from 'lucide-react';
import { Navigate } from 'react-router-dom';

const PendingApprovalPage = () => {
  const { user, isAuthenticated, isPendingApproval, logout, userDataLoaded } = useAuth();
  const { currentLanguage } = useTranslation();
  const isDanish = currentLanguage === 'da';

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If user has been approved (no longer pending), bounce to dashboard
  if (userDataLoaded && !isPendingApproval) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md shadow-sm border-border/70">
        <CardContent className="pt-8 pb-6 space-y-5 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Clock className="h-6 w-6 text-primary" aria-hidden />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              {isDanish ? 'Konto venter på godkendelse' : 'Account awaiting approval'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isDanish
                ? 'Tak fordi du loggede ind. En administrator skal tildele dig en rolle og afdeling, før du kan bruge systemet. Du får besked, så snart adgangen er klar.'
                : 'Thanks for signing in. An administrator needs to assign you a role and department before you can use the system. You will be notified once access is ready.'}
            </p>
          </div>

          {user?.email && (
            <div className="rounded-lg border border-border bg-muted/50 px-4 py-2 text-sm text-foreground break-all">
              {user.email}
            </div>
          )}

          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => {
              logout();
            }}
          >
            <LogOut className="h-4 w-4" aria-hidden />
            <span>{isDanish ? 'Log ud' : 'Sign out'}</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingApprovalPage;
