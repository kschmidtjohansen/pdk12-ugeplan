
import React from 'react';
import { Clock, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Assignment } from '../../types/assignment';

interface AssignmentCardProps {
  assignment: Assignment;
  canEdit: boolean;
  onEdit: (assignment: Assignment) => void;
  onDelete: () => void;
}

const AssignmentCard: React.FC<AssignmentCardProps> = ({
  assignment,
  canEdit,
  onEdit,
  onDelete
}) => {
  return (
    <div className="w-full border rounded-md p-4 bg-white hover:border-polygon-purple transition-colors">
      <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
        <h3 className="font-medium text-lg">{assignment.title}</h3>
        {canEdit && (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => onEdit(assignment)} className="h-8">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete} className="h-8">
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        )}
      </div>
      <p className="text-gray-600 mb-3">{assignment.description}</p>
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
          <span>{assignment.car}</span>
        </div>
      </div>
    </div>
  );
};

export default AssignmentCard;
