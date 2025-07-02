
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  title, 
  description, 
  icon = <AlertCircle className="h-12 w-12 text-gray-400" />,
  action 
}) => {
  return (
    <div className="text-center py-8 space-y-4">
      <div className="flex justify-center">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        {description && (
          <p className="text-gray-500 mt-2">{description}</p>
        )}
      </div>
      {action && (
        <Button 
          onClick={action.onClick}
          className="bg-polygon-blue hover:bg-polygon-darkblue"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
