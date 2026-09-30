import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { Button } from '@/components/ui/button';
import { UserCog, LogOut } from 'lucide-react';

/**
 * Persistent warning bar shown while IT-Support is acting as another employee.
 * The underlying login session is unchanged — only the identity the UI renders.
 */
const ImpersonationBanner: React.FC = () => {
  const { isImpersonating, user, realUser, stopImpersonation } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!isImpersonating || !user) return null;

  const handleStop = () => {
    stopImpersonation();
    navigate('/admin');
  };

  return (
    <div className="sticky top-0 z-50 w-full bg-warning text-warning-foreground border-b border-warning">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 sm:px-6">
        <div className="flex items-center gap-2 min-w-0">
          <UserCog className="h-4 w-4 shrink-0" />
          <span className="text-sm font-medium truncate">
            {t('ui.impersonationActive', { name: user.name, role: t(`admin.roles.${user.role}`) })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {realUser?.name && (
            <span className="hidden sm:inline text-xs opacity-80">
              {t('ui.impersonationLoggedInAs', { name: realUser.name })}
            </span>
          )}
          <Button size="sm" variant="secondary" className="h-8" onClick={handleStop}>
            <LogOut className="h-4 w-4 mr-1" />
            {t('ui.impersonationStop')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ImpersonationBanner;
