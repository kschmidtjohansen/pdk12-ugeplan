
import React, { useState } from 'react';
import { Assignment } from '@/types/assignment';
import { Car } from '@/types/car';
import { Employee } from '@/types/employee';
import { Vacation } from '@/types/vacation';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/context/TranslationContext';
import AssignmentForm from './AssignmentForm';
import AssignmentHistoryTab from './AssignmentHistoryTab';
import SeriesActionDialog from './SeriesActionDialog';

interface AssignmentDialogManagerProps {
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
  currentAssignment: Assignment | null;
  formData: Partial<Assignment>;
  setFormData: (data: Partial<Assignment>) => void;
  onSubmit: (data: Partial<Assignment>) => void;
  onSubmitSeries?: (groupId: string, data: Partial<Assignment>) => void;
  onDetachFromGroup?: (id: string) => Promise<boolean>;
  onDelete: (assignmentId: string) => void;
  onPublish: (assignmentId: string) => void;
  assignments: Assignment[];
  cars: Car[];
  employees: Employee[];
  vacations: Vacation[];
  selectedDay: string;
  onPublishDay: (date: string) => void;
  onEmployeeToggle: (employeeId: string) => void;
}

const AssignmentDialogManager: React.FC<AssignmentDialogManagerProps> = ({
  isDialogOpen,
  setIsDialogOpen,
  currentAssignment,
  formData,
  setFormData,
  onSubmit,
  onSubmitSeries,
  onDetachFromGroup,
  onDelete,
  onPublish,
  assignments,
  cars,
  employees,
  vacations,
  selectedDay,
  onPublishDay,
  onEmployeeToggle
}) => {
  const { t } = useTranslation();
  const isEditing = !!currentAssignment;
  const hasSeries = !!(currentAssignment?.groupId);

  const [seriesDialogOpen, setSeriesDialogOpen] = useState(false);
  const [pendingSubmitData, setPendingSubmitData] = useState<Partial<Assignment> | null>(null);

  // Intercept submit when editing a series assignment
  const handleSubmit = (data: Partial<Assignment>) => {
    if (isEditing && hasSeries && onSubmitSeries && onDetachFromGroup) {
      setPendingSubmitData(data);
      setSeriesDialogOpen(true);
    } else {
      onSubmit(data);
    }
  };

  const handleSingleDay = async () => {
    setSeriesDialogOpen(false);
    if (pendingSubmitData && currentAssignment) {
      // Detach from group first, then update single
      if (onDetachFromGroup) {
        await onDetachFromGroup(currentAssignment.id);
      }
      onSubmit(pendingSubmitData);
    }
    setPendingSubmitData(null);
  };

  const handleEntireSeries = () => {
    setSeriesDialogOpen(false);
    if (pendingSubmitData && currentAssignment?.groupId && onSubmitSeries) {
      onSubmitSeries(currentAssignment.groupId, pendingSubmitData);
    }
    setPendingSubmitData(null);
  };

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {isEditing ? (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="details">{t('planner.history.detailsTab')}</TabsTrigger>
                <TabsTrigger value="history">{t('planner.history.tab')}</TabsTrigger>
              </TabsList>
              <TabsContent value="details">
                <AssignmentForm
                  currentAssignment={currentAssignment}
                  formData={formData}
                  setFormData={setFormData}
                  onSubmit={handleSubmit}
                  onDelete={onDelete}
                  onPublish={onPublish}
                  assignments={assignments}
                  cars={cars}
                  employees={employees}
                  vacations={vacations}
                  selectedDay={selectedDay}
                  onPublishDay={onPublishDay}
                  onEmployeeToggle={onEmployeeToggle}
                />
              </TabsContent>
              <TabsContent value="history">
                <AssignmentHistoryTab assignment={currentAssignment} />
              </TabsContent>
            </Tabs>
          ) : (
            <AssignmentForm
              currentAssignment={currentAssignment}
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
              onDelete={onDelete}
              onPublish={onPublish}
              assignments={assignments}
              cars={cars}
              employees={employees}
              vacations={vacations}
              selectedDay={selectedDay}
              onPublishDay={onPublishDay}
              onEmployeeToggle={onEmployeeToggle}
            />
          )}
        </DialogContent>
      </Dialog>

      <SeriesActionDialog
        open={seriesDialogOpen}
        onOpenChange={setSeriesDialogOpen}
        mode="edit"
        onSingleDay={handleSingleDay}
        onEntireSeries={handleEntireSeries}
      />
    </>
  );
};

export default AssignmentDialogManager;
