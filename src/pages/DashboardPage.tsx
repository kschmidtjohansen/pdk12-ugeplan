
import React, { useState } from 'react';
import { useTranslation } from '@/context/TranslationContext';
import DashboardMetrics from '@/components/Dashboard/DashboardMetrics';
import UpcomingVacationsWidget from '@/components/Dashboard/UpcomingVacationsWidget';
import VehicleStatusWidget from '@/components/Dashboard/VehicleStatusWidget';
import AssignmentDetailsDialog from '@/components/Dashboard/AssignmentDetailsDialog';
import { Assignment } from '@/types/assignment';
import { useVacations } from '@/hooks/useVacations';

const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { vacations } = useVacations();
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);

  const handleAssignmentClick = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setIsAssignmentDialogOpen(true);
  };

  const handleCloseAssignmentDialog = () => {
    setIsAssignmentDialogOpen(false);
    setSelectedAssignment(null);
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Page Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-8 text-white shadow-large animate-fade-in-up">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {t("dashboard.title")}
            </h1>
            <p className="text-blue-100 text-lg">
              {t("dashboard.subtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="space-y-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        {/* Metrics Cards */}
        <DashboardMetrics />
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            <VehicleStatusWidget />
          </div>
          
          {/* Right Column */}
          <div className="space-y-6">
            <UpcomingVacationsWidget vacations={vacations} />
          </div>
        </div>
      </div>

      {/* Assignment Details Dialog */}
      <AssignmentDetailsDialog
        assignment={selectedAssignment}
        isOpen={isAssignmentDialogOpen}
        onClose={handleCloseAssignmentDialog}
      />
    </div>
  );
};

export default DashboardPage;
