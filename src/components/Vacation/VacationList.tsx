
import React from 'react';
import VacationCard from './VacationCard';
import { Vacation } from '@/types/vacation';
import { usePermissions } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';

interface VacationListProps {
  vacations: Vacation[];
  onApprove: (vacation: Vacation) => void;
  onReject: (vacation: Vacation) => void;
  onEdit?: (vacation: Vacation) => void;
  onDelete?: (vacation: Vacation) => void;
  isLoading?: boolean;
}

const VacationList: React.FC<VacationListProps> = ({ 
  vacations, 
  onApprove, 
  onReject,
  onEdit,
  onDelete,
  isLoading = false 
}) => {
  const { isAdmin } = usePermissions();
  const { t } = useTranslation();
  
  const canApprove = isAdmin; // Only admins can approve/reject
  
  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin h-8 w-8 border-t-2 border-polygon-blue rounded-full"></div>
      </div>
    );
  }
  
  if (vacations.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p>{t("vacation.noRequests")}</p>
      </div>
    );
  }
  
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {vacations.map((vacation) => (
        <VacationCard
          key={vacation.id}
          vacation={vacation}
          canApprove={canApprove}
          onApprove={onApprove}
          onReject={onReject}
          onEdit={isAdmin ? onEdit : undefined} // Only pass onEdit if admin
          onDelete={isAdmin ? onDelete : undefined} // Only pass onDelete if admin
        />
      ))}
    </div>
  );
};

export default VacationList;
