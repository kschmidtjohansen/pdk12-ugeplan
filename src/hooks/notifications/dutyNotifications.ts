import { useCallback } from 'react';
import { format } from 'date-fns';
import { da, enUS } from 'date-fns/locale';
import { useTranslation } from '@/context/TranslationContext';
import type { DutyType } from '@/types/duty';

export const useDutyNotifications = (
  addNotification: (notification: any) => Promise<string | null>
) => {
  const { t, currentLanguage } = useTranslation();
  const locale = currentLanguage === 'da' ? da : enUS;

  const createDutyAssignmentNotification = useCallback(async (
    employeeId: string,
    dutyType: DutyType,
    dates: Date[]
  ) => {
    try {
      const dutyTypeLabel = dutyType === 'skadeleder_vagt' 
        ? t('duty.skadelederVagt')
        : t('duty.kørevagt');

      // Format dates
      const dateFormat = currentLanguage === 'da' ? 'dd.MM.yyyy' : 'MM/dd/yyyy';
      const formattedDates = dates.map(date => format(date, dateFormat, { locale }));
      
      const datesText = formattedDates.length === 1 
        ? formattedDates[0]
        : formattedDates.length === 2
        ? `${formattedDates[0]} ${t('common.and')} ${formattedDates[1]}`
        : `${formattedDates.slice(0, -1).join(', ')} ${t('common.and')} ${formattedDates[formattedDates.length - 1]}`;

      const title = currentLanguage === 'da' 
        ? 'Ny vagt tildelt'
        : 'New duty assigned';

      const message = currentLanguage === 'da'
        ? `Du er blevet tildelt ${dutyTypeLabel} den ${datesText}`
        : `You have been assigned to ${dutyTypeLabel} on ${datesText}`;

      await addNotification({
        targetUserId: employeeId,
        type: 'duty',
        title,
        message,
        link: '/duty',
      });

      if (import.meta.env.DEV) console.log('Duty notification created for employee:', employeeId);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error creating duty notification:', error);
    }
  }, [addNotification, t, currentLanguage, locale]);

  return {
    createDutyAssignmentNotification,
  };
};
