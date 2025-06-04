
import React from 'react';
import { Vacation } from '@/types/vacation';
import { useTranslation } from '@/context/TranslationContext';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface VacationManagementProps {
  vacations: Vacation[];
  onApprove: (vacation: Vacation) => Promise<void>;
  onDeny: (vacation: Vacation) => Promise<void>;
}

const VacationManagement: React.FC<VacationManagementProps> = ({
  vacations,
  onApprove,
  onDeny
}) => {
  const { t } = useTranslation();

  const pendingVacations = vacations.filter(v => v.status === 'pending');

  const formatVacationDate = (date: Date | string): string => {
    if (typeof date === 'string') {
      return format(new Date(date), 'dd.MM.yyyy');
    }
    return format(date, 'dd.MM.yyyy');
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t('admin.vacationManagement')}</h3>
      <div className="space-y-3">
        {pendingVacations.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t('admin.noPendingVacations')}
          </p>
        ) : (
          pendingVacations.map((vacation) => (
            <div key={vacation.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">{vacation.employeeName}</p>
                <p className="text-sm text-muted-foreground">
                  {formatVacationDate(vacation.startDate)} - {formatVacationDate(vacation.endDate)}
                </p>
                <p className="text-sm">{vacation.reason}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onApprove(vacation)}
                  className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded"
                >
                  {t('vacation.approve')}
                </button>
                <button
                  onClick={() => onDeny(vacation)}
                  className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded"
                >
                  {t('vacation.deny')}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VacationManagement;
