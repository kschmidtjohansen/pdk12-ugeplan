
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, MapPin, Users, Car } from 'lucide-react';
import { format } from 'date-fns';
import { getCarDisplayText } from '@/utils/carUtils';

const ScreenDisplayPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { t, currentLanguage } = useTranslation();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  const selectedDate = searchParams.get('date') || format(new Date(), 'yyyy-MM-dd');

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Mock data for testing - replace with actual data fetching
  useEffect(() => {
    // This would be replaced with actual API call to fetch assignments for the selected date
    setAssignments([]);
  }, [selectedDate]);

  // Filter assignments for the selected date
  const dayAssignments = assignments.filter(assignment => assignment.date === selectedDate);

  // Sort assignments by time
  const sortedAssignments = dayAssignments.sort((a, b) => {
    return a.fromTime.localeCompare(b.fromTime);
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Daily Assignment Overview
        </h1>
        <div className="flex justify-center items-center gap-4 text-lg text-gray-600">
          <span>
            {new Date(selectedDate).toLocaleDateString(
              currentLanguage === 'da' ? 'da-DK' : 'en-GB',
              { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
            )}
          </span>
          <span className="text-blue-600 font-semibold">
            {currentTime.toLocaleTimeString(
              currentLanguage === 'da' ? 'da-DK' : 'en-GB',
              { hour: '2-digit', minute: '2-digit' }
            )}
          </span>
        </div>
      </div>

      {/* Assignments Grid */}
      {sortedAssignments.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl text-gray-300 mb-4">📅</div>
          <h2 className="text-2xl font-semibold text-gray-600 mb-2">
            No Assignments Scheduled
          </h2>
          <p className="text-gray-500">
            There are no assignments scheduled for {selectedDate}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedAssignments.map((assignment) => (
            <Card key={assignment.id} className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  {assignment.location}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Title */}
                <div>
                  <h3 className="font-semibold text-gray-800">{assignment.title}</h3>
                  {assignment.description && (
                    <p className="text-sm text-gray-600 mt-1">{assignment.description}</p>
                  )}
                </div>

                {/* Time */}
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-green-600" />
                  <span>{assignment.fromTime.substring(0, 5)} - {assignment.toTime.substring(0, 5)}</span>
                </div>

                {/* Car */}
                {assignment.car && (
                  <div className="flex items-center gap-2 text-sm">
                    <Car className="h-4 w-4 text-orange-600" />
                    <span>{getCarDisplayText(assignment.car)}</span>
                  </div>
                )}

                {/* Employees */}
                {assignment.employees && assignment.employees.length > 0 && (
                  <div className="flex items-start gap-2 text-sm">
                    <Users className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div className="flex flex-wrap gap-1">
                      {assignment.employees.map((employee, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs"
                        >
                          {employee}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScreenDisplayPage;
