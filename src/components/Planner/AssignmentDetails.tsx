
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Assignment } from '@/types/assignment';
import { MapPin, Clock, Car, FileText, Users } from 'lucide-react';
import { formatDateWithCapital } from '@/utils/dateUtils';
import { useTranslation } from '@/context/TranslationContext';

interface AssignmentDetailsProps {
  assignment: Assignment;
}

const AssignmentDetails: React.FC<AssignmentDetailsProps> = ({ assignment }) => {
  const { t, currentLanguage } = useTranslation();
  
  // Format time to show only hours and minutes (HH:MM)
  const formatTimeWithoutSeconds = (timeString: string) => {
    if (!timeString) return '';
    return timeString.split(':').slice(0, 2).join(':');
  };
  
  // Format the assignment times
  const formattedFromTime = formatTimeWithoutSeconds(assignment.fromTime);
  const formattedToTime = formatTimeWithoutSeconds(assignment.toTime);
  
  const formattedDate = formatDateWithCapital(assignment.date, currentLanguage);
  
  return (
    <Card>
      <CardContent className="p-4">
        <h2 className="text-xl font-semibold mb-4">{assignment.title}</h2>
        
        <div className="space-y-3">
          <div className="flex items-center text-sm">
            <Clock className="h-4 w-4 mr-2 text-gray-500" />
            <span className="text-gray-700">{formattedFromTime} - {formattedToTime}</span>
          </div>
          
          {assignment.location && (
            <div className="flex items-center text-sm">
              <MapPin className="h-4 w-4 mr-2 text-gray-500" />
              <span className="text-gray-700">{assignment.location}</span>
            </div>
          )}
          
          {assignment.car && (
            <div className="flex items-center text-sm">
              <Car className="h-4 w-4 mr-2 text-gray-500" />
              <span className="text-gray-700">
                {typeof assignment.car === 'string' ? assignment.car : assignment.car.name}
              </span>
            </div>
          )}
          
          {assignment.description && (
            <div className="pt-2">
              <div className="flex items-center text-sm mb-1">
                <FileText className="h-4 w-4 mr-2 text-gray-500" />
                <span className="font-medium text-gray-700">{t('planner.description')}</span>
              </div>
              <p className="text-sm text-gray-600 pl-6">{assignment.description}</p>
            </div>
          )}
          
          <div className="pt-2">
            <div className="flex items-start text-sm mb-1">
              <Users className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
              <span className="font-medium text-gray-700">{t('planner.employees')}</span>
            </div>
            <div className="pl-6">
              {assignment.employees && assignment.employees.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-1">
                  {assignment.employees.map((employee, index) => (
                    <Badge key={index} variant="outline" className="bg-blue-50">
                      {employee}
                    </Badge>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-gray-500">{t('planner.noEmployees')}</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AssignmentDetails;
