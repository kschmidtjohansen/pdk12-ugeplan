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

  const createDutySwapOfferNotification = useCallback(async (
    candidateIds: string[],
    dutyType: DutyType,
    dutyDate: string,
    requesterName: string,
  ) => {
    try {
      const dutyTypeLabel = dutyType === 'skadeleder_vagt'
        ? t('duty.skadelederVagt')
        : t('duty.kørevagt');
      const dateFormat = currentLanguage === 'da' ? 'dd.MM.yyyy' : 'MM/dd/yyyy';
      const formatted = format(new Date(dutyDate), dateFormat, { locale });
      const title = currentLanguage === 'da' ? 'Byttetilbud på vagt' : 'Duty swap offer';
      const message = currentLanguage === 'da'
        ? `${requesterName} tilbyder dig ${dutyTypeLabel} den ${formatted}. Først til mølle.`
        : `${requesterName} offers you ${dutyTypeLabel} on ${formatted}. First come, first served.`;
      await Promise.all(candidateIds.map(uid =>
        addNotification({
          targetUserId: uid,
          type: 'duty',
          title,
          message,
          link: '/duty',
        })
      ));
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error creating swap offer notification:', error);
    }
  }, [addNotification, t, currentLanguage, locale]);

  const createDutySwapTakenNotification = useCallback(async (
    otherCandidateIds: string[],
    dutyType: DutyType,
    dutyDate: string,
  ) => {
    try {
      const dutyTypeLabel = dutyType === 'skadeleder_vagt'
        ? t('duty.skadelederVagt')
        : t('duty.kørevagt');
      const dateFormat = currentLanguage === 'da' ? 'dd.MM.yyyy' : 'MM/dd/yyyy';
      const formatted = format(new Date(dutyDate), dateFormat, { locale });
      const title = currentLanguage === 'da' ? 'Vagten er taget' : 'Duty taken';
      const message = currentLanguage === 'da'
        ? `${dutyTypeLabel} den ${formatted} er allerede taget af en anden.`
        : `${dutyTypeLabel} on ${formatted} has already been taken.`;
      await Promise.all(otherCandidateIds.map(uid =>
        addNotification({
          targetUserId: uid,
          type: 'duty',
          title,
          message,
          link: '/duty',
        })
      ));
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error creating swap taken notification:', error);
    }
  }, [addNotification, t, currentLanguage, locale]);

  const createDutySwapDeclinedNotification = useCallback(async (
    requesterId: string,
    dutyType: DutyType,
    dutyDate: string,
    declinerName: string,
  ) => {
    try {
      const dutyTypeLabel = dutyType === 'skadeleder_vagt'
        ? t('duty.skadelederVagt')
        : t('duty.kørevagt');
      const dateFormat = currentLanguage === 'da' ? 'dd.MM.yyyy' : 'MM/dd/yyyy';
      const formatted = format(new Date(dutyDate), dateFormat, { locale });
      const title = currentLanguage === 'da' ? 'Byttetilbud afslået' : 'Swap offer declined';
      const message = currentLanguage === 'da'
        ? `${declinerName} har afslået ${dutyTypeLabel} den ${formatted}.`
        : `${declinerName} declined ${dutyTypeLabel} on ${formatted}.`;
      await addNotification({
        targetUserId: requesterId,
        type: 'duty',
        title,
        message,
        link: '/duty',
      });
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error creating swap declined notification:', error);
    }
  }, [addNotification, t, currentLanguage, locale]);

  return {
    createDutyAssignmentNotification,
    createDutySwapOfferNotification,
    createDutySwapTakenNotification,
    createDutySwapDeclinedNotification,
  };
};

