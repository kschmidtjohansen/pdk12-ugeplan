import React, { useState, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { Assignment, normalizeEmployees } from '@/types/assignment';
import { Car } from '@/types/car';
import { Employee } from '@/types/employee';
import { Vacation } from '@/types/vacation';
import { useTranslation } from '@/context/TranslationContext';
import { usePermissions } from '@/context/AuthContext';
import { useDepartment } from '@/context/DepartmentContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Send, Edit3, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import AssignmentFormFields from './AssignmentFormFields';
import { getEmployeeVacationStatus } from '@/utils/employeeAvailability';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

export interface EmployeeConflict {
  employeeId: string;
  employeeName: string;
  date: string;
  reason: 'booking' | 'vacation' | 'partialVacation' | 'onLeave' | 'training';
  details: string;
}

interface AssignmentFormProps {
  currentAssignment: Assignment | null;
  formData: Partial<Assignment>;
  setFormData: (data: Partial<Assignment>) => void;
  onSubmit: (data: Partial<Assignment>) => void;
  onDelete: (assignmentId: string) => void;
  onPublish: (assignmentId: string) => void;
  assignments: Assignment[];
  cars: Car[];
  employees: Employee[];
  vacations: Vacation[];
  selectedDay: string;
  onPublishDay: (date: string) => void;
  onEmployeeToggle: (employeeId: string) => void;
}

const AssignmentForm: React.FC<AssignmentFormProps> = ({
  currentAssignment,
  formData,
  setFormData,
  onSubmit,
  onDelete,
  onPublish,
  assignments,
  cars,
  employees,
  vacations,
  selectedDay,
  onPublishDay,
  onEmployeeToggle
}) => {
  const { t } = useTranslation();
  const { canEdit, canPublishTasks } = usePermissions();
  const { userSubDepartments } = useDepartment();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [zipCode, setZipCode] = useState(formData.zip_code || '');
  const [city, setCity] = useState(formData.city || '');
  const [assignmentLat, setAssignmentLat] = useState<number | undefined>(formData.lat ?? undefined);
  const [assignmentLng, setAssignmentLng] = useState<number | undefined>(formData.lng ?? undefined);
  const [conflictDetails, setConflictDetails] = useState<EmployeeConflict[]>([]);

  const { handleSubmit, formState: { errors } } = useForm<Partial<Assignment>>({
    defaultValues: formData
  });

  // Fetch trainings for currently selected employees within the date range
  const selectedEmployeeIds = useMemo(() => normalizeEmployees(formData.employees), [formData.employees]);
  const selectedDatesForQuery: string[] = useMemo(() => {
    const arr = (formData as any).dates?.length > 0 ? (formData as any).dates : (formData.date ? [formData.date] : []);
    return arr;
  }, [formData]);
  const dateRangeKey = useMemo(() => {
    if (selectedDatesForQuery.length === 0) return { start: '', end: '' };
    const sorted = [...selectedDatesForQuery].sort();
    return { start: sorted[0], end: sorted[sorted.length - 1] };
  }, [selectedDatesForQuery]);

  const { data: trainingRows = [] } = useQuery({
    queryKey: ['assignment-form-trainings', selectedEmployeeIds, dateRangeKey.start, dateRangeKey.end],
    enabled: selectedEmployeeIds.length > 0 && !!dateRangeKey.start,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trainings')
        .select('user_id, start_date, end_date, title')
        .in('user_id', selectedEmployeeIds)
        .lte('start_date', dateRangeKey.end)
        .gte('end_date', dateRangeKey.start);
      if (error) throw error;
      return (data || []) as Array<{ user_id: string; start_date: string; end_date: string; title: string | null }>;
    },
    staleTime: 60_000,
  });

  // Helper: check if two time ranges overlap
  const timeRangesOverlap = (startA: string, endA: string, startB: string, endB: string): boolean => {
    return startA < endB && startB < endA;
  };

  // Check all selected employees for conflicts across all selected dates
  const checkEmployeeConflicts = useCallback((): EmployeeConflict[] => {
    const conflicts: EmployeeConflict[] = [];
    const selectedEmployeeIds = normalizeEmployees(formData.employees);
    const dates: string[] = (formData as any).dates?.length > 0 ? (formData as any).dates : (formData.date ? [formData.date] : []);
    const fromTime = formData.fromTime || '08:00';
    const toTime = formData.toTime || '16:00';

    for (const empId of selectedEmployeeIds) {
      const emp = employees.find(e => e.id === empId);
      if (!emp) continue;

      for (const dateStr of dates) {
        const [y, m, d] = dateStr.split('-').map(Number);
        const dateObj = new Date(y, m - 1, d);

        // 1. Check onLeave
        if (emp.onLeave || emp.status === 'on_leave') {
          conflicts.push({
            employeeId: empId,
            employeeName: emp.name,
            date: dateStr,
            reason: 'onLeave',
            details: t('planner.conflicts.onLeaveDetails')
          });
          continue; // no need to check further for this emp+date
        }

        // 1b. Check training for this employee on this date
        const activeTraining = trainingRows.find(
          (tr) => tr.user_id === empId && tr.start_date <= dateStr && tr.end_date >= dateStr
        );
        if (activeTraining) {
          conflicts.push({
            employeeId: empId,
            employeeName: emp.name,
            date: dateStr,
            reason: 'training',
            details: activeTraining.title
              ? `${t('planner.conflicts.trainingDetails')} · ${activeTraining.title}`
              : t('planner.conflicts.trainingDetails'),
          });
          continue;
        }

        // 2. Check vacations
        const vacStatus = getEmployeeVacationStatus(empId, dateObj, vacations);
        if (vacStatus.isOnVacation) {
          if (vacStatus.vacationType === 'full_day') {
            conflicts.push({
              employeeId: empId,
              employeeName: emp.name,
              date: dateStr,
              reason: 'vacation',
              details: t('planner.conflicts.fullDayVacation')
            });
            continue;
          }
          if (vacStatus.vacationType === 'partial_day' && vacStatus.startTime && vacStatus.endTime) {
            if (timeRangesOverlap(fromTime, toTime, vacStatus.startTime, vacStatus.endTime)) {
              conflicts.push({
                employeeId: empId,
                employeeName: emp.name,
                date: dateStr,
                reason: 'partialVacation',
                details: t('planner.conflicts.partialVacationDetails', { from: vacStatus.startTime, to: vacStatus.endTime })
              });
            }
          }
        }

        // 3. Check existing assignment overlaps
        const overlapping = assignments.filter(a => {
          if (currentAssignment && a.id === currentAssignment.id) return false;
          const aDate = a.date.includes('T') ? a.date.split('T')[0] : a.date;
          if (aDate !== dateStr) return false;
          const aEmployees = normalizeEmployees(a.employees);
          if (!aEmployees.includes(empId)) return false;
          return timeRangesOverlap(fromTime, toTime, a.fromTime, a.toTime);
        });

        for (const overlap of overlapping) {
          conflicts.push({
            employeeId: empId,
            employeeName: emp.name,
            date: dateStr,
            reason: 'booking',
            details: t('planner.conflicts.bookingDetails', {
              title: overlap.title || overlap.case_number || '',
              from: overlap.fromTime,
              to: overlap.toTime
            })
          });
        }
      }
    }
    return conflicts;
  }, [formData, employees, vacations, assignments, currentAssignment, trainingRows, t]);

  // Absence reasons that block saving entirely (no "proceed anyway")
  const hasBlockingConflicts = (c: EmployeeConflict[]) =>
    c.some((x) => x.reason === 'vacation' || x.reason === 'onLeave' || x.reason === 'training' || x.reason === 'partialVacation');

  // Proceed with actual submission
  const executeSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (import.meta.env.DEV) console.log('[AssignmentForm] Submitting with data:', formData);
      await onSubmit({ ...formData, zip_code: zipCode, city, lat: assignmentLat, lng: assignmentLng });
    } catch (error) {
      if (import.meta.env.DEV) console.error('[AssignmentForm] Error in form submission:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle form submission with validation + conflict check
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (import.meta.env.DEV) console.log('[AssignmentForm] === FORM SUBMISSION DEBUG ===');

    // Validation
    const validationErrors: string[] = [];
    if (!formData.title?.trim()) validationErrors.push(t('planner.validation.titleRequired'));
    if (!formData.location?.trim()) validationErrors.push(t('planner.validation.locationRequired'));
    if (!formData.date && !((formData as any).dates?.length > 0)) validationErrors.push(t('planner.validation.dateRequired'));
    if (!formData.fromTime) validationErrors.push(t('planner.validation.fromTimeRequired'));
    if (!formData.toTime) validationErrors.push(t('planner.validation.toTimeRequired'));
    if (formData.fromTime && formData.toTime && formData.fromTime >= formData.toTime) {
      validationErrors.push(t('planner.validation.timeOrderRequired'));
    }

    if (validationErrors.length > 0) {
      validationErrors.forEach(error => {
        toast({ title: t('common.error'), description: error, variant: 'destructive' });
      });
      return;
    }

    // Conflict check
    const conflicts = checkEmployeeConflicts();
    if (conflicts.length > 0) {
      if (import.meta.env.DEV) console.log('[AssignmentForm] Conflicts found:', conflicts);
      setConflictDetails(conflicts);
      return;
    }

    await executeSubmit();
  };

  const handleDeleteClick = () => {
    if (import.meta.env.DEV) console.log('[AssignmentForm] Delete clicked for assignment:', currentAssignment?.id);
    if (currentAssignment?.id) onDelete(currentAssignment.id);
  };

  const handlePublishClick = () => {
    if (import.meta.env.DEV) console.log('[AssignmentForm] Publishing assignment:', currentAssignment?.id);
    if (currentAssignment?.id) onPublish(currentAssignment.id);
  };

  const handlePublishDayClick = () => {
    if (selectedDay) onPublishDay(selectedDay);
  };

  const getCarId = (car: string | { id: string; name: string } | null): string => {
    if (typeof car === 'string') return car;
    if (car && typeof car === 'object' && 'id' in car) return car.id;
    return '';
  };

  const getResponsibleUserId = (user: { id: string; name: string } | null): string => {
    if (formData.responsibleUserId) return formData.responsibleUserId as string;
    if (user && typeof user === 'object' && 'id' in user) return user.id;
    return '';
  };

  const setResponsibleUserById = (userId: string) => {
    if (userId) {
      const user = employees.find(emp => emp.id === userId);
      const userName = user ? user.name : '';
      setFormData({ ...formData, responsibleUser: { id: userId, name: userName }, responsibleUserId: userId });
    } else {
      setFormData({ ...formData, responsibleUser: null, responsibleUserId: null });
    }
  };

  const handleEmployeesChange = (employees: string[]) => {
    setFormData({ ...formData, employees });
  };

  const handleCarChange = (carId: string) => {
    setFormData({ ...formData, car: carId === '' ? null : carId });
  };

  const handleCarsChange = (carIds: string[]) => {
    if (import.meta.env.DEV) console.log('[AssignmentForm] Cars changed to:', carIds);
    setFormData({ ...formData, cars: carIds, car: carIds.length > 0 ? carIds[0] : '' });
  };

  const handleDatesChange = (dates: Date[]) => {
    if (dates && dates.length > 0) {
      const dateStrings = dates.map(date => format(date, 'yyyy-MM-dd'));
      if (import.meta.env.DEV) console.log('[AssignmentForm] Dates changed:', dateStrings);
      const updatedData = { ...formData, date: dateStrings[0] } as any;
      updatedData.dates = dateStrings;
      setFormData(updatedData);
    } else {
      const clearedData = { ...formData, date: '' } as any;
      clearedData.dates = [];
      setFormData(clearedData);
    }
  };

  const canPublishAssignment = currentAssignment && canPublishTasks && !currentAssignment.published;

  // Format date for display in conflict dialog
  const formatConflictDate = (dateStr: string): string => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      return format(new Date(y, m - 1, d), 'dd/MM/yyyy');
    } catch {
      return dateStr;
    }
  };

  // Map conflict reason to translated label
  const getConflictReasonLabel = (reason: EmployeeConflict['reason']): string => {
    switch (reason) {
      case 'booking': return t('planner.conflicts.reasonBooking');
      case 'vacation': return t('planner.conflicts.reasonVacation');
      case 'partialVacation': return t('planner.conflicts.reasonPartialVacation');
      case 'onLeave': return t('planner.conflicts.reasonOnLeave');
      case 'training': return t('planner.conflicts.reasonTraining');
      default: return reason;
    }
  };
  // "Book available days only" — remove dates where ANY employee has a conflict
  const handleBookAvailableOnly = async () => {
    const allDates: string[] = (formData as any).dates?.length > 0 ? (formData as any).dates : (formData.date ? [formData.date] : []);
    const conflictDates = new Set(conflictDetails.map(c => c.date));
    const safeDates = allDates.filter((d: string) => !conflictDates.has(d));

    if (safeDates.length === 0) {
      toast({ title: t('planner.conflicts.title'), description: t('planner.conflicts.allDatesConflict'), variant: 'destructive' });
      setConflictDetails([]);
      return;
    }

    // Update formData with only safe dates, then submit
    const updatedData = { ...formData, date: safeDates[0], zip_code: zipCode, city, lat: assignmentLat, lng: assignmentLng } as any;
    updatedData.dates = safeDates;
    setConflictDetails([]);
    setIsSubmitting(true);
    try {
      await onSubmit(updatedData);
    } catch (error) {
      if (import.meta.env.DEV) console.error('[AssignmentForm] Error in filtered submission:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          {currentAssignment ? t('planner.editAssignment') : t('planner.createNew')}
        </h2>

        {userSubDepartments.length > 0 && (
          <div className="space-y-1.5">
            <Label htmlFor="sub-department">Underafdeling</Label>
            <Select
              value={formData.subDepartmentId ?? '__all__'}
              onValueChange={(val) =>
                setFormData({ ...formData, subDepartmentId: val === '__all__' ? null : val })
              }
            >
              <SelectTrigger id="sub-department">
                <SelectValue placeholder="Vælg underafdeling" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Alle</SelectItem>
                {userSubDepartments.map((sd) => (
                  <SelectItem key={sd.id} value={sd.id}>{sd.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}


        <AssignmentFormFields
          title={formData.title || ''}
          setTitle={value => {
            if (import.meta.env.DEV) console.log('[AssignmentForm] Title updated:', value);
            setFormData({ ...formData, title: value });
          }}
          location={formData.location || ''}
          setLocation={value => {
            if (import.meta.env.DEV) console.log('[AssignmentForm] Location updated:', value);
            setFormData({ ...formData, location: value });
          }}
          selectedDates={(formData as any).dates?.map((d: string) => { const [y,m,day] = d.split('-').map(Number); return new Date(y, m-1, day); }) || (formData.date ? (() => { const [y,m,day] = formData.date!.split('-').map(Number); return [new Date(y, m-1, day)]; })() : [])}
          setSelectedDates={handleDatesChange}
          isEditMode={!!currentAssignment}
          fromTime={formData.fromTime || '08:00'}
          setFromTime={value => {
            if (import.meta.env.DEV) console.log('[AssignmentForm] From time updated:', value);
            setFormData({ ...formData, fromTime: value });
          }}
          toTime={formData.toTime || '16:00'}
          setToTime={value => {
            if (import.meta.env.DEV) console.log('[AssignmentForm] To time updated:', value);
            setFormData({ ...formData, toTime: value });
          }}
          description={formData.description || ''}
          setDescription={value => {
            if (import.meta.env.DEV) console.log('[AssignmentForm] Description updated:', value);
            setFormData({ ...formData, description: value });
          }}
          selectedCarIds={formData.cars || []}
          setSelectedCarIds={handleCarsChange}
          selectedResponsibleUserId={getResponsibleUserId(formData.responsibleUser)}
          setSelectedResponsibleUserId={setResponsibleUserById}
          selectedEmployees={normalizeEmployees(formData.employees)}
          onEmployeeToggle={onEmployeeToggle}
          cars={cars}
          employees={employees}
          vacations={vacations}
          assignmentId={currentAssignment?.id}
          assignments={assignments}
          zipCode={zipCode}
          setZipCode={setZipCode}
          city={city}
          setCity={setCity}
          onCoordsChange={(lat, lng) => {
            setAssignmentLat(lat);
            setAssignmentLng(lng);
          }}
          initialLat={formData.lat ?? undefined}
          initialLng={formData.lng ?? undefined}
        />
      </div>

      {/* Inline Conflict Warning Banner */}
      {conflictDetails.length > 0 && (
        <Card className="rounded-2xl border-destructive/40 bg-destructive/5 p-4 space-y-3">
          <div className="flex items-center gap-2 text-destructive font-semibold">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            {t('planner.conflicts.title')}
          </div>
          <p className="text-sm text-muted-foreground">
            {hasBlockingConflicts(conflictDetails)
              ? t('planner.conflicts.absenceBlockDescription')
              : t('planner.conflicts.description')}
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {conflictDetails.map((conflict, idx) => (
              <div key={idx} className="rounded-md border border-destructive/20 bg-background p-3 text-sm">
                <div className="font-medium text-foreground">
                  {conflict.employeeName} {t('planner.conflicts.warningPrefix')} {formatConflictDate(conflict.date)}
                </div>
                <div className="text-muted-foreground mt-1">
                  <span className="inline-block rounded bg-destructive/10 px-1.5 py-0.5 text-xs font-medium text-destructive mr-2">
                    {getConflictReasonLabel(conflict.reason)}
                  </span>
                  {conflict.details}
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setConflictDetails([])} className="flex-1">
              {t('common.cancel')}
            </Button>
            {!hasBlockingConflicts(conflictDetails) && (
              <>
                <Button type="button" variant="secondary" onClick={handleBookAvailableOnly} className="flex-1">
                  {t('planner.conflicts.bookAvailableOnly')}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={async () => { setConflictDetails([]); await executeSubmit(); }}
                  className="flex-1"
                >
                  {t('planner.conflicts.proceedAnyway')}
                </Button>
              </>
            )}
          </div>
        </Card>
      )}

      <div className="sticky bottom-0 bg-background border-t border-border pt-3 pb-3 flex flex-col sm:flex-row gap-3 z-10">
        <Button type="submit" disabled={isSubmitting || conflictDetails.length > 0} className="flex-1">
          <Edit3 className="mr-2 h-4 w-4" />
          {isSubmitting ? t('planner.operations.saving') : currentAssignment ? t('common.update') : t('common.create')}
        </Button>

        {currentAssignment && canEdit}

        {canPublishAssignment && (
          <Button type="button" variant="secondary" onClick={handlePublishClick} className="flex-none">
            <Send className="mr-2 h-4 w-4" />
            {t('planner.publish')}
          </Button>
        )}

        {canPublishTasks && selectedDay}
      </div>
    </form>
  );
};
export default AssignmentForm;