import React from 'react';
import QuickAccessGrid from './QuickAccessGrid';
import CompactKpiStack from './CompactKpiStack';
import MineOpgaver from './MineOpgaver';
import DutySummaryWidget from './DutySummaryWidget';
import UpcomingVacationsWidget from './UpcomingVacationsWidget';
import { useDepartment } from '@/context/DepartmentContext';
import { useVacations } from '@/hooks/useVacations';

interface DashboardCockpitProps {
  showMetrics: boolean;
  showMyTasks: boolean;
  userRole?: string;
}

const DashboardCockpit: React.FC<DashboardCockpitProps> = ({
  showMetrics,
  showMyTasks,
  userRole,
}) => {
  const { isDutyEnabled } = useDepartment();
  const { vacations } = useVacations();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* LEFT — main work surface (2/3) */}
      <div className="lg:col-span-2 space-y-4 min-w-0">
        {showMyTasks && <MineOpgaver />}
        <QuickAccessGrid userRole={userRole} />
      </div>

      {/* RIGHT — sticky cockpit panel (1/3) */}
      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        {showMetrics && <CompactKpiStack />}
        {isDutyEnabled && <DutySummaryWidget />}
        <UpcomingVacationsWidget vacations={vacations} />
      </aside>
    </div>
  );
};

export default DashboardCockpit;
