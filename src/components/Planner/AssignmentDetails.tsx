
import React from 'react';
import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Assignment } from '../../types/assignment';

interface AssignmentDetailsProps {
  assignment: Assignment;
}

const AssignmentDetails: React.FC<AssignmentDetailsProps> = ({
  assignment
}) => {
  // Format car display value
  const getCarDisplay = () => {
    if (!assignment.car) return 'No car assigned';
    if (typeof assignment.car === 'string') return assignment.car;
    return assignment.car.name;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-polygon-blue" />
        <span>{assignment.fromTime} - {assignment.toTime}</span>
      </div>
      <div className="flex items-center gap-2">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-4 w-4 text-polygon-blue">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>{assignment.location}</span>
      </div>
      <div className="flex items-center gap-2">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-4 w-4 text-polygon-blue">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
        </svg>
        <div className="flex flex-wrap gap-1">
          {assignment.employees.map((employee, index) => (
            <div key={index}>
              <Badge variant="outline" className="bg-gray-100">
                {employee}
              </Badge>
              {index < assignment.employees.length - 1 && ', '}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-4 w-4 text-polygon-blue">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
        </svg>
        <span>{getCarDisplay()}</span>
      </div>
    </div>
  );
};

export default AssignmentDetails;
