
import React from 'react';
import { Card } from '@/components/ui/card';
import { Vacation } from '../../types/vacation';
import { useTranslation } from '../../context/TranslationContext';
import VacationCard from './VacationCard';

interface VacationListProps {
  vacations: Vacation[];
  canApproveVacation: boolean;
  onApprove: (vacation: Vacation) => void;
  onReject: (vacation: Vacation) => void;
}

const VacationList: React.FC<VacationListProps> = ({
  vacations,
  canApproveVacation,
  onApprove,
  onReject
}) => {
  const { t } = useTranslation();
  
  if (vacations.length === 0) {
    return (
      <Card className="text-center p-8">
        <p className="text-muted-foreground">{t("vacation.noRequests")}</p>
      </Card>
    );
  }
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {vacations.map((vacation) => (
        <VacationCard
          key={vacation.id}
          vacation={vacation}
          canApprove={canApproveVacation}
          onApprove={onApprove}
          onReject={onReject}
        />
      ))}
    </div>
  );
};

export default VacationList;
