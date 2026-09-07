import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { RotateCcw } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';

/**
 * Clears app caches + unregisters stale service workers, then hard-reloads.
 * Auth storage (localStorage/sessionStorage) is intentionally untouched.
 */
export const ClearCacheButton: React.FC = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleClear = async () => {
    setBusy(true);
    try {
      if (typeof caches !== 'undefined') {
        const keys = await caches.keys();
        await Promise.allSettled(keys.map((key) => caches.delete(key)));
      }
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.allSettled(regs.map((reg) => reg.unregister()));
      }
    } catch (err: unknown) {
      if (import.meta.env.DEV) console.warn('[ClearCacheButton] cleanup failed', err);
    } finally {
      window.location.reload();
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="gap-2 text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <RotateCcw className="h-4 w-4" />
        {t('dashboard.clearCache.button')}
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dashboard.clearCache.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dashboard.clearCache.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                void handleClear();
              }}
            >
              {t('dashboard.clearCache.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ClearCacheButton;
