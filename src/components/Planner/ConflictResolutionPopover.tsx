import React, { useMemo, useState } from 'react';
import { AlertTriangle, Users, Car as CarIcon, Clock, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import { Car } from '@/types/car';
import { AssignmentConflict } from '@/utils/assignmentConflicts';
import { useAssignmentsConsolidated } from '@/hooks/useAssignmentsConsolidated';
import { cn } from '@/lib/utils';

interface Props {
  assignment: Assignment;
  allAssignments: Assignment[];
  conflicts: AssignmentConflict[];
  employees: Array<{ id: string; name: string; email?: string }>;
  cars: Car[];
  onResolved: () => void;
}

const ConflictResolutionPopover: React.FC<Props> = ({
  assignment,
  allAssignments,
  conflicts,
  employees,
  cars,
  onResolved,
}) => {
  const { t } = useTranslation();
  const { updateAssignment } = useAssignmentsConsolidated({ filter: 'planner' });

  // Pick the first unique conflict to act on
  const primary = conflicts[0];
  const other = useMemo(
    () => allAssignments.find(a => a.id === primary?.withAssignmentId),
    [allAssignments, primary?.withAssignmentId],
  );

  const [mode, setMode] = useState<'idle' | 'time' | 'resource'>('idle');
  const [fromTime, setFromTime] = useState((assignment.fromTime || '').substring(0, 5));
  const [toTime, setToTime] = useState((assignment.toTime || '').substring(0, 5));
  const [newResourceId, setNewResourceId] = useState<string>('');
  const [saving, setSaving] = useState(false);

  if (!primary) return null;

  const baseData: Partial<Assignment> = {
    title: assignment.title,
    description: assignment.description,
    date: assignment.date,
    fromTime: assignment.fromTime,
    toTime: assignment.toTime,
    location: assignment.location,
    case_number: assignment.case_number,
    published: assignment.published,
    responsibleUserId: assignment.responsibleUserId || assignment.responsibleUser?.id,
    employees: (assignment.assignedEmployees?.map(e => e.id)) ||
      (assignment.employees as string[] | undefined) || [],
    cars: assignment.cars && assignment.cars.length > 0
      ? assignment.cars
      : (assignment.car
        ? [typeof assignment.car === 'string' ? assignment.car : assignment.car.id]
        : []),
  };

  const handleResolved = () => {
    toast.success(t('planner.conflict.resolved'));
    onResolved();
  };

  const saveTime = async () => {
    if (!fromTime || !toTime || fromTime >= toTime) {
      toast.error(t('planner.conflict.invalidTime'));
      return;
    }
    setSaving(true);
    try {
      await updateAssignment(assignment.id, { ...baseData, fromTime, toTime });
      handleResolved();
    } catch (err) {
      toast.error((err as any)?.message || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const saveResource = async () => {
    if (!newResourceId) return;
    setSaving(true);
    try {
      if (primary.kind === 'employee') {
        const currentIds = baseData.employees as string[];
        const nextIds = currentIds
          .filter(id => id !== primary.resourceId)
          .concat(currentIds.includes(newResourceId) ? [] : [newResourceId]);
        await updateAssignment(assignment.id, { ...baseData, employees: nextIds });
      } else {
        const currentIds = baseData.cars as string[];
        const nextIds = currentIds.map(id => (id === primary.resourceId ? newResourceId : id));
        await updateAssignment(assignment.id, { ...baseData, cars: nextIds });
      }
      handleResolved();
    } catch (err) {
      toast.error((err as any)?.message || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const resourceOptions = primary.kind === 'employee'
    ? employees.filter(e => e.id !== primary.resourceId).map(e => ({ id: e.id, name: e.name }))
    : cars.filter(c => c.id !== primary.resourceId).map(c => ({ id: c.id, name: c.name }));

  const aTime = `${(assignment.fromTime || '').substring(0, 5)}–${(assignment.toTime || '').substring(0, 5)}`;
  const bTime = other ? `${(other.fromTime || '').substring(0, 5)}–${(other.toTime || '').substring(0, 5)}` : '';

  const ResourceIcon = primary.kind === 'employee' ? Users : CarIcon;

  return (
    <div className="w-[360px] space-y-3">
      <div className="flex items-center gap-2 text-destructive">
        <AlertTriangle className="h-4 w-4" />
        <h4 className="font-semibold text-sm">{t('planner.conflict.title')}</h4>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-md border border-border p-2 space-y-1">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {t('planner.conflict.thisAssignment')}
          </div>
          <div className="text-xs font-medium truncate">{assignment.title || assignment.case_number || '—'}</div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span className="tabular-nums">{aTime}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <ResourceIcon className="h-3 w-3" />
            <span className="truncate">{primary.resourceName}</span>
          </div>
        </div>
        <div className="rounded-md border border-border p-2 space-y-1">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {t('planner.conflict.conflictsWith')}
          </div>
          <div className="text-xs font-medium truncate">{primary.withTitle}</div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span className="tabular-nums">{bTime}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <ResourceIcon className="h-3 w-3" />
            <span className="truncate">{primary.resourceName}</span>
          </div>
        </div>
      </div>

      {mode === 'idle' && (
        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" variant="outline" onClick={() => setMode('time')}>
            <Clock className="h-3.5 w-3.5 mr-1" />
            {t('planner.conflict.changeTime')}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setMode('resource')}>
            <ArrowRight className="h-3.5 w-3.5 mr-1" />
            {t('planner.conflict.changeResource')}
          </Button>
        </div>
      )}

      {mode === 'time' && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground">{t('planner.fromTime')}</label>
              <Input
                type="time"
                value={fromTime}
                onChange={e => setFromTime(e.target.value)}
                disabled={saving}
                className="h-8"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">{t('planner.toTime')}</label>
              <Input
                type="time"
                value={toTime}
                onChange={e => setToTime(e.target.value)}
                disabled={saving}
                className="h-8"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setMode('idle')} disabled={saving}>
              {t('planner.conflict.cancel')}
            </Button>
            <Button size="sm" onClick={saveTime} disabled={saving}>
              {t('planner.conflict.save')}
            </Button>
          </div>
        </div>
      )}

      {mode === 'resource' && (
        <div className="space-y-2">
          <Select value={newResourceId} onValueChange={setNewResourceId} disabled={saving}>
            <SelectTrigger className="h-8">
              <SelectValue placeholder={
                primary.kind === 'employee'
                  ? t('planner.selectEmployees')
                  : t('planner.selectCar')
              } />
            </SelectTrigger>
            <SelectContent className={cn('z-[60]')}>
              {resourceOptions.map(opt => (
                <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setMode('idle')} disabled={saving}>
              {t('planner.conflict.cancel')}
            </Button>
            <Button size="sm" onClick={saveResource} disabled={saving || !newResourceId}>
              {t('planner.conflict.save')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConflictResolutionPopover;
