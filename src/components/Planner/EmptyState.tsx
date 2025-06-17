
import React from 'react';
import { CalendarX2 } from 'lucide-react';

interface EmptyStateProps {
  message: string;
  onCreateNew?: (date: string) => void;
  canCreate?: boolean;
  selectedWeek?: number;
  selectedYear?: number; // Add the missing prop
  onCreateAssignment?: (date: string) => void; // Add this prop for consistency
  canEdit?: boolean; // Add this prop for consistency
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  message,
  onCreateNew,
  canCreate,
  selectedWeek,
  selectedYear,
  onCreateAssignment,
  canEdit
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="rounded-full bg-gray-100 p-6 mb-4">
        <CalendarX2 className="w-12 h-12 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{message}</h3>
    </div>
  );
};

export default EmptyState;
