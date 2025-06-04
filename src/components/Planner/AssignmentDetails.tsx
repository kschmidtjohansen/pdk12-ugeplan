
import React from 'react';
import { Car, Clock, Tag, Users, UserCheck } from 'lucide-react';
import { Assignment } from '@/types/assignment';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';

interface AssignmentDetailsProps {
  assignment: Assignment;
}

// Helper function to format time to HH:MM format (remove seconds)
const formatTime = (time: string): string => {
  if (!time) return '';
  // If time already has the format HH:MM, return as is
  if (time.length === 5) return time;
  // Otherwise, assume HH:MM:SS format and remove seconds
  return time.substring(0, 5);
};

const AssignmentDetails: React.FC<AssignmentDetailsProps> = ({ assignment }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  // Create a formatted time range string without seconds
  const timeRange = `${formatTime(assignment.fromTime)} - ${formatTime(assignment.toTime)}`;
  
  // Enhanced employee display logic with role-specific debugging
  const displayEmployees = () => {
    console.log(`[AssignmentDetails] Processing employees for assignment ${assignment.id} (${assignment.location}):`);
    console.log(`  - User role: ${user?.role}`);
    console.log(`  - User name: ${user?.name}`);
    console.log(`  - Assignment object:`, assignment);
    console.log(`  - Employees property:`, assignment.employees);
    console.log(`  - Employees type:`, typeof assignment.employees);
    console.log(`  - Is array:`, Array.isArray(assignment.employees));
    
    // Special debugging for Fyn assignment and servicemedarbejder users
    if (assignment.location === 'Fyn' && user?.role === 'servicemedarbejder') {
      console.log(`[AssignmentDetails] 🔍 FYN ASSIGNMENT SERVICEMEDARBEJDER DEBUGGING:`, {
        assignmentId: assignment.id,
        location: assignment.location,
        userRole: user.role,
        userName: user.name,
        employees: assignment.employees,
        employeesType: typeof assignment.employees,
        isArray: Array.isArray(assignment.employees),
        length: assignment.employees?.length || 0,
        published: assignment.published,
        shouldShowAllEmployees: true
      });
    }
    
    // Ensure we have the assignment object
    if (!assignment) {
      console.log(`  - No assignment object, returning unassigned`);
      return t('planner.unassigned');
    }
    
    // Check if employees property exists and is an array
    if (!assignment.employees || !Array.isArray(assignment.employees)) {
      console.log(`  - No valid employees array, returning unassigned`);
      
      // Special debugging for Fyn assignment
      if (assignment.location === 'Fyn' && user?.role === 'servicemedarbejder') {
        console.log(`[AssignmentDetails] 🔍 FYN - Servicemedarbejder seeing no valid employees array:`, {
          employees: assignment.employees,
          isArray: Array.isArray(assignment.employees),
          willReturn: 'Ikke tildelt',
          thisIsTheProblem: 'YES - employees array is not properly populated for servicemedarbejder'
        });
      }
      
      return t('planner.unassigned');
    }
    
    // Filter out any invalid entries and get valid employee names
    const validEmployees = assignment.employees.filter(emp => {
      const isValidString = emp && typeof emp === 'string' && emp.trim() !== '';
      console.log(`    - Employee "${emp}" is valid: ${isValidString}`);
      
      // Special debugging for Fyn assignment and servicemedarbejder
      if (assignment.location === 'Fyn' && user?.role === 'servicemedarbejder') {
        console.log(`[AssignmentDetails] 🔍 FYN - Servicemedarbejder checking employee "${emp}":`, {
          employee: emp,
          type: typeof emp,
          isEmpty: !emp,
          trimmed: emp?.trim?.(),
          isValid: isValidString
        });
      }
      
      return isValidString;
    });
    
    console.log(`  - Valid employees after filtering:`, validEmployees);
    
    // Special debugging for Fyn assignment and servicemedarbejder
    if (assignment.location === 'Fyn' && user?.role === 'servicemedarbejder') {
      console.log(`[AssignmentDetails] 🔍 FYN - Servicemedarbejder valid employees after filtering:`, {
        originalEmployees: assignment.employees,
        validEmployees: validEmployees,
        validCount: validEmployees.length,
        willShowUnassigned: validEmployees.length === 0,
        expectedEmployee: 'Henrik Jørgensen',
        foundExpectedEmployee: validEmployees.includes('Henrik Jørgensen')
      });
    }
    
    if (validEmployees.length === 0) {
      console.log(`  - No valid employees found, returning unassigned`);
      
      // Special debugging for servicemedarbejder on Fyn assignment
      if (assignment.location === 'Fyn' && user?.role === 'servicemedarbejder') {
        console.log(`[AssignmentDetails] 🔍 FYN - Servicemedarbejder will see "Ikke tildelt" - THIS IS THE BUG!`);
      }
      
      return t('planner.unassigned');
    }
    
    // Join employee names with comma and space
    const employeeDisplay = validEmployees.join(', ');
    console.log(`  - Final employee display: "${employeeDisplay}"`);
    
    // Special debugging for Fyn assignment and servicemedarbejder
    if (assignment.location === 'Fyn' && user?.role === 'servicemedarbejder') {
      console.log(`[AssignmentDetails] 🔍 FYN - Servicemedarbejder FINAL DISPLAY:`, {
        employeeDisplay: employeeDisplay,
        willShow: employeeDisplay,
        success: employeeDisplay !== t('planner.unassigned')
      });
    }
    
    return employeeDisplay;
  };
  
  const employeeDisplay = displayEmployees();
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-sm text-left">
      {assignment.title && (
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 flex-shrink-0 text-gray-500" />
          <span className="truncate">{assignment.title}</span>
        </div>
      )}
      
      <div className="flex items-center gap-2 text-left">
        <Clock className="w-4 h-4 flex-shrink-0 text-gray-500" />
        <span className="text-left">{timeRange}</span>
      </div>
      
      {assignment.car && (
        <div className="flex items-center gap-2 text-left">
          <Car className="w-4 h-4 flex-shrink-0 text-gray-500" />
          <span className="truncate text-left">
            {typeof assignment.car === 'string' ? assignment.car : assignment.car.name}
          </span>
        </div>
      )}
      
      <div className="flex items-start gap-2 text-left">
        <Users className="w-4 h-4 flex-shrink-0 text-gray-500 mt-0.5" />
        <span className="text-left">
          {employeeDisplay}
        </span>
      </div>

      {assignment.responsibleUser && (
        <div className="flex items-center gap-2 text-left">
          <UserCheck className="w-4 h-4 flex-shrink-0 text-purple-600" />
          <span className="truncate text-left">
            {assignment.responsibleUser.name}
          </span>
        </div>
      )}
    </div>
  );
};

export default AssignmentDetails;
