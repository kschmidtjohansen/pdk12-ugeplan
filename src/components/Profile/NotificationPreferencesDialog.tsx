import React from 'react';
import { Bell } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/context/TranslationContext';
import {
  useNotificationPreferences,
  type NotificationPreferenceKey,
} from '@/hooks/useNotificationPreferences';
import { useAuth } from '@/context/AuthContext';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NotificationPreferencesDialog: React.FC<Props> = ({ open, onOpenChange }) => {
  const { t } = useTranslation();
  const { isAdmin, isSkadeleder } = useAuth();
  const { preferences, loading, saving, updatePreference } = useNotificationPreferences();

  const items: { key: NotificationPreferenceKey; label: string; hint: string; show: boolean }[] = [
    {
      key: 'broadcast',
      label: t('profile.notifications.broadcast'),
      hint: t('profile.notifications.broadcastHint'),
      show: true,
    },
    {
      key: 'assignment',
      label: t('profile.notifications.assignment'),
      hint: t('profile.notifications.assignmentHint'),
      show: true,
    },
    {
      key: 'duty',
      label: t('profile.notifications.duty'),
      hint: t('profile.notifications.dutyHint'),
      show: true,
    },
    {
      key: 'vacation',
      label: t('profile.notifications.vacation'),
      hint: t('profile.notifications.vacationHint'),
      show: true,
    },
    {
      key: 'sick_day',
      label: t('profile.notifications.sickDay'),
      hint: t('profile.notifications.sickDayHint'),
      show: isAdmin || isSkadeleder,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-sm:left-0 max-sm:top-auto max-sm:bottom-0 max-sm:translate-x-0 max-sm:translate-y-0 max-sm:max-w-full max-sm:rounded-t-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            {t('profile.notifications.title')}
          </DialogTitle>
          <DialogDescription>{t('profile.notifications.description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {items
            .filter((item) => item.show)
            .map((item) => (
              <div
                key={item.key}
                className="flex items-start justify-between gap-4 rounded-xl border border-border/60 p-3"
              >
                <div className="min-w-0">
                  <Label htmlFor={`pref-${item.key}`} className="text-sm font-medium">
                    {item.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">{item.hint}</p>
                </div>
                <Switch
                  id={`pref-${item.key}`}
                  checked={preferences[item.key]}
                  disabled={loading || saving}
                  onCheckedChange={(checked) => updatePreference(item.key, checked)}
                  aria-label={item.label}
                />
              </div>
            ))}
        </div>

        <p className="text-xs text-muted-foreground">{t('profile.notifications.footnote')}</p>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationPreferencesDialog;
