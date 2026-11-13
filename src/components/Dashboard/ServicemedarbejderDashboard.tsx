
import React from 'react';
import { useDepartment } from '@/context/DepartmentContext';
import MineOpgaver from './MineOpgaver';
import MinDag from './MinDag';
import TodayGuardsWidget from './TodayGuardsWidget';

const ServicemedarbejderDashboard: React.FC = () => {
  const { isDutyEnabled } = useDepartment();

  return (
    <div className="space-y-6">
      <MinDag />

      {isDutyEnabled && <TodayGuardsWidget />}

      <MineOpgaver />
    </div>
  );
};

export default ServicemedarbejderDashboard;
