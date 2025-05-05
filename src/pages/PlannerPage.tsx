import React, { useState, useEffect } from 'react';
import { usePermissions } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { Dialog } from "@/components/ui/dialog";
import { useToast } from '@/components/ui/use-toast';
import { Assignment, getCurrentWeek, groupByDate } from '../types/assignment';
import { Vacation, VacationStatus } from '../types/vacation';

// Import custom components
import PlannerHeader from '../components/Planner/PlannerHeader';
import EmptyState from '../components/Planner/EmptyState';
import AssignmentList from '../components/Planner/AssignmentList';
import AssignmentForm from '../components/Planner/AssignmentForm';

// Mock data
const initialAssignments = [
  {
    id: '1',
    title: 'Vandskade inspektion',
    description: 'Komplet inspektion af vandskade i kælderområdet.',
    date: '2025-05-06',
    fromTime: '09:00',
    toTime: '11:00',
    location: 'Aarhus Central',
    car: 'Van 1',
    employees: ['John Doe'],
  },
  {
    id: '2',
    title: 'Brandskade restaurering',
    description: 'Første vurdering af brandskade i lejlighed.',
    date: '2025-05-07',
    fromTime: '13:00',
    toTime: '16:00',
    location: 'København Syd',
    car: 'Truck 3',
    employees: ['Jane Smith'],
  },
  {
    id: '3',
    title: 'Skimmelsvamp vurdering',
    description: 'Inspicer og vurder skimmelsvamp skade på køkkenvægge.',
    date: '2025-05-09',
    fromTime: '10:00',
    toTime: '12:30',
    location: 'Odense Øst',
    car: 'Van 2',
    employees: ['Mike Johnson', 'Anna Williams'],
  },
];

const MOCK_EMPLOYEES = [
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
    status: 'approved' as VacationStatus,
    createdAt: new Date('2025-04-01'),
  },
  {
    id: '2',
    employeeId: '2',
    employeeName: 'Jane Smith',
    startDate: new Date('2025-05-06'),  // On vacation during the first assignment
    endDate: new Date('2025-05-13'),
    reason: 'Family vacation',
    status: 'approved' as VacationStatus,
    createdAt: new Date('2025-04-15'),
  },
];

const PlannerPage: React.FC = () => {
  const { canCreate, canEdit } = usePermissions();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState<Assignment | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    date: '',
    fromTime: '',
    toTime: '',
    location: '',
    car: '',
  });
  const [vacations, setVacations] = useState<Vacation[]>(MOCK_VACATIONS);
  
  const currentWeek = getCurrentWeek();
  const groupedAssignments = groupByDate(assignments);
  
  const handleCreateNew = () => {
    setCurrentAssignment(null);
    setFormData({
      id: '',
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0], // Default to today
      fromTime: '',
      toTime: '',
      location: '',
      car: '',
    });
    setSelectedEmployees([]);
    setDialogOpen(true);
  };

  const handleEdit = (assignment: Assignment) => {
    setCurrentAssignment(assignment);
    setSelectedEmployees(assignment.employees || []);
    setFormData({
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      date: assignment.date,
      fromTime: assignment.fromTime,
      toTime: assignment.toTime,
      location: assignment.location,
      car: assignment.car,
    });
    setDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEmployeeToggle = (employeeName: string) => {
    setSelectedEmployees((prev) => {
      if (prev.includes(employeeName)) {
        return prev.filter(name => name !== employeeName);
      } else {
        return [...prev, employeeName];
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentAssignment) {
      // Update existing
      setAssignments(
        assignments.map((a) =>
          a.id === currentAssignment.id 
            ? { ...formData, employees: selectedEmployees } as Assignment
            : a
        )
      );
      toast({
        title: t("planner.assignmentUpdated"),
        description: t("planner.assignmentUpdatedMsg", { title: formData.title }),
      });
    } else {
      // Create new
      const newAssignment = {
        ...formData,
        id: Date.now().toString(),
        employees: selectedEmployees,
      } as Assignment;
      setAssignments([...assignments, newAssignment]);
      toast({
        title: t("planner.assignmentCreated"),
        description: t("planner.assignmentCreatedMsg", { title: formData.title }),
      });
    }
    
    setDialogOpen(false);
  };

  const handleDelete = (assignmentId: string) => {
    setAssignments(assignments.filter(a => a.id !== assignmentId));
    toast({
      title: t("planner.assignmentDeleted"),
      description: t("planner.assignmentDeletedMsg"),
    });
  };

  return (
    <>
      <PlannerHeader 
        currentWeek={currentWeek}
        canCreate={canCreate}
        onCreateNew={handleCreateNew}
      />

      <div className="grid gap-6">
        {assignments.length === 0 ? (
          <EmptyState onCreateNew={handleCreateNew} canCreate={canCreate} />
        ) : (
          <AssignmentList 
            assignments={assignments}
            onEditAssignment={handleEdit}
            onDeleteAssignment={handleDelete}
            onCreateAssignment={handleCreateNew}
          />
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AssignmentForm 
          currentAssignment={currentAssignment}
          formData={formData}
          selectedEmployees={selectedEmployees}
          cars={MOCK_CARS}
          employees={MOCK_EMPLOYEES}
          vacations={vacations}
          handleInputChange={handleInputChange}
          handleSelectChange={handleSelectChange}
          handleEmployeeToggle={handleEmployeeToggle}
          handleSubmit={handleSubmit}
          onClose={() => setDialogOpen(false)}
        />
      </Dialog>
    </>
  );
};

export default PlannerPage;
