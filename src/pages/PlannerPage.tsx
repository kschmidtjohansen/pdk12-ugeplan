
import React, { useState } from 'react';
import { usePermissions } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { Assignment, getCurrentWeek } from '../types/assignment';
import { Vacation } from '../types/vacation';
import { Employee } from '../types/employee';
import { usePlannerAssignments } from '@/hooks/usePlannerAssignments';

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
  { id: '1', name: 'Van 1' },
  { id: '2', name: 'Van 2' },
  { id: '3', name: 'Truck 3' },
  { id: '4', name: 'Sedan 1' },
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
  const { canCreate } = usePermissions();
  const { t } = useTranslation();
  const { assignments, createAssignment, updateAssignment, deleteAssignment } = usePlannerAssignments();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState<Assignment | null>(null);
  const [vacations] = useState<Vacation[]>(MOCK_VACATIONS);
  
  const currentWeek = getCurrentWeek();
  
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
      } as Assignment;
      createAssignment(newAssignment);
    }
  };

  return (
    <div className="w-full max-w-full h-full flex flex-col">
      <PlannerHeader 
        currentWeek={currentWeek}
        canCreate={canCreate}
        onCreateNew={handleCreateNew}
      />

      <div className="w-full flex-grow mt-6">
        <AssignmentList 
          assignments={assignments}
          onEditAssignment={handleEdit}
          onDeleteAssignment={deleteAssignment}
          onCreateAssignment={handleCreateNew}
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
