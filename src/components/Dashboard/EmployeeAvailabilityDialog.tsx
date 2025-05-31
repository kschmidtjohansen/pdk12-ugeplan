
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Employee } from '@/types/employee';
import { Assignment } from '@/types/assignment';
import { Vacation } from '@/types/vacation';
import { useTranslation } from '@/context/TranslationContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addDays, subDays, format } from 'date-fns';
import { da } from 'date-fns/locale';

interface EmployeeAvailabilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  assignments: Assignment[];
  vacations: Vacation[];
  selectedDate: string;
  title: string;
}

export const EmployeeAvailabilityDialog: React.FC<EmployeeAvailabilityDialogProps> = ({
  open,
  onOpenChange,
  employees,
  assignments,
  vacations,
  selectedDate,
  title
}) => {
  const { t, currentLanguage } = useTranslation();
  
  // Local state for the viewed date
  const [viewedDate, setViewedDate] = useState<string>(selectedDate);

  // Update local state when selectedDate prop changes
  React.useEffect(() => {
    setViewedDate(selectedDate);
  }, [selectedDate]);

  // Convert viewedDate string to Date object
  const currentDate = new Date(viewedDate);

  // Navigation functions
  const handlePreviousDay = () => {
    const previousDay = subDays(currentDate, 1);
    const previousDateStr = format(previousDay, 'yyyy-MM-dd');
    setViewedDate(previousDateStr);
    console.log('[EmployeeAvailabilityDialog] Previous day:', previousDateStr);
  };

  const handleNextDay = () => {
    const nextDay = addDays(currentDate, 1);
    const nextDateStr = format(nextDay, 'yyyy-MM-dd');
    setViewedDate(nextDateStr);
    console.log('[EmployeeAvailabilityDialog] Next day:', nextDateStr);
  };

  // Format date for display
  const formatDisplayDate = (date: Date) => {
    try {
      const locale = currentLanguage === 'da' ? da : undefined;
      const dateStr = format(date, 'PPP', { locale });
      
      if (currentLanguage === 'da') {
        return dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
      }
      return dateStr;
    } catch (e) {
      console.error("Error formatting date:", e);
      return format(date, 'PPP');
    }
  };

  // Helper function to check if an employee is on vacation
  const isEmployeeOnVacation = (employeeId: string, date: string) => {
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    return vacations.some(vacation => {
      if (vacation.employeeId !== employeeId || vacation.status !== 'approved') {
        return false;
      }
      
      const startDate = new Date(vacation.startDate);
      const endDate = new Date(vacation.endDate);
      
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      
      return checkDate >= startDate && checkDate <= endDate;
    });
  };

  // ENHANCED: Improved time normalization function
  const normalizeTime = (time: string): string => {
    if (!time) return '';
    
    // Remove seconds if present (HH:MM:SS -> HH:MM)
    if (time.length === 8 && time.includes(':')) {
      time = time.substring(0, 5);
    }
    
    // Ensure we have HH:MM format
    if (time.length === 5 && time.includes(':')) {
      return time;
    }
    
    // Handle edge cases
    return time.trim();
  };

  // ENHANCED: Much improved function to get employee assignment status with proper 16:00 detection
  const getEmployeeStatus = (employee: Employee) => {
    const isOnVacation = isEmployeeOnVacation(employee.id, viewedDate);
    const isOnLeave = employee.onLeave;
    
    if (isOnVacation) return { status: 'vacation', label: t('dashboard.onVacation'), color: 'bg-orange-100 text-orange-800', hasEndTimeAtSixteen: false };
    if (isOnLeave) return { status: 'leave', label: t('dashboard.onLeave'), color: 'bg-red-100 text-red-800', hasEndTimeAtSixteen: false };

    const employeeAssignments = assignments.filter(assignment => {
      const assignmentDate = new Date(assignment.date);
      const selectedDateObj = new Date(viewedDate);
      assignmentDate.setHours(0, 0, 0, 0);
      selectedDateObj.setHours(0, 0, 0, 0);
      
      return assignmentDate.getTime() === selectedDateObj.getTime() &&
             assignment.employees &&
             assignment.employees.includes(employee.name);
    });

    if (employeeAssignments.length === 0) {
      return { status: 'available', label: t('dashboard.available'), color: 'bg-green-100 text-green-800', hasEndTimeAtSixteen: false };
    }

    // ENHANCED: Much better 16:00 detection - this should take priority over all other status checks
    const hasEndTimeAtSixteen = employeeAssignments.some(assignment => {
      const originalTime = assignment.toTime;
      const normalizedEndTime = normalizeTime(originalTime);
      const exactMatch = normalizedEndTime === "16:00";
      
      console.log(`[EmployeeAvailabilityDialog] Assignment ${assignment.id} for ${employee.name}:`);
      console.log(`  - Original time: "${originalTime}"`);
      console.log(`  - Normalized time: "${normalizedEndTime}"`);
      console.log(`  - Exact 16:00 match: ${exactMatch}`);
      
      return exactMatch;
    });
    
    console.log(`[EmployeeAvailabilityDialog] Employee ${employee.name} has 16:00 end time: ${hasEndTimeAtSixteen}`);
    
    // FIXED: 16:00 end time should take priority and show red styling
    if (hasEndTimeAtSixteen) {
      return { 
        status: 'fullyBooked', 
        label: t('dashboard.fullyBooked'), 
        color: '!bg-red-600 !text-white !border-red-700', 
        hasEndTimeAtSixteen: true 
      };
    }

    // Get the latest end time to show when they'll be available
    let latestEndTime = "00:00";
    employeeAssignments.forEach(assignment => {
      const normalizedTime = normalizeTime(assignment.toTime);
      if (normalizedTime > latestEndTime) {
        latestEndTime = normalizedTime;
      }
    });

    // Check if fully booked
    const dayOfWeek = new Date(viewedDate).getDay();
    const workdayEnd = dayOfWeek === 5 ? "15:30" : "16:00";
    
    let totalCoverage = false;
    const sortedAssignments = [...employeeAssignments].sort((a, b) => a.fromTime.localeCompare(b.fromTime));
    
    // Simple check for full day coverage
    if (sortedAssignments.length > 0) {
      const firstStart = normalizeTime(sortedAssignments[0].fromTime);
      const lastEnd = normalizeTime(sortedAssignments[sortedAssignments.length - 1].toTime);
      
      if (firstStart <= "08:00" && lastEnd >= workdayEnd) {
        totalCoverage = true;
      }
    }

    if (totalCoverage) {
      return { status: 'fullyBooked', label: t('dashboard.fullyBooked'), color: 'bg-red-100 text-red-800', hasEndTimeAtSixteen: false };
    }

    // Show available after time instead of generic "partially available"
    const formattedTime = latestEndTime.substring(0, 5); // Remove seconds if present
    return { 
      status: 'partiallyAvailable', 
      label: t('dashboard.availableAfter', { time: formattedTime }), 
      color: 'bg-yellow-100 text-yellow-800',
      hasEndTimeAtSixteen: false
    };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePreviousDay}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center">
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>
                {formatDisplayDate(currentDate)}
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNextDay}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <ScrollArea className="max-h-96">
          <div className="space-y-2">
            {employees.map((employee) => {
              const status = getEmployeeStatus(employee);
              
              return (
                <div
                  key={employee.id}
                  className={`flex items-center justify-between p-2 rounded-lg border ${
                    status.hasEndTimeAtSixteen ? 'border-red-300 bg-red-50' : ''
                  }`}
                >
                  <span className={`font-medium ${status.hasEndTimeAtSixteen ? '!text-red-600 !font-bold' : ''}`}>
                    {employee.name}
                  </span>
                  <Badge className={status.color}>
                    {status.label}
                  </Badge>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeAvailabilityDialog;
