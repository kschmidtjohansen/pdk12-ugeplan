import React, { useState } from 'react';
import { Printer, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useDepartment } from '@/context/DepartmentContext';
import { useEmployees } from '@/hooks/useEmployees';
import { useTranslation } from '@/context/TranslationContext';
import { formatDateWithCapital } from '@/utils/dateUtils';
import { generateDayReportPdf } from '@/utils/dayReportPdf';
import { Assignment } from '@/types/assignment';
import { Car } from '@/types/car';

interface PrintDayReportButtonProps {
  dateKey: string;
  assignments: Assignment[];
  cars: Car[];
  className?: string;
}

/** Downloads an A4 "dagsseddel" (day sheet) for the given day, grouped by car/team. */
const PrintDayReportButton: React.FC<PrintDayReportButtonProps> = ({
  dateKey,
  assignments,
  cars,
  className,
}) => {
  const { currentLanguage } = useTranslation();
  const { selectedDepartment } = useDepartment();
  const { employees } = useEmployees();
  const [generating, setGenerating] = useState(false);
  const isDa = currentLanguage === 'da';

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (generating) return;
    setGenerating(true);
    try {
      const employeeNames = new Map(employees.map(emp => [emp.id, emp.name]));
      await generateDayReportPdf({
        dateKey,
        dateLabel: formatDateWithCapital(dateKey, currentLanguage),
        departmentLabel: selectedDepartment?.name || '',
        assignments,
        cars,
        employeeNames,
      });
      toast.success(isDa ? 'Dagsseddel hentet' : 'Day sheet downloaded');
    } catch (error) {
      const message = (error as { message?: string })?.message;
      toast.error(isDa ? 'Kunne ikke lave dagsseddel' : 'Could not create day sheet', {
        description: message,
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={generating}
      className={className}
      aria-label={isDa ? 'Print dagsseddel' : 'Print day sheet'}
    >
      {generating ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Printer className="mr-2 h-4 w-4" />
      )}
      {isDa ? 'Dagsseddel' : 'Day sheet'}
    </Button>
  );
};

export default React.memo(PrintDayReportButton);
