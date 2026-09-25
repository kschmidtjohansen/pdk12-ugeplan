
import React from 'react';
import { useDepartment } from '@/context/DepartmentContext';
import MineOpgaver from './MineOpgaver';
import MinDag from './MinDag';
import DutySummaryWidget from './DutySummaryWidget';
import ClearCacheButton from './ClearCacheButton';

const ServicemedarbejderDashboard: React.FC = () => {
  const { isDutyEnabled } = useDepartment();

  return (
    <div className="space-y-6">
      <MinDag />

      {isDutyEnabled && <DutySummaryWidget />}

      <MineOpgaver />

      <div className="flex justify-center pt-2">
        <ClearCacheButton />
      </div>
    </div>
  );
};

export default ServicemedarbejderDashboard;
