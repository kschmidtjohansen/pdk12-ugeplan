
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Employee } from '@/types/employee';
import { Assignment } from '@/types/assignment';
import { Vacation } from '@/types/vacation';
import { useTranslation } from '@/context/TranslationContext';
import { useEmployees } from '@/hooks/useEmployees';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addDays, subDays, format } from 'date-fns';
import { da } from 'date-fns/locale';
import { getEmployeeAvailabilityStatus } from '@/utils/employeeAvailability';

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
  employees: initialEmployees,
  assignments,
  vacations,
  selectedDate,
  title
}) => {
  const { t, currentLanguage } = useTranslation();
  const { employees: allEmployees } = useEmployees();

  // Local state for the viewed date
  const [viewedDate, setViewedDate] = useState<string>(selectedDate);

  // Update local state when selectedDate prop changes
  React.useEffect(() => {
    setViewedDate(selectedDate);
  }, [selectedDate]);

  // Convert viewedDate string to Date object
  const currentDate = new Date(viewedDate + 'T12:00:00');

  console.log(`[EmployeeAvailabilityDialog] === DIALOG DEBUG INFO ===`);
  console.log(`[EmployeeAvailabilityDialog] Dialog title: ${title}`);
  console.log(`[EmployeeAvailabilityDialog] Initial selected date: ${selectedDate}`);
  console.log(`[EmployeeAvailabilityDialog] Currently viewed date: ${viewedDate}`);
  console.log(`[EmployeeAvailabilityDialog] Date changed: ${viewedDate !== selectedDate}`);
  console.log(`[EmployeeAvailabilityDialog] Initial employees passed: ${initialEmployees.length}`);

  // HYBRID APPROACH: Use initial employees for original date, all service employees for navigated dates
  const getEmployeesToShow = () => {
    if (viewedDate === selectedDate) {
      // For the original date, use the pre-filtered employees from DashboardMetrics
      console.log(`[EmployeeAvailabilityDialog] Using pre-filtered employees (${initialEmployees.length}) for original date ${selectedDate}`);
      return initialEmployees;
    } else {
      // For navigated dates, get all service employees and filter them dynamically
      const serviceEmployees = allEmployees.filter(employee => employee.role === 'servicemedarbejder');
      console.log(`[EmployeeAvailabilityDialog] Using all service employees (${serviceEmployees.length}) for navigated date ${viewedDate}`);
      
      // Filter to show only available and partially available employees for navigated dates
      const availableEmployees = serviceEmployees.filter(employee => {
        const availabilityInfo = getEmployeeAvailabilityStatus(
          employee,
          currentDate,
          assignments,
          vacations,
          t
        );
        
        const isAvailable = availabilityInfo.status === 'available' || availabilityInfo.status === 'partiallyBooked';
        console.log(`[EmployeeAvailabilityDialog] Employee ${employee.name} for ${viewedDate}: status=${availabilityInfo.status}, available=${isAvailable}`);
        return isAvailable;
      });
      
      console.log(`[EmployeeAvailabilityDialog] Filtered available employees for ${viewedDate}: ${availableEmployees.length}`);
      return availableEmployees;
    }
  };

  const employeesToShow = getEmployeesToShow();

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

  // Get employee status with proper availability calculation
  const getEmployeeStatus = (employee: Employee) => {
    console.log(`[EmployeeAvailabilityDialog] === CHECKING EMPLOYEE: ${employee.name} for ${viewedDate} ===`);
    
    const availabilityInfo = getEmployeeAvailabilityStatus(
      employee,
      currentDate,
      assignments,
      vacations,
      t
    );
    
    console.log(`[EmployeeAvailabilityDialog] Employee ${employee.name} status: ${availabilityInfo.status}, text: "${availabilityInfo.statusText}"`);
    
    // Map the status to appropriate labels and colors for the dialog
    switch (availabilityInfo.status) {
      case 'available':
        return {
          status: 'available',
          label: 'Ledig',
          color: 'bg-green-100 text-green-800 border-green-200',
          hasEndTimeAtSixteen: false
        };
      case 'partiallyBooked':
        return {
          status: 'partiallyAvailable',
          label: availabilityInfo.statusText, // This already contains "Ledig efter kl. XX:XX"
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          hasEndTimeAtSixteen: false
        };
      case 'fullyBooked':
        return {
          status: 'fullyBooked',
          label: 'Ikke ledig',
          color: 'bg-red-100 text-red-800 border-red-200',
          hasEndTimeAtSixteen: availabilityInfo.availableAt === "16:00"
        };
      case 'onVacation':
        return {
          status: 'vacation',
          label: 'Holder fri',
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          hasEndTimeAtSixteen: false
        };
      case 'onLeave':
        return {
          status: 'leave',
          label: 'Fraværende',
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          hasEndTimeAtSixteen: false
        };
      default:
        return {
          status: 'unknown',
          label: 'Ukendt status',
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          hasEndTimeAtSixteen: false
        };
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between py-[19px]">
            <Button variant="ghost" size="sm" onClick={handlePreviousDay} className="h-8 w-8 p-0">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center">
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>
                {formatDisplayDate(currentDate)}
              </DialogDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={handleNextDay} className="h-8 w-8 p-0">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <ScrollArea className="max-h-96">
          <div className="space-y-2">
            {employeesToShow.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                Ingen medarbejdere fundet for denne dato
              </div>
            ) : (
              employeesToShow.map(employee => {
                const status = getEmployeeStatus(employee);
                return (
                  <div 
                    key={employee.id} 
                    className={`flex items-center justify-between p-2 rounded-lg border ${
                      status.hasEndTimeAtSixteen ? 'border-red-300 bg-red-50' : ''
                    }`}
                  >
                    <span className={`font-medium ${
                      status.hasEndTimeAtSixteen ? '!text-red-600 !font-bold' : ''
                    }`}>
                      {employee.name}
                    </span>
                    <Badge className={status.color}>
                      {status.label}
                    </Badge>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeAvailabilityDialog;
