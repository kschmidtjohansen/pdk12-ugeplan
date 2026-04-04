import React from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/context/TranslationContext';

interface SeriesActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'edit' | 'delete';
  onSingleDay: () => void;
  onEntireSeries: () => void;
}

const SeriesActionDialog: React.FC<SeriesActionDialogProps> = ({
  open,
  onOpenChange,
  mode,
  onSingleDay,
  onEntireSeries,
}) => {
  const { t } = useTranslation();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {mode === 'delete'
              ? t('planner.series.deleteTitle')
              : t('planner.series.editTitle')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {mode === 'delete'
              ? t('planner.series.deleteDescription')
              : t('planner.series.editDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
          <Button variant="outline" onClick={onSingleDay}>
            {t('planner.series.onlyThisDay')}
          </Button>
          <Button
            variant={mode === 'delete' ? 'destructive' : 'default'}
            onClick={onEntireSeries}
          >
            {t('planner.series.entireSeries')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SeriesActionDialog;
