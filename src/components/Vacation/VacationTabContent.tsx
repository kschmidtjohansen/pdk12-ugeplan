
import React from 'react';
import { TabsContent } from "@/components/ui/tabs";
import { Vacation } from '../../types/vacation';
import VacationList from './VacationList';

interface VacationTabContentProps {
  activeTab: string;
  filteredVacations: Vacation[];
  canApproveVacation: boolean;
  onApprove: (vacation: Vacation) => void;
  onReject: (vacation: Vacation) => void;
}

const VacationTabContent: React.FC<VacationTabContentProps> = ({
  activeTab,
  filteredVacations,
  canApproveVacation,
  onApprove,
  onReject
}) => {
  return (
    <TabsContent value={activeTab} className="mt-6">
      <VacationList
        vacations={filteredVacations}
        canApproveVacation={canApproveVacation}
        onApprove={onApprove}
        onReject={onReject}
      />
    </TabsContent>
  );
};

export default VacationTabContent;
