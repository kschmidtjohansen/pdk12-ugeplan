
import React, { useState, useEffect } from 'react';
import { usePermissions } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { Assignment, getCurrentWeek } from '../types/assignment';
import { Vacation } from '../types/vacation';
import { Employee } from '../types/employee';
import { usePlannerAssignments, getWeekDates } from '@/hooks/usePlannerAssignments';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

// Import custom components
import PlannerHeader from '../components/Planner/PlannerHeader';
import AssignmentList from '../components/Planner/AssignmentList';
import AssignmentDialogManager from '../components/Planner/AssignmentDialogManager';

// Mock data
const MOCK_EMPLOYEES: Employee[] = [
  { id: '1', name: 'John Doe', email: 'john.doe@polygon.com', phone: '+45 12 34 56 78', jobTitle: 'Senior Technician', role: 'skadeleder' },
  { id: '2', name: 'Jane Smith', email: 'jane.smith@polygon.com', phone: '+45 23 45 67 89', jobTitle: 'Technician', role: 'servicemedarbejder' },
  { id: '3', name: 'Mike Johnson', email: 'mike.johnson@polygon.com', phone: '+45 34 56 78 90', jobTitle: 'Project Manager', role: 'administrator' },
  { id: '4', name: 'Anna Williams', email: 'anna.williams@polygon.com', phone: '+45 45 67 89 01', jobTitle: 'Junior Technician', role: 'servicemedarbejder' },
];

const MOCK_CARS = [
  { id: '1', name: 'Van 1', hasTrailerHitch: true },
  { id: '2', name: 'Van 2', hasTrailerHitch: false },
  { id: '3', name: 'Truck 3', hasTrailerHitch: true },
  { id: '4', name: 'Sedan 1', hasTrailerHitch: false },
];

// Mock vacations for employee availability feature
const MOCK_VACATIONS: Vacation[] = [
  {
    id: '1',
    employeeId: '1',
    employeeName: 'John Doe',
    startDate: new Date('2025-05-10'),
    endDate: new Date('2025-05-15'),
    reason: 'Annual leave',
    status: 'approved',
    createdAt: new Date('2025-04-01'),
  },
  {
    id: '2',
    employeeId: '2',
    employeeName: 'Jane Smith',
    startDate: new Date('2025-05-06'),  // On vacation during the first assignment
    endDate: new Date('2025-05-13'),
    reason: 'Family vacation',
    status: 'approved',
    createdAt: new Date('2025-04-15'),
  },
];

const PlannerPage: React.FC = () => {
  const { canCreate, canPublishTasks } = usePermissions();
  const { t, currentLanguage } = useTranslation();
  const initialWeek = getCurrentWeek();
  const [selectedWeek, setSelectedWeek] = useState<number>(initialWeek);
  const { assignments, createAssignment, updateAssignment, deleteAssignment, publishAssignment, publishAssignments } = usePlannerAssignments(selectedWeek);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState<Assignment | null>(null);
  const [vacations] = useState<Vacation[]>(MOCK_VACATIONS);
  
  // Calculate week dates
  const weekDates = getWeekDates(selectedWeek);
  const dateFormat = 'd. MMM';
  const locale = currentLanguage === 'da' ? da : undefined;
  
  const weekDateRange = `${format(weekDates.start, dateFormat, { locale })} - ${format(weekDates.end, dateFormat, { locale })}`;
  
  // Current date in YYYY-MM-DD format for filtering today's tasks
  const today = format(new Date(), 'yyyy-MM-dd');
  
  // Get unpublished tasks for today
  const unpublishedTodayTasks = assignments.filter(
    assignment => assignment.date === today && assignment.published !== true
  );

  const handleCreateNew = () => {
    setCurrentAssignment(null);
    setDialogOpen(true);
  };

  const handleEdit = (assignment: Assignment) => {
    setCurrentAssignment(assignment);
    setDialogOpen(true);
  };

  const handleSubmit = (formData: Partial<Assignment>, selectedEmployees: string[]) => {
    if (currentAssignment) {
      // Update existing
      updateAssignment({
        ...currentAssignment,
        ...formData,
        employees: selectedEmployees
      } as Assignment);
    } else {
      // Create new
      const newAssignment = {
        ...formData,
        id: Date.now().toString(),
        employees: selectedEmployees,
        published: false
      } as Assignment;
      createAssignment(newAssignment);
    }
  };

  const handlePreviousWeek = () => {
    setSelectedWeek(prevWeek => prevWeek > 1 ? prevWeek - 1 : 52);
  };

  const handleNextWeek = () => {
    setSelectedWeek(prevWeek => prevWeek < 52 ? prevWeek + 1 : 1);
  };

  const handlePublishTodayTasks = () => {
    const taskIds = unpublishedTodayTasks.map(task => task.id);
    if (taskIds.length > 0) {
      publishAssignments(taskIds);
    }
  };

  return (
    <div className="w-full max-w-full h-full flex flex-col">
      <PlannerHeader 
        currentWeek={selectedWeek}
        weekDateRange={weekDateRange}
        canCreate={canCreate}
        onCreateNew={handleCreateNew}
        onPreviousWeek={handlePreviousWeek}
        onNextWeek={handleNextWeek}
        onPublishTodayTasks={canPublishTasks ? handlePublishTodayTasks : undefined}
        hasTasksToPublishToday={unpublishedTodayTasks.length > 0}
      />

      <div className="w-full flex-grow mt-6">
        <AssignmentList 
          assignments={assignments}
          onEditAssignment={handleEdit}
          onDeleteAssignment={deleteAssignment}
          onPublishAssignment={canPublishTasks ? publishAssignment : undefined}
          onCreateAssignment={handleCreateNew}
          selectedWeek={selectedWeek}
        />
      </div>

      <AssignmentDialogManager
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        currentAssignment={currentAssignment}
        cars={MOCK_CARS}
        employees={MOCK_EMPLOYEES}
        vacations={vacations}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default PlannerPage;
