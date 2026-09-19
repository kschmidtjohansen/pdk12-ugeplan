
import React from 'react';
import { useDepartment } from '@/context/DepartmentContext';
import MineOpgaver from './MineOpgaver';
import MinDag from './MinDag';
import DutySummaryWidget from './DutySummaryWidget';

const ServicemedarbejderDashboard: React.FC = () => {
  const { isDutyEnabled } = useDepartment();

  return (
    <div className="space-y-6">
      <MinDag />

      {isDutyEnabled && <DutySummaryWidget />}

      <MineOpgaver />
    </div>
  );
};

export default ServicemedarbejderDashboard;
