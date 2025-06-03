
import React from 'react';
import { Car, Clock, Tag, Users } from 'lucide-react';
import { Assignment } from '@/types/assignment';
import { useTranslation } from '@/context/TranslationContext';

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
  
  // Create a formatted time range string without seconds
  const timeRange = `${formatTime(assignment.fromTime)} - ${formatTime(assignment.toTime)}`;
  
  // Enhanced employee display with detailed debugging
  const displayEmployees = () => {
    console.log(`[AssignmentDetails] Processing employees for assignment ${assignment.id} (${assignment.location}):`);
    console.log(`  - Assignment object:`, assignment);
    console.log(`  - Assignment.employees:`, assignment.employees);
    console.log(`  - Type of employees:`, typeof assignment.employees);
    console.log(`  - Is array:`, Array.isArray(assignment.employees));
    console.log(`  - Length:`, assignment.employees?.length || 0);
    console.log(`  - Published:`, assignment.published);
    
    // Check if employees array exists and has valid entries
    if (assignment.employees && Array.isArray(assignment.employees) && assignment.employees.length > 0) {
      // Filter out any empty or invalid entries
      const validEmployees = assignment.employees.filter(emp => emp && typeof emp === 'string' && emp.trim() !== '');
      
      console.log(`  - Valid employees after filtering:`, validEmployees);
      console.log(`  - Valid employee count:`, validEmployees.length);
      
      if (validEmployees.length > 0) {
        const employeeDisplay = validEmployees.join(', ');
        console.log(`  - Final employee display: "${employeeDisplay}"`);
        return employeeDisplay;
      }
    }
    
    console.log(`  - No valid employees found, showing unassigned`);
    return t('planner.unassigned');
  };
  
  const employeeDisplay = displayEmployees();
  console.log(`[AssignmentDetails] FINAL employee display for ${assignment.location}: "${employeeDisplay}"`);
  
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
    </div>
  );
};

export default AssignmentDetails;
