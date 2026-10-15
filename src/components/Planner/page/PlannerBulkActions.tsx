import React, { useCallback, useState, Suspense, lazy } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import BulkActionBar from '@/components/Planner/BulkActionBar';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Assignment } from '@/types/assignment';
const BulkAssignEmployeeDialog = lazy(() => import('@/components/Planner/BulkAssignEmployeeDialog'));
const BulkAssignCarDialog = lazy(() => import('@/components/Planner/BulkAssignCarDialog'));

interface Props {
  selectedIds: Set<string>;
  clearSelection: () => void;
  weekAssignments: Assignment[];
  refetch: () => Promise<unknown> | unknown;
  deleteAssignment: (id: string) => Promise<unknown>;
}

/** Floating bulk bar + its dialogs (assign employee/car, delete) for multi-selected assignments. */
const PlannerBulkActions: React.FC<Props> = ({ selectedIds, clearSelection, weekAssignments, refetch, deleteAssignment }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [bulkAssignCarOpen, setBulkAssignCarOpen] = useState(false);

  const handleBulkAssignCar = useCallback(async (carId: string) => {
    if (selectedIds.size === 0) return;
    setBulkBusy(true);
    try {
      const ids = [...selectedIds];
      const { error } = await supabase
        .from('assignments')
        .update({ car_id: carId })
        .in('id', ids);
      if (error) {
        toast({ title: t('ui.carAssignFailed'), description: error.message, variant: 'destructive' });
      } else {
        toast({ title: ids.length === 1 ? t('ui.carAssignedOne') : t('ui.carAssignedMany', { count: ids.length }) });
        await refetch();
        clearSelection();
      }
    } finally {
      setBulkBusy(false);
    }
  }, [selectedIds, toast, refetch, clearSelection]);

  const handleBulkDeleteConfirm = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setBulkBusy(true);
    const ids = [...selectedIds];
    let failed = 0;
    try {
      await Promise.all(ids.map(id => deleteAssignment(id).catch(() => { failed++; })));
      toast({
        title: failed === 0 ? `${ids.length} opgaver slettet` : `${ids.length - failed} slettet, ${failed} fejlede`,
        variant: failed === 0 ? 'default' : 'destructive',
      });
      clearSelection();
    } finally {
      setBulkBusy(false);
      setBulkDeleteOpen(false);
    }
  }, [selectedIds, deleteAssignment, toast, clearSelection]);

  const handleBulkAssignEmployee = useCallback(async (userId: string) => {
    if (selectedIds.size === 0) return;
    setBulkBusy(true);
    try {
      const ids = [...selectedIds];
      const rows = ids.map(assignment_id => ({ assignment_id, user_id: userId }));
      const { error } = await supabase
        .from('assignments_employees')
        .upsert(rows, { onConflict: 'assignment_id,user_id', ignoreDuplicates: true });
      if (error) {
        toast({ title: t('ui.employeeAssignFailed'), description: error.message, variant: 'destructive' });
      } else {
        toast({ title: ids.length === 1 ? t('ui.employeeAssignedOne') : t('ui.employeeAssignedMany', { count: ids.length }) });
        await refetch();
        clearSelection();
      }
    } finally {
      setBulkBusy(false);
    }
  }, [selectedIds, toast, refetch, clearSelection]);

  return (
    <>
        <BulkActionBar
          count={selectedIds.size}
          busy={bulkBusy}
          onAssignEmployee={() => setBulkAssignOpen(true)}
          onAssignCar={() => setBulkAssignCarOpen(true)}
          onDelete={() => setBulkDeleteOpen(true)}
          onClear={clearSelection}
        />

        <Suspense fallback={null}>
          {bulkAssignOpen && (
            <BulkAssignEmployeeDialog
              open={bulkAssignOpen}
              count={selectedIds.size}
              dates={weekAssignments
                .filter(a => selectedIds.has(a.id))
                .map(a => (a.date?.includes('T') ? a.date.split('T')[0] : a.date))
                .filter(Boolean) as string[]}
              onClose={() => setBulkAssignOpen(false)}
              onConfirm={handleBulkAssignEmployee}
            />
          )}

          {bulkAssignCarOpen && (
            <BulkAssignCarDialog
              open={bulkAssignCarOpen}
              count={selectedIds.size}
              onClose={() => setBulkAssignCarOpen(false)}
              onConfirm={handleBulkAssignCar}
            />
          )}
        </Suspense>

        <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Slet {selectedIds.size} opgave{selectedIds.size === 1 ? '' : 'r'}?</AlertDialogTitle>
              <AlertDialogDescription>
                Denne handling kan ikke fortrydes. Alle valgte opgaver slettes permanent.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={bulkBusy}>Annullér</AlertDialogCancel>
              <AlertDialogAction onClick={handleBulkDeleteConfirm} disabled={bulkBusy}>
                Slet
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </>
  );
};

export default PlannerBulkActions;
